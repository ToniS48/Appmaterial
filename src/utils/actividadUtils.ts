import { Actividad } from '../types/actividad';
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
 * Obtiene una lista única de IDs de participantes, incluyendo automáticamente
 * el creador y los responsables sin duplicados
 * @param participanteIds - Array de IDs de participantes seleccionados
 * @param creadorId - ID del creador de la actividad
 * @param responsableActividadId - ID del responsable de la actividad (opcional)
 * @param responsableMaterialId - ID del responsable del material (opcional)
 * @returns Array de IDs únicos
 */
export const getUniqueParticipanteIds = (
  participanteIds: string[],
  creadorId?: string,
  responsableActividadId?: string,
  responsableMaterialId?: string
): string[] => {
  const idsSet = new Set<string>();
  
  // Agregar participantes seleccionados
  participanteIds.forEach(id => {
    if (id && id.trim()) {
      idsSet.add(id);
    }
  });
  
  // Agregar creador si existe
  if (creadorId && creadorId.trim()) {
    idsSet.add(creadorId);
  }
  
  // Agregar responsable de actividad si existe
  if (responsableActividadId && responsableActividadId.trim()) {
    idsSet.add(responsableActividadId);
  }
  
  // Agregar responsable de material si existe
  if (responsableMaterialId && responsableMaterialId.trim()) {
    idsSet.add(responsableMaterialId);
  }
  
  return Array.from(idsSet);
};

/**
 * Valida que todos los participantes necesarios estén incluidos en la lista
 * @param participanteIds - Array de IDs de participantes
 * @param creadorId - ID del creador (debe estar incluido)
 * @param responsableActividadId - ID del responsable de actividad (debe estar incluido si existe)
 * @param responsableMaterialId - ID del responsable de material (debe estar incluido si existe)
 * @returns true si todos los participantes necesarios están incluidos
 */
export const validateParticipantesRequeridos = (
  participanteIds: string[],
  creadorId?: string,
  responsableActividadId?: string,
  responsableMaterialId?: string
): boolean => {
  if (creadorId && !participanteIds.includes(creadorId)) {
    return false;
  }
  
  if (responsableActividadId && !participanteIds.includes(responsableActividadId)) {
    return false;
  }
  
  if (responsableMaterialId && !participanteIds.includes(responsableMaterialId)) {
    return false;
  }
  
  return true;
};