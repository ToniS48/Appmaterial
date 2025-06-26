import { Actividad, EstadoActividad, MaterialAsignado } from '../types/actividad';

export const validateActividad = (actividad: Partial<Actividad>): string | null => {
  if (!actividad.nombre?.trim()) {
    return "El nombre de la actividad es obligatorio";
  }
  
  if (!actividad.lugar?.trim()) {
    return "El lugar de la actividad es obligatorio";
  }
  
  if (!actividad.tipo || !Array.isArray(actividad.tipo) || actividad.tipo.length === 0) {
    return "Debe seleccionar al menos un tipo de actividad";
  }
  
  if (!actividad.subtipo || !Array.isArray(actividad.subtipo) || actividad.subtipo.length === 0) {
    return "Debe seleccionar al menos un subtipo de actividad";
  }
  
  return null;
};

export const standardizeMaterials = (
  materials: Array<{ materialId: string; nombre?: string; cantidad?: number | string }>
): MaterialAsignado[] => {
  return Array.isArray(materials)
    ? materials
        .filter(m => m && m.materialId)
        .map(m => ({
          materialId: m.materialId,
          nombre: m.nombre || '',
          cantidad: typeof m.cantidad === 'number' 
            ? m.cantidad 
            : parseInt(String(m.cantidad), 10) || 1
        }))
    : [];
};

export const standardizeLinks = (enlaces: any): any => {
  if (!enlaces) return {
    enlacesWikiloc: [],
    enlacesTopografias: [],
    enlacesDrive: [],
    enlacesWeb: []
  };
  
  return {
    enlacesWikiloc: Array.isArray(enlaces.enlacesWikiloc) ? enlaces.enlacesWikiloc : [],
    enlacesTopografias: Array.isArray(enlaces.enlacesTopografias) ? enlaces.enlacesTopografias : [],
    enlacesDrive: Array.isArray(enlaces.enlacesDrive) ? enlaces.enlacesDrive : [],
    enlacesWeb: Array.isArray(enlaces.enlacesWeb) ? enlaces.enlacesWeb : []
  };
};

export const getDefaultActivityData = (
  existingActivity?: Actividad,
  currentUserId?: string
): Partial<Actividad> => {
  if (existingActivity) {
    return {
      ...existingActivity,
      enlaces: standardizeLinks(existingActivity.enlaces),
      materiales: standardizeMaterials(existingActivity.materiales || [])
    };
  }
  
  const mañana = new Date();
  mañana.setDate(mañana.getDate() + 1);
  
  return {
    nombre: '',
    lugar: '',
    descripcion: '',
    fechaInicio: new Date(),
    fechaFin: mañana,
    tipo: [],
    subtipo: [],
    dificultad: 'media' as 'baja' | 'media' | 'alta',
    necesidadMaterial: false,
    materiales: [],
    enlaces: [],
    responsableActividadId: currentUserId || '',
    responsableMaterialId: currentUserId || '',
    participanteIds: [],
    estado: 'planificada' as EstadoActividad,
    creadorId: currentUserId || '',
    comentarios: [],
    enlacesWikiloc: [],
    enlacesTopografias: [],
    enlacesDrive: [],
    enlacesWeb: [],
    imagenesTopografia: [],
    archivosAdjuntos: []
  };
};

export const getUniqueParticipanteIds = (
  participanteIds: string[],
  creadorId?: string,
  responsableActividadId?: string,
  responsableMaterialId?: string
): string[] => {
  const allIds = [
    ...participanteIds,
    creadorId,
    responsableActividadId,
    responsableMaterialId
  ].filter((id): id is string => Boolean(id));
  
  return Array.from(new Set(allIds));
};

export const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (e) {
    return false;
  }
};
