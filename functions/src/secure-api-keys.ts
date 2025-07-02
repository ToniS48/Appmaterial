/**
 * FIREBASE FUNCTIONS: Gestión Segura de API Keys
 * 
 * Esta función maneja el guardado seguro de API keys sensibles
 * usando encriptado del lado del servidor.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import * as crypto from 'crypto';

// Clave de encriptado del servidor (debe estar en variables de entorno de Cloud Functions)
const ENCRYPTION_KEY = process.env.API_ENCRYPTION_KEY; // 32 bytes key
const ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  logger.error('❌ API_ENCRYPTION_KEY debe ser una clave hexadecimal de 64 caracteres (32 bytes)');
}

/**
 * Encripta datos sensibles usando AES-256-GCM
 */
function encryptSensitiveData(text: string): { encrypted: string; iv: string; tag: string } {
  if (!ENCRYPTION_KEY) {
    throw new Error('Clave de encriptado no configurada');
  }
  
  const iv = crypto.randomBytes(16); // Vector de inicialización
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from('AEMET_API_KEY', 'utf8')); // Datos adicionales autenticados
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

/**
 * Desencripta datos sensibles
 */
function decryptSensitiveData(encryptedData: { encrypted: string; iv: string; tag: string }): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('Clave de encriptado no configurada');
  }
  
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(Buffer.from('AEMET_API_KEY', 'utf8'));
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Guarda una API key de forma segura
 */
export const saveApiKeySecure = onCall(async (request) => {
  try {
    // 1. Verificar autenticación
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    // 2. Verificar permisos de administrador
    const db = getFirestore();
    const userDoc = await db.collection('usuarios').doc(request.auth.uid).get();
    
    if (!userDoc.exists || userDoc.data()?.rol !== 'admin') {
      throw new HttpsError('permission-denied', 'Solo administradores pueden modificar API keys');
    }

    // 3. Validar datos de entrada
    const { service, apiKey } = request.data;
    
    if (!service || typeof service !== 'string') {
      throw new HttpsError('invalid-argument', 'Servicio no especificado');
    }
    
    if (!apiKey || typeof apiKey !== 'string') {
      throw new HttpsError('invalid-argument', 'API key no válida');
    }

    // Servicios permitidos
    const allowedServices = ['aemet', 'openWeather', 'googleMaps', 'gmail'];
    if (!allowedServices.includes(service)) {
      throw new HttpsError('invalid-argument', `Servicio no permitido: ${service}`);
    }

    // 4. Encriptar la API key
    let encryptedData;
    try {
      encryptedData = encryptSensitiveData(apiKey);
    } catch (encryptError) {
      logger.error('Error encriptando API key:', encryptError);
      throw new HttpsError('internal', 'Error procesando API key');
    }

    // 5. Guardar en Firestore de forma segura
    const configRef = db.collection('configuracion').doc('apis_secure');
    
    await configRef.set({
      [`${service}`]: {
        encrypted: encryptedData.encrypted,
        iv: encryptedData.iv,
        tag: encryptedData.tag,
        lastUpdated: new Date(),
        updatedBy: request.auth.uid
      }
    }, { merge: true });

    // 6. Log de auditoría
    await db.collection('audit_logs').add({
      action: 'api_key_updated',
      service: service,
      userId: request.auth.uid,
      userEmail: request.auth.token.email,
      timestamp: new Date(),
      success: true
    });

    logger.info(`✅ API key actualizada para servicio: ${service} por usuario: ${request.auth.uid}`);

    return {
      success: true,
      message: `API key de ${service} actualizada correctamente`,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    // Log de auditoría para errores
    if (request.auth) {
      const db = getFirestore();
      await db.collection('audit_logs').add({
        action: 'api_key_update_failed',
        service: request.data?.service || 'unknown',
        userId: request.auth.uid,
        userEmail: request.auth.token.email,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        success: false
      });
    }

    logger.error('❌ Error guardando API key:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Error interno del servidor');
  }
});

/**
 * Obtiene una API key de forma segura (solo para uso interno del backend)
 */
export const getApiKeySecure = onCall(async (request) => {
  try {
    // Solo permitir desde funciones del backend o administradores
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }

    const { service } = request.data;
    
    if (!service) {
      throw new HttpsError('invalid-argument', 'Servicio no especificado');
    }

    const db = getFirestore();
    const configDoc = await db.collection('configuracion').doc('apis_secure').get();
    
    if (!configDoc.exists) {
      throw new HttpsError('not-found', 'Configuración de APIs no encontrada');
    }

    const data = configDoc.data();
    const serviceData = data?.[service];
    
    if (!serviceData) {
      throw new HttpsError('not-found', `API key para ${service} no encontrada`);
    }

    // Verificar que la API key existe y es válida
    try {
      decryptSensitiveData({
        encrypted: serviceData.encrypted,
        iv: serviceData.iv,
        tag: serviceData.tag
      });
    } catch (decryptError) {
      throw new HttpsError('internal', 'Error procesando API key almacenada');
    }

    // NO devolver la clave real al frontend
    // Solo confirmar si existe o no
    return {
      exists: true,
      lastUpdated: serviceData.lastUpdated,
      service: service
    };

  } catch (error) {
    logger.error('❌ Error obteniendo API key:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Error interno del servidor');
  }
});

/**
 * Función interna para obtener API keys desencriptadas (solo para uso del backend)
 */
export async function getDecryptedApiKey(service: string): Promise<string | null> {
  try {
    const db = getFirestore();
    const configDoc = await db.collection('configuracion').doc('apis_secure').get();
    
    if (!configDoc.exists) {
      return null;
    }

    const data = configDoc.data();
    const serviceData = data?.[service];
    
    if (!serviceData) {
      return null;
    }

    return decryptSensitiveData({
      encrypted: serviceData.encrypted,
      iv: serviceData.iv,
      tag: serviceData.tag
    });

  } catch (error) {
    logger.error(`Error obteniendo API key para ${service}:`, error);
    return null;
  }
}
