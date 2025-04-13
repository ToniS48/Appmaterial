import { Timestamp } from 'firebase/firestore';

/**
 * Formatea una fecha (Date o Timestamp) con el formato local
 */
export const formatDate = (date: Date | Timestamp | undefined | null): string => {
  if (!date) return '';
  
  const dateObject = date instanceof Date ? date : date.toDate();
  
  return dateObject.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formatea una fecha y hora (Date o Timestamp) con el formato local
 */
export const formatDateTime = (date: Date | Timestamp | undefined | null): string => {
  if (!date) return '';
  
  const dateObject = date instanceof Date ? date : date.toDate();
  
  return dateObject.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Convierte con seguridad cualquier valor de fecha a un objeto Date válido
 * @param date Cualquier valor que debería representar una fecha
 * @returns Un objeto Date válido o null si la entrada no puede convertirse
 */
export const safeDate = (date: any): Date | null => {
  if (!date) return null;
  
  // Si ya es una fecha válida, devolverla
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  
  // Si es un Timestamp de Firestore
  if (date && typeof date.toDate === 'function') {
    try {
      const convertedDate = date.toDate();
      return isNaN(convertedDate.getTime()) ? null : convertedDate;
    } catch (e) {
      console.warn('Error converting Firestore timestamp', e);
      return null;
    }
  }
  
  // Intentar parsear una fecha
  try {
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  } catch (e) {
    console.warn('Error parsing date', e);
    return null;
  }
};

/**
 * Convierte con seguridad una fecha a formato ISO String
 * @param date Cualquier valor que debería representar una fecha
 * @returns ISO String de la fecha o cadena vacía si es inválida
 */
export const safeISOString = (date: any): string => {
  const validDate = safeDate(date);
  if (!validDate) return '';
  
  try {
    return validDate.toISOString();
  } catch (e) {
    console.warn('Error converting to ISO string', e);
    return '';
  }
};