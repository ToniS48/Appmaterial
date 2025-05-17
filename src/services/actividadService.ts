import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Actividad, Comentario } from '../types/actividad';
import { handleFirebaseError } from '../utils/errorHandling';
import { Usuario } from '../types/usuario';
import { actividadCache } from './actividadCache';
import { crearPrestamo, actualizarPrestamo, registrarDevolucion, obtenerPrestamosPorActividad } from './prestamoService';
import { enviarNotificacionMasiva } from './notificacionService'; // Importamos el servicio de notificaciones
import { listarUsuarios, obtenerUsuarioPorId as obtenerUsuario } from './usuarioService'; // Importamos el servicio de usuarios
import { obtenerMaterial } from './materialService'; // Importamos el servicio de materiales
import messages from '../constants/messages';
import { determinarEstadoActividad } from '../utils/dateUtils';

// Crear una nueva actividad
export const crearActividad = async (actividadData: Omit<Actividad, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Actividad> => {
  try {
    // Validar que necesidadMaterial tenga un valor definido
    const necesidadMaterial = actividadData.necesidadMaterial ?? false;
    
    const actividadesRef = collection(db, 'actividades');
    const now = Timestamp.now();
    
    // Si no hay responsable de actividad asignado, usar el creador como responsable
    const dataToSave = {
      ...actividadData,
      // Asignar el creador como responsable si no se especificó un responsable
      responsableActividadId: actividadData.responsableActividadId || actividadData.creadorId,
      necesidadMaterial, // Usar el valor validado
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
    
    // La función ya tiene validaciones internas, solo necesitamos llamarla una vez
    await crearPrestamosParaActividad(nuevaActividad);
    
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
    const updatedDoc = await getDoc(actividadRef);
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as Actividad;
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
export const listarActividades = async (filters?: any, ignoreCache: boolean = false): Promise<Actividad[]> => {
  // Crear una clave para el caché basada en los filtros
  const cacheKey = filters ? JSON.stringify(filters) : 'all';
  
  // Intentar obtener del caché primero, a menos que se indique ignorarlo
  if (!ignoreCache) {
    const cachedActividades = actividadCache.getActividadesList(cacheKey);
    if (cachedActividades) {
      return cachedActividades;
    }
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
export const obtenerActividadesProximas = async (
  limit = 5, 
  options?: { ignoreCache?: boolean }
): Promise<Actividad[]> => {
  const ignoreCache = options?.ignoreCache ?? false;
  
  // Usar caché a menos que explícitamente se pida ignorarlo
  if (!ignoreCache) {
    const cacheKey = `proximas_${limit}`;
    const cachedActividades = actividadCache.getActividadesList(cacheKey);
    if (cachedActividades) {
      return cachedActividades;
    }
  }
  
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
    
    // Guardar en caché
    const cacheKey = `proximas_${limit}`;
    actividadCache.setActividadesList(cacheKey, actividades);
    
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
}

// Cambiar de función auxiliar interna a función exportada
export async function crearPrestamosParaActividad(actividad: Actividad): Promise<void> {
  if (!actividad.id) {
    console.warn('No se pueden crear préstamos para una actividad sin ID');
    return;
  }
  
  try {
    // Verificar primero si la actividad requiere material
    if (!actividad.necesidadMaterial) {
      console.log(`La actividad ${actividad.id} no requiere material, cancelando préstamos existentes`);
      // Verificar si había préstamos previos que necesitan cancelarse
      const prestamosExistentes = await obtenerPrestamosPorActividad(actividad.id);
      
      // Si hay préstamos existentes pero la actividad no requiere material, cancelarlos
      if (prestamosExistentes.length > 0) {
        for (const prestamo of prestamosExistentes) {
          await actualizarPrestamo(prestamo.id as string, {
            estado: 'cancelado',
            observaciones: `Cancelado automáticamente porque la actividad ${actividad.id} ya no requiere material`
          });
        }
      }
      return;
    }
    
    // Solo procedemos si hay un responsable de material y materiales asignados
    if (!actividad.responsableMaterialId || !actividad.materiales || actividad.materiales.length === 0) {
      console.warn(`La actividad ${actividad.id} requiere material pero no tiene responsable o materiales asignados`);
      return;
    }
    
    // Obtener préstamos existentes para la actividad
    const prestamosExistentes = await obtenerPrestamosPorActividad(actividad.id as string);
    
    // Crear mapa para búsqueda eficiente
    const mapaPrestamosPorMaterial = new Map();
    prestamosExistentes.forEach(prestamo => {
      mapaPrestamosPorMaterial.set(prestamo.materialId, prestamo);
    });
    
    // Crear mapa de materiales actuales para detectar préstamos que ya no son necesarios
    const materialesActuales = new Set();
    actividad.materiales.forEach(material => {
      materialesActuales.add(material.materialId);
    });
    
    // Verificar préstamos a cancelar (los que ya no están en la lista de materiales)
    for (const prestamo of prestamosExistentes) {
      if (!materialesActuales.has(prestamo.materialId)) {
        await actualizarPrestamo(prestamo.id as string, {
          estado: 'devuelto',
          observaciones: `Devuelto automáticamente porque el material ya no está asignado a la actividad ${actividad.id}`
        });
      }
    }
    
    // Para cada material en la actividad
    for (const material of actividad.materiales) {
      const prestamoExistente = mapaPrestamosPorMaterial.get(material.materialId);
      
      if (prestamoExistente) {
        // Actualizar préstamo si es necesario
        if (prestamoExistente.cantidadPrestada !== material.cantidad || 
            prestamoExistente.usuarioId !== actividad.responsableMaterialId) {
          
          await actualizarPrestamo(prestamoExistente.id as string, {
            cantidadPrestada: material.cantidad,
            usuarioId: actividad.responsableMaterialId
          });
        }
      } else {
        // Intentar obtener información del usuario para el nombre
        let nombreUsuario = '';
        try {
          const usuario = await obtenerUsuario(actividad.responsableMaterialId);
          nombreUsuario = usuario ? `${usuario.nombre} ${usuario.apellidos}` : '';
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error);
        }
        
        // Obtener información del material
        let nombreMaterial = material.nombre;
        if (!nombreMaterial) {
          try {
            const materialInfo = await obtenerMaterial(material.materialId);
            if (materialInfo) {
              nombreMaterial = materialInfo.nombre;
            }
          } catch (error) {
            console.error('Error al obtener datos del material:', error);
          }
        }
        
        // Crear nuevo préstamo
        await crearPrestamo({
          materialId: material.materialId,
          nombreMaterial,
          cantidadPrestada: material.cantidad,
          usuarioId: actividad.responsableMaterialId,
          nombreUsuario,
          actividadId: actividad.id as string,
          nombreActividad: actividad.nombre,
          fechaPrestamo: new Date(),
          fechaDevolucionPrevista: actividad.fechaFin,
          estado: 'en_uso'
        });
      }
    }
  } catch (error) {
    console.error('Error al gestionar préstamos para actividad:', error);
    throw new Error(`No se pudieron gestionar los préstamos: ${error}`);
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

export const guardarActividad = async (actividadData: Actividad): Promise<Actividad> => {
  try {
    // Convertir fechas a Timestamp para Firebase
    const fechaInicio = actividadData.fechaInicio instanceof Date 
      ? Timestamp.fromDate(actividadData.fechaInicio)
      : actividadData.fechaInicio;
      
    const fechaFin = actividadData.fechaFin instanceof Date
      ? Timestamp.fromDate(actividadData.fechaFin)
      : actividadData.fechaFin;
    
    const now = Timestamp.now();
    
    // Determinar estado automáticamente basado en fechas
    const estado = determinarEstadoActividad(fechaInicio, fechaFin, actividadData.estado);
    
    // Crear objeto base para guardar
    let dataToSave: any = {
      ...actividadData,
      fechaInicio,
      fechaFin,
      estado,
      fechaActualizacion: now,
      necesidadMaterial: actividadData.necesidadMaterial ?? false // Garantizar que siempre tenga valor
    };
    
    // Guardar en Firestore
    let nuevaActividadConId: Actividad;
    if (actividadData.id) {
      // Actualizar actividad existente - NO establecer fechaCreacion
      await updateDoc(doc(db, 'actividades', actividadData.id), dataToSave);
      nuevaActividadConId = { id: actividadData.id, ...dataToSave };
    } else {
      // Crear nueva actividad - Establecer fechaCreacion solo para nuevas actividades
      dataToSave.fechaCreacion = now;
      const docRef = await addDoc(collection(db, 'actividades'), dataToSave);
      nuevaActividadConId = { id: docRef.id, ...dataToSave };
    }
    
    // IMPORTANTE: Gestionar los préstamos de material después de guardar
    await crearPrestamosParaActividad(nuevaActividadConId);
    
    // Limpiar caché o actualizar estado global - asegurar que esto funcione
    await invalidateActividadesCache();
    
    return nuevaActividadConId;
  } catch (error) {
    console.error("Error al guardar actividad:", error);
    throw error;
  }
};

// Mejorar la función de invalidación de caché
export const invalidateActividadesCache = async (): Promise<void> => {
  try {
    // Limpiar toda la caché de actividades
    actividadCache.clear();
    console.log('Caché de actividades invalidado correctamente');
    
    // Marcar en sessionStorage que se debe recargar la lista en la próxima visita
    sessionStorage.setItem('actividades_cache_invalidated', 'true');
    
    // Emitir evento para componentes que estén escuchando
    const event = new CustomEvent('actividades-updated');
    window.dispatchEvent(event);
  } catch (error) {
    console.error('Error al invalidar caché de actividades:', error);
  }
};