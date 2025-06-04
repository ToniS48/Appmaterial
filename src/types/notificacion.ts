
import { Timestamp } from 'firebase/firestore';

export type TipoNotificacion = 
  | 'material' 
  | 'actividad' 
  | 'prestamo' 
  | 'devolucion' 
  | 'incidencia' 
  | 'sistema'
  | 'recordatorio';

export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: TipoNotificacion;
  mensaje: string;
  fecha: Date | Timestamp;
  leida: boolean;
  enlace?: string; // URL opcional para navegar al hacer clic
  entidadId?: string; // ID de la entidad relacionada (material, actividad, etc.)
  entidadTipo?: string; // Tipo de la entidad relacionada
  imagen?: string; // URL opcional para una imagen
  prioridad?: 'baja' | 'normal' | 'alta'; // Prioridad del mensaje
}