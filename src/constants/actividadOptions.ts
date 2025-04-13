import { TipoActividad, SubtipoActividad } from '../types/actividad';

export interface OpcionValor {
  value: string;
  label: string;
  color?: string; // Opcional para ser más flexible
}

// Opciones para tipos de actividad
export const TIPOS_ACTIVIDAD = [
  { value: 'espeleologia' as TipoActividad, label: 'Espeleología' },
  { value: 'barranquismo' as TipoActividad, label: 'Barranquismo' },
  { value: 'exterior' as TipoActividad, label: 'Actividad Exterior' }
];

// Opciones para subtipos de actividad
export const SUBTIPOS_ACTIVIDAD = [
  { value: 'visita' as SubtipoActividad, label: 'Visita' },
  { value: 'exploracion' as SubtipoActividad, label: 'Exploración' },
  { value: 'formacion' as SubtipoActividad, label: 'Formación/Curso' },
  { value: 'otro' as SubtipoActividad, label: 'Otro' }
];

// Opciones para dificultad
export const DIFICULTADES: OpcionValor[] = [
  { value: 'baja', label: 'Baja', color: 'green' },
  { value: 'media', label: 'Media', color: 'orange' },
  { value: 'alta', label: 'Alta', color: 'red' }
];