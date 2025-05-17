import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { Actividad, EstadoActividad } from '../types/actividad';
import { 
  obtenerActividad, 
  crearActividad, 
  actualizarActividad 
} from '../services/actividadService';
import { Timestamp } from 'firebase/firestore';
import { determinarEstadoActividad } from '../utils/dateUtils';
import { 
  validateActividadComplete,
  getStandardizedActivityData,
  standardizeLinks,
  standardizeMaterials
} from '../utils/actividadUtils';

interface UseActividadFormProps {
  actividadId?: string;
  usuarioId?: string;
}

export const useActividadForm = ({ actividadId, usuarioId }: UseActividadFormProps) => {
  const [formData, setFormData] = useState<Partial<Actividad>>({});
  const [loading, setLoading] = useState(!!actividadId);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const initialData = actividadId
          ? await obtenerActividad(actividadId)
          : getStandardizedActivityData(null, usuarioId);

        setFormData(initialData);
      } catch (e: any) {
        setError(e.message || 'Error al cargar la actividad');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [actividadId, usuarioId]);

  const updateInfo = (data: Partial<Actividad>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const updateParticipantes = (participanteIds: string[]) => {
    setFormData((prev) => ({ ...prev, participanteIds }));
  };

  const updateMaterial = (materiales: { materialId: string; nombre?: string; cantidad?: number | string }[]) => {
    const materialesValidados = standardizeMaterials(materiales);
    setFormData((prev) => ({ ...prev, materiales: materialesValidados }));
  };

  const updateEnlaces = (enlaces: Partial<Actividad>) => {
    const enlacesEstandarizados = standardizeLinks(enlaces);
    setFormData((prev) => ({ ...prev, ...enlacesEstandarizados }));
  };

  const saveActividad = async (): Promise<Actividad | null> => {
    setIsSaving(true);
    setError(null);

    try {
      // Añadir validación para los campos críticos que faltan
      if (!formData.nombre || formData.nombre.trim() === '') {
        throw new Error('El nombre de la actividad es obligatorio');
      }
      
      if (!formData.lugar || formData.lugar.trim() === '') {
        throw new Error('El lugar de la actividad es obligatorio');
      }
      
      if (!formData.fechaInicio) {
        throw new Error('La fecha de inicio es obligatoria');
      }
      
      if (!formData.fechaFin) {
        throw new Error('La fecha de finalización es obligatoria');
      }

      const estadoAutomatico = determinarEstadoActividad(
        formData.fechaInicio,
        formData.fechaFin,
        formData.estado
      );

      const actividadCompleta = {
        ...formData,
        estado: estadoAutomatico,
        fechaActualizacion: Timestamp.fromDate(new Date()),
        // Garantizar un valor para necesidadMaterial
        necesidadMaterial: formData.necesidadMaterial ?? false
      };

      let resultado: Actividad;
      if (actividadId) {
        resultado = await actualizarActividad(actividadId, actividadCompleta);
        toast({ title: 'Actividad actualizada', status: 'success' });
      } else {
        resultado = await crearActividad(actividadCompleta as Actividad);
        toast({ title: 'Actividad creada', status: 'success' });
      }

      return resultado;
    } catch (e: any) {
      setError(e.message || 'Error al guardar la actividad');
      toast({ 
        title: 'Error al guardar', 
        description: e.message, 
        status: 'error',
        duration: 5000,
        isClosable: true
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