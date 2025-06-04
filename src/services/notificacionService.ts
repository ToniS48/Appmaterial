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
        fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : data.fecha
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
    (snapshot) => {
      const notificaciones = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha instanceof Timestamp ? doc.data().fecha.toDate() : doc.data().fecha
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

export {};