
import { Timestamp, FieldValue } from 'firebase/firestore';

export type RolUsuario = 'admin' | 'vocal' | 'socio' | 'invitado';

export interface Usuario {
  id?: string; // Para compatibilidad con BaseEntity
  uid: string;
  email: string;
  nombre: string;
  apellidos: string;
  rol: RolUsuario;
  activo: boolean;
  pendienteVerificacion: boolean;
  eliminado?: boolean; // Añadir este campo
  fechaEliminacion?: Timestamp | Date | FieldValue; // Añadir este campo
  telefono?: string;
  telefonosEmergencia?: string[];
  observaciones?: string;
  fechaCreacion?: Timestamp; // Cambiar para compatibilidad con BaseEntity
  fechaActualizacion?: Timestamp; // Añadir para compatibilidad con BaseEntity
  fechaRegistro?: Timestamp | Date | FieldValue;
  ultimaConexion?: Timestamp | Date | FieldValue;
  avatarUrl?: string;
}