import { Timestamp } from 'firebase/firestore';
import { RolUsuario } from './usuario';

export type TipoMensaje = 'texto' | 'archivo' | 'imagen' | 'enlace';
export type EstadoMensaje = 'enviado' | 'entregado' | 'leido';
export type TipoConversacion = 'privada' | 'grupo' | 'actividad' | 'general';

export interface Mensaje {
  id: string;
  conversacionId: string;
  remitenteId: string;
  remitenteNombre: string;
  remitenteRol: RolUsuario;
  tipo: TipoMensaje;
  contenido: string;
  archivoUrl?: string;
  archivoNombre?: string;
  archivoTipo?: string;
  fechaEnvio: Date | Timestamp;
  fechaEdicion?: Date | Timestamp;
  estado: EstadoMensaje;
  respondeTo?: string; // ID del mensaje al que responde
  mencionados?: string[]; // IDs de usuarios mencionados
  etiquetas?: string[]; // Etiquetas del mensaje
  editado: boolean;
  eliminado: boolean;
  reacciones?: { [emoji: string]: string[] }; // emoji -> array de userIds
}

export interface Conversacion {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoConversacion;
  participantes: string[]; // IDs de usuarios
  administradores: string[]; // IDs de usuarios con permisos de admin
  creadorId: string;
  fechaCreacion: Date | Timestamp;
  fechaUltimoMensaje?: Date | Timestamp;
  ultimoMensaje?: string;
  avatarUrl?: string;
  activa: boolean;
  publica: boolean; // Si es visible para todos los roles
  rolesPermitidos: RolUsuario[]; // Roles que pueden participar
  configuracion: ConfiguracionConversacion;
  // Para conversaciones de actividad
  actividadId?: string;
  actividadNombre?: string;
}

export interface ConfiguracionConversacion {
  permiteArchivos: boolean;
  permiteImagenes: boolean;
  permiteEnlaces: boolean;
  soloAdministradores: boolean; // Solo admins pueden escribir
  notificacionesActivas: boolean;
  limiteTamaño: number; // MB para archivos
  moderada: boolean; // Los mensajes requieren aprobación
}

export interface ParticipanteConversacion {
  conversacionId: string;
  usuarioId: string;
  fechaUnion: Date | Timestamp;
  fechaUltimaLectura?: Date | Timestamp;
  mensajesNoLeidos: number;
  notificacionesActivas: boolean;
  silenciada: boolean;
  favorita: boolean;
  rol: 'miembro' | 'moderador' | 'administrador';
}

export interface MensajeLeido {
  mensajeId: string;
  usuarioId: string;
  fechaLectura: Date | Timestamp;
}

// Filtros para búsqueda de conversaciones
export interface FiltroConversaciones {
  tipo?: TipoConversacion;
  activa?: boolean;
  participante?: string;
  rol?: RolUsuario;
  fechaDesde?: Date;
  fechaHasta?: Date;
  busqueda?: string;
}

// Filtros para búsqueda de mensajes
export interface FiltroMensajes {
  conversacionId?: string;
  remitenteId?: string;
  tipo?: TipoMensaje;
  fechaDesde?: Date;
  fechaHasta?: Date;
  busqueda?: string;
  conArchivos?: boolean;
  conImagenes?: boolean;
}

// Datos para crear nueva conversación
export interface NuevaConversacion {
  nombre: string;
  descripcion?: string;
  tipo: TipoConversacion;
  participantes: string[];
  publica: boolean;
  rolesPermitidos: RolUsuario[];
  configuracion: Partial<ConfiguracionConversacion>;
  actividadId?: string;
}

// Datos para enviar mensaje
export interface NuevoMensaje {
  conversacionId: string;
  tipo: TipoMensaje;
  contenido: string;
  archivoUrl?: string;
  archivoNombre?: string;
  archivoTipo?: string;
  respondeTo?: string;
  mencionados?: string[];
  etiquetas?: string[];
}

// Estadísticas de mensajería
export interface EstadisticasMensajeria {
  totalConversaciones: number;
  conversacionesActivas: number;
  mensajesHoy: number;
  mensajesSemana: number;
  participantesActivos: number;
  conversacionesPorTipo: { [tipo: string]: number };
}
