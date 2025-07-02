/**
 * Script para verificación y health check de Google APIs
 * Verifica la configuración y conectividad
 */

const GoogleApisBase = require('./google-apis-base');
const { google } = require('googleapis');

class GoogleVerificationScript extends GoogleApisBase {
  constructor() {
    super();
  }

  /**
   * Health check completo
   */
  async healthCheck() {
    try {
      const results = {
        status: 'HEALTHY',
        timestamp: new Date().toISOString(),
        environment: 'node-scripts',
        version: '1.0.0',
        services: {}
      };

      // Verificar autenticación
      try {
        await this.getAuthClient();
        results.services.googleAuth = 'healthy';
      } catch (error) {
        results.services.googleAuth = 'unhealthy';
        results.status = 'DEGRADED';
      }

      // Verificar Calendar API
      try {
        const authClient = await this.getAuthClient();
        const calendar = google.calendar({ version: 'v3', auth: authClient });
        await calendar.calendarList.list({ maxResults: 1 });
        results.services.calendar = 'healthy';
      } catch (error) {
        results.services.calendar = 'unhealthy';
        results.status = 'DEGRADED';
      }

      // Verificar Drive API
      try {
        const authClient = await this.getAuthClient();
        const drive = google.drive({ version: 'v3', auth: authClient });
        await drive.files.list({ pageSize: 1 });
        results.services.drive = 'healthy';
      } catch (error) {
        results.services.drive = 'unhealthy';
        results.status = 'DEGRADED';
      }

      // Verificar variables de entorno
      const requiredEnvVars = [
        'GOOGLE_PROJECT_ID',
        'GOOGLE_PRIVATE_KEY',
        'GOOGLE_CLIENT_EMAIL',
        'GOOGLE_CLIENT_ID'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        results.services.environment = `unhealthy - Missing: ${missingVars.join(', ')}`;
        results.status = 'UNHEALTHY';
      } else {
        results.services.environment = 'healthy';
      }

      this.handleResponse(true, results);
    } catch (error) {
      this.handleError(error, 'Health Check');
    }
  }

  /**
   * Verificar configuración específica
   */
  async verifyConfig() {
    try {
      const config = {
        hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
        hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
        hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        projectId: process.env.GOOGLE_PROJECT_ID || 'Not configured',
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL || 'Not configured'
      };

      const authClient = await this.getAuthClient();
      config.authenticationWorking = !!authClient;

      this.handleResponse(true, config);
    } catch (error) {
      this.handleError(error, 'Config Verification');
    }
  }

  /**
   * Probar conectividad básica con Google APIs
   */
  async testConnectivity() {
    try {
      const results = {
        calendar: false,
        drive: false,
        timestamp: new Date().toISOString()
      };

      const authClient = await this.getAuthClient();

      // Probar Calendar
      try {
        const calendar = google.calendar({ version: 'v3', auth: authClient });
        const response = await calendar.calendarList.list({ maxResults: 1 });
        results.calendar = {
          working: true,
          calendarsFound: response.data.items?.length || 0
        };
      } catch (error) {
        results.calendar = {
          working: false,
          error: error.message
        };
      }

      // Probar Drive
      try {
        const drive = google.drive({ version: 'v3', auth: authClient });
        const response = await drive.files.list({ pageSize: 1 });
        results.drive = {
          working: true,
          filesFound: response.data.files?.length || 0
        };
      } catch (error) {
        results.drive = {
          working: false,
          error: error.message
        };
      }

      this.handleResponse(true, results);
    } catch (error) {
      this.handleError(error, 'Connectivity Test');
    }
  }
}

// Procesar argumentos de línea de comandos
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'health';

  const script = new GoogleVerificationScript();

  try {
    switch (action) {
      case 'health':
        await script.healthCheck();
        break;

      case 'config':
        await script.verifyConfig();
        break;

      case 'connectivity':
        await script.testConnectivity();
        break;

      default:
        console.log('Uso: node google-verification-script.js <action>');
        console.log('Acciones disponibles:');
        console.log('  health      - Health check completo');
        console.log('  config      - Verificar configuración');
        console.log('  connectivity - Probar conectividad con APIs');
        process.exit(1);
    }
  } catch (error) {
    script.handleError(error, 'Main');
  }
}

if (require.main === module) {
  main();
}

module.exports = GoogleVerificationScript;
