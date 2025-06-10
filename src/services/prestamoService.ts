import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
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
    
    return nuevoPrestamoConId;} catch (error: unknown) {
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
      console.log(`✅ Cantidad disponible incrementada: +${cantidadDevuelta} para material ${prestamo.materialId}`);    } catch (materialError) {
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
    return prestamos;  } catch (error: unknown) {
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
