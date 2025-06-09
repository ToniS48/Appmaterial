import { Timestamp } from "firebase/firestore";
import { EstadoActividad } from "../types/actividad";

/**
 * Tipo para entradas de fecha que necesitan conversión a Timestamp
 * NUEVA ESTRATEGIA: Internamente todo será Timestamp
 */
export type DateInput = Date | Timestamp | string | number | null | undefined;

/**
 * Convierte cualquier entrada de fecha a Timestamp (formato interno único)
 * @param date Fecha en cualquier formato de entrada
 * @returns Timestamp o null si no es válido
 */
export const toTimestamp = (date: DateInput): Timestamp | null => {
  if (!date) return null;
  
  if (date instanceof Timestamp) {
    return date;
  }
  
  if (date instanceof Date) {
    return Timestamp.fromDate(date);
  }
  
  // Verificar si es un objeto tipo Timestamp pero no instanceof Timestamp
  if (date && typeof date === 'object' && 'toDate' in date) {
    const toDateFn = (date as any).toDate;
    if (typeof toDateFn === 'function') {
      try {
        const dateObj = toDateFn.call(date);
        return Timestamp.fromDate(dateObj);
      } catch (e) {
        console.warn("Error al convertir pseudo-timestamp:", e);
        return null;
      }
    }
  }
  
  try {
    // Intenta convertir desde timestamp o string
    const dateObj = new Date(date as string | number);
    if (isNaN(dateObj.getTime())) return null;
    return Timestamp.fromDate(dateObj);
  } catch (e) {
    console.error("Error al convertir fecha a timestamp:", e);
    return null;
  }
};

/**
 * Convierte Timestamp a Date solo para casos específicos donde se requiera
 * @param timestamp Timestamp de Firestore
 * @returns Date o null si no es válido
 */
export const timestampToDate = (timestamp: Timestamp | null | undefined): Date | null => {
  if (!timestamp || !(timestamp instanceof Timestamp)) return null;
  try {
    return timestamp.toDate();
  } catch (e) {
    console.error("Error al convertir timestamp a date:", e);
    return null;
  }
};

/**
 * Formatea un Timestamp para mostrar al usuario
 * @param timestamp Timestamp a formatear
 * @param options Opciones de formateo (opcional)
 * @returns Cadena de fecha formateada o cadena vacía si la fecha es inválida
 */
export const formatTimestamp = (
  timestamp: Timestamp | null | undefined, 
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!timestamp) return '';
  
  const date = timestampToDate(timestamp);
  if (!date) return '';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };
  
  try {
    return date.toLocaleDateString('es-ES', { ...defaultOptions, ...options });
  } catch (e) {
    console.error("Error al formatear fecha:", e);
    return '';
  }
};

/**
 * Serializa Timestamp para localStorage
 * @param data Objeto que puede contener timestamps
 * @returns Objeto con timestamps serializados como ISO strings
 */
export const serializeTimestampsForStorage = (data: any): any => {
  if (!data) return data;
  
  const serialized = { ...data };
  const dateFields = ['fechaInicio', 'fechaFin', 'fechaCreacion', 'fechaActualizacion'];
  
  dateFields.forEach(field => {
    if (serialized[field] instanceof Timestamp) {
      const date = timestampToDate(serialized[field]);
      if (date) {
        serialized[field] = date.toISOString();
      }
    }
  });
  
  return serialized;
};

/**
 * Deserializa desde localStorage convirtiendo a Timestamp
 * @param data Datos recuperados de localStorage
 * @returns Objeto con fechas convertidas a Timestamp
 */
export const deserializeTimestampsFromStorage = (data: any): any => {
  if (!data) return data;
  
  const deserialized = { ...data };
  const dateFields = ['fechaInicio', 'fechaFin', 'fechaCreacion', 'fechaActualizacion'];
  
  dateFields.forEach(field => {
    if (deserialized[field] && typeof deserialized[field] === 'string') {
      try {
        const date = new Date(deserialized[field]);
        if (!isNaN(date.getTime())) {
          deserialized[field] = Timestamp.fromDate(date);
        }
      } catch (e) {
        console.warn(`Error al deserializar timestamp ${field}:`, e);
        delete deserialized[field];
      }
    }
  });
  
  return deserialized;
};

/**
 * Normaliza una fecha eliminando la hora para comparaciones de solo fecha
 * @param timestamp Timestamp a normalizar
 * @returns Timestamp normalizado o null si la entrada no es válida
 */
export const normalizeTimestamp = (timestamp: Timestamp | null | undefined): Timestamp | null => {
  if (!timestamp) return null;
  
  const date = timestampToDate(timestamp);
  if (!date) return null;
  
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(normalizedDate);
};

/**
 * Compara dos timestamps: devuelve -1 si ts1 < ts2, 0 si son iguales, 1 si ts1 > ts2
 * @param ts1 Primer timestamp a comparar
 * @param ts2 Segundo timestamp a comparar
 * @returns -1, 0, 1 según la comparación o null si algún timestamp es inválido
 */
export const compareTimestamps = (ts1: Timestamp | null, ts2: Timestamp | null): number | null => {
  if (!ts1 || !ts2) return null;
  
  const normalized1 = normalizeTimestamp(ts1);
  const normalized2 = normalizeTimestamp(ts2);
  
  if (!normalized1 || !normalized2) return null;
  
  const seconds1 = normalized1.seconds;
  const seconds2 = normalized2.seconds;
  
  if (seconds1 < seconds2) return -1;
  if (seconds1 > seconds2) return 1;
  return 0;
};

/**
 * Determina el estado de una actividad basándose en sus fechas (usando Timestamps)
 * @param fechaInicio Timestamp de inicio de la actividad
 * @param fechaFin Timestamp de fin de la actividad
 * @param estadoActual Estado actual (se respeta si es 'cancelada')
 * @returns El estado correspondiente
 */
export const determinarEstadoActividad = (
  fechaInicio: Timestamp | null,
  fechaFin: Timestamp | null,
  estadoActual?: EstadoActividad
): EstadoActividad => {
  if (estadoActual === 'cancelada') return 'cancelada';
  
  const hoy = Timestamp.fromDate(new Date());
  const normalizedHoy = normalizeTimestamp(hoy);
  const inicioNormalizado = normalizeTimestamp(fechaInicio);
  const finNormalizado = normalizeTimestamp(fechaFin);
  
  // Si fechas no válidas, devolver planificada como fallback
  if (!inicioNormalizado || !finNormalizado || !normalizedHoy) return 'planificada';
  
  const compareWithStart = compareTimestamps(normalizedHoy, inicioNormalizado);
  const compareWithEnd = compareTimestamps(normalizedHoy, finNormalizado);
  
  if (compareWithEnd && compareWithEnd > 0) {
    // Hoy es después de la fecha de fin
    return 'finalizada';
  } else if (compareWithStart && compareWithStart >= 0) {
    // Hoy es igual o después de la fecha de inicio
    return 'en_curso';
  } else {
    // Hoy es antes de la fecha de inicio
    return 'planificada';
  }
};

/**
 * Convierte un Timestamp a string ISO de forma segura
 * @param timestamp Timestamp a convertir
 * @returns String ISO o string vacío si falla
 */
export const safeISOString = (timestamp: Timestamp | null): string => {
  if (!timestamp) return '';
  
  try {
    const date = timestampToDate(timestamp);
    return date ? date.toISOString() : '';
  } catch (e) {
    console.error("Error al convertir timestamp a ISO string:", e);
    return '';
  }
};

/**
 * Comprueba si dos timestamps representan el mismo día
 * @param ts1 Primer timestamp
 * @param ts2 Segundo timestamp
 * @returns true si representan el mismo día, false en caso contrario
 */
export const isSameDay = (ts1: Timestamp | null, ts2: Timestamp | null): boolean => {
  if (!ts1 || !ts2) return false;
  
  const date1 = timestampToDate(ts1);
  const date2 = timestampToDate(ts2);
  
  if (!date1 || !date2) return false;
  
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

/**
 * Normaliza una fecha eliminando las horas (alias para normalizeTimestamp)
 * @param timestamp Timestamp a normalizar
 * @returns Timestamp normalizado a medianoche
 */
export const normalizarFecha = (timestamp: Timestamp | null): Timestamp | null => {
  return normalizeTimestamp(timestamp);
};

// FUNCIONES DE COMPATIBILIDAD PARA MIGRACIÓN GRADUAL
// Estas funciones mantienen la compatibilidad con el código existente

/**
 * @deprecated Usar toTimestamp en su lugar
 */
export const toDate = (date: DateInput): Date | null => {
  console.warn('toDate() está deprecated. Usar toTimestamp() + timestampToDate() en su lugar.');
  const timestamp = toTimestamp(date);
  return timestamp ? timestampToDate(timestamp) : null;
};

/**
 * @deprecated Usar serializeTimestampsForStorage en su lugar
 */
export const serializeForLocalStorage = serializeTimestampsForStorage;

/**
 * @deprecated Usar deserializeTimestampsFromStorage en su lugar
 */
export const deserializeFromLocalStorage = deserializeTimestampsFromStorage;

/**
 * @deprecated Usar formatTimestamp en su lugar
 */
export const formatFecha = (date: DateInput, options?: Intl.DateTimeFormatOptions): string => {
  console.warn('formatFecha() está deprecated. Usar formatTimestamp() en su lugar.');
  const timestamp = toTimestamp(date);
  return formatTimestamp(timestamp, options);
};
