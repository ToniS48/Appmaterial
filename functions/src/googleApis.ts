/**
 * Firebase Functions para Google APIs
 * 
 * Endpoints REST seguros para manejar Google Calendar y Drive APIs
 * usando Service Account en el backend.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleApisService } from './services/googleApisService';
import cors from 'cors';

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

// Configurar CORS
const corsHandler = cors({ origin: true });

// Función para obtener configuración de Google APIs desde environment variables
const getGoogleConfig = () => {
  const config = {
    projectId: process.env.GOOGLE_PROJECT_ID!,
    serviceAccountEmail: process.env.GOOGLE_CLIENT_EMAIL!,
    privateKey: process.env.GOOGLE_PRIVATE_KEY!,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive',
    ],
  };

  if (!config.projectId || !config.serviceAccountEmail || !config.privateKey) {
    throw new Error('Missing required Google API configuration');
  }

  return config;
};

// Función auxiliar para validar autenticación del usuario
const validateAuth = async (req: any): Promise<{ uid: string; email: string } | null> => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return null;
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email!,
    };
  } catch (error) {
    console.error('Error validating auth:', error);
    return null;
  }
};

/**
 * CALENDAR API ENDPOINTS
 */

export const getCalendarEvents = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Validar autenticación
      const user = await validateAuth(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Validar método
      if (req.method !== 'GET') {
        return res.status(401).json({ error: 'Method not allowed' });
        return;
      }

      // Obtener parámetros
      const {
        calendarId = 'primary',
        timeMin,
        timeMax,
        maxResults = 10
      } = req.query;

      // Inicializar servicio
      const googleService = new GoogleApisService(getGoogleConfig());

      // Obtener eventos
      const result = await googleService.getCalendarEvents(calendarId as string, {
        timeMin: timeMin as string,
        timeMax: timeMax as string,
        maxResults: parseInt(maxResults as string),
      });

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in getCalendarEvents:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
});

export const createCalendarEvent = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Validar autenticación
      const user = await validateAuth(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validar método
      if (req.method !== 'POST') {
        return res.status(401).json({ error: 'Method not allowed' });
      }

      // Obtener datos del evento
      const { calendarId = 'primary', eventData } = req.body;

      if (!eventData) {
        return res.status(401).json({ error: 'Event data is required' });
      }

      // Inicializar servicio
      const googleService = new GoogleApisService(getGoogleConfig());

      // Crear evento
      const result = await googleService.createCalendarEvent(calendarId, eventData);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in createCalendarEvent:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
});

export const updateCalendarEvent = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Validar autenticación
      const user = await validateAuth(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validar método
      if (req.method !== 'PUT') {
        return res.status(401).json({ error: 'Method not allowed' });
      }

      // Obtener datos
      const { calendarId = 'primary', eventId, eventData } = req.body;

      if (!eventId || !eventData) {
        return res.status(401).json({ error: 'Event ID and data are required' });
      }

      // Inicializar servicio
      const googleService = new GoogleApisService(getGoogleConfig());

      // Actualizar evento
      const result = await googleService.updateCalendarEvent(calendarId, eventId, eventData);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in updateCalendarEvent:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
});

export const deleteCalendarEvent = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Validar autenticación
      const user = await validateAuth(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validar método
      if (req.method !== 'DELETE') {
        return res.status(401).json({ error: 'Method not allowed' });
      }

      // Obtener datos
      const { calendarId = 'primary', eventId } = req.body;

      if (!eventId) {
        return res.status(401).json({ error: 'Event ID is required' });
      }

      // Inicializar servicio
      const googleService = new GoogleApisService(getGoogleConfig());

      // Eliminar evento
      const result = await googleService.deleteCalendarEvent(calendarId, eventId);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in deleteCalendarEvent:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
});

export const getCalendars = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Validar autenticación
      const user = await validateAuth(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validar método
      if (req.method !== 'GET') {
        return res.status(401).json({ error: 'Method not allowed' });
      }

      // Inicializar servicio
      const googleService = new GoogleApisService(getGoogleConfig());

      // Obtener calendarios
      const result = await googleService.getCalendars();

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in getCalendars:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
});

/**
 * DRIVE API ENDPOINTS
 */

export const listDriveFiles = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Validar autenticación
      const user = await validateAuth(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validar método
      if (req.method !== 'GET') {
        return res.status(401).json({ error: 'Method not allowed' });
      }

      // Obtener parámetros
      const { query, pageSize = 10 } = req.query;

      // Inicializar servicio
      const googleService = new GoogleApisService(getGoogleConfig());

      // Listar archivos
      const result = await googleService.listDriveFiles(
        query as string,
        parseInt(pageSize as string)
      );

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in listDriveFiles:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
});

export const createDriveFolder = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Validar autenticación
      const user = await validateAuth(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validar método
      if (req.method !== 'POST') {
        return res.status(401).json({ error: 'Method not allowed' });
      }

      // Obtener datos
      const { name, parentId } = req.body;

      if (!name) {
        return res.status(401).json({ error: 'Folder name is required' });
      }

      // Inicializar servicio
      const googleService = new GoogleApisService(getGoogleConfig());

      // Crear carpeta
      const result = await googleService.createDriveFolder(name, parentId);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in createDriveFolder:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
});

export const uploadDriveFile = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Validar autenticación
      const user = await validateAuth(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validar método
      if (req.method !== 'POST') {
        return res.status(401).json({ error: 'Method not allowed' });
      }

      // Obtener datos
      const { name, content, mimeType, parentId } = req.body;

      if (!name || !content || !mimeType) {
        return res.status(401).json({ error: 'Name, content and mimeType are required' });
      }

      // Inicializar servicio
      const googleService = new GoogleApisService(getGoogleConfig());

      // Subir archivo
      const result = await googleService.uploadDriveFile(name, content, mimeType, parentId);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in uploadDriveFile:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
});

export const deleteDriveFile = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Validar autenticación
      const user = await validateAuth(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validar método
      if (req.method !== 'DELETE') {
        return res.status(401).json({ error: 'Method not allowed' });
      }

      // Obtener datos
      const { fileId } = req.body;

      if (!fileId) {
        return res.status(401).json({ error: 'File ID is required' });
      }

      // Inicializar servicio
      const googleService = new GoogleApisService(getGoogleConfig());

      // Eliminar archivo
      const result = await googleService.deleteDriveFile(fileId);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in deleteDriveFile:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
});

export const shareDriveFile = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      // Validar autenticación
      const user = await validateAuth(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validar método
      if (req.method !== 'POST') {
        return res.status(401).json({ error: 'Method not allowed' });
      }

      // Obtener datos
      const { fileId, email, role = 'reader' } = req.body;

      if (!fileId || !email) {
        return res.status(401).json({ error: 'File ID and email are required' });
      }

      // Inicializar servicio
      const googleService = new GoogleApisService(getGoogleConfig());

      // Compartir archivo
      const result = await googleService.shareDriveFile(fileId, email, role);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in shareDriveFile:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });
});

/**
 * HEALTH CHECK ENDPOINT
 */
export const googleApisHealthCheck = functions.https.onRequest(async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const config = getGoogleConfig();
      return res.status(200).json({
        success: true,
        message: 'Google APIs service is running',
        config: {
          projectId: config.projectId,
          serviceAccountEmail: config.serviceAccountEmail,
          hasPrivateKey: !!config.privateKey,
          scopes: config.scopes,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
});
