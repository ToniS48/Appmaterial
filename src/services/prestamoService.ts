import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Prestamo, EstadoPrestamo } from '../types/prestamo';

// Crear un nuevo préstamo
export const crearPrestamo = async (prestamoData: Omit<Prestamo, 'id'>): Promise<Prestamo> => {
  try {
    // Asegurar que la fecha de préstamo esté definida
    if (!prestamoData.fechaPrestamo) {
      prestamoData.fechaPrestamo = Timestamp.now();
    }
    
    const prestamosRef = collection(db, 'prestamos');
    const docRef = await addDoc(prestamosRef, prestamoData);
    
    const nuevoPrestamoConId = {
      id: docRef.id,
      ...prestamoData
    };
    
    return nuevoPrestamoConId;
  } catch (error) {
    console.error('Error al crear préstamo:', error);
    throw error;
  }
};

// Obtener préstamos por usuario
export const obtenerPrestamosPorUsuario = async (usuarioId: string): Promise<Prestamo[]> => {
  try {
    const q = query(
      collection(db, 'prestamos'),
      where('usuarioId', '==', usuarioId),
      orderBy('fechaPrestamo', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as Prestamo);
  } catch (error) {
    console.error('Error al obtener préstamos por usuario:', error);
    throw error;
  }
};

// Actualizar estado de préstamo
export const actualizarEstadoPrestamo = async (prestamoId: string, nuevoEstado: EstadoPrestamo): Promise<void> => {
  try {
    const prestamoRef = doc(db, 'prestamos', prestamoId);
    await updateDoc(prestamoRef, { 
      estado: nuevoEstado,
      fechaActualizacion: serverTimestamp()
    });
  } catch (error) {
    console.error('Error al actualizar estado de préstamo:', error);
    throw error;
  }
};

// Obtener préstamo por ID
export const obtenerPrestamoPorId = async (prestamoId: string): Promise<Prestamo | null> => {
  try {
    const prestamoRef = doc(db, 'prestamos', prestamoId);
    const docSnap = await getDoc(prestamoRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Prestamo;
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener préstamo por ID:', error);
    throw error;
  }
};

// Registrar devolución de préstamo
export const registrarDevolucion = async (prestamoId: string, observaciones?: string): Promise<void> => {
  try {
    const prestamoRef = doc(db, 'prestamos', prestamoId);
    await updateDoc(prestamoRef, {
      estado: 'devuelto' as EstadoPrestamo,
      fechaDevolucion: serverTimestamp(),
      observacionesDevolucion: observaciones || ''
    });
  } catch (error) {
    console.error('Error al registrar devolución:', error);
    throw error;
  }
};

// Registrar devolución con incidencia opcional
export const registrarDevolucionConIncidencia = async (
  prestamoId: string, 
  observaciones?: string,
  incidencia?: {
    tipo: string | undefined;
    gravedad: string | undefined;
    descripcion: string;
  }
): Promise<void> => {
  try {
    const prestamoRef = doc(db, 'prestamos', prestamoId);
    const updateData: any = {
      estado: 'devuelto' as EstadoPrestamo,
      fechaDevolucion: serverTimestamp(),
      observacionesDevolucion: observaciones || ''
    };

    // Si hay incidencia, agregar campos de incidencia
    if (incidencia) {
      updateData.incidencia = {
        tipo: incidencia.tipo,
        gravedad: incidencia.gravedad,
        descripcion: incidencia.descripcion,
        fechaRegistro: serverTimestamp()
      };
      
      // Cambiar estado según la gravedad de la incidencia
      if (incidencia.tipo === 'perdida') {
        updateData.estado = 'perdido' as EstadoPrestamo;
      } else if (incidencia.gravedad === 'alta' || incidencia.gravedad === 'critica') {
        updateData.estado = 'estropeado' as EstadoPrestamo;
      }
    }
    
    await updateDoc(prestamoRef, updateData);
  } catch (error) {
    console.error('Error al registrar devolución con incidencia:', error);
    throw error;
  }
};

// Listar todos los préstamos con filtros opcionales
export const listarPrestamos = async (filtros?: {
  usuarioId?: string;
  estado?: EstadoPrestamo;
  actividadId?: string;
}): Promise<Prestamo[]> => {
  try {
    let q = query(collection(db, 'prestamos'), orderBy('fechaPrestamo', 'desc'));
    
    if (filtros?.usuarioId) {
      q = query(q, where('usuarioId', '==', filtros.usuarioId));
    }
    
    if (filtros?.estado) {
      q = query(q, where('estado', '==', filtros.estado));
    }
    
    if (filtros?.actividadId) {
      q = query(q, where('actividadId', '==', filtros.actividadId));
    }
    
    const querySnapshot = await getDocs(q);
    const prestamos: Prestamo[] = [];
    
    querySnapshot.forEach((doc) => {
      prestamos.push({
        id: doc.id,
        ...doc.data()
      } as Prestamo);
    });
    
    return prestamos;
  } catch (error) {
    console.error('Error al listar préstamos:', error);
    throw error;
  }
};

// Obtener préstamos por actividad
export const obtenerPrestamosPorActividad = async (actividadId: string): Promise<Prestamo[]> => {
  try {
    const q = query(
      collection(db, 'prestamos'),
      where('actividadId', '==', actividadId),
      orderBy('fechaPrestamo', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const prestamos: Prestamo[] = [];
    
    querySnapshot.forEach((doc) => {
      prestamos.push({
        id: doc.id,
        ...doc.data()
      } as Prestamo);
    });
    
    return prestamos;
  } catch (error) {
    console.error('Error al obtener préstamos por actividad:', error);
    throw error;
  }
};

// Actualizar préstamo existente
export const actualizarPrestamo = async (prestamoId: string, prestamoData: Partial<Prestamo>): Promise<Prestamo> => {
  try {
    const prestamoRef = doc(db, 'prestamos', prestamoId);
    
    // Filtrar datos actualizables (sin ID)
    const { id, ...dataToUpdate } = prestamoData;
    
    await updateDoc(prestamoRef, dataToUpdate);
    
    // Obtener el préstamo actualizado
    const prestamoActualizado = await obtenerPrestamoPorId(prestamoId);
    if (!prestamoActualizado) {
      throw new Error('No se pudo obtener el préstamo actualizado');
    }
    
    return prestamoActualizado;
  } catch (error) {
    console.error('Error al actualizar préstamo:', error);
    throw error;
  }
};

// Alias para compatibilidad
export const obtenerPrestamosUsuario = obtenerPrestamosPorUsuario;
