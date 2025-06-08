import { crearNotificacion } from './notificacionService';
import { TipoNotificacion } from '../types/notificacion';

/**
 * Servicio para crear notificaciones relacionadas con mensajería
 */

export const notificarNuevoMensaje = async (
  destinatarioId: string,
  remitenteNombre: string,
  conversacionId: string,
  contenido: string,
  esGrupal: boolean = false
): Promise<void> => {
  try {
    const mensaje = esGrupal 
      ? `Nuevo mensaje en grupo de ${remitenteNombre}: ${contenido.length > 50 ? contenido.substring(0, 50) + '...' : contenido}`
      : `Nuevo mensaje de ${remitenteNombre}: ${contenido.length > 50 ? contenido.substring(0, 50) + '...' : contenido}`;

    await crearNotificacion({
      usuarioId: destinatarioId,
      tipo: 'mensaje' as TipoNotificacion,
      mensaje,
      enlace: `/mensajeria?conversacion=${conversacionId}`,
      entidadId: conversacionId,
      entidadTipo: 'conversacion',
      prioridad: 'normal'
    });
  } catch (error) {
    console.error('Error al crear notificación de mensaje:', error);
  }
};

export const notificarInvitacionConversacion = async (
  destinatarioId: string,
  nombreConversacion: string,
  invitadoPor: string,
  conversacionId: string
): Promise<void> => {
  try {
    await crearNotificacion({
      usuarioId: destinatarioId,
      tipo: 'sistema' as TipoNotificacion,
      mensaje: `${invitadoPor} te ha invitado a la conversación "${nombreConversacion}"`,
      enlace: `/mensajeria?conversacion=${conversacionId}`,
      entidadId: conversacionId,
      entidadTipo: 'conversacion',
      prioridad: 'normal'
    });
  } catch (error) {
    console.error('Error al crear notificación de invitación:', error);
  }
};

export const notificarMencionEnMensaje = async (
  destinatarioId: string,
  remitenteNombre: string,
  conversacionId: string,
  contenido: string
): Promise<void> => {
  try {
    await crearNotificacion({
      usuarioId: destinatarioId,
      tipo: 'mencion' as TipoNotificacion,
      mensaje: `${remitenteNombre} te ha mencionado: ${contenido.length > 50 ? contenido.substring(0, 50) + '...' : contenido}`,
      enlace: `/mensajeria?conversacion=${conversacionId}`,
      entidadId: conversacionId,
      entidadTipo: 'conversacion',
      prioridad: 'alta'
    });
  } catch (error) {
    console.error('Error al crear notificación de mención:', error);
  }
};
