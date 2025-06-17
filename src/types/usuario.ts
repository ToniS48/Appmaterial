
import { Timestamp, FieldValue } from 'firebase/firestore';
import { EstadoAprobacion, EstadoActividad } from './usuarioHistorial';

export type RolUsuario = 'admin' | 'vocal' | 'socio' | 'invitado';

export interface Usuario {
  id?: string; // Para compatibilidad con BaseEntity
  uid: string;
  email: string;
  nombre: string;
  apellidos: string;
  rol: RolUsuario;
  
  // Estados actualizados según requerimientos
  estadoAprobacion: EstadoAprobacion; // Reemplaza el anterior 'activo' boolean
  estadoActividad: EstadoActividad; // Nuevo: basado en participación en actividades
  pendienteVerificacion: boolean; // Mantener para compatibilidad
  
  // Fechas importantes para calcular actividad
  fechaUltimaActividad?: Timestamp | Date | FieldValue; // Última participación en actividad
  fechaUltimaConexion?: Timestamp | Date | FieldValue; // Última vez que se conectó
  fechaAprobacion?: Timestamp | Date | FieldValue; // Cuando fue aprobado
  
  // Información adicional
  eliminado?: boolean;
  fechaEliminacion?: Timestamp | Date | FieldValue;
  telefono?: string;
  telefonosEmergencia?: string[];
  observaciones?: string;
  
  // Metadatos
  fechaCreacion?: Timestamp; // Cambiar para compatibilidad con BaseEntity
  fechaActualizacion?: Timestamp; // Añadir para compatibilidad con BaseEntity
  fechaRegistro?: Timestamp | Date | FieldValue;
  ultimaConexion?: Timestamp | Date | FieldValue; // Mantener para compatibilidad
  avatarUrl?: string;
  
  // Estadísticas de actividad (calculadas)
  totalActividades?: number; // Total de actividades en las que ha participado
  actividadesUltimos6Meses?: number; // Actividades en los últimos 6 meses
  diasDesdeUltimaActividad?: number; // Calculado dinámicamente
}