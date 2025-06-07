import { Actividad } from './actividad';

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
 * Tipo para el formulario de actividades
 * Define la estructura esperada para los datos del formulario de actividades
 */
export interface ActividadFormData extends Omit<Actividad, 'id' | 'fechaCreacion' | 'fechaActualizacion'> {
  // Aquí puedes añadir campos adicionales específicos del formulario si los hay
}

/**
 * Props específicos para cada editor
 */
export interface InfoEditorProps extends BaseEditorProps<Actividad, Partial<Actividad>> {
  mostrarBotones?: boolean;
}

// Actualizar interfaces para usar callbacks directos

export interface ParticipantesEditorProps {
  data: Actividad;
  onSave: (participanteIds: string[]) => void;
  onResponsablesChange: (responsableActividadId: string, responsableMaterialId?: string) => void;
  mostrarBotones?: boolean;
  onCancel?: () => void;
}

export interface MaterialEditorProps {
  data: Actividad;
  onSave: (materiales: { materialId: string; nombre: string; cantidad: number }[]) => void;
  onNecesidadMaterialChange?: (necesita: boolean) => void;
  isInsideForm?: boolean;
  mostrarBotones?: boolean;
  onCancel?: () => void;
}

export interface EnlacesEditorProps {
  data: Actividad;
  onSave: (enlaces: any) => void;
  mostrarBotones?: boolean;
  onCancel?: () => void;
  esNuevo?: boolean; // Añadir esta propiedad opcional
}