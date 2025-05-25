import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Prestamo, EstadoPrestamo } from '../types/prestamo';
import { handleFirebaseError } from '../utils/errorHandling';
import { actualizarCantidadDisponible, registrarIncidenciaMaterial } from './materialService';
import { enviarNotificacionMasiva } from './notificacionService';
import { listarUsuarios } from './usuarioService';
import { Usuario } from '../types/usuario';
import { Actividad } from '../types/actividad';

// Crear un nuevo préstamo
export const crearPrestamo = async (prestamoData: Omit<Prestamo, 'id'>): Promise<Prestamo> => {
  try {
    // Asegurarse que la fecha de préstamo existe
    if (!prestamoData.fechaPrestamo) {
      prestamoData.fechaPrestamo = Timestamp.now();
    }
    
    const prestamosRef = collection(db, 'prestamos');
    const docRef = await addDoc(prestamosRef, prestamoData);
    
    // Actualizar la cantidad disponible del material
    await actualizarCantidadDisponible(
      prestamoData.materialId, 
      -prestamoData.cantidadPrestada // Restamos la cantidad prestada
    );
    
    // Crear objeto con ID para retornar
    const nuevoPrestamoConId = {
      id: docRef.id,
      ...prestamoData
    };
    
    // Enviar notificaciones
    await enviarNotificacionNuevoPrestamo(nuevoPrestamoConId);
    
    return nuevoPrestamoConId;
  } catch (error) {
    handleFirebaseError(error, 'Error al crear préstamo');
    throw error;
  }
};

// Enviar notificación de nuevo préstamo
async function enviarNotificacionNuevoPrestamo(prestamo: Prestamo): Promise<void> {
  try {
    // 1. Notificar al usuario que recibe el préstamo
    await enviarNotificacionMasiva(
      [prestamo.usuarioId],
      'prestamo',
      `Se te ha asignado el material: ${prestamo.nombreMaterial} (${prestamo.cantidadPrestada} unidades)`,
      prestamo.id,
      'prestamo',
      `/material`
    );
    
    // 2. Notificar a administradores y vocales
    const usuarios = await listarUsuarios();
    const adminsYVocales = usuarios.filter((u: Usuario) => u.rol === 'admin' || u.rol === 'vocal');
    
    if (adminsYVocales.length > 0) {
      await enviarNotificacionMasiva(
        adminsYVocales.map((u: Usuario) => u.uid),
        'prestamo',
        `Nuevo préstamo: ${prestamo.nombreMaterial} para ${prestamo.nombreUsuario}`,
        prestamo.id,
        'prestamo',
        `/admin/prestamos`
      );
    }
  } catch (error) {
    console.error('Error al enviar notificaciones de préstamo:', error);
    // No lanzamos error para no interrumpir la creación del préstamo
  }
}

// Enviar notificación de devolución de material
async function enviarNotificacionDevolucion(prestamo: Prestamo, tieneIncidencia: boolean = false): Promise<void> {
  try {
    // 1. Notificar al usuario que devolvió el material
    await enviarNotificacionMasiva(
      [prestamo.usuarioId],
      'devolucion',
      `Has devuelto correctamente: ${prestamo.nombreMaterial} (${prestamo.cantidadPrestada} unidades)`,
      prestamo.id,
      'prestamo',
      `/material`
    );
    
    // 2. Notificar a administradores y vocales
    const usuarios = await listarUsuarios();
    const adminsYVocales = usuarios.filter((u: Usuario) => u.rol === 'admin' || u.rol === 'vocal');
    
    if (adminsYVocales.length > 0) {
      const mensajeBase = `Devolución registrada: ${prestamo.nombreMaterial} por ${prestamo.nombreUsuario}`;
      const mensaje = tieneIncidencia ? 
        `${mensajeBase} - ¡ATENCIÓN! Se ha reportado una incidencia` : 
        mensajeBase;
      
      await enviarNotificacionMasiva(
        adminsYVocales.map((u: Usuario) => u.uid),
        'devolucion',
        mensaje,
        prestamo.id,
        'prestamo',
        `/admin/prestamos`
      );
    }
  } catch (error) {
    console.error('Error al enviar notificaciones de devolución:', error);
    // No lanzamos error para no interrumpir el registro de devolución
  }
}

// Actualizar un préstamo existente
export const actualizarPrestamo = async (id: string, prestamoData: Partial<Prestamo>): Promise<Prestamo> => {
  try {
    const prestamoRef = doc(db, 'prestamos', id);
    
    // Obtener el préstamo actual para comparar cambios
    const prestamoActualSnapshot = await getDoc(prestamoRef);
    
    if (!prestamoActualSnapshot.exists()) {
      throw new Error('El préstamo no existe');
    }
    
    const prestamoActual = prestamoActualSnapshot.data() as Prestamo;
    
    // Actualizar el préstamo
    await updateDoc(prestamoRef, prestamoData);
    
    // Si el estado cambia a devuelto y no tenía fecha de devolución, actualizamos la cantidad disponible
    if (
      prestamoData.estado === 'devuelto' && 
      prestamoActual.estado !== 'devuelto' &&
      !prestamoActual.fechaDevolucion
    ) {
      // Devolver el material al inventario
      await actualizarCantidadDisponible(
        prestamoActual.materialId, 
        prestamoActual.cantidadPrestada // Sumamos la cantidad que se devuelve
      );
      
      // Actualizar fecha de devolución si no se proporcionó una
      if (!prestamoData.fechaDevolucion) {
        await updateDoc(prestamoRef, {
          fechaDevolucion: Timestamp.now()
        });
      }
    }
    
    // Recuperar el documento actualizado
    const prestamoSnapshot = await getDoc(prestamoRef);
    
    return {
      id: prestamoSnapshot.id,
      ...prestamoSnapshot.data()
    } as Prestamo;
  } catch (error) {
    handleFirebaseError(error, 'Error al actualizar préstamo');
    throw error;
  }
};

// Registrar devolución de préstamo
export const registrarDevolucion = async (id: string, observaciones?: string): Promise<Prestamo> => {
  try {
    const datosDevolucion = {
      estado: 'devuelto' as EstadoPrestamo,
      fechaDevolucion: Timestamp.now()
    };
    
    if (observaciones) {
      Object.assign(datosDevolucion, { observaciones });
    }
    
    // Actualiza el préstamo
    const prestamoActualizado = await actualizarPrestamo(id, datosDevolucion);
    
    // Enviar notificaciones
    await enviarNotificacionDevolucion(prestamoActualizado);
    
    return prestamoActualizado;
  } catch (error) {
    handleFirebaseError(error, 'Error al registrar devolución');
    throw error;
  }
};

// Registrar devolución de préstamo con posible incidencia
export const registrarDevolucionConIncidencia = async (
  id: string, 
  observaciones?: string,
  incidencia?: {
    tipo?: 'daño' | 'perdida' | 'mantenimiento' | 'otro';
    gravedad?: 'baja' | 'media' | 'alta' | 'critica';
    descripcion?: string;
  }
): Promise<Prestamo> => {
  try {
    const prestamoRef = doc(db, 'prestamos', id);
    const prestamoSnapshot = await getDoc(prestamoRef);
    
    if (!prestamoSnapshot.exists()) {
      throw new Error('Préstamo no encontrado');
    }
    
    const prestamoActual = {
      id,
      ...prestamoSnapshot.data()
    } as Prestamo;
    
    // Marcar préstamo como devuelto
    const datosDevolucion = {
      estado: 'devuelto' as EstadoPrestamo,
      fechaDevolucion: Timestamp.now(),
      observaciones: observaciones || ''
    };
    
    // Actualizar el préstamo como devuelto
    await updateDoc(prestamoRef, datosDevolucion);
    
    // Devolver el material al inventario
    await actualizarCantidadDisponible(
      prestamoActual.materialId, 
      prestamoActual.cantidadPrestada // Sumamos la cantidad que se devuelve
    );
    
    // Si hay incidencia, registrarla 
    if (incidencia && incidencia.tipo) {
      // Obtener material
      const materialRef = doc(db, 'material_deportivo', prestamoActual.materialId);
      const materialSnapshot = await getDoc(materialRef);
      
      if (materialSnapshot.exists()) {
        const material = {
          id: materialSnapshot.id,
          ...materialSnapshot.data()
        };
        
        // Registrar la incidencia
        await registrarIncidenciaMaterial(material.id, {
          descripcion: incidencia.descripcion || 'Sin descripción',
          reportadoPor: prestamoActual.usuarioId, 
          tipo: incidencia.tipo,
          gravedad: incidencia.gravedad
        });
      }
    }
    
    // Enviar notificaciones
    await enviarNotificacionDevolucion(prestamoActual, !!incidencia);
    
    // Devolver el préstamo actualizado
    const prestamoActualizadoSnapshot = await getDoc(prestamoRef);
    return {
      id,
      ...prestamoActualizadoSnapshot.data()
    } as Prestamo;
    
  } catch (error) {
    handleFirebaseError(error, 'Error al registrar devolución');
    throw error;
  }
};

// Obtener un préstamo por ID
export const obtenerPrestamo = async (id: string): Promise<Prestamo> => {
  try {
    const prestamoRef = doc(db, 'prestamos', id);
    const prestamoSnapshot = await getDoc(prestamoRef);
    
    if (!prestamoSnapshot.exists()) {
      throw new Error('Préstamo no encontrado');
    }
    
    return {
      id: prestamoSnapshot.id,
      ...prestamoSnapshot.data()
    } as Prestamo;
  } catch (error) {
    handleFirebaseError(error, 'Error al obtener préstamo');
    throw error;
  }
};

// Listar préstamos con filtros opcionales
export const listarPrestamos = async (filters?: any): Promise<Prestamo[]> => {
  try {
    let prestamoQuery = query(
      collection(db, 'prestamos'),
      orderBy('fechaPrestamo', 'desc')
    );
    
    if (filters) {
      // Filtrar por estado (string único)
      if (filters.estado) {
        prestamoQuery = query(
          prestamoQuery,
          where('estado', '==', filters.estado)
        );
      }
      
      // Filtrar por múltiples estados (array)
      if (filters.estados && Array.isArray(filters.estados)) {
        prestamoQuery = query(
          prestamoQuery,
          where('estado', 'in', filters.estados)
        );
      }
      
      // Filtrar por usuario
      if (filters.usuarioId) {
        prestamoQuery = query(
          prestamoQuery,
          where('usuarioId', '==', filters.usuarioId)
        );
      }
      
      // Filtrar por actividad
      if (filters.actividadId) {
        prestamoQuery = query(
          prestamoQuery,
          where('actividadId', '==', filters.actividadId)
        );
      }
      
      // Filtrar por material
      if (filters.materialId) {
        prestamoQuery = query(
          prestamoQuery,
          where('materialId', '==', filters.materialId)
        );
      }
    }
    
    const prestamosSnapshot = await getDocs(prestamoQuery);
    const prestamos = prestamosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Prestamo));
    
    return prestamos;
  } catch (error) {
    handleFirebaseError(error, 'Error al listar préstamos');
    throw error;
  }
};

// Obtener préstamos activos (no devueltos)
export const obtenerPrestamosActivos = async (): Promise<Prestamo[]> => {
  try {
    const prestamoQuery = query(
      collection(db, 'prestamos'),
      where('estado', '!=', 'devuelto'),
      orderBy('estado'),
      orderBy('fechaPrestamo')
    );
    
    const prestamosSnapshot = await getDocs(prestamoQuery);
    const prestamos = prestamosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Prestamo));
    
    return prestamos;
  } catch (error) {
    handleFirebaseError(error, 'Error al obtener préstamos activos');
    throw error;
  }
};

// Obtener préstamos de un usuario
export const obtenerPrestamosUsuario = async (usuarioId: string, incluirDevueltos = false): Promise<Prestamo[]> => {
  try {
    let prestamoQuery;
    
    if (incluirDevueltos) {
      prestamoQuery = query(
        collection(db, 'prestamos'),
        where('usuarioId', '==', usuarioId),
        orderBy('fechaPrestamo', 'desc')
      );
    } else {
      prestamoQuery = query(
        collection(db, 'prestamos'),
        where('usuarioId', '==', usuarioId),
        where('estado', '!=', 'devuelto'),
        orderBy('fechaPrestamo')
      );
    }
    
    const prestamosSnapshot = await getDocs(prestamoQuery);
    const prestamos = prestamosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Prestamo));
    
    return prestamos;
  } catch (error) {
    handleFirebaseError(error, 'Error al obtener préstamos del usuario');
    throw error;
  }
};

// Obtener préstamos relacionados con una actividad específica
export const obtenerPrestamosPorActividad = async (actividadId: string): Promise<Prestamo[]> => {
  try {
    // Usando la función existente con un filtro adicional
    const prestamosQuery = query(
      collection(db, 'prestamos'),
      where('actividadId', '==', actividadId)
    );
    
    const snapshot = await getDocs(prestamosQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as Prestamo);
  } catch (error) {
    handleFirebaseError(error, 'Error al obtener préstamos por actividad');
    throw error;
  }
};

// Crear préstamos para una actividad específica
export const crearPrestamosParaActividad = async (actividad: Actividad) => {
  // Solo procesar si la actividad tiene necesidad de material
  if (!actividad.necesidadMaterial) {
    console.log('La actividad no requiere material, no se crean préstamos');
    return [];
  }
  
  try {
    // Resto del código para crear préstamos...
  } catch (error) {
    console.error('Error al crear préstamos para la actividad:', error);
    throw error;
  }
};