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
import { handleFirebaseError } from '../utils/errorHandling';
import { Prestamo } from '../types/prestamo'; // Añadir esta importación

// Obtener notificaciones de un usuario
export const obtenerNotificacionesUsuario = async (usuarioId: string, mostrarLeidas: boolean = false, limite: number = 50): Promise<Notificacion[]> => {
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
    handleFirebaseError(error, 'Error al obtener notificaciones');
    throw error;
  }
};

// Crear una nueva notificación
export const crearNotificacion = async (notificacion: Omit<Notificacion, 'id' | 'fecha' | 'leida'>): Promise<Notificacion> => {
  try {
    const notificacionData = {
      ...notificacion,
      fecha: serverTimestamp(),
      leida: false
    };
    
    const docRef = await addDoc(collection(db, 'notificaciones'), notificacionData);
    
    return {
      id: docRef.id,
      ...notificacionData,
      fecha: new Date()
    } as Notificacion;
  } catch (error) {
    handleFirebaseError(error, 'Error al crear notificación');
    throw error;
  }
};

// Marcar una notificación como leída
export const marcarNotificacionLeida = async (notificacionId: string): Promise<void> => {
  try {
    const notificacionRef = doc(db, 'notificaciones', notificacionId);
    await updateDoc(notificacionRef, { 
      leida: true 
    });
  } catch (error) {
    handleFirebaseError(error, 'Error al marcar notificación como leída');
    throw error;
  }
};

// Marcar todas las notificaciones como leídas
export const marcarTodasLeidas = async (usuarioId: string): Promise<void> => {
  try {
    const notificacionQuery = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', usuarioId),
      where('leida', '==', false)
    );
    
    const snapshot = await getDocs(notificacionQuery);
    
    // Actualizar cada notificación
    const promises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { leida: true })
    );
    
    await Promise.all(promises);
  } catch (error) {
    handleFirebaseError(error, 'Error al marcar todas las notificaciones como leídas');
    throw error;
  }
};

// Eliminar una notificación
export const eliminarNotificacion = async (notificacionId: string): Promise<void> => {
  try {
    const notificacionRef = doc(db, 'notificaciones', notificacionId);
    await deleteDoc(notificacionRef);
  } catch (error) {
    handleFirebaseError(error, 'Error al eliminar notificación');
    throw error;
  }
};

// Enviar notificación a varios usuarios
export const enviarNotificacionMasiva = async (
  usuarioIds: string[],
  tipo: TipoNotificacion,
  mensaje: string,
  entidadId?: string,
  entidadTipo?: string,
  enlace?: string
): Promise<void> => {
  try {
    const promises = usuarioIds.map(usuarioId => crearNotificacion({
      usuarioId,
      tipo,
      mensaje,
      entidadId,
      entidadTipo,
      enlace
    }));
    
    await Promise.all(promises);
  } catch (error) {
    handleFirebaseError(error, 'Error al enviar notificaciones masivas');
    throw error;
  }
};

// Suscribirse a cambios en notificaciones en tiempo real
export const subscribeToNotificaciones = (
  usuarioId: string, 
  onUpdate: (notificaciones: Notificacion[]) => void,
  onError: (error: Error) => void
): () => void => {
  try {
    // Crear la consulta para obtener notificaciones no leídas
    const notificacionQuery = query(
      collection(db, 'notificaciones'),
      where('usuarioId', '==', usuarioId),
      where('leida', '==', false),
      orderBy('fecha', 'desc')
    );
    
    // Suscribirse a cambios en tiempo real
    const unsubscribe = onSnapshot(
      notificacionQuery,
      (snapshot) => {
        // Convertir documentos a objetos Notificacion
        const notificaciones = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : data.fecha
          } as Notificacion;
        });
        
        // Llamar al callback con las notificaciones actualizadas
        onUpdate(notificaciones);
      },
      onError
    );
    
    // Devolver función para cancelar la suscripción
    return unsubscribe;
  } catch (error) {
    console.error('Error al suscribirse a notificaciones:', error);
    onError(error as Error);
    // Devolver una función vacía como fallback
    return () => {};
  }
};

// Añadir nuevo servicio para enviar recordatorios

// Enviar recordatorio de devolución próxima
export const enviarRecordatorioDevolucion = async (diasAntelacion: number = 2): Promise<void> => {
  try {
    // Obtener fecha actual
    const ahora = new Date();
    
    // Calcular fecha límite (hoy + días de antelación)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAntelacion);
    
    // Obtener préstamos activos con fecha de devolución próxima
    const prestamosQuery = query(
      collection(db, 'prestamos'),
      where('estado', '==', 'en_uso'),
      where('fechaDevolucionPrevista', '>=', Timestamp.fromDate(ahora)),
      where('fechaDevolucionPrevista', '<=', Timestamp.fromDate(fechaLimite))
    );
    
    const prestamosSnapshot = await getDocs(prestamosQuery);
    const prestamos = prestamosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Prestamo[];
    
    // Enviar recordatorio para cada préstamo
    for (const prestamo of prestamos) {
      const fechaDevolucion = prestamo.fechaDevolucionPrevista instanceof Timestamp ? 
        prestamo.fechaDevolucionPrevista.toDate() : prestamo.fechaDevolucionPrevista;
      
      const formattedDate = fechaDevolucion.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      
      await enviarNotificacionMasiva(
        [prestamo.usuarioId],
        'recordatorio',
        `Recordatorio: Debes devolver el material "${prestamo.nombreMaterial}" antes del ${formattedDate}`,
        prestamo.id,
        'prestamo',
        `/prestamos`
      );
    }
    
    return;
  } catch (error) {
    console.error('Error al enviar recordatorios:', error);
    throw error;
  }
};

// Crear un recordatorio personalizado
export const crearRecordatorioPersonalizado = async (
  usuarioIds: string[],
  mensaje: string,
  fecha: Date,
  entidadId?: string,
  entidadTipo?: string,
  enlace?: string
): Promise<void> => {
  try {
    await enviarNotificacionMasiva(
      usuarioIds,
      'recordatorio',
      mensaje,
      entidadId,
      entidadTipo,
      enlace
    );
    
    return;
  } catch (error) {
    handleFirebaseError(error, 'Error al crear recordatorio');
    throw error;
  }
};