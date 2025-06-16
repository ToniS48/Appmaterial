/**
 * Wrapper de clase para el servicio de notificaciones
 * Mantiene compatibilidad con el patrón de inyección de dependencias
 */
import { 
  crearNotificacion as crearNotificacionFunc,
  enviarNotificacionMasiva,
  enviarRecordatorioDevolucion,
  enviarNotificacionDevolucion
} from '../notificacionService';
import { Notificacion, TipoNotificacion } from '../../types/notificacion';

export class NotificacionService {
  /**
   * Crear una nueva notificación
   */
  async crearNotificacion(notificacion: Omit<Notificacion, 'id' | 'fecha' | 'leida'>): Promise<Notificacion> {
    return crearNotificacionFunc(notificacion);
  }

  /**
   * Enviar notificación masiva a múltiples usuarios
   */
  async enviarNotificacionMasiva(
    usuarioIds: string[],
    tipo: TipoNotificacion,
    mensaje: string,
    enlace?: string,
    entidadId?: string,
    entidadTipo?: string
  ): Promise<void> {
    return enviarNotificacionMasiva(usuarioIds, tipo, mensaje, enlace, entidadId, entidadTipo);
  }
  /**
   * Enviar recordatorio de devolución
   */
  async enviarRecordatorioDevolucion(
    usuarioId: string,
    nombreMaterial: string,
    fechaVencimiento: Date
  ): Promise<void> {
    return enviarRecordatorioDevolucion(usuarioId, nombreMaterial, fechaVencimiento);
  }
  /**
   * Crear recordatorio personalizado
   */
  async crearRecordatorioPersonalizado(
    usuarioId: string,
    mensaje: string,
    fechaRecordatorio: Date,
    enlace?: string,
    entidadId?: string,
    entidadTipo?: string
  ): Promise<Notificacion> {
    // Crear la notificación directamente ya que la función original espera un array
    return this.crearNotificacion({
      usuarioId,
      tipo: 'recordatorio',
      mensaje,
      enlace,
      entidadId,
      entidadTipo
    });
  }

  /**
   * Notificar nueva actividad a participantes
   */
  async notificarNuevaActividad(actividad: any, participanteIds: string[]): Promise<void> {
    const mensaje = `Nueva actividad: ${actividad.nombre} programada para ${new Date(actividad.fechaInicio).toLocaleDateString()}`;
    return this.enviarNotificacionMasiva(
      participanteIds,
      'actividad',
      mensaje,
      `/actividades/${actividad.id}`,
      actividad.id,
      'actividad'
    );
  }

  /**
   * Notificar cambios en actividad
   */
  async notificarCambioActividad(actividad: any, participanteIds: string[], mensaje: string): Promise<void> {
    return this.enviarNotificacionMasiva(
      participanteIds,
      'actividad',
      mensaje,
      `/actividades/${actividad.id}`,
      actividad.id,
      'actividad'
    );
  }

  /**
   * Notificar cancelación de actividad
   */
  async notificarCancelacionActividad(actividad: any, participanteIds: string[], motivo: string): Promise<void> {
    const mensaje = `Actividad "${actividad.nombre}" ha sido cancelada. Motivo: ${motivo}`;
    return this.enviarNotificacionMasiva(
      participanteIds,
      'actividad',
      mensaje,
      `/actividades/${actividad.id}`,
      actividad.id,
      'actividad'
    );
  }

  /**
   * Notificar nuevo participante en actividad
   */
  async notificarNuevoParticipante(actividad: any, usuarioId: string): Promise<void> {
    const mensaje = `Nuevo participante se ha unido a la actividad: ${actividad.nombre}`;
    await this.crearNotificacion({
      usuarioId: actividad.responsableActividadId,
      tipo: 'actividad',
      mensaje,
      enlace: `/actividades/${actividad.id}`,
      entidadId: actividad.id,
      entidadTipo: 'actividad'
    });
  }

  /**
   * Notificar que un participante abandona la actividad
   */
  async notificarParticipanteAbandona(actividad: any, usuarioId: string): Promise<void> {
    const mensaje = `Un participante ha abandonado la actividad: ${actividad.nombre}`;
    await this.crearNotificacion({
      usuarioId: actividad.responsableActividadId,
      tipo: 'actividad',
      mensaje,
      enlace: `/actividades/${actividad.id}`,
      entidadId: actividad.id,
      entidadTipo: 'actividad'
    });
  }

  /**
   * Notificar actividad cancelada
   */
  async notificarActividadCancelada(actividad: any, motivo: string): Promise<void> {
    const mensaje = `Actividad "${actividad.nombre}" ha sido cancelada. Motivo: ${motivo}`;
    await this.enviarNotificacionMasiva(
      actividad.participanteIds,
      'actividad',
      mensaje,
      `/actividades/${actividad.id}`,
      actividad.id,
      'actividad'
    );
  }

  /**
   * Notificar sobre devolución de material
   */
  async notificarDevolucionMaterial(actividad: any): Promise<void> {
    const mensaje = `Recordatorio: Devolver material de la actividad "${actividad.nombre}"`;
    await this.crearNotificacion({
      usuarioId: actividad.responsableMaterialId!,
      tipo: 'material',
      mensaje,
      enlace: `/actividades/${actividad.id}`,
      entidadId: actividad.id,
      entidadTipo: 'actividad'
    });
  }

  /**
   * Notificar cuando se devuelve material
   */
  async notificarDevolucion(
    prestamo: any,
    incidencia?: { tipo?: string; gravedad?: string; descripcion: string }
  ): Promise<void> {
    return enviarNotificacionDevolucion(prestamo, incidencia);
  }
}

// Instancia singleton
export const notificacionService = new NotificacionService();
export default notificacionService;
