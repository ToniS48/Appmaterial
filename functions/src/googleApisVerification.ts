/**
 * Verificación de Google APIs para Firebase Functions
 * Endpoint HTTP para diagnosticar el estado de las APIs
 */

import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

// Interfaces específicas para Functions
interface GoogleApisVerificationResult {
  success: boolean;
  errors: string[];
  summary: {
    backend: { configured: boolean; errors: string[] };
    analytics: { configured: boolean; errors: string[] };
    bigQuery: { configured: boolean; errors: string[] };
    frontend: { configured: boolean; errors: string[] };
    environment: { configured: boolean; errors: string[] };
  };
  timestamp: string;
  environment: 'functions';
}

/**
 * Verificar configuración de Google APIs en Functions
 */
async function verifyGoogleApisConfiguration(): Promise<GoogleApisVerificationResult> {
  const errors: string[] = [];
  const summary: GoogleApisVerificationResult['summary'] = {
    backend: { configured: false, errors: [] },
    analytics: { configured: false, errors: [] },
    bigQuery: { configured: false, errors: [] },
    frontend: { configured: false, errors: [] },
    environment: { configured: false, errors: [] }
  };

  try {
    logger.info('Verificando configuración en Functions');

    // Verificar variables de entorno en Functions
    const envErrors: string[] = [];
    
    if (!process.env.GCP_PROJECT) {
      envErrors.push('GCP_PROJECT no está configurado');
    }
    
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_CONFIG) {
      envErrors.push('GOOGLE_APPLICATION_CREDENTIALS o FIREBASE_CONFIG no están configurados');
    }

    summary.environment.configured = envErrors.length === 0;
    summary.environment.errors = envErrors;

    // En Functions, el backend está configurado si tenemos service account
    summary.backend.configured = !!(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG);
    if (!summary.backend.configured) {
      summary.backend.errors.push('Service Account no configurado en Functions');
    }

    // Analytics y BigQuery dependen del project ID
    const hasProjectId = !!(process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT);
    summary.analytics.configured = hasProjectId;
    summary.bigQuery.configured = hasProjectId;
    
    if (!hasProjectId) {
      summary.analytics.errors.push('Project ID no configurado para Analytics');
      summary.bigQuery.errors.push('Project ID no configurado para BigQuery');
    }

    // Frontend se asume configurado (no podemos verificarlo desde Functions)
    summary.frontend.configured = true;

    // Recopilar errores
    Object.values(summary).forEach(section => {
      errors.push(...section.errors);
    });

    return {
      success: errors.length === 0,
      errors,
      summary,
      timestamp: new Date().toISOString(),
      environment: 'functions'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    errors.push(`Error durante verificación: ${errorMessage}`);
    
    return {
      success: false,
      errors,
      summary,
      timestamp: new Date().toISOString(),
      environment: 'functions'
    };
  }
}

/**
 * Cloud Function para verificar estado de Google APIs
 * GET /verifyGoogleApis
 */
export const verifyGoogleApis = onRequest(
  {
    cors: true,
    region: 'europe-west1'
  },
  async (request, response) => {
    try {
      logger.info('Iniciando verificación de Google APIs');
      
      // Solo permitir GET requests
      if (request.method !== 'GET') {
        response.status(405).json({
          error: 'Método no permitido',
          allowedMethods: ['GET']
        });
        return;
      }

      // Ejecutar verificación
      const result: GoogleApisVerificationResult = await verifyGoogleApisConfiguration();
      
      logger.info('Verificación completada', { 
        success: result.success, 
        errorCount: result.errors.length 
      });

      // Construir respuesta
      const responseData = {
        ...result,
        functionInfo: {
          region: process.env.FUNCTION_REGION || 'europe-west1',
          runtime: process.version,
          timestamp: new Date().toISOString()
        }
      };

      // Determinar código de estado HTTP
      const statusCode = result.success ? 200 : 
        (result.errors.length > 0 ? 207 : 500); // 207 = Multi-Status

      response.status(statusCode).json(responseData);
      
    } catch (error) {
      logger.error('Error en verificación de Google APIs', error);
      
      response.status(500).json({
        success: false,
        errors: [`Error interno: ${error instanceof Error ? error.message : 'Error desconocido'}`],
        summary: null,
        timestamp: new Date().toISOString(),
        environment: 'functions'
      });
    }
  }
);

/**
 * Cloud Function para diagnóstico detallado
 * GET /googleApisDiagnostic
 */
export const googleApisDiagnostic = onRequest(
  {
    cors: true,
    region: 'europe-west1'
  },
  async (request, response) => {
    try {
      logger.info('Iniciando diagnóstico detallado de Google APIs');

      if (request.method !== 'GET') {
        response.status(405).json({
          error: 'Método no permitido',
          allowedMethods: ['GET']
        });
        return;
      }

      // Obtener información del entorno
      const environmentInfo = {
        nodeVersion: process.version,
        functionName: process.env.FUNCTION_NAME,
        functionRegion: process.env.FUNCTION_REGION,
        gcpProject: process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT,
        variables: {
          hasProjectId: !!process.env.GCP_PROJECT_ID,
          hasGoogleApplicationCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
          hasApiEncryptKey: !!process.env.API_ENCRYPT_KEY,
          hasGaPropertyId: !!process.env.GA_PROPERTY_ID
        }
      };

      // Ejecutar verificación completa
      const verificationResult = await verifyGoogleApisConfiguration();

      // Información adicional de servicios disponibles
      const servicesInfo = {
        availableApis: [
          'Google Calendar API',
          'Google Drive API', 
          'Google Analytics API',
          'BigQuery API',
          'Cloud Firestore',
          'Firebase Auth'
        ],
        endpointsAvailable: [
          '/googleCalendar',
          '/googleDrive',
          '/verifyGoogleApis',
          '/googleApisDiagnostic'
        ]
      };

      const diagnosticResult = {
        ...verificationResult,
        environment: environmentInfo,
        services: servicesInfo,
        diagnostic: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          status: verificationResult.success ? 'healthy' : 'warning'
        }
      };

      logger.info('Diagnóstico completado', { 
        status: diagnosticResult.diagnostic.status 
      });

      response.status(200).json(diagnosticResult);

    } catch (error) {
      logger.error('Error en diagnóstico de Google APIs', error);
      
      response.status(500).json({
        success: false,
        errors: [`Error en diagnóstico: ${error instanceof Error ? error.message : 'Error desconocido'}`],
        timestamp: new Date().toISOString(),
        environment: 'functions'
      });
    }
  }
);

/**
 * Cloud Function para verificación rápida de salud
 * GET /googleApisHealth
 */
export const googleApisHealth = onRequest(
  {
    cors: true,
    region: 'europe-west1'
  },
  async (request, response) => {
    try {
      if (request.method !== 'GET') {
        response.status(405).json({ error: 'Método no permitido' });
        return;
      }

      // Verificación rápida
      const hasRequiredEnvVars = !!(
        process.env.GCP_PROJECT_ID && 
        process.env.GOOGLE_APPLICATION_CREDENTIALS
      );

      const healthStatus = {
        status: hasRequiredEnvVars ? 'healthy' : 'warning',
        timestamp: new Date().toISOString(),
        environment: 'functions',
        checks: {
          environmentVariables: hasRequiredEnvVars,
          functionsRuntime: true,
          region: process.env.FUNCTION_REGION || 'unknown'
        }
      };

      const statusCode = hasRequiredEnvVars ? 200 : 503;
      
      response.status(statusCode).json(healthStatus);
      
    } catch (error) {
      logger.error('Error en health check', error);
      response.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
);
