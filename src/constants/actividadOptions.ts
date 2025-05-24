import { TipoActividad, SubtipoActividad, TipoActividadOption, SubtipoActividadOption } from '../types/actividad';

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