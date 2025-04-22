import { Actividad } from '../types/actividad';
import { toDate } from './dateUtils';

export const validateActividad = (actividad: Partial<Actividad>): string | null => {
  // Validación de campos básicos
  if (!actividad.nombre?.trim()) {
    return "El nombre de la actividad es obligatorio";
  }
  if (!actividad.lugar?.trim()) {
    return "El lugar de la actividad es obligatorio";
  }
  if (!actividad.tipo?.length) {
    return "Debes seleccionar al menos un tipo de actividad";
  }
  if (!actividad.subtipo?.length) {
    return "Debes seleccionar al menos un subtipo de actividad";
  }
  if (!actividad.responsableActividadId) {
    return "El responsable de la actividad es obligatorio";
  }
  if (!actividad.fechaInicio) {
    return "La fecha de inicio es obligatoria";
  }
  if (!actividad.fechaFin) {
    return "La fecha de fin es obligatoria";
  }
  
  // Validación de fechas
  if (actividad.fechaInicio && actividad.fechaFin) {
    // Usar la función toDate que maneja correctamente objetos Timestamp
    const inicio = toDate(actividad.fechaInicio);
    const fin = toDate(actividad.fechaFin);
    
    // Verificar que ambas fechas son válidas
    if (!inicio || !fin) {
      return "Las fechas proporcionadas no son válidas";
    }
    
    if (inicio > fin) {
      return "La fecha de fin debe ser posterior a la fecha de inicio";
    }
  }
  
  return null; // No hay errores
}

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