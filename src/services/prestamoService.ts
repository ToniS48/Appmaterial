import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Prestamo, EstadoPrestamo } from '../types/prestamo';
import { actualizarCantidadDisponible } from './materialService';

// Crear un nuevo préstamo
export const crearPrestamo = async (prestamoData: Omit<Prestamo, 'id'>): Promise<Prestamo> => {
  console.log('🔧 crearPrestamo - INICIANDO con datos:', prestamoData);
  
  try {
    // Validar datos requeridos
    if (!prestamoData.materialId) {
      throw new Error('materialId es requerido para crear un préstamo');
    }
    if (!prestamoData.usuarioId) {
      throw new Error('usuarioId es requerido para crear un préstamo');
    }
    
    // Asegurar que la fecha de préstamo esté definida
    if (!prestamoData.fechaPrestamo) {
      console.log('⚠️ fechaPrestamo no definida, usando timestamp actual');
      prestamoData.fechaPrestamo = Timestamp.now();
    }
    
    console.log('📍 Obteniendo referencia a colección "prestamos"...');
    const prestamosRef = collection(db, 'prestamos');
    console.log('✅ Referencia obtenida:', prestamosRef.path);
    
    console.log('💾 Intentando crear documento en Firestore...');
    const docRef = await addDoc(prestamosRef, prestamoData);
    console.log('✅ Documento creado con ID:', docRef.id);
    
    // ✅ ACTUALIZAR CANTIDAD DISPONIBLE DEL MATERIAL
    console.log('📦 Actualizando cantidad disponible del material...');
    try {
      const cantidadPrestada = prestamoData.cantidadPrestada || 1;
      await actualizarCantidadDisponible(prestamoData.materialId, -cantidadPrestada);
      console.log(`✅ Cantidad disponible actualizada: -${cantidadPrestada} para material ${prestamoData.materialId}`);
    } catch (materialError) {
      console.error('⚠️ Error actualizando cantidad disponible:', materialError);
      // No lanzamos error para evitar que falle la creación del préstamo
      // pero registramos el error para investigación
    }
    
    const nuevoPrestamoConId = {
      id: docRef.id,
      ...prestamoData
    };
    
    console.log('🎉 crearPrestamo - ÉXITO. Préstamo creado:', nuevoPrestamoConId.id);
    
    // Limpiar cache de vencidos al crear nuevo préstamo
    limpiarCacheVencidos();
    
    return nuevoPrestamoConId;
  } catch (error: unknown) {
    console.error('❌ crearPrestamo - ERROR:', error);
    console.error('🔍 Tipo de error:', typeof error);
    console.error('🔍 Error completo:', JSON.stringify(error, null, 2));
    
    if (error instanceof Error) {
      console.error('📝 Mensaje:', error.message);
      console.error('🏷️ Nombre:', error.name);
      console.error('📍 Stack:', error.stack);
    }
    
    // Si es un error de Firebase
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('🔥 Código Firebase:', (error as any).code);
      console.error('📨 Mensaje Firebase:', (error as any).message);
    }
    
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
  console.log('🔄 registrarDevolucion - INICIANDO para préstamo:', prestamoId);
  
  try {
    // 1. Obtener datos del préstamo antes de actualizar
    console.log('📋 Obteniendo datos del préstamo...');
    const prestamo = await obtenerPrestamoPorId(prestamoId);
    if (!prestamo) {
      throw new Error('Préstamo no encontrado');
    }
    
    console.log('📦 Datos del préstamo:', {
      materialId: prestamo.materialId,
      cantidadPrestada: prestamo.cantidadPrestada,
      estado: prestamo.estado
    });
    
    // 2. Actualizar el préstamo
    console.log('📝 Actualizando estado del préstamo...');
    const prestamoRef = doc(db, 'prestamos', prestamoId);
    await updateDoc(prestamoRef, {
      estado: 'devuelto' as EstadoPrestamo,
      fechaDevolucion: serverTimestamp(),
      observacionesDevolucion: observaciones || ''
    });
    console.log('✅ Estado del préstamo actualizado');
    
    // 3. ACTUALIZAR CANTIDAD DISPONIBLE DEL MATERIAL (INCREMENTAR)
    console.log('📦 Incrementando cantidad disponible del material...');
    try {
      const cantidadDevuelta = prestamo.cantidadPrestada || 1;
      await actualizarCantidadDisponible(prestamo.materialId, cantidadDevuelta); // Incrementar (cantidad positiva)
      console.log(`✅ Cantidad disponible incrementada: +${cantidadDevuelta} para material ${prestamo.materialId}`);
    } catch (materialError) {
      console.error('⚠️ Error incrementando cantidad disponible:', materialError);
      // No lanzamos error para evitar que falle la devolución
    }
    
    console.log('🎉 registrarDevolucion - ÉXITO');
    
    // Limpiar cache de vencidos al registrar devolución
    limpiarCacheVencidos();
  } catch (error) {
    console.error('❌ registrarDevolucion - ERROR:', error);
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
  console.log('🔄 registrarDevolucionConIncidencia - INICIANDO para préstamo:', prestamoId);
  
  try {
    // 1. Obtener datos del préstamo antes de actualizar
    console.log('📋 Obteniendo datos del préstamo...');
    const prestamo = await obtenerPrestamoPorId(prestamoId);
    if (!prestamo) {
      throw new Error('Préstamo no encontrado');
    }
    
    console.log('📦 Datos del préstamo:', {
      materialId: prestamo.materialId,
      cantidadPrestada: prestamo.cantidadPrestada,
      estado: prestamo.estado
    });
    
    // 2. Preparar datos de actualización
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
    
    // 3. Actualizar el préstamo
    console.log('📝 Actualizando préstamo con incidencia...');
    await updateDoc(prestamoRef, updateData);
    console.log('✅ Préstamo actualizado');
    
    // 4. ACTUALIZAR CANTIDAD DISPONIBLE DEL MATERIAL
    console.log('📦 Procesando actualización de material...');
    try {
      const cantidadDevuelta = prestamo.cantidadPrestada || 1;
      
      if (incidencia && incidencia.tipo === 'perdida') {
        // Si se perdió, no incrementar cantidad disponible
        console.log('⚠️ Material perdido - no se incrementa cantidad disponible');
      } else {
        // Incrementar cantidad disponible normalmente
        await actualizarCantidadDisponible(prestamo.materialId, cantidadDevuelta);
        console.log(`✅ Cantidad disponible incrementada: +${cantidadDevuelta} para material ${prestamo.materialId}`);
      }
    } catch (materialError) {
      console.error('⚠️ Error actualizando cantidad disponible:', materialError);
      // No lanzamos error para evitar que falle la devolución
    }
    
    console.log('🎉 registrarDevolucionConIncidencia - ÉXITO');
  } catch (error) {
    console.error('❌ registrarDevolucionConIncidencia - ERROR:', error);
    throw error;
  }
};

// Listar todos los préstamos con filtros opcionales
export const listarPrestamos = async (filtros?: {
  usuarioId?: string;
  estado?: EstadoPrestamo;
  actividadId?: string;
}): Promise<Prestamo[]> => {
  const callId = Date.now();
  try {
    console.log(`🔍 [${callId}] Listando préstamos con filtros:`, filtros);
    
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
    
    console.log(`✅ [${callId}] Préstamos obtenidos: ${prestamos.length}`);
    return prestamos;
  } catch (error: any) {
    console.error(`❌ [${callId}] Error al listar préstamos:`, error);
    
    // Manejo específico de errores de Firebase
    if (error?.code === 'failed-precondition') {
      console.error(`🔥 [${callId}] Error de índice en Firebase para listar préstamos`);
    } else if (error?.code === 'permission-denied') {
      console.error(`🔒 [${callId}] Permisos denegados para listar préstamos`);
    }
    
    throw error;
  }
};

// Obtener préstamos por actividad
export const obtenerPrestamosPorActividad = async (actividadId: string): Promise<Prestamo[]> => {
  console.log('🔍 obtenerPrestamosPorActividad - Buscando préstamos para actividad:', actividadId);
  
  try {
    if (!actividadId) {
      console.warn('⚠️ actividadId no proporcionado');
      return [];
    }
    
    console.log('📍 Creando query para colección "prestamos"...');
    const q = query(
      collection(db, 'prestamos'),
      where('actividadId', '==', actividadId),
      orderBy('fechaPrestamo', 'desc')
    );
    
    console.log('🔍 Ejecutando consulta en Firestore...');
    const querySnapshot = await getDocs(q);
    console.log(`📊 Documentos encontrados: ${querySnapshot.size}`);
    
    const prestamos: Prestamo[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`📄 Préstamo encontrado: ${doc.id}`, {
        materialId: data.materialId,
        nombreMaterial: data.nombreMaterial,
        estado: data.estado,
        usuarioId: data.usuarioId
      });
      
      prestamos.push({
        id: doc.id,
        ...data
      } as Prestamo);
    });
    
    console.log(`✅ obtenerPrestamosPorActividad - Retornando ${prestamos.length} préstamos`);
    return prestamos;
  } catch (error: unknown) {
    console.error('❌ obtenerPrestamosPorActividad - ERROR:', error);
    console.error('🔍 Actividad ID:', actividadId);
    
    if (error instanceof Error) {
      console.error('📝 Mensaje:', error.message);
      console.error('🏷️ Nombre:', error.name);
    }
    
    // Si es un error de Firebase
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('🔥 Código Firebase:', (error as any).code);
    }
    
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

// Cache para préstamos vencidos
let cacheVencidos: { data: Prestamo[], timestamp: number } | null = null;
let loadingVencidos = false;

// Función para limpiar el cache (útil cuando se crean/actualizan préstamos)
export const limpiarCacheVencidos = () => {
  console.log('🧹 Limpiando cache de préstamos vencidos');
  cacheVencidos = null;
};

// Obtener préstamos vencidos/retrasados
export const obtenerPrestamosVencidos = async (): Promise<Prestamo[]> => {
  const callId = Date.now();
  
  // Si ya hay una petición en curso, esperar
  if (loadingVencidos) {
    console.log(`⏳ [${callId}] Ya hay una petición en curso, esperando...`);
    // Esperar hasta que termine la petición actual
    let attempts = 0;
    while (loadingVencidos && attempts < 50) { // máximo 5 segundos
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    // Si hay cache válido después de esperar, devolverlo
    if (cacheVencidos && (Date.now() - cacheVencidos.timestamp) < 30000) {
      console.log(`📦 [${callId}] Usando cache después de espera`);
      return cacheVencidos.data;
    }
  }
  
  // Verificar cache válido (30 segundos)
  if (cacheVencidos && (Date.now() - cacheVencidos.timestamp) < 30000) {
    console.log(`📦 [${callId}] Usando cache válido de préstamos vencidos`);
    return cacheVencidos.data;
  }
  
  loadingVencidos = true;
  
  try {
    console.log(`🔍 [${callId}] Buscando préstamos vencidos en Firebase...`);
    
    // Obtener todos los préstamos activos (no devueltos)
    const q = query(
      collection(db, 'prestamos'),
      where('estado', '!=', 'devuelto'),
      orderBy('fechaDevolucionPrevista', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const prestamos: Prestamo[] = [];
    const ahora = new Date();
    
    console.log(`📊 [${callId}] Documentos encontrados: ${querySnapshot.size}`);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const prestamo = {
        id: doc.id,
        ...data
      } as Prestamo;
      
      // Calcular si está vencido
      const fechaVencimiento = prestamo.fechaDevolucionPrevista instanceof Date ? 
        prestamo.fechaDevolucionPrevista : 
        (prestamo.fechaDevolucionPrevista as any).toDate();
      
      if (fechaVencimiento < ahora) {
        console.log(`📅 [${callId}] Préstamo vencido: ${prestamo.nombreMaterial} - Vencido: ${fechaVencimiento.toLocaleDateString()}`);
        prestamos.push(prestamo);
      }
    });
    
    // Guardar en cache
    cacheVencidos = {
      data: prestamos,
      timestamp: Date.now()
    };
    
    console.log(`✅ [${callId}] Préstamos vencidos encontrados: ${prestamos.length}`);
    return prestamos;
  } catch (error: any) {
    console.error(`❌ [${callId}] Error al obtener préstamos vencidos:`, error);
    
    // Manejo específico de errores de Firebase
    if (error?.code === 'failed-precondition') {
      console.error(`🔥 [${callId}] Error de índice en Firebase. Consulta necesita un índice compuesto.`);
      console.error(`💡 [${callId}] Intenta crear el índice desde Firebase Console o ejecuta: firebase deploy --only firestore:indexes`);
    } else if (error?.code === 'permission-denied') {
      console.error(`🔒 [${callId}] Permisos denegados para consultar préstamos`);
    } else if (error?.code === 'unavailable') {
      console.error(`📡 [${callId}] Firestore no disponible temporalmente`);
    }
    
    // Si hay cache previo (aunque sea viejo), usarlo como fallback
    if (cacheVencidos) {
      console.log(`🔄 [${callId}] Usando cache como fallback ante error`);
      return cacheVencidos.data;
    }
    
    throw error;
  } finally {
    loadingVencidos = false;
  }
};

// Obtener préstamos próximos a vencer
export const obtenerPrestamosProximosVencer = async (diasAnticipacion: number = 3): Promise<Prestamo[]> => {
  try {
    console.log(`🔍 Buscando préstamos próximos a vencer en ${diasAnticipacion} días...`);
    
    // Obtener todos los préstamos activos (no devueltos)
    const q = query(
      collection(db, 'prestamos'),
      where('estado', '!=', 'devuelto'),
      orderBy('fechaDevolucionPrevista', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const prestamos: Prestamo[] = [];
    const ahora = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const prestamo = {
        id: doc.id,
        ...data
      } as Prestamo;
      
      // Calcular si está próximo a vencer
      const fechaVencimiento = prestamo.fechaDevolucionPrevista instanceof Date ? 
        prestamo.fechaDevolucionPrevista : 
        (prestamo.fechaDevolucionPrevista as any).toDate();
      
      if (fechaVencimiento <= fechaLimite && fechaVencimiento >= ahora) {
        prestamos.push(prestamo);
      }
    });
    
    console.log(`✅ Se encontraron ${prestamos.length} préstamos próximos a vencer`);
    return prestamos;
  } catch (error) {
    console.error('❌ Error al obtener préstamos próximos a vencer:', error);
    throw error;
  }
};

// Obtener préstamos donde el usuario es responsable (actividad o material)
export const listarPrestamosPorResponsabilidad = async (userId: string): Promise<Prestamo[]> => {
  const callId = Date.now();
  console.log(`🔍 [${callId}] Buscando préstamos por responsabilidad para usuario: ${userId}`);
  
  try {
    // PASO 1: Obtener préstamos directos (siempre funciona)
    let prestamosDirectos: Prestamo[] = [];
    try {
      prestamosDirectos = await listarPrestamos({ usuarioId: userId });
      console.log(`📊 [${callId}] Préstamos directos: ${prestamosDirectos.length}`);
      if (prestamosDirectos.length > 0) {
        console.log(`   [${callId}] Primeros préstamos directos:`, prestamosDirectos.slice(0, 3).map(p => `${p.nombreMaterial} (${p.estado})`));
      }
    } catch (directosError) {
      console.error(`⚠️ [${callId}] Error obteniendo préstamos directos:`, directosError);
      // Continuar sin préstamos directos
    }
    
    // PASO 2: Obtener préstamos por responsabilidad de actividad (con manejo de errores)
    let prestamosRespActividad: Prestamo[] = [];
    try {
      prestamosRespActividad = await obtenerPrestamosPorResponsableActividad(userId);
      console.log(`📊 [${callId}] Préstamos por resp. actividad: ${prestamosRespActividad.length}`);
      if (prestamosRespActividad.length > 0) {
        console.log(`   [${callId}] Primeros préstamos por resp. actividad:`, prestamosRespActividad.slice(0, 3).map(p => `${p.nombreMaterial} (${p.estado})`));
      }    } catch (actividadError) {
      console.warn(`⚠️ [${callId}] No se pudieron obtener préstamos por responsabilidad de actividad:`, actividadError);
      if ((actividadError as any)?.code === 'failed-precondition') {
        console.error(`🔥 [${callId}] PROBLEMA CRÍTICO: Índice faltante para responsableActividad`);
        console.log(`💡 [${callId}] SOLUCIÓN: Crear índice en Firebase Console: Collection=prestamos, Field=responsableActividad`);
      }
      // Continuar sin estos préstamos
    }
    
    // PASO 3: Obtener préstamos por responsabilidad de material (con manejo de errores)
    let prestamosRespMaterial: Prestamo[] = [];
    try {
      prestamosRespMaterial = await obtenerPrestamosPorResponsableMaterial(userId);
      console.log(`📊 [${callId}] Préstamos por resp. material: ${prestamosRespMaterial.length}`);
      if (prestamosRespMaterial.length > 0) {
        console.log(`   [${callId}] Primeros préstamos por resp. material:`, prestamosRespMaterial.slice(0, 3).map(p => `${p.nombreMaterial} (${p.estado})`));
      }    } catch (materialError) {
      console.warn(`⚠️ [${callId}] No se pudieron obtener préstamos por responsabilidad de material:`, materialError);
      if ((materialError as any)?.code === 'failed-precondition') {
        console.error(`🔥 [${callId}] PROBLEMA CRÍTICO: Índice faltante para responsableMaterial`);
        console.log(`💡 [${callId}] SOLUCIÓN: Crear índice en Firebase Console: Collection=prestamos, Field=responsableMaterial`);
      }
      // Continuar sin estos préstamos
    }
    
    // PASO 4: Combinar todos los préstamos y eliminar duplicados
    const todosLosPrestamos = [...prestamosDirectos, ...prestamosRespActividad, ...prestamosRespMaterial];
    console.log(`🔍 [${callId}] Total antes de deduplicar: ${todosLosPrestamos.length}`);
    
    const prestamosUnicos = todosLosPrestamos.filter((prestamo, index, array) => 
      array.findIndex(p => p.id === prestamo.id) === index
    );
    console.log(`🔍 [${callId}] Total después de deduplicar: ${prestamosUnicos.length}`);
    
    // PASO 5: Filtrar solo préstamos activos (incluyendo "por_devolver")
    const prestamosActivos = prestamosUnicos.filter(p => 
      p.estado === 'en_uso' || p.estado === 'pendiente' || p.estado === 'aprobado' || p.estado === 'por_devolver'
    );
    
    console.log(`✅ [${callId}] Total encontrados: ${prestamosDirectos.length} directos + ${prestamosRespActividad.length} resp.actividad + ${prestamosRespMaterial.length} resp.material = ${prestamosActivos.length} activos`);
    
    // Log adicional si no hay resultados para ayudar en diagnóstico
    if (prestamosActivos.length === 0) {
      console.log(`⚠️ [${callId}] NO HAY PRÉSTAMOS ACTIVOS - Diagnóstico:`);
      console.log(`   - Préstamos directos encontrados: ${prestamosDirectos.length}`);
      console.log(`   - Préstamos por resp. actividad: ${prestamosRespActividad.length}`);
      console.log(`   - Préstamos por resp. material: ${prestamosRespMaterial.length}`);
      
      if (prestamosUnicos.length > 0) {
        const estadosPrestamos = prestamosUnicos.reduce((acc, p) => {
          acc[p.estado] = (acc[p.estado] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log(`   - Estados de préstamos encontrados:`, estadosPrestamos);
        console.log(`   - Estados activos permitidos: en_uso, pendiente, aprobado, por_devolver`);
      }
    }
    
    return prestamosActivos;
    
  } catch (error: any) {
    console.error(`❌ [${callId}] Error crítico al listar préstamos por responsabilidad:`, error);
    
    // FALLBACK FINAL: Si todo falla, intentar al menos obtener préstamos directos básicos
    try {
      console.log(`🆘 [${callId}] Fallback de emergencia: solo préstamos directos básicos...`);
      
      // Consulta más simple posible
      const q = query(
        collection(db, 'prestamos'),
        where('usuarioId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const prestamosBasicos: Prestamo[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        prestamosBasicos.push({
          id: doc.id,
          ...data
        } as Prestamo);
      });
      
      // Filtrar activos (incluyendo "por_devolver")
      const prestamosActivosBasicos = prestamosBasicos.filter(p => 
        p.estado === 'en_uso' || p.estado === 'pendiente' || p.estado === 'aprobado' || p.estado === 'por_devolver'
      );
      
      console.log(`✅ [${callId}] Fallback exitoso: ${prestamosActivosBasicos.length} préstamos básicos`);
      return prestamosActivosBasicos;
      
    } catch (fallbackError) {
      console.error(`❌ [${callId}] Error en fallback de emergencia:`, fallbackError);
      
      // Si incluso el fallback falla, devolver array vacío en lugar de lanzar error
      console.log(`🔴 [${callId}] Devolviendo array vacío para evitar crash completo`);
      return [];
    }
  }
};

// Función auxiliar para obtener préstamos por responsable de actividad
const obtenerPrestamosPorResponsableActividad = async (userId: string): Promise<Prestamo[]> => {
  try {
    console.log(`🔍 Buscando préstamos donde usuario es responsable de actividad: ${userId}`);
    
    // Consulta simple sin múltiples where + orderBy para evitar problemas de índices
    const q = query(
      collection(db, 'prestamos'),
      where('responsableActividad', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const prestamos: Prestamo[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Prestamo;
      prestamos.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log(`✅ Encontrados ${prestamos.length} préstamos por responsable de actividad`);
    return prestamos;
  } catch (error: any) {
    console.error('❌ Error al obtener préstamos por responsable de actividad:', error);
    
    // Registrar el tipo específico de error para diagnóstico
    if (error?.code === 'failed-precondition') {
      console.warn('⚠️ Error de índice faltante para responsableActividad - puede necesitar índices en Firebase');
    } else if (error?.code === 'permission-denied') {
      console.warn('⚠️ Permisos insuficientes para consultar préstamos por responsableActividad');
    }
    
    // En caso de error, devolver array vacío para no romper la funcionalidad principal
    console.log('🔄 Fallback: devolviendo array vacío para responsable de actividad');
    return [];
  }
};

// Función auxiliar para obtener préstamos por responsable de material
const obtenerPrestamosPorResponsableMaterial = async (userId: string): Promise<Prestamo[]> => {
  try {
    console.log(`🔍 Buscando préstamos donde usuario es responsable de material: ${userId}`);
    
    // Consulta simple sin múltiples where + orderBy para evitar problemas de índices
    const q = query(
      collection(db, 'prestamos'),
      where('responsableMaterial', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const prestamos: Prestamo[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Prestamo;
      prestamos.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log(`✅ Encontrados ${prestamos.length} préstamos por responsable de material`);
    return prestamos;
  } catch (error: any) {
    console.error('❌ Error al obtener préstamos por responsable de material:', error);
    
    // Registrar el tipo específico de error para diagnóstico
    if (error?.code === 'failed-precondition') {
      console.warn('⚠️ Error de índice faltante para responsableMaterial - puede necesitar índices en Firebase');
    } else if (error?.code === 'permission-denied') {
      console.warn('⚠️ Permisos insuficientes para consultar préstamos por responsableMaterial');
    }
    
    // En caso de error, devolver array vacío para no romper la funcionalidad principal
    console.log('🔄 Fallback: devolviendo array vacío para responsable de material');
    return [];
  }
};

// Marcar préstamo como "por devolver"
export const marcarComoPorDevolver = async (prestamoId: string, motivo?: string): Promise<void> => {
  console.log('🔄 marcarComoPorDevolver - INICIANDO para préstamo:', prestamoId);
  
  try {
    const prestamoRef = doc(db, 'prestamos', prestamoId);
    
    // Verificar que el préstamo existe y está en estado válido
    const prestamoDoc = await getDoc(prestamoRef);
    if (!prestamoDoc.exists()) {
      throw new Error('Préstamo no encontrado');
    }
    
    const prestamoData = prestamoDoc.data() as Prestamo;
    
    // Solo permitir marcar como "por devolver" si está en uso
    if (prestamoData.estado !== 'en_uso') {
      throw new Error(`No se puede marcar para devolución un préstamo en estado: ${prestamoData.estado}`);
    }
    
    // Actualizar el estado
    await updateDoc(prestamoRef, {
      estado: 'por_devolver' as EstadoPrestamo,
      observaciones: motivo ? `${prestamoData.observaciones || ''}\n[MARCADO PARA DEVOLUCIÓN]: ${motivo}` : 
                             `${prestamoData.observaciones || ''}\n[MARCADO PARA DEVOLUCIÓN]`,
      fechaActualizacion: serverTimestamp()
    });
    
    console.log('✅ Préstamo marcado como "por devolver" exitosamente');
    
    // Limpiar cache
    limpiarCacheVencidos();
    
  } catch (error) {
    console.error('❌ marcarComoPorDevolver - ERROR:', error);
    throw error;
  }
};

// Marcar múltiples préstamos de una actividad como "por devolver"
export const marcarActividadComoPorDevolver = async (actividadId: string, motivo?: string): Promise<number> => {
  console.log('🔄 marcarActividadComoPorDevolver - INICIANDO para actividad:', actividadId);
  
  try {
    // Obtener préstamos activos de la actividad
    const prestamos = await obtenerPrestamosPorActividad(actividadId);
    const prestamosActivos = prestamos.filter(p => p.estado === 'en_uso');
    
    if (prestamosActivos.length === 0) {
      console.log('ℹ️ No hay préstamos activos para marcar en la actividad');
      return 0;
    }
    
    // Batch operation para eficiencia
    const batch = writeBatch(db);
    
    prestamosActivos.forEach(prestamo => {
      const prestamoRef = doc(db, 'prestamos', prestamo.id!);
      batch.update(prestamoRef, {
        estado: 'por_devolver' as EstadoPrestamo,
        observaciones: motivo ? 
          `${prestamo.observaciones || ''}\n[ACTIVIDAD FINALIZADA - MARCADO PARA DEVOLUCIÓN]: ${motivo}` : 
          `${prestamo.observaciones || ''}\n[ACTIVIDAD FINALIZADA - MARCADO PARA DEVOLUCIÓN]`,
        fechaActualizacion: serverTimestamp()
      });
    });
    
    await batch.commit();
    
    console.log(`✅ ${prestamosActivos.length} préstamos marcados como "por devolver"`);
    
    // Limpiar cache
    limpiarCacheVencidos();
    
    return prestamosActivos.length;
    
  } catch (error) {
    console.error('❌ marcarActividadComoPorDevolver - ERROR:', error);
    throw error;
  }
};

// Obtener préstamos marcados como "por devolver"
export const obtenerPrestamosPorDevolver = async (usuarioId?: string): Promise<Prestamo[]> => {
  console.log('🔍 obtenerPrestamosPorDevolver - Buscando préstamos por devolver');
  
  try {
    let q = query(
      collection(db, 'prestamos'),
      where('estado', '==', 'por_devolver'),
      orderBy('fechaActualizacion', 'desc')
    );
    
    // Filtrar por usuario si se especifica
    if (usuarioId) {
      q = query(
        collection(db, 'prestamos'),
        where('estado', '==', 'por_devolver'),
        where('usuarioId', '==', usuarioId),
        orderBy('fechaActualizacion', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const prestamos: Prestamo[] = [];
    
    querySnapshot.forEach((doc) => {
      prestamos.push({
        id: doc.id,
        ...doc.data()
      } as Prestamo);
    });
    
    console.log(`✅ Encontrados ${prestamos.length} préstamos por devolver`);
    return prestamos;
    
  } catch (error) {
    console.error('❌ Error obteniendo préstamos por devolver:', error);
    throw error;
  }
};

// Función para marcar automáticamente préstamos como "por devolver" cuando la actividad termina
export const marcarPrestamosVencidosAutomaticamente = async (): Promise<{
  procesados: number;
  marcados: number;
  errores: number;
}> => {
  const callId = Date.now();
  console.log(`🔄 [${callId}] Iniciando marcado automático de préstamos vencidos...`);
  
  try {
    // Fecha límite: hace una semana
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 7);
    
    console.log(`📅 [${callId}] Buscando actividades finalizadas antes de: ${fechaLimite.toISOString()}`);
    
    // Buscar actividades finalizadas hace más de una semana
    const actividadesQuery = query(
      collection(db, 'actividades'),
      where('estado', '==', 'finalizada'),
      where('fechaFin', '<=', Timestamp.fromDate(fechaLimite))
    );
    
    const actividadesSnapshot = await getDocs(actividadesQuery);
    console.log(`📋 [${callId}] Actividades finalizadas encontradas: ${actividadesSnapshot.size}`);
    
    let procesados = 0;
    let marcados = 0;
    let errores = 0;
    
    for (const actividadDoc of actividadesSnapshot.docs) {
      try {
        const actividad = actividadDoc.data();
        const actividadId = actividadDoc.id;
        
        console.log(`📦 [${callId}] Procesando actividad: ${actividad.nombre} (${actividadId})`);
        
        // Buscar préstamos en estado 'en_uso' de esta actividad
        const prestamosQuery = query(
          collection(db, 'prestamos'),
          where('actividadId', '==', actividadId),
          where('estado', '==', 'en_uso')
        );
        
        const prestamosSnapshot = await getDocs(prestamosQuery);
        
        if (prestamosSnapshot.size > 0) {
          console.log(`🔍 [${callId}] Encontrados ${prestamosSnapshot.size} préstamos activos en actividad ${actividad.nombre}`);
          
          // Marcar cada préstamo como "por devolver"
          for (const prestamoDoc of prestamosSnapshot.docs) {
            try {
              const prestamoRef = doc(db, 'prestamos', prestamoDoc.id);
              const prestamoData = prestamoDoc.data();
              
              await updateDoc(prestamoRef, {
                estado: 'por_devolver' as EstadoPrestamo,
                observaciones: `${prestamoData.observaciones || ''}\n[MARCADO AUTOMÁTICAMENTE]: Actividad "${actividad.nombre}" finalizada hace más de 7 días`,
                fechaActualizacion: serverTimestamp(),
                marcadoAutomaticamente: true,
                fechaMarcadoAutomatico: serverTimestamp()
              });
              
              marcados++;
              console.log(`✅ [${callId}] Préstamo ${prestamoDoc.id} marcado como "por devolver"`);
              
            } catch (prestamoError) {
              console.error(`❌ [${callId}] Error marcando préstamo ${prestamoDoc.id}:`, prestamoError);
              errores++;
            }
          }
        }
        
        procesados++;
        
      } catch (actividadError) {
        console.error(`❌ [${callId}] Error procesando actividad ${actividadDoc.id}:`, actividadError);
        errores++;
      }
    }
    
    console.log(`✅ [${callId}] Marcado automático completado:`);
    console.log(`   📊 Actividades procesadas: ${procesados}`);
    console.log(`   ✅ Préstamos marcados: ${marcados}`);
    console.log(`   ❌ Errores: ${errores}`);
    
    // Limpiar cache
    limpiarCacheVencidos();
    
    return { procesados, marcados, errores };
    
  } catch (error) {
    console.error(`❌ [${callId}] Error en marcado automático:`, error);
    throw error;
  }
};

// Función para verificar si una actividad debe tener sus préstamos marcados automáticamente
export const verificarActividadParaMarcadoAutomatico = async (actividadId: string): Promise<boolean> => {
  try {
    console.log(`🔍 Verificando actividad ${actividadId} para marcado automático...`);
    
    // Obtener datos de la actividad
    const actividadRef = doc(db, 'actividades', actividadId);
    const actividadDoc = await getDoc(actividadRef);
    
    if (!actividadDoc.exists()) {
      console.log(`❌ Actividad ${actividadId} no encontrada`);
      return false;
    }
    
    const actividad = actividadDoc.data();
    
    // Verificar que esté finalizada
    if (actividad.estado !== 'finalizada') {
      console.log(`ℹ️ Actividad ${actividadId} no está finalizada (estado: ${actividad.estado})`);
      return false;
    }
    
    // Verificar que haya pasado más de una semana desde la finalización
    const fechaFin = actividad.fechaFin.toDate();
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 7);
    
    if (fechaFin > fechaLimite) {
      console.log(`ℹ️ Actividad ${actividadId} finalizó hace menos de 7 días`);
      return false;
    }
    
    // Verificar si hay préstamos activos
    const prestamosQuery = query(
      collection(db, 'prestamos'),
      where('actividadId', '==', actividadId),
      where('estado', '==', 'en_uso')
    );
    
    const prestamosSnapshot = await getDocs(prestamosQuery);
    
    if (prestamosSnapshot.size === 0) {
      console.log(`ℹ️ Actividad ${actividadId} no tiene préstamos activos`);
      return false;
    }
    
    console.log(`✅ Actividad ${actividadId} cumple criterios para marcado automático (${prestamosSnapshot.size} préstamos activos)`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error verificando actividad ${actividadId}:`, error);
    return false;
  }
};

// Función para configurar verificación automática periódica
export const configurarVerificacionAutomatica = (): (() => void) => {
  console.log('🔧 Configurando verificación automática de préstamos vencidos...');
  
  // Ejecutar inmediatamente
  marcarPrestamosVencidosAutomaticamente().catch(error => {
    console.error('❌ Error en verificación automática inicial:', error);
  });
  
  // Configurar intervalo para ejecutar cada 24 horas
  const intervalo = setInterval(async () => {
    try {
      console.log('⏰ Ejecutando verificación automática programada...');
      const resultado = await marcarPrestamosVencidosAutomaticamente();
      
      if (resultado.marcados > 0) {
        console.log(`📢 Verificación automática: ${resultado.marcados} préstamos marcados como "por devolver"`);
      }
      
    } catch (error) {
      console.error('❌ Error en verificación automática programada:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 horas
  
  // Retornar función para cancelar el intervalo
  return () => {
    console.log('🛑 Cancelando verificación automática...');
    clearInterval(intervalo);
  };
};

// Función para devolver todos los materiales de una actividad en bulk
export const devolverTodosLosMaterialesActividad = async (
  actividadId: string, 
  observaciones?: string
): Promise<{ exito: number; errores: string[] }> => {
  console.log('🔄 devolverTodosLosMaterialesActividad - INICIANDO para actividad:', actividadId);
  
  try {
    // 1. Obtener todos los préstamos activos de la actividad
    const prestamosActivos = await obtenerPrestamosPorActividad(actividadId);
    const prestamosADevolver = prestamosActivos.filter(p => p.estado === 'en_uso' || p.estado === 'por_devolver');
    
    if (prestamosADevolver.length === 0) {
      console.log('ℹ️ No hay préstamos activos para devolver en la actividad');
      return { exito: 0, errores: [] };
    }

    console.log(`📦 Encontrados ${prestamosADevolver.length} préstamos para devolver`);

    // 2. Usar batch operations para eficiencia
    const batch = writeBatch(db);
    const errores: string[] = [];
    let exitosos = 0;

    // 3. Actualizar todos los préstamos en el batch
    for (const prestamo of prestamosADevolver) {
      try {
        const prestamoRef = doc(db, 'prestamos', prestamo.id!);
        
        // Actualizar préstamo como devuelto
        batch.update(prestamoRef, {
          estado: 'devuelto' as EstadoPrestamo,
          fechaDevolucion: serverTimestamp(),
          observacionesDevolucion: observaciones || 'Devolución en lote de toda la actividad'
        });

        exitosos++;
      } catch (error) {
        console.error(`❌ Error preparando devolución de préstamo ${prestamo.id}:`, error);
        errores.push(`Error con material ${prestamo.nombreMaterial}: ${error}`);
      }
    }

    // 4. Ejecutar el batch
    if (exitosos > 0) {
      await batch.commit();
      console.log(`✅ Batch ejecutado: ${exitosos} préstamos devueltos`);
    }

    // 5. Actualizar cantidades disponibles de materiales (secuencialmente para evitar conflictos)
    for (const prestamo of prestamosADevolver.slice(0, exitosos)) {
      try {
        const cantidadDevuelta = prestamo.cantidadPrestada || 1;
        await actualizarCantidadDisponible(prestamo.materialId, cantidadDevuelta);
        console.log(`✅ Cantidad disponible incrementada: +${cantidadDevuelta} para material ${prestamo.materialId}`);
      } catch (materialError) {
        console.error(`⚠️ Error actualizando cantidad disponible para material ${prestamo.materialId}:`, materialError);
        errores.push(`Error actualizando stock de ${prestamo.nombreMaterial}: ${materialError}`);
      }
    }

    // 6. Limpiar cache
    limpiarCacheVencidos();

    console.log(`🎉 devolverTodosLosMaterialesActividad - COMPLETADO: ${exitosos} éxitos, ${errores.length} errores`);
    
    return {
      exito: exitosos,
      errores
    };

  } catch (error) {
    console.error('❌ devolverTodosLosMaterialesActividad - ERROR CRÍTICO:', error);
    throw error;
  }
};
