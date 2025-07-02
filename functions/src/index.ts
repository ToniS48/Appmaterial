import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializar Firebase Admin
initializeApp();
const db = getFirestore();

// Importar funciones de verificación de Google APIs
export { 
  verifyGoogleApis, 
  googleApisDiagnostic, 
  googleApisHealth 
} from './googleApisVerification';

// Tipos de eventos para el historial
const TIPOS_EVENTO = [
  'entrada_inicial',
  'consumo_diario', 
  'reposicion',
  'ajuste_inventario',
  'transferencia',
  'caducidad'
] as const;

type TipoEvento = typeof TIPOS_EVENTO[number];

// Función para generar fecha aleatoria en los últimos 6 meses
function generarFechaAleatoria(): Date {
  const ahora = new Date();
  const seiseMesesAtras = new Date(ahora.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
  const tiempo = seiseMesesAtras.getTime() + Math.random() * (ahora.getTime() - seiseMesesAtras.getTime());
  return new Date(tiempo);
}

// Función para generar cantidad aleatoria basada en el tipo de evento
function generarCantidad(tipo: TipoEvento): number {
  switch (tipo) {
    case 'entrada_inicial':
      return Math.floor(Math.random() * 500) + 100;
    case 'consumo_diario':
      return -(Math.floor(Math.random() * 20) + 1);
    case 'reposicion':
      return Math.floor(Math.random() * 200) + 50;
    case 'ajuste_inventario':
      return Math.floor(Math.random() * 21) - 10; // -10 a +10
    case 'transferencia':
      return -(Math.floor(Math.random() * 30) + 5);
    case 'caducidad':
      return -(Math.floor(Math.random() * 15) + 1);
    default:
      return Math.floor(Math.random() * 50);
  }
}

// Interface para el material
interface Material {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  categoria: string;
  precio?: number;
  estado: string;
  ubicacion: string;
}

// Interface para evento de historial
interface EventoHistorial {
  materialId: string;
  materialNombre: string;
  tipo: TipoEvento;
  cantidad: number;
  cantidadAnterior: number;
  cantidadNueva: number;
  timestamp: Date;
  observaciones: string;
  usuario: string;
  origen: string;
  categoria: string;
  ubicacion: string;
}

/**
 * Cloud Function para generar historial de materiales
 * Callable function que puede ser invocada desde el frontend
 */
export const generarHistorialMateriales = onCall(
  { region: 'us-central1' },
  async (request) => {
    try {
      logger.info('🚀 Iniciando generación de historial de materiales');
      
      // Verificar autenticación
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Usuario no autenticado');
      }

      const { limpiarHistorialExistente = false, numeroEventosPorMaterial = 25 } = request.data || {};
      
      // 1. Obtener materiales del inventario
      logger.info('📋 Obteniendo materiales del inventario...');
      const inventarioSnapshot = await db.collection('inventario_materiales').get();
      
      if (inventarioSnapshot.empty) {
        logger.info('⚠️ No hay materiales en el inventario, creando ejemplos...');
        
        // Crear materiales de ejemplo
        const materialesEjemplo = [
          { nombre: 'Cemento Portland', cantidad: 150, unidad: 'sacos', categoria: 'Cemento', precio: 12.50 },
          { nombre: 'Arena Fina', cantidad: 80, unidad: 'm³', categoria: 'Agregados', precio: 25.00 },
          { nombre: 'Grava 20mm', cantidad: 120, unidad: 'm³', categoria: 'Agregados', precio: 28.00 },
          { nombre: 'Acero #4', cantidad: 200, unidad: 'varillas', categoria: 'Acero', precio: 15.75 },
          { nombre: 'Ladrillo Rojo', cantidad: 5000, unidad: 'unidades', categoria: 'Mampostería', precio: 0.35 },
          { nombre: 'Cal Hidratada', cantidad: 100, unidad: 'sacos', categoria: 'Cemento', precio: 8.50 },
          { nombre: 'Tubería PVC 4"', cantidad: 50, unidad: 'metros', categoria: 'Plomería', precio: 12.00 },
          { nombre: 'Varilla #3', cantidad: 150, unidad: 'varillas', categoria: 'Acero', precio: 12.25 },
          { nombre: 'Alambre de Amarre', cantidad: 300, unidad: 'kg', categoria: 'Acero', precio: 2.80 },
          { nombre: 'Block de Concreto', cantidad: 2000, unidad: 'unidades', categoria: 'Mampostería', precio: 1.15 }
        ];
        
        const batch = db.batch();
        for (const material of materialesEjemplo) {
          const materialRef = db.collection('inventario_materiales').doc();
          batch.set(materialRef, {
            ...material,
            fechaCreacion: new Date(),
            estado: 'activo',
            ubicacion: 'Almacén Principal',
            proveedorPrincipal: 'Proveedor Demo',
            stockMinimo: Math.floor(material.cantidad * 0.2),
            stockMaximo: Math.floor(material.cantidad * 1.5),
            ultimaActualizacion: new Date(),
            creadoPor: request.auth.uid
          });
        }
        await batch.commit();
        logger.info(`✅ Creados ${materialesEjemplo.length} materiales de ejemplo`);
      }
      
      // 2. Obtener materiales (incluye nuevos si se crearon)
      const materialesSnapshot = await db.collection('inventario_materiales').get();
      const materiales: Material[] = materialesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Material));
      
      logger.info(`📋 Procesando ${materiales.length} materiales`);
      
      // 3. Limpiar historial existente si se solicita
      if (limpiarHistorialExistente) {
        logger.info('🧹 Limpiando historial existente...');
        const historialExistente = await db.collection('material_historial').get();
        const deleteBatch = db.batch();
        historialExistente.docs.forEach(doc => {
          deleteBatch.delete(doc.ref);
        });
        if (!historialExistente.empty) {
          await deleteBatch.commit();
          logger.info(`🗑️ Eliminados ${historialExistente.size} eventos existentes`);
        }
      }
      
      // 4. Generar eventos históricos
      logger.info(`📝 Generando eventos históricos (${numeroEventosPorMaterial} por material)...`);
      
      const eventos: EventoHistorial[] = [];
      
      for (const material of materiales) {
        for (let i = 0; i < numeroEventosPorMaterial; i++) {
          const tipoEvento = TIPOS_EVENTO[Math.floor(Math.random() * TIPOS_EVENTO.length)];
          const cantidad = generarCantidad(tipoEvento);
          const fecha = generarFechaAleatoria();
          
          const evento: EventoHistorial = {
            materialId: material.id,
            materialNombre: material.nombre,
            tipo: tipoEvento,
            cantidad: cantidad,
            cantidadAnterior: Math.max(0, (material.cantidad || 100) + Math.floor(Math.random() * 100)),
            cantidadNueva: Math.max(0, (material.cantidad || 100) + cantidad),
            timestamp: fecha,
            observaciones: `${tipoEvento.replace('_', ' ').toUpperCase()} - ${cantidad > 0 ? 'Entrada' : 'Salida'} de ${Math.abs(cantidad)} ${material.unidad || 'unidades'}`,
            usuario: 'Sistema Automático',
            origen: 'cloud_function',
            categoria: material.categoria || 'Sin categoría',
            ubicacion: material.ubicacion || 'Almacén Principal'
          };
          
          eventos.push(evento);
        }
      }
      
      // 5. Guardar eventos en lotes
      logger.info(`💾 Guardando ${eventos.length} eventos en la base de datos...`);
      
      const BATCH_SIZE = 500; // Firestore limit
      let totalGuardados = 0;
      
      for (let i = 0; i < eventos.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const loteEventos = eventos.slice(i, i + BATCH_SIZE);
        
        for (const evento of loteEventos) {
          const eventoRef = db.collection('material_historial').doc();
          batch.set(eventoRef, evento);
        }
        
        await batch.commit();
        totalGuardados += loteEventos.length;
        logger.info(`📊 Progreso: ${totalGuardados}/${eventos.length} eventos guardados`);
      }
      
      // 6. Estadísticas finales
      const estadisticas = {
        materialesProcesados: materiales.length,
        eventosGenerados: eventos.length,
        eventosPorMaterial: numeroEventosPorMaterial,
        fechaGeneracion: new Date(),
        historialLimpiado: limpiarHistorialExistente,
        usuario: request.auth.uid
      };
      
      logger.info('🎉 Historial generado exitosamente', estadisticas);
      
      return {
        success: true,
        message: '🎉 Historial de materiales generado exitosamente',
        estadisticas
      };
      
    } catch (error) {
      logger.error('❌ Error generando historial:', error);
      throw new HttpsError('internal', `Error generando historial: ${error}`);
    }
  }
);

/**
 * Cloud Function para verificar el estado del historial
 */
export const verificarHistorialMateriales = onCall(
  { region: 'us-central1' },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Usuario no autenticado');
      }
      
      // Obtener estadísticas del historial
      const historialSnapshot = await db.collection('material_historial').get();
      const materialesSnapshot = await db.collection('inventario_materiales').get();
      
      const eventosHoy = historialSnapshot.docs.filter(doc => {
        const timestamp = doc.data().timestamp;
        const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return fecha.toDateString() === new Date().toDateString();
      });
      
      const materialesConHistorial = new Set(
        historialSnapshot.docs.map(doc => doc.data().materialId)
      );
      
      const estadisticas = {
        totalEventos: historialSnapshot.size,
        totalMateriales: materialesSnapshot.size,
        materialesConHistorial: materialesConHistorial.size,
        eventosHoy: eventosHoy.length,
        ultimaActualizacion: new Date()
      };
      
      return {
        success: true,
        estadisticas
      };
      
    } catch (error) {
      logger.error('❌ Error verificando historial:', error);
      throw new HttpsError('internal', `Error verificando historial: ${error}`);
    }
  }
);

/**
 * Cloud Function para limpiar el historial
 */
export const limpiarHistorialMateriales = onCall(
  { region: 'us-central1' },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Usuario no autenticado');
      }
      
      const historialSnapshot = await db.collection('material_historial').get();
      
      if (historialSnapshot.empty) {
        return {
          success: true,
          message: 'No hay eventos para limpiar',
          eventosEliminados: 0
        };
      }
      
      // Eliminar en lotes
      const BATCH_SIZE = 500;
      let totalEliminados = 0;
      
      for (let i = 0; i < historialSnapshot.docs.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const loteDocumentos = historialSnapshot.docs.slice(i, i + BATCH_SIZE);
        
        for (const doc of loteDocumentos) {
          batch.delete(doc.ref);
        }
        
        await batch.commit();
        totalEliminados += loteDocumentos.length;
      }
      
      logger.info(`🧹 Historial limpiado: ${totalEliminados} eventos eliminados`);
      
      return {
        success: true,
        message: `Historial limpiado exitosamente`,
        eventosEliminados: totalEliminados
      };
      
    } catch (error) {
      logger.error('❌ Error limpiando historial:', error);
      throw new HttpsError('internal', `Error limpiando historial: ${error}`);
    }
  }
);

// ================================
// FUNCIONES DE GOOGLE APIS
// ================================

/**
 * Health check para Google APIs
 */
export const googleApisHealthCheck = onCall(async (request) => {
  try {
    const config = {
      projectId: process.env.GOOGLE_PROJECT_ID || 'fichamaterial',
      serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL || 'appmaterial-service@fichamaterial.iam.gserviceaccount.com',
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
    };
    
    return {
      success: true,
      status: 'healthy',
      service: 'Google APIs Functions',
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        hasGoogleProjectId: !!config.projectId,
        hasGoogleClientEmail: !!config.serviceAccountEmail,
        hasGooglePrivateKey: config.hasPrivateKey,
        mode: 'mock'
      }
    };
    
  } catch (error) {
    logger.error('❌ Error en health check:', error);
    throw new HttpsError('internal', `Error en health check: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
});

/**
 * Obtener eventos del calendario (versión mock)
 */
export const getCalendarEvents = onCall(async (request) => {
  try {
    // Validar autenticación
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    logger.info('🗓️ Obteniendo eventos del calendario para usuario:', request.auth.uid);

    // Datos mock para testing
    const mockEvents = [
      {
        id: 'mock-event-1',
        summary: 'Revisión de materiales',
        start: { dateTime: new Date().toISOString() },
        end: { dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
        description: 'Evento de prueba desde Firebase Functions'
      },
      {
        id: 'mock-event-2',
        summary: 'Mantenimiento de equipos',
        start: { dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
        end: { dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString() },
        description: 'Evento de mantenimiento programado'
      }
    ];

    return {
      success: true,
      events: mockEvents,
      message: 'Eventos obtenidos exitosamente (modo mock)',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('❌ Error obteniendo eventos del calendario:', error);
    throw new HttpsError('internal', `Error obteniendo eventos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
});

/**
 * Listar archivos de Drive (versión mock)
 */
export const listDriveFiles = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    logger.info('📁 Listando archivos de Drive para usuario:', request.auth.uid);

    // Datos mock para testing
    const mockFiles = [
      {
        id: 'mock-file-1',
        name: 'Reporte Materiales.pdf',
        mimeType: 'application/pdf',
        size: '1024000',
        modifiedTime: new Date().toISOString(),
        webViewLink: 'https://drive.google.com/mock-file-1'
      },
      {
        id: 'mock-file-2',
        name: 'Inventario.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: '512000',
        modifiedTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        webViewLink: 'https://drive.google.com/mock-file-2'
      }
    ];

    return {
      success: true,
      files: mockFiles,
      message: 'Archivos obtenidos exitosamente (modo mock)',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('❌ Error listando archivos de Drive:', error);
    throw new HttpsError('internal', `Error listando archivos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
});
