import { Actividad, MaterialAsignado } from './actividad';

/**
 * Interfaz base para todos los editores de la aplicación
 */
export interface BaseEditorProps<T, R = T> {
  data: T;
  onSave: (data: R) => void;
  onCancel?: () => void;
  mostrarBotones?: boolean;
}

/**
 * Props específicos para cada editor
 */
export interface InfoEditorProps extends BaseEditorProps<Actividad, Partial<Actividad>> {
  mostrarBotones?: boolean;
}

export interface ParticipantesEditorProps extends BaseEditorProps<Actividad, string[]> {
  // Propiedades específicas si son necesarias
}

// Usar MaterialAsignado en lugar de MaterialActividad
export interface MaterialEditorProps extends BaseEditorProps<Actividad, MaterialAsignado[]> {
  // Propiedades específicas si son necesarias
  isInsideForm?: boolean; // Añadir esta propiedad para indicar si el editor está dentro de un formulario
}

export interface EnlacesEditorProps extends BaseEditorProps<Actividad, Partial<Actividad>> {
  esNuevo?: boolean;
}