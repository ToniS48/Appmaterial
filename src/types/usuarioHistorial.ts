/**
 * Tipos para el seguimiento y historial de usuarios
 * Gestiona el estado de aprobación, actividad y eventos relacionados con usuarios
 */
import { Timestamp } from 'firebase/firestore';

/**
 * Tipos de eventos que pueden ocurrir con un usuario
 */
export enum TipoEventoUsuario {
  REGISTRO = 'registro',
  APROBACION = 'aprobacion',
  RECHAZO = 'rechazo',
  ACTIVACION = 'activacion',
  DESACTIVACION = 'desactivacion',
  SUSPENSION = 'suspension',
  REACTIVACION = 'reactivacion',
  CAMBIO_ROL = 'cambio_rol',
  ACTUALIZACION_DATOS = 'actualizacion_datos',
  ELIMINACION = 'eliminacion',
  ULTIMA_CONEXION = 'ultima_conexion'
}

/**
 * Estados de aprobación de un usuario
 */
export enum EstadoAprobacion {
  PENDIENTE = 'pendiente',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado'
}

/**
 * Estados de actividad de un usuario basado en participación
 */
export enum EstadoActividad {
  ACTIVO = 'activo',        // Ha participado en actividades en los últimos 6 meses
  INACTIVO = 'inactivo',    // No ha participado en actividades en los últimos 6 meses
  SUSPENDIDO = 'suspendido' // Suspendido administrativamente
}

/**
 * Gravedad de una incidencia relacionada con un usuario
 */
export enum GravedadIncidenciaUsuario {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  CRITICA = 'critica'
}

/**
 * Evento individual en el historial de un usuario
 */
export interface EventoUsuario {
  id?: string;
  usuarioId: string;
  nombreUsuario: string;
  emailUsuario: string;
  tipoEvento: TipoEventoUsuario;
  descripcion: string;
  fecha: Timestamp | Date;
  año: number;
  mes: number; // 1-12
  
  // Información contextual
  responsableId?: string; // Usuario que realizó la acción (admin/vocal)
  responsableNombre?: string;
  actividadId?: string; // Si el evento está relacionado con una actividad
  actividadNombre?: string;
  
  // Detalles específicos
  rolAnterior?: string; // Para cambios de rol
  rolNuevo?: string;
  motivoSuspension?: string;
  gravedad?: GravedadIncidenciaUsuario;
  observaciones?: string;
  
  // Metadatos
  fechaRegistro: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Resumen anual de actividad de usuarios
 */
export interface ResumenAnualUsuarios {
  id?: string;
  año: number;
  
  // Estadísticas generales
  totalUsuarios: number;
  usuariosNuevos: number;
  usuariosAprobados: number;
  usuariosRechazados: number;
  usuariosSuspendidos: number;
  usuariosEliminados: number;
  
  // Estado de aprobación
  usuariosPendientes: number;
  tasaAprobacion: number; // Porcentaje de usuarios aprobados vs solicitados
  
  // Estado de actividad
  usuariosActivos: number;
  usuariosInactivos: number;
  tasaActividad: number; // Porcentaje de usuarios activos
  
  // Distribución por roles
  distribucuonRoles: {
    admin: number;
    vocal: number;
    socio: number;
    invitado: number;
  };
  
  // Actividad mensual
  registrosPorMes: number[]; // Array de 12 posiciones (0=enero, 11=diciembre)
  aprobaciónPorMes: number[];
  suspesionesPorMes: number[];
  
  // Eventos por tipo
  eventosPorTipo: Record<TipoEventoUsuario, number>;
  
  // Usuarios problemáticos
  usuariosProblematicos: UsuarioProblematico[];
  
  // Metadatos
  fechaCalculo: Timestamp;
  calculadoPor?: string;
}

/**
 * Usuario que requiere atención especial
 */
export interface UsuarioProblematico {
  usuarioId: string;
  nombreUsuario: string;
  emailUsuario: string;
  totalEventos: number;
  tiposEventos: Record<TipoEventoUsuario, number>;
  ultimoEvento: Timestamp | Date;
  gravedad: GravedadIncidenciaUsuario;
  recomendaciones: string[];
  estadoActual: {
    aprobacion: EstadoAprobacion;
    actividad: EstadoActividad;
    rol: string;
  };
}

/**
 * Estadísticas anuales calculadas para usuarios
 */
export interface EstadisticasAnualesUsuarios {
  año: number;
  
  // Contadores principales
  totalEventos: number;
  usuariosRegistrados: number;
  usuariosAprobados: number;
  usuariosRechazados: number;
  usuariosSuspendidos: number;
  usuariosActivos: number;
  usuariosInactivos: number;
  
  // Tasas y porcentajes
  tasaAprobacion: number;
  tasaActividad: number;
  tasaRetencion: number; // Usuarios que siguen activos después de 6 meses
  
  // Distribuciones
  eventosPorMes: number[]; // 12 posiciones
  eventosPorTipo: Record<TipoEventoUsuario, number>;
  usuariosPorRol: Record<string, number>;
  
  // Análisis de actividad
  usuariosProblematicos: UsuarioProblematico[];
  tiempoPromedioAprobacion: number; // Días
  participacionPromedio: number; // Actividades por usuario activo
  
  // Comparación con año anterior
  crecimientoUsuarios?: number; // Porcentaje
  cambioTasaActividad?: number;
  tendencia?: 'creciente' | 'estable' | 'decreciente';
}

/**
 * Filtros para consultas de historial de usuarios
 */
export interface FiltroHistorialUsuarios {
  usuarioId?: string;
  tipoEvento?: TipoEventoUsuario | TipoEventoUsuario[];
  estadoAprobacion?: EstadoAprobacion;
  estadoActividad?: EstadoActividad;
  rol?: string | string[];
  gravedad?: GravedadIncidenciaUsuario;
  fechaInicio?: Date;
  fechaFin?: Date;
  año?: number;
  mes?: number;
  responsableId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Configuración para el seguimiento de usuarios
 */
export interface ConfiguracionSeguimientoUsuarios {
  // Configuración de actividad
  mesesParaInactividad: number; // Por defecto 6 meses
  minimoActividadesActividad: number; // Mínimo de actividades para considerar activo
  
  // Configuración de aprobación
  diasLimiteAprobacion: number; // Días máximos para aprobar un usuario
  requiereAprobacionManual: boolean;
  
  // Configuración de alertas
  alertarUsuariosInactivos: boolean;
  alertarPendientesAprobacion: boolean;
  diasAntesAlertaInactividad: number;
  
  // Configuración de reportes
  generarReportesAutomaticos: boolean;
  frecuenciaReportes: 'mensual' | 'trimestral' | 'anual';
  destinatariosReportes: string[]; // Emails de administradores
}
