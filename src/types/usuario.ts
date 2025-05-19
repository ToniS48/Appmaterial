import { Timestamp, FieldValue } from 'firebase/firestore';

export type RolUsuario = 'admin' | 'vocal' | 'socio' | 'invitado';

export interface Usuario {
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
  fechaCreacion?: Timestamp | Date | FieldValue;
  fechaRegistro?: Timestamp | Date | FieldValue;
  ultimaConexion?: Timestamp | Date | FieldValue;
  avatarUrl?: string;
}