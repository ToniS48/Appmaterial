import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notificacion, TipoNotificacion } from '../types/notificacion';

// Obtener notificaciones de un usuario
export const obtenerNotificacionesUsuario = async (
  usuarioId: string, 
  mostrarLeidas: boolean = false, 
  limite: number = 10
): Promise<Notificacion[]> => {
  try {
    let notificacionQuery = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', usuarioId),
      orderBy('fecha', 'desc'),
      limit(limite)
    );
    
    // Si no queremos mostrar las leídas
    if (!mostrarLeidas) {
      notificacionQuery = query(
        collection(db, 'notificaciones'),
        where('usuarioId', '==', usuarioId),
        where('leida', '==', false),
        orderBy('fecha', 'desc'),
        limit(limite)
      );
    }
      const snapshot = await getDocs(notificacionQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // NUEVA ESTRATEGIA: Mantener Timestamp internamente, formatear solo en UI
        fecha: data.fecha instanceof Timestamp ? data.fecha : (data.fecha ? Timestamp.fromDate(new Date(data.fecha)) : Timestamp.now())
      } as Notificacion;
    });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    throw error;
  }
};

// Crear una nueva notificación
export const crearNotificacion = async (notificacion: Omit<Notificacion, 'id' | 'fecha' | 'leida'>): Promise<Notificacion> => {
  try {
    const nuevaNotificacion = {
      ...notificacion,
      fecha: serverTimestamp(),
      leida: false
    };
    
    const docRef = await addDoc(collection(db, 'notificaciones'), nuevaNotificacion);
    
    return {
      id: docRef.id,
      ...notificacion,
      fecha: new Date(),
      leida: false
    };
  } catch (error) {
    console.error('Error al crear notificación:', error);
    throw error;
  }
};

// Marcar una notificación como leída
export const marcarNotificacionComoLeida = async (notificacionId: string): Promise<void> => {
  try {
    const notificacionRef = doc(db, 'notificaciones', notificacionId);
    await updateDoc(notificacionRef, { 
      leida: true 
    });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    throw error;
  }
};

// Eliminar una notificación
export const eliminarNotificacion = async (notificacionId: string): Promise<void> => {
  try {
    const notificacionRef = doc(db, 'notificaciones', notificacionId);
    await deleteDoc(notificacionRef);
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    throw error;
  }
};

// Enviar notificación masiva
export const enviarNotificacionMasiva = async (
  usuarioIds: string[], 
  tipo: TipoNotificacion, 
  mensaje: string,
  entidadId?: string,
  entidadTipo?: string,
  enlace?: string
): Promise<void> => {
  try {
    const promises = usuarioIds.map(usuarioId => 
      crearNotificacion({
        usuarioId,
        tipo,
        mensaje,
        entidadId,
        entidadTipo,
        enlace
      })
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Error al enviar notificación masiva:', error);
    throw error;
  }
};

// Marcar todas las notificaciones como leídas
export const marcarTodasLeidas = async (usuarioId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', usuarioId),
      where('leida', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { leida: true })
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
    throw error;
  }
};

// Suscripción en tiempo real
export const suscribirseANotificaciones = (
  usuarioId: string, 
  callback: (notificaciones: Notificacion[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(
    collection(db, 'notificaciones'),
    where('usuarioId', '==', usuarioId),
    where('leida', '==', false),
    orderBy('fecha', 'desc')
  );

  return onSnapshot(q, 
    (snapshot) => {      const notificaciones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // NUEVA ESTRATEGIA: Mantener Timestamp internamente
        fecha: doc.data().fecha instanceof Timestamp ? doc.data().fecha : (doc.data().fecha ? Timestamp.fromDate(new Date(doc.data().fecha)) : Timestamp.now())
      } as Notificacion));
      callback(notificaciones);
    },
    (error) => {
      console.error('Error en suscripción a notificaciones:', error);
      if (onError) onError(error);
    }
  );
};

// Enviar recordatorio de devolución
export const enviarRecordatorioDevolucion = async (
  usuarioId: string, 
  nombreMaterial: string, 
  fechaVencimiento: Date
): Promise<void> => {
  try {
    await crearNotificacion({
      usuarioId,
      tipo: 'material',
      mensaje: `Recordatorio de Devolución: El material "${nombreMaterial}" debe ser devuelto el ${fechaVencimiento.toLocaleDateString()}`
    });
  } catch (error) {
    console.error('Error al enviar recordatorio de devolución:', error);
    throw error;
  }
};

// Enviar notificación cuando se devuelve material
export const enviarNotificacionDevolucion = async (
  prestamo: any,
  incidencia?: { tipo?: string; gravedad?: string; descripcion: string }
): Promise<void> => {
  try {
    console.log('📧 Enviando notificaciones de devolución para préstamo:', prestamo.id);
    
    // Obtener información adicional si está disponible
    let actividad = null;
    let usuarios: any[] = [];
    
    try {
      const { listarUsuarios } = await import('./usuarioService');
      usuarios = await listarUsuarios();
    } catch (error) {
      console.warn('No se pudieron obtener usuarios para notificaciones:', error);
    }
    
    try {
      if (prestamo.actividadId) {
        const { obtenerActividad } = await import('./actividadService');
        actividad = await obtenerActividad(prestamo.actividadId);
      }
    } catch (error) {
      console.warn('No se pudo obtener información de la actividad:', error);
    }
    
    // Construir mensaje base
    const materialInfo = `Material "${prestamo.nombreMaterial}"`;
    const actividadInfo = actividad ? ` de la actividad "${actividad.nombre}"` : '';
    const incidenciaInfo = incidencia ? ` con ${incidencia.tipo === 'perdida' ? 'pérdida' : 'incidencia'}` : '';
    
    const mensajeBase = `${materialInfo}${actividadInfo} ha sido devuelto${incidenciaInfo}`;
    
    const usuariosANotificar: string[] = [];
    
    // 1. Notificar al responsable de la actividad (si existe y es diferente del usuario que devolvió)
    if (actividad?.responsableActividadId && actividad.responsableActividadId !== prestamo.usuarioId) {
      usuariosANotificar.push(actividad.responsableActividadId);
    }
    
    // 2. Notificar al responsable del material (si existe y es diferente del usuario que devolvió)
    if (actividad?.responsableMaterialId && 
        actividad.responsableMaterialId !== prestamo.usuarioId &&
        actividad.responsableMaterialId !== actividad.responsableActividadId) {
      usuariosANotificar.push(actividad.responsableMaterialId);
    }
    
    // 3. Notificar a administradores y vocales
    const adminsYVocales = usuarios.filter(u => u.rol === 'admin' || u.rol === 'vocal');
    adminsYVocales.forEach(usuario => {
      if (!usuariosANotificar.includes(usuario.uid) && usuario.uid !== prestamo.usuarioId) {
        usuariosANotificar.push(usuario.uid);
      }
    });
    
    // Enviar notificaciones si hay destinatarios
    if (usuariosANotificar.length > 0) {
      let mensaje = mensajeBase;
      
      // Añadir información adicional para administradores
      if (incidencia) {
        mensaje += `\n\nDetalles de la incidencia:\n`;
        mensaje += `Tipo: ${incidencia.tipo || 'No especificado'}\n`;
        if (incidencia.gravedad) {
          mensaje += `Gravedad: ${incidencia.gravedad}\n`;
        }
        mensaje += `Descripción: ${incidencia.descripcion}`;
      }
      
      // Información del usuario que devolvió
      mensaje += `\n\nDevuelto por: ${prestamo.nombreUsuario || 'Usuario desconocido'}`;
      
      const enlace = actividad ? `/activities/${actividad.id}` : '/material';
      
      await enviarNotificacionMasiva(
        usuariosANotificar,
        incidencia ? 'incidencia' : 'devolucion',
        mensaje,
        prestamo.id,
        'prestamo',
        enlace
      );
      
      console.log(`✅ Notificaciones de devolución enviadas a ${usuariosANotificar.length} usuarios`);
    } else {
      console.log('ℹ️ No hay usuarios para notificar sobre la devolución');
    }
    
  } catch (error) {
    console.error('❌ Error al enviar notificaciones de devolución:', error);
    // No lanzamos error para no interrumpir el proceso de devolución
  }
};

export {};