import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Actividad, Comentario } from '../types/actividad';
import { handleFirebaseError } from '../utils/errorHandling';
import type { Usuario } from '../types/usuario';
import { EstadoPrestamo } from '../types/prestamo';
import { actividadCache } from './actividadCache';
import { crearPrestamo, actualizarPrestamo, obtenerPrestamosPorActividad } from './prestamoService';
import { enviarNotificacionMasiva } from './notificacionService';
import { listarUsuarios, obtenerUsuarioPorId } from './usuarioService';
import { getEstadoActivoLegacy } from '../utils/migracionUsuarios';
import { obtenerMaterial } from 'src/services/MaterialService';
import messages from '../constants/messages';
import { determinarEstadoActividad } from '../utils/dateUtils';
import { getUniqueParticipanteIds } from '../utils/actividadUtils';
import { executeTransaction } from '../utils/transactionUtils';
import { validateWithZod } from '../validation/validationMiddleware';
import { logger } from '../utils/loggerUtils';
import { z } from 'zod';
import { actividadCompleteSchema } from '../schemas/actividadSchema';

// Crear una nueva actividad
export async function crearActividad(actividadData: Omit<Actividad, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<Actividad> {  try {
    // Obtener participantes únicos
    const participanteIds = getUniqueParticipanteIds(
      actividadData.participanteIds,
      actividadData.creadorId,
      actividadData.responsableActividadId,
      actividadData.responsableMaterialId
    );

    // Validar que necesidadMaterial tenga un valor definido
    const necesidadMaterial = actividadData.necesidadMaterial ?? false;

    const actividadesRef = collection(db, 'actividades');
    const now = Timestamp.now();

    // Añadir campo normalizado para búsquedas insensibles a mayúsculas/minúsculas
    const dataToSave = {
      ...actividadData,
      participanteIds, // Ahora garantizado único
      nombreNormalizado: actividadData.nombre.trim().toLowerCase(),
      responsableActividadId: actividadData.responsableActividadId || actividadData.creadorId,
      necesidadMaterial,
      fechaCreacion: now,
      fechaActualizacion: now,
      comentarios: [],
      enlaces: [],
      imagenesTopografia: [],
      archivosAdjuntos: []
    };

    const docRef = await addDoc(actividadesRef, dataToSave);    const nuevaActividad: Actividad = {
      id: docRef.id,
      ...dataToSave,
      fechaFin: dataToSave.fechaFin // Asegurar que fechaFin esté disponible para préstamos
    };
      console.log('🔧 Actividad creada, iniciando gestión de préstamos...', {
      id: nuevaActividad.id,
      necesidadMaterial: nuevaActividad.necesidadMaterial,
      responsableMaterialId: nuevaActividad.responsableMaterialId,
      materiales: nuevaActividad.materiales
    });

    console.log('🚀 DEBUGGING: Llamando a crearPrestamosParaActividad...');
    console.log('📋 DEBUGGING: Datos completos de la actividad:', JSON.stringify(nuevaActividad, null, 2));
      try {
      console.log('⏳ DEBUGGING: Esperando resultado de crearPrestamosParaActividad...');
      await crearPrestamosParaActividad(nuevaActividad);
      console.log('✅ DEBUGGING: crearPrestamosParaActividad completado exitosamente');
    } catch (error: unknown) {
      console.error('❌ DEBUGGING: Error en crearPrestamosParaActividad:', error);
      console.error('🔍 DEBUGGING: Stack trace:', error instanceof Error ? error.stack : 'No stack available');
      throw error; // Re-lanzar el error para no romper el flujo
    }

    // Enviar notificaciones a administradores y vocales
    await enviarNotificacionesNuevaActividad(nuevaActividad);

    return nuevaActividad;
  } catch (error) {
    console.error('Error al crear la actividad:', error);
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
    const actividadActualizada = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as Actividad;
    
    // Gestionar préstamos si la actividad tiene material o se ha actualizado la información de materiales
    if (actividadData.materiales !== undefined || actividadData.necesidadMaterial !== undefined) {
      await crearPrestamosParaActividad(actividadActualizada);
    }
    
    // Invalidar caché después de actualizar
    invalidarCacheActividades();
    
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
      orderBy('fechaInicio', 'asc')
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
export const obtenerActividadesProximas = async (limit: number = 10, options?: { ignoreCache?: boolean }): Promise<Actividad[]> => {
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
    
    // Simplificar la consulta para evitar errores de índice compuesto
    const actividadQuery = query(
      collection(db, 'actividades'),
      where('fechaInicio', '>=', now),
      orderBy('fechaInicio', 'asc')
    );
      const actividadesSnapshot = await getDocs(actividadQuery);
    const actividades = actividadesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Actividad))
      // Filtrar actividades canceladas y finalizadas en el cliente
      .filter(actividad => !['cancelada', 'finalizada'].includes(actividad.estado))
      .slice(0, limit);
    
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
    console.log('🔍 obtenerActividadesClasificadas - Iniciando para usuario:', usuarioId);
    
    // Obtener todas las actividades del sistema (necesario para buscar por responsabilidad)
    const todasActividades = await listarActividades();
    console.log('🔍 obtenerActividadesClasificadas - Total actividades en sistema:', todasActividades.length);
    
    // Filtrar solo las actividades donde el usuario tiene algún rol
    const actividadesUsuario = todasActividades.filter(act => 
      act.creadorId === usuarioId || 
      act.responsableActividadId === usuarioId || 
      act.responsableMaterialId === usuarioId ||
      (act.participanteIds && act.participanteIds.includes(usuarioId))
    );
    
    console.log('🔍 obtenerActividadesClasificadas - Actividades del usuario:', actividadesUsuario.length);
    
    // Clasificar las actividades
    const actividadesResponsable = actividadesUsuario.filter(
      act => act.creadorId === usuarioId || 
             act.responsableActividadId === usuarioId || 
             act.responsableMaterialId === usuarioId
    );
    
    const actividadesParticipante = actividadesUsuario.filter(
      act => act.creadorId !== usuarioId && 
             act.responsableActividadId !== usuarioId && 
             (act.responsableMaterialId === undefined || act.responsableMaterialId !== usuarioId) &&
             (act.participanteIds && act.participanteIds.includes(usuarioId))
    );
    
    console.log('🔍 obtenerActividadesClasificadas - Como responsable:', actividadesResponsable.length);
    console.log('🔍 obtenerActividadesClasificadas - Como participante:', actividadesParticipante.length);
    
    // Log detallado de actividades como responsable
    actividadesResponsable.forEach(act => {
      console.log(`  📋 Responsable de "${act.nombre}": creador=${act.creadorId === usuarioId}, respActividad=${act.responsableActividadId === usuarioId}, respMaterial=${act.responsableMaterialId === usuarioId}`);
    });
      // Ordenar por fecha de inicio ascendente (más antiguas primero)
    actividadesResponsable.sort((a, b) => {
      const fechaA = a.fechaInicio instanceof Date ? a.fechaInicio : a.fechaInicio.toDate();
      const fechaB = b.fechaInicio instanceof Date ? b.fechaInicio : b.fechaInicio.toDate();
      return fechaA.getTime() - fechaB.getTime();
    });
    
    actividadesParticipante.sort((a, b) => {
      const fechaA = a.fechaInicio instanceof Date ? a.fechaInicio : a.fechaInicio.toDate();
      const fechaB = b.fechaInicio instanceof Date ? b.fechaInicio : b.fechaInicio.toDate();
      return fechaA.getTime() - fechaB.getTime();
    });
    
    return { actividadesResponsable, actividadesParticipante };
  } catch (error) {
    console.error('❌ Error en obtenerActividadesClasificadas:', error);
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
  console.log('🔧 crearPrestamosParaActividad - Iniciando para actividad:', actividad.id);
  console.log('🚀 DEBUGGING: FUNCIÓN INICIADA - timestamp:', new Date().toISOString());
  console.log('📊 Datos de actividad:', {
    id: actividad.id,
    necesidadMaterial: actividad.necesidadMaterial,
    responsableMaterialId: actividad.responsableMaterialId,
    cantidadMateriales: actividad.materiales?.length || 0,
    materiales: actividad.materiales
  });

  if (!actividad.id) {
    console.warn('❌ No se pueden crear préstamos para una actividad sin ID');
    return;
  }
  
  console.log('🔍 DEBUGGING: Verificando necesidadMaterial...');
  console.log('📋 DEBUGGING: necesidadMaterial =', actividad.necesidadMaterial, '(tipo:', typeof actividad.necesidadMaterial, ')');
  
  try {
    // Verificar primero si la actividad requiere material
    if (!actividad.necesidadMaterial) {
      console.log(`⚠️ La actividad ${actividad.id} no requiere material, cancelando préstamos existentes`);
      console.log('🚪 DEBUGGING: Saliendo porque necesidadMaterial es falsy');
      
      // Verificar si había préstamos previos que necesitan cancelarse
      const prestamosExistentes = await obtenerPrestamosPorActividad(actividad.id);
      
      // Si hay préstamos existentes pero la actividad no requiere material, cancelarlos
      if (prestamosExistentes.length > 0) {
        console.log(`🗑️ Cancelando ${prestamosExistentes.length} préstamos existentes`);
        for (const prestamo of prestamosExistentes) {
          await actualizarPrestamo(prestamo.id as string, {
            estado: 'cancelado',
            observaciones: `Cancelado automáticamente porque la actividad ${actividad.id} ya no requiere material`
          });
        }
      }
      return;
    }
    
    console.log('✅ DEBUGGING: necesidadMaterial es true, continuando...');
    console.log('🔍 DEBUGGING: Verificando responsableMaterialId y materiales...');
    console.log('👤 DEBUGGING: responsableMaterialId =', actividad.responsableMaterialId);
    console.log('📦 DEBUGGING: materiales =', actividad.materiales);
    console.log('📊 DEBUGGING: materiales.length =', actividad.materiales?.length);
    
    // Solo procedemos si hay un responsable de material y materiales asignados
    if (!actividad.responsableMaterialId || !actividad.materiales || actividad.materiales.length === 0) {
      console.warn(`⚠️ La actividad ${actividad.id} requiere material pero no tiene responsable o materiales asignados`);
      console.log('📋 Datos faltantes:', {
        responsableMaterialId: actividad.responsableMaterialId,
        materiales: actividad.materiales,
        cantidadMateriales: actividad.materiales?.length || 0
      });
      console.log('🚪 DEBUGGING: Saliendo por falta de responsable o materiales');
      return;
    }
    
    console.log(`✅ Condiciones cumplidas, procesando ${actividad.materiales.length} materiales...`);
    console.log('🔄 DEBUGGING: Iniciando procesamiento de materiales...');
    
    // Obtener préstamos existentes para la actividad
    const prestamosExistentes = await obtenerPrestamosPorActividad(actividad.id as string);
    console.log(`📦 Préstamos existentes encontrados: ${prestamosExistentes.length}`);
    
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
        console.log(`🗑️ Cancelando préstamo obsoleto para material: ${prestamo.materialId}`);
        await actualizarPrestamo(prestamo.id as string, {
          estado: 'devuelto',
          observaciones: `Devuelto automáticamente porque el material ya no está asignado a la actividad ${actividad.id}`
        });
      }
    }
    
    // Para cada material en la actividad
    let prestamosCreados = 0;
    let prestamosActualizados = 0;
    
    console.log('🔄 DEBUGGING: Iniciando bucle de materiales...');
    console.log('📋 DEBUGGING: Total materiales a procesar:', actividad.materiales.length);
    
    for (const material of actividad.materiales) {
      console.log(`🔧 DEBUGGING: Procesando material ${prestamosCreados + prestamosActualizados + 1}/${actividad.materiales.length}`);
      console.log(`🔧 Procesando material: ${material.materialId} (${material.nombre})`);
      console.log('📋 DEBUGGING: Datos del material:', JSON.stringify(material, null, 2));
      
      const prestamoExistente = mapaPrestamosPorMaterial.get(material.materialId);
      console.log('🔍 DEBUGGING: ¿Préstamo existente?', !!prestamoExistente);
      
      if (prestamoExistente) {
        console.log(`📝 Préstamo existente encontrado para material: ${material.materialId}`);
        // Actualizar préstamo si es necesario
        if (prestamoExistente.cantidadPrestada !== material.cantidad || 
            prestamoExistente.usuarioId !== actividad.responsableMaterialId) {
          
          console.log(`🔄 Actualizando préstamo: cantidad ${prestamoExistente.cantidadPrestada} -> ${material.cantidad}`);
          await actualizarPrestamo(prestamoExistente.id as string, {
            cantidadPrestada: material.cantidad,
            usuarioId: actividad.responsableMaterialId
          });
          prestamosActualizados++;
        } else {
          console.log(`✅ Préstamo ya está actualizado para material: ${material.materialId}`);
        }
      } else {
        console.log(`➕ DEBUGGING: Creando nuevo préstamo para material: ${material.materialId}`);
        
        // Intentar obtener información del usuario para el nombre
        let nombreUsuario = '';
        console.log('👤 DEBUGGING: Obteniendo datos del usuario...');
        try {
          const usuario = await obtenerUsuarioPorId(actividad.responsableMaterialId);
          nombreUsuario = usuario ? `${usuario.nombre} ${usuario.apellidos}` : '';
          console.log(`👤 Usuario responsable: ${nombreUsuario}`);
          console.log('✅ DEBUGGING: Datos del usuario obtenidos correctamente');
        } catch (error) {
          console.error('❌ Error al obtener datos del usuario:', error);
          console.error('❌ DEBUGGING: Error detallado en obtenerUsuario:', error);
        }
        
        // Obtener información del material
        let nombreMaterial = material.nombre;
        console.log('📦 DEBUGGING: Verificando nombre del material...');
        console.log('📦 DEBUGGING: material.nombre =', material.nombre);
        if (!nombreMaterial) {
          console.log('📦 DEBUGGING: Nombre vacío, obteniendo de BD...');
          try {
            const materialInfo = await obtenerMaterial(material.materialId);
            if (materialInfo) {
              nombreMaterial = materialInfo.nombre;
              console.log(`📦 Material obtenido de BD: ${nombreMaterial}`);
            }
          } catch (error) {
            console.error('❌ Error al obtener datos del material:', error);
            console.error('❌ DEBUGGING: Error detallado en obtenerMaterial:', error);
          }
        } else {
          console.log('✅ DEBUGGING: Nombre del material ya disponible:', nombreMaterial);
        }        console.log('🏗️ DEBUGGING: Preparando datos del préstamo...');        // Obtener información del responsable de material desde la actividad
        let responsableMaterial = '';
        let nombreResponsableMaterial = '';
        try {
          // El responsable del material se obtiene desde la actividad, no desde el material
          if (actividad.responsableMaterialId) {
            const responsableMaterialInfo = await obtenerUsuarioPorId(actividad.responsableMaterialId);
            if (responsableMaterialInfo) {
              responsableMaterial = actividad.responsableMaterialId;
              nombreResponsableMaterial = `${responsableMaterialInfo.nombre} ${responsableMaterialInfo.apellidos}`;
            }
          }
        } catch (error) {
          console.error('❌ Error al obtener responsable del material:', error);
        }
        
        // Obtener responsable de la actividad
        let responsableActividad = '';
        let nombreResponsableActividad = '';
        try {
          if (actividad.responsableActividadId) {
            const responsableActividadInfo = await obtenerUsuarioPorId(actividad.responsableActividadId);
            if (responsableActividadInfo) {
              responsableActividad = actividad.responsableActividadId;
              nombreResponsableActividad = `${responsableActividadInfo.nombre} ${responsableActividadInfo.apellidos}`;
            }
          }
        } catch (error) {
          console.error('❌ Error al obtener responsable de la actividad:', error);
        }
          // Crear nuevo préstamo
        const datosPrestamo = {
          materialId: material.materialId,
          nombreMaterial,
          cantidadPrestada: material.cantidad,
          usuarioId: actividad.responsableMaterialId,
          nombreUsuario,
          actividadId: actividad.id as string,
          nombreActividad: actividad.nombre,
          fechaPrestamo: new Date(),
          fechaDevolucionPrevista: actividad.fechaFin,
          fechaFinActividad: actividad.fechaFin,  // ✅ NUEVO CAMPO para optimizar detección
          estado: 'en_uso' as EstadoPrestamo,
          responsableActividad,
          nombreResponsableActividad,
          responsableMaterial,
          nombreResponsableMaterial
        };
        
        console.log(`💾 Creando préstamo con datos:`, datosPrestamo);
        console.log('💾 DEBUGGING: Datos del préstamo preparados:', JSON.stringify(datosPrestamo, null, 2));
        
        console.log('🚀 DEBUGGING: Llamando a crearPrestamo...');
        try {
          console.log('⏳ DEBUGGING: Esperando resultado de crearPrestamo...');
          const resultado = await crearPrestamo(datosPrestamo);
          prestamosCreados++;
          console.log(`✅ Préstamo creado exitosamente para: ${nombreMaterial}`);
          console.log('✅ DEBUGGING: crearPrestamo completado, resultado:', resultado);
        } catch (error: unknown) {
          console.error(`❌ Error al crear préstamo para ${nombreMaterial}:`, error);
          console.error('❌ DEBUGGING: Error detallado en crearPrestamo:', error);
          console.error('❌ DEBUGGING: Tipo de error:', typeof error);
          console.error('❌ DEBUGGING: Error serializado:', JSON.stringify(error, null, 2));
          throw error;
        }
      }
    }
    
    console.log(`🎉 Gestión de préstamos completada:`, {
      prestamosCreados,
      prestamosActualizados,
      totalMateriales: actividad.materiales.length
    });
    } catch (error: unknown) {
    console.error('❌ Error al gestionar préstamos para actividad:', error);
    console.error('🔍 DEBUGGING: Stack trace:', error instanceof Error ? error.stack : 'No stack available');
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
    const usuarios = await listarUsuarios();    return {
      activos: usuarios.filter(u => getEstadoActivoLegacy(u)).length,
      inactivos: usuarios.filter(u => !getEstadoActivoLegacy(u)).length,
      pendientes: usuarios.filter(u => u.pendienteVerificacion === true).length,
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de usuarios:', error);
    return { activos: 0, inactivos: 0, pendientes: 0 };
  }
};

// Obtener estadísticas de actividades
export const obtenerEstadisticasActividades = async (): Promise<{
  total: number;
  planificadas: number;
  enCurso: number;
  finalizadas: number;
  canceladas: number;
}> => {
  try {
    const actividades = await listarActividades();
    return {
      total: actividades.length,
      planificadas: actividades.filter(a => a.estado === 'planificada').length,
      enCurso: actividades.filter(a => a.estado === 'en_curso').length,
      finalizadas: actividades.filter(a => a.estado === 'finalizada').length,
      canceladas: actividades.filter(a => a.estado === 'cancelada').length,
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de actividades:', error);
    return { total: 0, planificadas: 0, enCurso: 0, finalizadas: 0, canceladas: 0 };
  }
};

// Obtener comentarios de una actividad
export const obtenerComentarios = async (actividadId: string): Promise<Comentario[]> => {
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
    
    // Invalidar caché después de finalizar
    invalidarCacheActividades();
    
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

// Modificar la función guardarActividad para usar transacciones
export const guardarActividad = validateWithZod(
  actividadCompleteSchema as unknown as z.ZodType<Actividad>,  async (actividadData: Actividad): Promise<Actividad> => {
    try {
      const result = await executeTransaction(async (transaction) => {
        // Convertir fechas a Timestamp para Firebase
        const fechaInicio = actividadData.fechaInicio instanceof Date 
          ? Timestamp.fromDate(actividadData.fechaInicio)
          : actividadData.fechaInicio;
          
        const fechaFin = actividadData.fechaFin instanceof Date
          ? Timestamp.fromDate(actividadData.fechaFin)
          : actividadData.fechaFin;
        
        const now = Timestamp.now();
        
        // Usar getUniqueParticipanteIds para garantizar participantes únicos
        const participanteIds = getUniqueParticipanteIds(
          actividadData.participanteIds,
          actividadData.creadorId,
          actividadData.responsableActividadId,
          actividadData.responsableMaterialId
        );
        
        // Determinar estado automáticamente basado en fechas
        const estado = determinarEstadoActividad(fechaInicio, fechaFin, actividadData.estado);
        
        // Crear objeto base para guardar
        let dataToSave: any = {
          ...actividadData,
          participanteIds,
          fechaInicio,
          fechaFin,
          estado,
          fechaActualizacion: now,
          necesidadMaterial: actividadData.necesidadMaterial ?? false
        };
        
        let nuevaActividadConId: Actividad;
        
        if (actividadData.id) {
          // Actualizar actividad existente
          const actividadRef = doc(db, 'actividades', actividadData.id);
          transaction.update(actividadRef, dataToSave);
          nuevaActividadConId = { id: actividadData.id, ...dataToSave };
        } else {
          // Crear nueva actividad
          dataToSave.fechaCreacion = now;
          const actividadesRef = collection(db, 'actividades');
          const newDocRef = doc(actividadesRef);
          transaction.set(newDocRef, dataToSave);
          nuevaActividadConId = { id: newDocRef.id, ...dataToSave };
        }
        
        // Los préstamos se gestionarán después de la transacción
        return nuevaActividadConId;
      });
        // Gestionar préstamos después de completar la transacción exitosamente
      await crearPrestamosParaActividad(result);
      
      // Enviar notificaciones solo para nuevas actividades (sin ID original)
      if (!actividadData.id) {
        await enviarNotificacionesNuevaActividad(result);
      }
      
      return result;
    } catch (error) {
      logger.error("Error al guardar actividad con transacción:", error);
      throw error;
    }
  }
);

// Mejorar la función de invalidación de caché
export const invalidarCacheActividades = (): void => {
    actividadCache.clear();
    console.log('Caché de actividades invalidado correctamente');
    
    // Marcar en sessionStorage que se debe recargar la lista en la próxima visita
    sessionStorage.setItem('actividades_cache_invalidated', 'true');
    
    // Emitir evento para componentes que estén escuchando
    const event = new CustomEvent('actividades-updated');
    window.dispatchEvent(event);
};

// Añadir esta función nueva
export const buscarActividadesPorNombre = async (nombre: string): Promise<Actividad[]> => {
  try {
    const nombreNormalizado = nombre.trim().toLowerCase();
    
    // Consulta para buscar actividades con el mismo nombre
    const actividadesQuery = query(
      collection(db, 'actividades'),
      where('nombreNormalizado', '==', nombreNormalizado)
    );
      const snapshot = await getDocs(actividadesQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Actividad));
  } catch (error) {
    console.error('Error al buscar actividades por nombre:', error);
    return [];
  }
};

// Función para verificar nombre de actividad duplicado
export const verificarNombreDuplicado = async (nombre: string, idExcluir?: string): Promise<boolean> => {
  try {
    const nombreNormalizado = nombre.trim().toLowerCase();
    
    const actividadesQuery = query(
      collection(db, 'actividades'),
      where('nombreNormalizado', '==', nombreNormalizado)
    );
    
    const snapshot = await getDocs(actividadesQuery);
    
    // Si estamos actualizando, excluimos la propia actividad
    if (idExcluir) {
      return snapshot.docs.some(doc => doc.id !== idExcluir);
    }
    
    // Para nuevas actividades, cualquier resultado indica duplicado
    return !snapshot.empty;
  } catch (error) {
    console.error('Error al verificar nombre de actividad:', error);
    // En caso de error, permitimos continuar pero lo registramos
    return false;
  }
};
