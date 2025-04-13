import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Actividad, Comentario } from '../types/actividad';
import { handleFirebaseError } from '../utils/errorHandling';
import { Usuario } from '../types/usuario';
import { actividadCache } from './actividadCache';
import { crearPrestamo, actualizarPrestamo, registrarDevolucion, obtenerPrestamosPorActividad } from './prestamoService';
import { enviarNotificacionMasiva } from './notificacionService'; // Importamos el servicio de notificaciones
import { listarUsuarios } from './usuarioService'; // Importamos el servicio de usuarios
import messages from '../constants/messages';

// Crear una nueva actividad
export const crearActividad = async (actividadData: Omit<Actividad, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Actividad> => {
  try {
    const actividadesRef = collection(db, 'actividades');
    const now = Timestamp.now();
    
    // Si no hay responsable de actividad asignado, usar el creador como responsable
    const dataToSave = {
      ...actividadData,
      // Asignar el creador como responsable si no se especificó un responsable
      responsableActividadId: actividadData.responsableActividadId || actividadData.creadorId,
      fechaCreacion: now,
      fechaActualizacion: now,
      comentarios: [],
      enlaces: [],
      imagenesTopografia: [],
      archivosAdjuntos: []
    };
    
    const docRef = await addDoc(actividadesRef, dataToSave);
    
    const nuevaActividad: Actividad = {
      id: docRef.id,
      ...dataToSave
    };
    
    // Crear préstamos automáticamente para los materiales seleccionados
    await crearPrestamosParaActividad(nuevaActividad);
    
    // Si la actividad necesita material, creamos los préstamos correspondientes
    if (nuevaActividad.necesidadMaterial && nuevaActividad.materiales && nuevaActividad.materiales.length > 0) {
      await crearPrestamosParaActividad(nuevaActividad);
    }
    
    // Enviar notificaciones a administradores y vocales
    await enviarNotificacionesNuevaActividad(nuevaActividad);
    
    return nuevaActividad;
  } catch (error) {
    handleFirebaseError(error, messages.actividades.service.errors.crear);
    throw error;
  }
};

// Actualizar una actividad existente
export const actualizarActividad = async (id: string, actividadData: Partial<Actividad>): Promise<Actividad> => {
  try {
    const actividadRef = doc(db, 'actividades', id);
    
    // Asegurarse de que no se sobreescriban campos existentes que no deberían actualizarse
    const updateData = {
      ...actividadData,
      fechaActualizacion: Timestamp.now()
    };
    
    await updateDoc(actividadRef, updateData);
    
    // Recuperar el documento actualizado
    const actividadSnapshot = await getDoc(actividadRef);
    
    if (!actividadSnapshot.exists()) {
      throw new Error(messages.actividades.service.exceptions.noExiste);
    }
    
    const actividadActualizada = {
      id: actividadSnapshot.id,
      ...actividadSnapshot.data()
    } as Actividad;
    
    // Actualizar préstamos automáticamente
    await crearPrestamosParaActividad(actividadActualizada);
    
    // Si la actividad necesita material, creamos los préstamos correspondientes
    // Solo si hay campos de material en la actualización
    if (actividadData.necesidadMaterial && actividadData.materiales && actividadData.materiales.length > 0) {
      await crearPrestamosParaActividad(actividadActualizada);
    }
    
    return actividadActualizada;
  } catch (error) {
    handleFirebaseError(error, messages.actividades.service.errors.actualizar);
    throw error;
  }
};

// Obtener una actividad por ID con caché
export const obtenerActividad = async (id: string): Promise<Actividad> => {
  // Intentar obtener del caché primero
  const cachedActividad = actividadCache.getActividad(id);
  if (cachedActividad) {
    return cachedActividad;
  }
  
  try {
    const actividadRef = doc(db, 'actividades', id);
    const actividadSnapshot = await getDoc(actividadRef);
    
    if (!actividadSnapshot.exists()) {
      throw new Error(messages.actividades.service.exceptions.noEncontrada);
    }
    
    const actividad = {
      id: actividadSnapshot.id,
      ...actividadSnapshot.data()
    } as Actividad;
    
    // Guardar en caché
    actividadCache.setActividad(id, actividad);
    
    return actividad;
  } catch (error) {
    handleFirebaseError(error, messages.actividades.service.errors.obtener);
    throw error;
  }
};

// Listar actividades con caché
export const listarActividades = async (filters?: any): Promise<Actividad[]> => {
  // Crear una clave para el caché basada en los filtros
  const cacheKey = filters ? JSON.stringify(filters) : 'all';
  
  // Intentar obtener del caché primero
  const cachedActividades = actividadCache.getActividadesList(cacheKey);
  if (cachedActividades) {
    return cachedActividades;
  }
  
  try {
    let actividadQuery = query(
      collection(db, 'actividades'),
      orderBy('fechaInicio', 'desc')
    );
    
    if (filters) {
      // Filtrar por tipo
      if (filters.tipo) {
        actividadQuery = query(
          actividadQuery,
          where('tipo', 'array-contains', filters.tipo)
        );
      }
      
      // Filtrar por estado
      if (filters.estado) {
        actividadQuery = query(
          actividadQuery,
          where('estado', '==', filters.estado)
        );
      }
      
      // Filtrar por participante
      if (filters.participanteId) {
        actividadQuery = query(
          actividadQuery,
          where('participanteIds', 'array-contains', filters.participanteId)
        );
      }
      
      // Filtrar por creador
      if (filters.creadorId) {
        actividadQuery = query(
          actividadQuery,
          where('creadorId', '==', filters.creadorId)
        );
      }
    }
    
    const actividadesSnapshot = await getDocs(actividadQuery);
    const actividades = actividadesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Actividad));
    
    // Guardar en caché
    actividadCache.setActividadesList(cacheKey, actividades);
    
    return actividades;
  } catch (error) {
    handleFirebaseError(error, messages.actividades.service.errors.listar);
    throw error;
  }
};

// Eliminar una actividad
export const eliminarActividad = async (id: string): Promise<{ id: string }> => {
  try {
    const actividadRef = doc(db, 'actividades', id);
    await deleteDoc(actividadRef);
    return { id };
  } catch (error) {
    handleFirebaseError(error, messages.actividades.service.errors.eliminar);
    throw error;
  }
};

// Añadir comentario a una actividad
export const añadirComentario = async (
  actividadId: string, 
  comentario: Omit<Comentario, 'fecha'>
): Promise<Comentario> => {
  try {
    const actividadRef = doc(db, 'actividades', actividadId);
    
    const nuevoComentario: Comentario = {
      ...comentario,
      fecha: Timestamp.now()
    };
    
    await updateDoc(actividadRef, {
      comentarios: arrayUnion(nuevoComentario)
    });
    
    return nuevoComentario;
  } catch (error) {
    handleFirebaseError(error, messages.actividades.service.errors.comentario);
    throw error;
  }
};

// Obtener actividades próximas
export const obtenerActividadesProximas = async (limit = 5): Promise<Actividad[]> => {
  try {
    const now = Timestamp.now();
    
    const actividadQuery = query(
      collection(db, 'actividades'),
      where('fechaInicio', '>=', now),
      orderBy('fechaInicio', 'asc'),
      where('estado', '!=', 'cancelada')
    );
    
    const actividadesSnapshot = await getDocs(actividadQuery);
    const actividades = actividadesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Actividad)).slice(0, limit);
    
    return actividades;
  } catch (error) {
    handleFirebaseError(error, 'Error al obtener actividades próximas');
    throw error;
  }
};

// Obtener actividades de un usuario
export const obtenerActividadesUsuario = async (usuarioId: string): Promise<Actividad[]> => {
  try {
    const actividadQuery = query(
      collection(db, 'actividades'),
      where('participanteIds', 'array-contains', usuarioId),
      orderBy('fechaInicio', 'desc')
    );
    
    const actividadesSnapshot = await getDocs(actividadQuery);
    return actividadesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Actividad));
  } catch (error) {
    handleFirebaseError(error, messages.actividades.service.errors.obtenerUsuario);
    throw error;
  }
};

// Cancelar una actividad
export const cancelarActividad = async (id: string): Promise<Actividad> => {
  try {
    const actividadRef = doc(db, 'actividades', id);
    
    await updateDoc(actividadRef, {
      estado: 'cancelada',
      fechaActualizacion: Timestamp.now()
    });
    
    // Recuperar el documento actualizado
    const actividadSnapshot = await getDoc(actividadRef);
    
    if (!actividadSnapshot.exists()) {
      throw new Error(messages.actividades.service.exceptions.noExiste);
    }
    
    return {
      id: actividadSnapshot.id,
      ...actividadSnapshot.data()
    } as Actividad;
  } catch (error) {
    handleFirebaseError(error, messages.actividades.service.errors.cancelar);
    throw error;
  }
};

/**
 * Obtiene las actividades clasificadas por el rol del usuario
 * @param usuarioId ID del usuario
 * @returns Objeto con actividades clasificadas
 */
export const obtenerActividadesClasificadas = async (usuarioId: string): Promise<{
  actividadesResponsable: Actividad[];
  actividadesParticipante: Actividad[];
}> => {
  try {
    // Obtener todas las actividades en las que participa el usuario
    const actividadQuery = query(
      collection(db, 'actividades'),
      where('participanteIds', 'array-contains', usuarioId),
      orderBy('fechaInicio', 'desc')
    );
    
    const actividadesSnapshot = await getDocs(actividadQuery);
    const todasActividades = actividadesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Actividad));
    
    // Clasificar las actividades
    const actividadesResponsable = todasActividades.filter(
      act => act.creadorId === usuarioId || 
             act.responsableActividadId === usuarioId || 
             act.responsableMaterialId === usuarioId
    );
    
    const actividadesParticipante = todasActividades.filter(
      act => act.creadorId !== usuarioId && 
             act.responsableActividadId !== usuarioId && 
             (act.responsableMaterialId === undefined || act.responsableMaterialId !== usuarioId)
    );
    
    return { actividadesResponsable, actividadesParticipante };
  } catch (error) {
    handleFirebaseError(error, 'Error al obtener actividades clasificadas');
    throw error;
  }
};

// Función para unirse a una actividad
export const unirseActividad = async (actividadId: string, usuarioId: string): Promise<Actividad> => {
  try {
    const actividadRef = doc(db, 'actividades', actividadId);
    
    // Primero obtener la actividad para verificar si ya es participante
    const actividadDoc = await getDoc(actividadRef);
    if (!actividadDoc.exists()) {
      throw new Error('La actividad no existe');
    }
    
    const actividad = actividadDoc.data() as Actividad;
    const participantes = actividad.participanteIds || [];
    
    // Evitar duplicados
    if (!participantes.includes(usuarioId)) {
      await updateDoc(actividadRef, {
        participanteIds: arrayUnion(usuarioId),
        fechaActualizacion: Timestamp.now()
      });
    }
    
    // Devolver la actividad actualizada
    const updatedDoc = await getDoc(actividadRef);
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as Actividad;
  } catch (error) {
    handleFirebaseError(error, 'Error al unirse a la actividad');
    throw error;
  }
};

// Función auxiliar para crear o actualizar préstamos asociados a una actividad
async function crearPrestamosParaActividad(actividad: Actividad): Promise<void> {
  try {
    // Solo procedemos si hay un responsable de material y materiales asignados
    if (!actividad.responsableMaterialId || !actividad.materiales || actividad.materiales.length === 0) {
      return;
    }

    console.log(messages.actividades.materiales.procesandoPrestamos.replace('{nombre}', actividad.nombre).replace('{id}', actividad.id as string));
    console.log(messages.actividades.materiales.materialesEnActividad.replace('{cantidad}', actividad.materiales.length.toString()));

    // Primero, obtenemos los préstamos existentes para esta actividad
    const prestamosExistentes = await obtenerPrestamosPorActividad(actividad.id as string);
    
    console.log(messages.actividades.materiales.prestamosExistentes.replace('{cantidad}', prestamosExistentes.length.toString()));

    // Creamos un mapa de los préstamos existentes por materialId para búsqueda rápida
    const mapaPrestamosPorMaterial = new Map();
    prestamosExistentes.forEach(prestamo => {
      mapaPrestamosPorMaterial.set(prestamo.materialId, prestamo);
    });
    
    // Para cada material asignado a la actividad
    for (const material of actividad.materiales) {
      const prestamoExistente = mapaPrestamosPorMaterial.get(material.materialId);
      
      if (prestamoExistente) {
        // Actualizar préstamo existente si hay cambios
        if (prestamoExistente.cantidadPrestada !== material.cantidad || 
            prestamoExistente.usuarioId !== actividad.responsableMaterialId) {
          
          console.log(messages.actividades.materiales.actualizandoPrestamo
            .replace('{nombre}', material.nombre)
            .replace('{cantidad}', material.cantidad.toString()));
          
          await actualizarPrestamo(prestamoExistente.id as string, {
            cantidadPrestada: material.cantidad,
            usuarioId: actividad.responsableMaterialId,
            nombreUsuario: '', // Se completará en el servicio de préstamos
            fechaDevolucionPrevista: actividad.fechaFin instanceof Date 
              ? actividad.fechaFin 
              : actividad.fechaFin.toDate()
          });
        }
      } else {
        // Crear nuevo préstamo
        console.log(messages.actividades.materiales.creandoPrestamo
          .replace('{nombre}', material.nombre)
          .replace('{cantidad}', material.cantidad.toString()));
        
        await crearPrestamo({
          materialId: material.materialId,
          nombreMaterial: material.nombre,
          usuarioId: actividad.responsableMaterialId,
          nombreUsuario: '', // Se completará en el servicio de préstamos
          actividadId: actividad.id as string,
          nombreActividad: actividad.nombre,
          fechaPrestamo: new Date(),
          fechaDevolucionPrevista: actividad.fechaFin instanceof Date 
            ? actividad.fechaFin 
            : actividad.fechaFin.toDate(),
          estado: 'en_uso',
          cantidadPrestada: material.cantidad,
          registradoPor: actividad.creadorId
        });
      }
    }
    
    // Enviar notificación para materiales que ya no están en la actividad
    for (const prestamo of prestamosExistentes) {
      // Si este material ya no está en la lista actual
      if (!actividad.materiales.some(m => m.materialId === prestamo.materialId) && prestamo.estado !== 'devuelto') {
        console.log(messages.actividades.materiales.notificandoMaterial.replace('{nombre}', prestamo.nombreMaterial));
        
        // Enviar notificación al responsable para que devuelva el material
        await enviarNotificacionMasiva(
          [prestamo.usuarioId],
          'recordatorio',
          messages.actividades.service.notifications.materialNoAsignado
            .replace('{nombre}', prestamo.nombreMaterial)
            .replace('{actividad}', actividad.nombre),
          prestamo.id,
          'prestamo',
          `/devolucion-material` // Enlace a la página de devolución
        );
      }
    }
  } catch (error) {
    handleFirebaseError(error, messages.actividades.service.errors.crearPrestamos);
    throw error;
  }
}

// Función para enviar notificaciones a administradores y vocales
async function enviarNotificacionesNuevaActividad(actividad: Actividad): Promise<void> {
  try {
    // Obtener todos los usuarios con roles admin y vocal
    const usuarios = await listarUsuarios();
    const usuariosNotificar = usuarios.filter(u => u.rol === 'admin' || u.rol === 'vocal');
    
    if (usuariosNotificar.length > 0) {
      // Extraer solo los IDs de usuario
      const usuarioIds = usuariosNotificar.map(u => u.uid);
      
      // Crear mensaje de notificación
      const mensaje = messages.actividades.service.notifications.nuevaActividad
        .replace('{nombre}', actividad.nombre)
        .replace('{tipos}', actividad.tipo?.join(", ") || '');
      
      // Enviar notificación masiva
      await enviarNotificacionMasiva(
        usuarioIds,
        'actividad',
        mensaje,
        actividad.id as string,
        'actividad',
        `/activities/${actividad.id}` // Enlace a la vista detallada de la actividad
      );
    }
  } catch (error) {
    console.error(messages.actividades.service.errors.enviarNotificaciones, error);
    // No lanzamos error para no interrumpir la creación de la actividad
  }
}

// Obtener estadísticas de usuarios
export const obtenerEstadisticasUsuarios = async () => {
  try {
    const usuarios = await listarUsuarios();
    return {
      activos: usuarios.filter(u => u.activo).length,
      inactivos: usuarios.filter(u => !u.activo).length,
      pendientes: usuarios.filter(u => u.pendienteVerificacion === true).length,
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de usuarios:', error);
    return { activos: 0, inactivos: 0, pendientes: 0 };
  }
};

// Obtener estadísticas de actividades
export const obtenerEstadisticasActividades = async () => {
  try {
    const actividades = await listarActividades();
    return {
      planificadas: actividades.filter(a => a.estado === 'planificada').length,
      enCurso: actividades.filter(a => a.estado === 'en_curso').length,
      finalizadas: actividades.filter(a => a.estado === 'finalizada').length,
      canceladas: actividades.filter(a => a.estado === 'cancelada').length,
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de actividades:', error);
    return { planificadas: 0, enCurso: 0, finalizadas: 0, canceladas: 0 };
  }
};

// Obtener comentarios de una actividad
export const obtenerComentariosActividad = async (actividadId: string) => {
  try {
    const actividad = await obtenerActividad(actividadId);
    return actividad.comentarios || [];
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    return [];
  }
};

// Modificar la función finalizarActividad para notificar en lugar de hacer devolución automática

export const finalizarActividad = async (id: string): Promise<Actividad> => {
  try {
    const actividadRef = doc(db, 'actividades', id);
    
    await updateDoc(actividadRef, {
      estado: 'finalizada',
      fechaActualizacion: Timestamp.now()
    });
    
    // En vez de devolver automáticamente, notificar al responsable de material
    const actividadSnapshot = await getDoc(actividadRef);
    if (actividadSnapshot.exists()) {
      const actividad = { id, ...actividadSnapshot.data() } as Actividad;
      
      if (actividad.responsableMaterialId && actividad.materiales?.length > 0) {
        // Notificar al responsable de material
        await enviarNotificacionMasiva(
          [actividad.responsableMaterialId],
          'recordatorio',
          messages.actividades.service.notifications.devolucionMaterial
            .replace('{nombre}', actividad.nombre),
          actividad.id,
          'actividad',
          `/devolucion-material` // Enlace a la página de devolución
        );
      }
    }
    
    // Recuperar el documento actualizado
    if (!actividadSnapshot.exists()) {
      throw new Error(messages.actividades.service.exceptions.noExiste);
    }
    
    return {
      id: actividadSnapshot.id,
      ...actividadSnapshot.data()
    } as Actividad;
  } catch (error) {
    handleFirebaseError(error, messages.actividades.service.errors.finalizar);
    throw error;
  }
};