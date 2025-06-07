import { TipoActividadOption, SubtipoActividadOption } from '../types/actividad';

export const TIPOS_ACTIVIDAD: TipoActividadOption[] = [
  { value: 'espeleologia', label: 'Espeleología' },
  { value: 'barranquismo', label: 'Barranquismo' },
  { value: 'exterior', label: 'Exterior' }
];

export const SUBTIPOS_ACTIVIDAD: SubtipoActividadOption[] = [
  { value: 'visita', label: 'Visita' },
  { value: 'exploracion', label: 'Exploración' },
  { value: 'formacion', label: 'Formación' },
  { value: 'otro', label: 'Otro' }
];

// Opciones de dificultad para actividades
export const DIFICULTADES_ACTIVIDAD = [
  { value: 'baja', label: 'Baja', color: 'green' },
  { value: 'media', label: 'Media', color: 'orange' },
  { value: 'alta', label: 'Alta', color: 'red' }
] as const;

export type DificultadActividad = typeof DIFICULTADES_ACTIVIDAD[number]['value'];