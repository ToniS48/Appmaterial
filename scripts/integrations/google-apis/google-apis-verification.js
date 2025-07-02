/**
 * Script para verificación de Google APIs
 * Uso: node scripts/google-apis-verification.js
 */

const GoogleApisBase = require('./google-apis-base');
const { google } = require('googleapis');

class GoogleApisVerificationScript extends GoogleApisBase {
  constructor() {
    super();
  }

  /**
   * Verificar estado de las APIs de Google
   */
  async verifyAPIs() {
    try {
      const authClient = await this.getAuthClient();
      
      const verificationResults = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: 'node-scripts',
        version: '1.0.0',
        services: {}
      };

      // Verificar Google Calendar
      try {
        const calendar = google.calendar({ version: 'v3', auth: authClient });
        const calendarResponse = await calendar.calendarList.list({ maxResults: 1 });
        verificationResults.services.calendar = {
          status: 'healthy',
          calendarsCount: calendarResponse.data.items?.length || 0
        };
      } catch (error) {
        verificationResults.services.calendar = {
          status: 'unhealthy',
          error: error.message
        };
        verificationResults.status = 'degraded';
      }

      // Verificar Google Drive
      try {
        const drive = google.drive({ version: 'v3', auth: authClient });
        const driveResponse = await drive.files.list({ pageSize: 1 });
        verificationResults.services.drive = {
          status: 'healthy',
          filesAccessible: driveResponse.data.files?.length >= 0
        };
      } catch (error) {
        verificationResults.services.drive = {
          status: 'unhealthy',
          error: error.message
        };
        verificationResults.status = 'degraded';
      }

      // Verificar autenticación
      try {
        const oauth2 = google.oauth2({ version: 'v2', auth: authClient });
        const userInfo = await oauth2.userinfo.get();
        verificationResults.services.auth = {
          status: 'healthy',
          serviceAccount: userInfo.data.email || 'unknown'
        };
      } catch (error) {
        verificationResults.services.auth = {
          status: 'unhealthy',
          error: error.message
        };
        verificationResults.status = 'degraded';
      }

      // Verificar variables de entorno
      const envCheck = {
        GOOGLE_PROJECT_ID: !!process.env.GOOGLE_PROJECT_ID,
        GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
        GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
        REACT_APP_GOOGLE_CALENDAR_ID: !!process.env.REACT_APP_GOOGLE_CALENDAR_ID
      };

      const missingEnvVars = Object.entries(envCheck)
        .filter(([_, exists]) => !exists)
        .map(([key, _]) => key);

      verificationResults.services.environment = {
        status: missingEnvVars.length === 0 ? 'healthy' : 'degraded',
        missingVariables: missingEnvVars
      };

      if (missingEnvVars.length > 0) {
        verificationResults.status = 'degraded';
      }

      this.handleResponse(true, verificationResults);

    } catch (error) {
      this.handleError(error, 'Google APIs Verification');
    }
  }

  /**
   * Health check simple
   */
  async healthCheck() {
    try {
      const result = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: 'node-scripts',
        version: '1.0.0',
        message: 'Google APIs scripts están funcionando correctamente'
      };

      // Verificación básica de autenticación
      try {
        await this.getAuthClient();
        result.services = { googleAuth: 'configured' };
      } catch (error) {
        result.status = 'degraded';
        result.services = { googleAuth: 'error', error: error.message };
      }

      this.handleResponse(true, result);

    } catch (error) {
      this.handleError(error, 'Health Check');
    }
  }
}

// Ejecutar script si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const script = new GoogleApisVerificationScript();

  const action = args[0] || 'healthCheck';

  switch (action) {
    case 'healthCheck':
      script.healthCheck();
      break;
    case 'verify':
    case 'verifyAPIs':
      script.verifyAPIs();
      break;
    default:
      script.handleError(new Error(`Acción desconocida: ${action}. Use: healthCheck o verify`), 'Arguments');
  }
}

module.exports = GoogleApisVerificationScript;
