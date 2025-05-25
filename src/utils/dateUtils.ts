import { Timestamp } from "firebase/firestore";

/**
 * Tipo unión que representa los posibles formatos de fecha en la aplicación
 */
export type DateLike = Date | Timestamp | string | number | null | undefined;

/**
 * Convierte cualquier representación de fecha a un objeto Date de JavaScript
 * @param date Fecha en formato Date, Timestamp o string/number (timestamp)
 * @returns Objeto Date o null si no es válido
 */
export const toDate = (date: DateLike): Date | null => {
  if (!date) return null;
  
  if (date instanceof Date) {
    return date;
  }
  
  if (date instanceof Timestamp) {
    return date.toDate();
  }
  
  // Verificar si es un objeto tipo Timestamp pero no instanceof Timestamp
  if (date && typeof date === 'object' && 'toDate' in date) {
    const toDateFn = (date as any).toDate;
    if (typeof toDateFn === 'function') {
      return toDateFn.call(date);
    }
  }
  
  try {
    // Intenta convertir desde timestamp o string
    const newDate = new Date(date as string | number);
    return isNaN(newDate.getTime()) ? null : newDate;
  } catch (e) {
    console.error("Error al convertir fecha:", e);
    return null;
  }
};

/**
 * Convierte cualquier representación de fecha a un Timestamp de Firestore
 * @param date Fecha en cualquier formato
 * @returns Timestamp o null si no es válido
 */
export const toTimestamp = (date: DateLike): Timestamp | null => {
  const dateObj = toDate(date);
  if (!dateObj) return null;
  return Timestamp.fromDate(dateObj);
};

/**
 * Normaliza una fecha eliminando la hora para comparaciones de solo fecha
 * @param date Fecha a normalizar
 * @returns Date normalizada o null si la entrada no es válida
 */
export const normalizarFecha = (date: DateLike): Date | null => {
  const dateObj = toDate(date);
  if (!dateObj) return null;
  
  const normalizedDate = new Date(dateObj);
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate;
};

/**
 * Compara dos fechas: devuelve -1 si date1 < date2, 0 si son iguales, 1 si date1 > date2
 * @param date1 Primera fecha a comparar
 * @param date2 Segunda fecha a comparar
 * @returns -1, 0, 1 según la comparación o null si alguna fecha es inválida
 */
export const compareDates = (date1: DateLike, date2: DateLike): number | null => {
  const d1 = normalizarFecha(date1);
  const d2 = normalizarFecha(date2);
  
  if (!d1 || !d2) return null;
  
  const t1 = d1.getTime();
  const t2 = d2.getTime();
  
  if (t1 < t2) return -1;
  if (t1 > t2) return 1;
  return 0;
};

/**
 * Determina el estado de una actividad basándose en sus fechas
 * @param fechaInicio Fecha de inicio de la actividad
 * @param fechaFin Fecha de fin de la actividad
 * @param estadoActual Estado actual (se respeta si es 'cancelada')
 * @returns El estado correspondiente
 */
export const determinarEstadoActividad = (
  fechaInicio: DateLike, 
  fechaFin: DateLike, 
  estadoActual?: string
): 'planificada' | 'en_curso' | 'finalizada' | 'cancelada' => {
  // Si ya está cancelada, mantener ese estado
  if (estadoActual === 'cancelada') return 'cancelada';
  
  const hoy = normalizarFecha(new Date())!;
  const inicioNormalizado = normalizarFecha(fechaInicio);
  const finNormalizado = normalizarFecha(fechaFin);
  
  // Si fechas no válidas, devolver planificada como fallback
  if (!inicioNormalizado || !finNormalizado) return 'planificada';
  
  // Usar el operador de coalescencia nula (??) para manejar los posibles null
  if ((compareDates(hoy, finNormalizado) ?? 0) > 0) {
    // Hoy es después de la fecha de fin
    return 'finalizada';
  } else if ((compareDates(hoy, inicioNormalizado) ?? 0) >= 0) {
    // Hoy es igual o después de la fecha de inicio
    return 'en_curso';
  } else {
    // Hoy es antes de la fecha de inicio
    return 'planificada';
  }
};

/**
 * Formatea una fecha para mostrarla al usuario
 * @param date Fecha a formatear
 * @param options Opciones de formateo (opcional)
 * @returns Cadena de fecha formateada o cadena vacía si la fecha es inválida
 */
export const formatDate = (date: DateLike, options?: Intl.DateTimeFormatOptions): string => {
  if (!date) return '';
  
  const dateObj = toDate(date);
  if (!dateObj) return '';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };
  
  return dateObj.toLocaleDateString('es-ES', options || defaultOptions);
};

/**
 * Comprueba si dos fechas corresponden al mismo día
 * @param date1 Primera fecha a comparar
 * @param date2 Segunda fecha a comparar
 * @returns true si ambas fechas son del mismo día, false en caso contrario
 */
export const isSameDay = (date1: DateLike, date2: DateLike): boolean => {
  const d1 = normalizarFecha(date1);
  const d2 = normalizarFecha(date2);
  
  if (!d1 || !d2) return false;
  
  return d1.getTime() === d2.getTime();
};

/**
 * Convierte una fecha a string ISO de forma segura
 * @param date Fecha a convertir
 * @returns String ISO o string vacío si la fecha es inválida
 */
export const safeISOString = (date: DateLike): string => {
  const dateObj = toDate(date);
  if (!dateObj) return '';
  
  return dateObj.toISOString();
};