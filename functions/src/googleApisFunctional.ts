/**
 * Firebase Functions para Google APIs - Versión Funcional
 * 
 * Funciones callable seguras para manejar Google Calendar y Drive APIs
 * usando Service Account en el backend.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

// Función para obtener configuración de Google APIs desde environment variables
const getGoogleConfig = () => {
  const config = {
    projectId: process.env.GOOGLE_PROJECT_ID || 'fichamaterial',
    serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL || 'appmaterial-service@fichamaterial.iam.gserviceaccount.com',
    privateKey: process.env.GOOGLE_PRIVATE_KEY || '',
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive',
    ],
  };

  return config;
};

// Función auxiliar para validar autenticación del usuario
const validateAuth = async (request: any): Promise<{ uid: string; email: string } | null> => {
  try {
    if (!request.auth) {
      return null;
    }

    return {
      uid: request.auth.uid,
      email: request.auth.token.email || 'unknown@example.com',
    };
  } catch (error) {
    logger.error('Error validating auth:', error);
    return null;
  }
};

// ================================
// FUNCIONES DE GOOGLE CALENDAR
// ================================

/**
 * Obtener eventos del calendario
 */
export const getCalendarEvents = onCall(async (request) => {
  try {
    // Validar autenticación
    const user = await validateAuth(request);
    if (!user) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    logger.info('🗓️ Obteniendo eventos del calendario para usuario:', user.email);

    // Por ahora retornamos datos mock hasta que configuremos las APIs
    const mockEvents = [
      {
        id: 'mock-event-1',
        summary: 'Revisión de materiales',
        start: { dateTime: new Date().toISOString() },
        end: { dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
        description: 'Evento de prueba desde Firebase Functions'
      }
    ];

    return {
      success: true,
      events: mockEvents,
      message: 'Eventos obtenidos exitosamente (modo mock)',
      config: getGoogleConfig()
    };

  } catch (error) {
    logger.error('❌ Error obteniendo eventos del calendario:', error);
    throw new HttpsError('internal', `Error obteniendo eventos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
});

/**
 * Crear evento en el calendario
 */
export const createCalendarEvent = onCall(async (request) => {
  try {
    const user = await validateAuth(request);
    if (!user) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const { eventData } = request.data;
    if (!eventData) {
      throw new HttpsError('invalid-argument', 'Datos del evento requeridos');
    }

    logger.info('📅 Creando evento del calendario para usuario:', user.email, eventData);

    // Mock response por ahora
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
      message: 'Evento creado exitosamente (modo mock)'
    };

  } catch (error) {
    logger.error('❌ Error creando evento:', error);
    throw new HttpsError('internal', `Error creando evento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
});

/**
 * Obtener lista de calendarios
 */
export const getCalendars = onCall(async (request) => {
  try {
    const user = await validateAuth(request);
    if (!user) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    logger.info('📋 Obteniendo calendarios para usuario:', user.email);

    // Mock response
    const mockCalendars = [
      {
        id: 'primary',
        summary: 'Calendario Principal',
        primary: true
      },
      {
        id: 'materiales@fichamaterial.com',
        summary: 'Calendario de Materiales',
        primary: false
      }
    ];

    return {
      success: true,
      calendars: mockCalendars,
      message: 'Calendarios obtenidos exitosamente (modo mock)'
    };

  } catch (error) {
    logger.error('❌ Error obteniendo calendarios:', error);
    throw new HttpsError('internal', `Error obteniendo calendarios: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
});

// ================================
// FUNCIONES DE GOOGLE DRIVE
// ================================

/**
 * Listar archivos de Drive
 */
export const listDriveFiles = onCall(async (request) => {
  try {
    const user = await validateAuth(request);
    if (!user) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const { folderId, query } = request.data || {};
    logger.info('📁 Listando archivos de Drive para usuario:', user.email, { folderId, query });

    // Mock response
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
      message: 'Archivos obtenidos exitosamente (modo mock)'
    };

  } catch (error) {
    logger.error('❌ Error listando archivos de Drive:', error);
    throw new HttpsError('internal', `Error listando archivos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
});

/**
 * Crear carpeta en Drive
 */
export const createDriveFolder = onCall(async (request) => {
  try {
    const user = await validateAuth(request);
    if (!user) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const { name, parentId } = request.data || {};
    if (!name) {
      throw new HttpsError('invalid-argument', 'Nombre de carpeta requerido');
    }

    logger.info('📁 Creando carpeta en Drive para usuario:', user.email, { name, parentId });

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
      message: 'Carpeta creada exitosamente (modo mock)'
    };

  } catch (error) {
    logger.error('❌ Error creando carpeta:', error);
    throw new HttpsError('internal', `Error creando carpeta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
});

// ================================
// FUNCIONES DE UTILIDAD
// ================================

/**
 * Health check para Google APIs
 */
export const googleApisHealthCheck = onCall(async (request) => {
  try {
    const config = getGoogleConfig();
    
    return {
      success: true,
      status: 'healthy',
      service: 'Google APIs Functions',
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        hasGoogleProjectId: !!config.projectId,
        hasGoogleClientEmail: !!config.serviceAccountEmail,
        hasGooglePrivateKey: !!config.privateKey,
        mode: 'mock' // Cambiar a 'production' cuando esté listo
      }
    };
    
  } catch (error) {
    logger.error('❌ Error en health check:', error);
    throw new HttpsError('internal', `Error en health check: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
});

/**
 * Función de prueba para verificar la configuración
 */
export const testGoogleConfiguration = onCall(async (request) => {
  try {
    const user = await validateAuth(request);
    if (!user) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const config = getGoogleConfig();
    
    return {
      success: true,
      message: 'Configuración de Google APIs verificada',
      timestamp: new Date().toISOString(),
      userInfo: {
        uid: user.uid,
        email: user.email
      },
      configuration: {
        projectId: config.projectId,
        serviceAccountEmail: config.serviceAccountEmail,
        hasPrivateKey: !!config.privateKey,
        scopes: config.scopes
      }
    };
    
  } catch (error) {
    logger.error('❌ Error verificando configuración:', error);
    throw new HttpsError('internal', `Error verificando configuración: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
});
