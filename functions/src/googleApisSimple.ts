/**
 * Firebase Functions para Google APIs - Versión Simplificada
 * 
 * Endpoints REST seguros para manejar Google Calendar y Drive APIs
 * usando Service Account en el backend.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleApisService } from './services/googleApisService';

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

export const getCalendarEvents = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Validar autenticación
    const user = await validateAuth(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validar método
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
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

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in getCalendarEvents:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export const createCalendarEvent = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Validar autenticación
    const user = await validateAuth(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validar método
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Obtener datos del evento
    const { calendarId = 'primary', eventData } = req.body;

    if (!eventData) {
      res.status(400).json({ error: 'Event data is required' });
      return;
    }

    // Inicializar servicio
    const googleService = new GoogleApisService(getGoogleConfig());

    // Crear evento
    const result = await googleService.createCalendarEvent(calendarId, eventData);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in createCalendarEvent:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export const listDriveFiles = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Validar autenticación
    const user = await validateAuth(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Validar método
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
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

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in listDriveFiles:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * HEALTH CHECK ENDPOINT
 */
export const googleApisHealthCheck = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const config = getGoogleConfig();
    res.status(200).json({
      success: true,
      message: 'Google APIs service is running',
      timestamp: new Date().toISOString(),
      config: {
        projectId: config.projectId,
        serviceAccountEmail: config.serviceAccountEmail,
        hasPrivateKey: !!config.privateKey,
        privateKeyLength: config.privateKey.length,
        scopes: config.scopes,
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
