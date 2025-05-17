import { Actividad, EstadoActividad, MaterialAsignado } from '../types/actividad';
import { Timestamp } from 'firebase/firestore';
import { toDate } from './dateUtils';

export const validateActividad = (actividad: Partial<Actividad>): string | null => {
  // Añadir log para depurar valores
  console.log("Validando actividad:", {
    nombre: actividad.nombre,
    nombreLength: actividad.nombre?.length,
    nombreTrim: actividad.nombre?.trim(),
    lugar: actividad.lugar,
    tipo: actividad.tipo,
    subtipo: actividad.subtipo
  });
  
  // Añade esto a la función validateActividad
  console.log("Validando tipo:", actividad.tipo);
  console.log("Validando subtipo:", actividad.subtipo);
  
  // Validación de campos básicos
  if (!actividad.nombre?.trim()) {
    console.warn("Validación fallida: nombre vacío o undefined");
    return "El nombre de la actividad es obligatorio";
  }
  
  if (!actividad.lugar?.trim()) {
    console.warn("Validación fallida: lugar vacío o undefined");
    return "El lugar de la actividad es obligatorio";
  }
  
  if (!actividad.tipo || actividad.tipo.length === 0) {
    console.warn("Validación fallida: tipo vacío");
    return "Debe seleccionar al menos un tipo de actividad";
  }
  
  if (!actividad.subtipo || actividad.subtipo.length === 0) {
    console.warn("Validación fallida: subtipo vacío");
    return "Debe seleccionar al menos un subtipo de actividad";
  }
  
  return null;
};

/**
 * Validación específica para enlaces de actividades
 */
export const validateActividadEnlaces = (enlaces: Partial<Actividad>): string | null => {
  // Validar que los enlaces tengan formato correcto
  if (enlaces.enlacesWikiloc?.some(enlace => !isValidUrl(enlace.url))) {
    return "Hay enlaces de Wikiloc con formato incorrecto";
  }
  
  if (enlaces.enlacesTopografias?.some(enlace => !isValidUrl(enlace))) {
    return "Hay enlaces de topografías con formato incorrecto";
  }
  
  if (enlaces.enlacesDrive?.some(enlace => !isValidUrl(enlace))) {
    return "Hay enlaces de Drive con formato incorrecto";
  }
  
  if (enlaces.enlacesWeb?.some(enlace => !isValidUrl(enlace))) {
    return "Hay enlaces web con formato incorrecto";
  }
  
  return null;
}

// Función auxiliar para validar URLs
const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Estandariza los materiales para garantizar formato consistente
 */
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

/**
 * Estandariza los enlaces para garantizar consistencia
 */
export const standardizeLinks = (data: Partial<Actividad>): Partial<Actividad> => {
  // Asegurar que todos los arrays estén inicializados
  return {
    ...data, // Preservar todos los campos originales
    enlacesWikiloc: data.enlacesWikiloc || [],
    enlacesTopografias: data.enlacesTopografias || [],
    enlacesDrive: data.enlacesDrive || [],
    enlacesWeb: data.enlacesWeb || [],
    // Regenerar el array de enlaces combinados para compatibilidad
    enlaces: [
      ...(data.enlacesWikiloc || []).map(e => e.url),
      ...(data.enlacesTopografias || []),
      ...(data.enlacesDrive || []),
      ...(data.enlacesWeb || [])
    ]
  };
};

/**
 * Genera un objeto actividad estandarizado ya sea desde una actividad existente o como nueva
 * @param existingActivity Actividad existente (si es edición)
 * @param currentUserId ID del usuario actual
 */
export const getStandardizedActivityData = (existingActivity: Partial<Actividad> | null, currentUserId?: string): Partial<Actividad> => {
  // Si hay una actividad existente, usamos esa como base
  if (existingActivity && Object.keys(existingActivity).length > 0) {
    return {
      ...existingActivity,
      // Asegurar que estos campos siempre existan
      materiales: existingActivity.materiales || [],
      participanteIds: existingActivity.participanteIds || (currentUserId ? [currentUserId] : []),
      enlacesWikiloc: existingActivity.enlacesWikiloc || [],
      enlacesTopografias: existingActivity.enlacesTopografias || [],
      enlacesDrive: existingActivity.enlacesDrive || [],
      enlacesWeb: existingActivity.enlacesWeb || [],
      comentarios: existingActivity.comentarios || [],
      enlaces: existingActivity.enlaces || []
    };
  }
  
  // Para nueva actividad - valores por defecto consistentes
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
    responsableActividadId: currentUserId || '',
    responsableMaterialId: currentUserId || '',
    participanteIds: currentUserId ? [currentUserId] : [],
    materiales: [],
    estado: 'planificada' as EstadoActividad,
    creadorId: currentUserId || '',
    enlacesWikiloc: [],
    enlacesTopografias: [],
    enlacesDrive: [],
    enlacesWeb: [],
    comentarios: [],
    enlaces: []
  };
};

/**
 * Realiza una validación completa de la actividad antes de guardar
 * @param data Datos de la actividad a validar
 * @returns String con mensaje de error o null si es válida
 */
export const validateActividadComplete = (data: Partial<Actividad>): string | null => {
  if (!data.nombre || data.nombre.trim() === '') {
    return 'El nombre de la actividad es obligatorio';
  }
  
  if (!data.fechaInicio) {
    return 'La fecha de inicio es obligatoria';
  }
  
  if (!data.fechaFin) {
    return 'La fecha de finalización es obligatoria';
  }

  // Añadir validación para necesidadMaterial (antes faltaba)
  if (data.necesidadMaterial === undefined || data.necesidadMaterial === null) {
    return 'Debe indicar si la actividad requiere material';
  }
  
  return null;
};