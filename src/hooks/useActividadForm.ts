import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import { Actividad } from '../types/actividad';
import { 
  obtenerActividad, 
  crearActividad, 
  actualizarActividad 
} from '../services/actividadService';
import { Timestamp } from 'firebase/firestore';
import { determinarEstadoActividad, toTimestamp } from '../utils/dateUtils';
import { 
  validateActividad,
  standardizeLinks,
  standardizeMaterials,
  getDefaultActivityData
} from '../utils/actividadUtils';
import { useZodValidation } from './useZodValidation';
import { actividadBaseSchema } from '../schemas/actividadSchema';

interface UseActividadFormProps {
  actividadId?: string;
  usuarioId?: string;
}

export function useActividadForm({ actividadId, usuarioId }: UseActividadFormProps) {
  const [formData, setFormData] = useState<Partial<Actividad>>(() => {
    // Inicializar con valores por defecto seguros para evitar errores de undefined
    return {
      tipo: [],
      subtipo: [],
      participanteIds: [],
      materiales: [],
      enlaces: [],
      enlacesWikiloc: [],
      enlacesTopografias: [],
      enlacesDrive: [],
      enlacesWeb: [],
      comentarios: []
    };
  });
  const [loading, setLoading] = useState(!!actividadId);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  
  // Usar ref para evitar re-creación del hook en cada render
  const validateRef = useRef(useZodValidation(actividadBaseSchema));
  const { validate } = validateRef.current;

  // Optimización: Usar useMemo para datos por defecto pesados
  const defaultData = useMemo(() => {
    if (!actividadId) {
      return getDefaultActivityData(undefined, usuarioId);
    }
    return null;
  }, [actividadId, usuarioId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Optimización: usar setTimeout para diferir la carga y evitar violaciones
        const loadAsync = () => new Promise<void>((resolve) => {
          setTimeout(async () => {
            try {
              const initialData = actividadId
                ? await obtenerActividad(actividadId)
                : defaultData;

              setFormData(initialData || {});
              resolve();
            } catch (e: any) {
              setError(e.message || 'Error al cargar la actividad');
              resolve();
            }
          }, 0); // Usar 0ms para el siguiente tick
        });

        await loadAsync();
      } catch (e: any) {
        setError(e.message || 'Error al cargar la actividad');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [actividadId, defaultData]);

  // Optimizar updateInfo con useCallback para evitar re-renderizados
  const updateInfo = useCallback((data: Partial<Actividad>) => {
    // Usar validate con la opción silenciosa para evitar toast
    if (validate(data, { showToast: false })) {
      setFormData((prev) => ({ ...prev, ...data }));
      return true;
    }
    return false;
  }, [validate]);  // Optimizar updateParticipantes con useCallback
  const updateParticipantes = useCallback((participanteIds: string[], responsableIds?: { responsableId?: string, responsableMaterialId?: string }) => {
    console.log("useActividadForm updateParticipantes - Recibidos participanteIds:", participanteIds);
    console.log("useActividadForm updateParticipantes - Recibidos responsableIds:", responsableIds);
    
    setFormData((prev) => {
      // Eliminar posibles duplicados en los participantes
      const uniqueParticipanteIds = Array.from(new Set(participanteIds));
      console.log("useActividadForm updateParticipantes - IDs únicos:", uniqueParticipanteIds);
      
      // Para actividades nuevas (sin ID), ser más conservador con la inclusión automática
      if (!actividadId) {
        // Solo asegurar que el creador esté incluido si está definido
        const idsObligatorios: string[] = [];
        if (prev.creadorId && !uniqueParticipanteIds.includes(prev.creadorId)) {
          idsObligatorios.push(prev.creadorId);
        }
        
        const todosLosIds = [...uniqueParticipanteIds, ...idsObligatorios];
        console.log("useActividadForm updateParticipantes - Todos los IDs finales:", todosLosIds);
        
        return {
          ...prev,
          participanteIds: todosLosIds,
          ...(responsableIds?.responsableId && { responsableActividadId: responsableIds.responsableId }),
          ...(responsableIds?.responsableMaterialId && { responsableMaterialId: responsableIds.responsableMaterialId }),
        };
      }
      
      // Para actividades existentes, usar la lógica original
      const idsObligatorios: string[] = [];
      
      // Solo agregar IDs que existan (no undefined/null)
      if (prev.creadorId) idsObligatorios.push(prev.creadorId);
      
      // Para responsableActividadId
      const responsableActividadId = responsableIds?.responsableId || prev.responsableActividadId || '';
      if (responsableActividadId) idsObligatorios.push(responsableActividadId);
      
      // Para responsableMaterialId
      const responsableMaterialId = responsableIds?.responsableMaterialId || prev.responsableMaterialId || '';
      if (responsableMaterialId) idsObligatorios.push(responsableMaterialId);
      
      // Combinar todos los IDs, eliminar duplicados y filtrar strings vacíos
      const todosLosIds = [...uniqueParticipanteIds, ...idsObligatorios]
        .filter((id, index, array) => id && array.indexOf(id) === index);
      
      return {
        ...prev,
        participanteIds: todosLosIds,
        ...(responsableIds?.responsableId && { responsableActividadId: responsableIds.responsableId }),
        ...(responsableIds?.responsableMaterialId && { responsableMaterialId: responsableIds.responsableMaterialId }),
      };
    });
  }, [actividadId]);
  // Optimizar updateMaterial con useCallback
  const updateMaterial = useCallback((materiales: any[]) => {
    setFormData((prev) => ({ ...prev, materiales: standardizeMaterials(materiales) }));
  }, []);
  // Optimizar updateEnlaces con useCallback
  const updateEnlaces = useCallback((enlacesData: any) => {
    setFormData((prev) => ({ 
      ...prev, 
      ...enlacesData,
      enlaces: enlacesData.enlaces || []
    }));
  }, []);

  // Modificar la función saveActividad para garantizar que todos los campos obligatorios existan:
  const saveActividad = async (overrideData?: Partial<Actividad>): Promise<Actividad | null> => {
    setIsSaving(true);
    setError(null);

    try {
      // Combinar datos actuales con posibles anulaciones
      const dataToSave = { ...formData, ...(overrideData || {}) };
      
      // Validaciones críticas
      if (!dataToSave.nombre?.trim()) {
        throw new Error('El nombre de la actividad es obligatorio');
      }
      
      if (!dataToSave.lugar?.trim()) {
        throw new Error('El lugar de la actividad es obligatorio');
      }
      
      if (!dataToSave.fechaInicio) {
        throw new Error('La fecha de inicio es obligatoria');
      }
      
      if (!dataToSave.fechaFin) {
        throw new Error('La fecha de finalización es obligatoria');
      }

      if (dataToSave.fechaInicio > dataToSave.fechaFin) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      // Asegurar que todos los campos obligatorios estén definidos
      const actividadValidada: Omit<Actividad, 'id' | 'fechaCreacion'> = {
        nombre: dataToSave.nombre || '',
        lugar: dataToSave.lugar || '',
        descripcion: dataToSave.descripcion || '',
        tipo: dataToSave.tipo || [],
        subtipo: dataToSave.subtipo || [],
        fechaInicio: dataToSave.fechaInicio,
        fechaFin: dataToSave.fechaFin,
        creadorId: dataToSave.creadorId || usuarioId || '',
        responsableActividadId: dataToSave.responsableActividadId || dataToSave.creadorId || usuarioId || '',
        responsableMaterialId: dataToSave.responsableMaterialId || '',
        participanteIds: dataToSave.participanteIds || [],
        necesidadMaterial: Boolean(dataToSave.responsableMaterialId && dataToSave.materiales?.length),
        materiales: dataToSave.materiales || [],        estado: determinarEstadoActividad(
          toTimestamp(dataToSave.fechaInicio),
          toTimestamp(dataToSave.fechaFin),
          dataToSave.estado
        ),
        comentarios: dataToSave.comentarios || [],
        enlaces: dataToSave.enlaces || [],
        enlacesWikiloc: dataToSave.enlacesWikiloc || [],
        enlacesTopografias: dataToSave.enlacesTopografias || [],
        enlacesDrive: dataToSave.enlacesDrive || [],
        enlacesWeb: dataToSave.enlacesWeb || [],
        imagenesTopografia: dataToSave.imagenesTopografia || [],
        archivosAdjuntos: dataToSave.archivosAdjuntos || [],
        dificultad: dataToSave.dificultad || 'media'
      };

      // Ahora podemos asignar fechaActualizacion sin error
      actividadValidada.fechaActualizacion = Timestamp.fromDate(new Date());

      // Guardar actividad usando el objeto validado
      let resultado: Actividad;
      if (actividadId) {
        resultado = await actualizarActividad(actividadId, actividadValidada);
        toast({ title: 'Actividad actualizada', status: 'success' });
      } else {
        resultado = await crearActividad(actividadValidada);
        toast({ title: 'Actividad creada', status: 'success' });
      }

      return resultado;
    } catch (error: any) {
      console.error('Error al guardar actividad:', error);
      setError(error.message || 'Error al guardar la actividad');
      toast({ 
        title: 'Error', 
        description: error.message || 'Error al guardar la actividad', 
        status: 'error' 
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formData,
    loading,
    error,
    isSaving,
    updateInfo,
    updateParticipantes,
    updateMaterial,
    updateEnlaces,
    saveActividad,
  };
};
