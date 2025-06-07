import { useForm } from 'react-hook-form';
import { useMemo } from 'react';
import { Actividad } from '../types/actividad';

interface UseActividadReactFormProps {
  data?: Partial<Actividad>;
}

/**
 * Hook que combina la inicialización segura de arrays con React Hook Form
 * para uso en componentes que requieren FormProvider
 */
export function useActividadReactForm({ data }: UseActividadReactFormProps) {
  // Crear valores por defecto seguros
  const getDefaultValues = () => ({
    nombre: data?.nombre || '',
    lugar: data?.lugar || '',
    descripcion: data?.descripcion || '',
    fechaInicio: data?.fechaInicio || null,
    fechaFin: data?.fechaFin || null,    tipo: Array.isArray(data?.tipo) ? data?.tipo : [],
    subtipo: Array.isArray(data?.subtipo) ? data?.subtipo : [],
    dificultad: data?.dificultad || 'media',
    necesidadMaterial: data?.necesidadMaterial || false,
    materiales: Array.isArray(data?.materiales) ? data?.materiales : [],
    participanteIds: Array.isArray(data?.participanteIds) ? data?.participanteIds : [],
    responsableActividadId: data?.responsableActividadId || '',
    responsableMaterialId: data?.responsableMaterialId || '',
    enlaces: Array.isArray(data?.enlaces) ? data?.enlaces : [],
    enlacesWikiloc: Array.isArray(data?.enlacesWikiloc) ? data?.enlacesWikiloc : [],
    enlacesTopografias: Array.isArray(data?.enlacesTopografias) ? data?.enlacesTopografias : [],
    enlacesDrive: Array.isArray(data?.enlacesDrive) ? data?.enlacesDrive : [],
    enlacesWeb: Array.isArray(data?.enlacesWeb) ? data?.enlacesWeb : [],
    imagenesTopografia: Array.isArray(data?.imagenesTopografia) ? data?.imagenesTopografia : [],
    archivosAdjuntos: Array.isArray(data?.archivosAdjuntos) ? data?.archivosAdjuntos : [],
    comentarios: Array.isArray(data?.comentarios) ? data?.comentarios : []
  });

  const methods = useForm({
    defaultValues: getDefaultValues()
  });

  return {
    methods,
    defaultValues: getDefaultValues()
  };
}
