/**
 * Firebase Functions - Google APIs Integration
 * Funciones simplificadas para integración con Google APIs
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
// import { getFirestore } from 'firebase-admin/firestore'; // Comentado hasta que se necesite

// Inicializar Firebase Admin
initializeApp();
// const db = getFirestore(); // Comentado hasta que se necesite

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
    
    logger.info('🔍 Health check ejecutado', { user: request.auth?.uid });
    
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

/**
 * Crear evento en el calendario (versión mock)
 */
export const createCalendarEvent = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const { eventData } = request.data || {};
    if (!eventData) {
      throw new HttpsError('invalid-argument', 'Datos del evento requeridos');
    }

    logger.info('📅 Creando evento del calendario para usuario:', request.auth.uid, eventData);

    // Mock response
    const mockEvent = {
      id: `mock-created-${Date.now()}`,
      summary: eventData.summary || 'Nuevo evento',
      start: eventData.start || { dateTime: new Date().toISOString() },
      end: eventData.end || { dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
      description: eventData.description || 'Evento creado desde Firebase Functions'
    };

    return {
      success: true,
      event: mockEvent,
      message: 'Evento creado exitosamente (modo mock)',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('❌ Error creando evento:', error);
    throw new HttpsError('internal', `Error creando evento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
});

/**
 * Crear carpeta en Drive (versión mock)
 */
export const createDriveFolder = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const { name, parentId } = request.data || {};
    if (!name) {
      throw new HttpsError('invalid-argument', 'Nombre de carpeta requerido');
    }

    logger.info('📁 Creando carpeta en Drive para usuario:', request.auth.uid, { name, parentId });

    // Mock response
    const mockFolder = {
      id: `mock-folder-${Date.now()}`,
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      createdTime: new Date().toISOString(),
      webViewLink: `https://drive.google.com/mock-folder-${Date.now()}`
    };

    return {
      success: true,
      folder: mockFolder,
      message: 'Carpeta creada exitosamente (modo mock)',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('❌ Error creando carpeta:', error);
    throw new HttpsError('internal', `Error creando carpeta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
});
