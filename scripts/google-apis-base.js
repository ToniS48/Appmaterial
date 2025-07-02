/**
 * Script base para Google APIs
 * Configuración común para todos los scripts de Google APIs
 */

const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

class GoogleApisBase {
  constructor() {
    this.auth = null;
    this.initializeAuth();
  }

  /**
   * Inicializar autenticación con Service Account
   */
  initializeAuth() {
    try {
      if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL) {
        throw new Error('Variables de entorno de Google no configuradas');
      }

      const credentials = {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: this.formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLIENT_EMAIL)}`
      };

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/gmail.send'
        ]
      });

    } catch (error) {
      console.error('Error inicializando autenticación Google:', error.message);
      throw error;
    }
  }

  /**
   * Obtener cliente autenticado
   */
  async getAuthClient() {
    try {
      return await this.auth.getClient();
    } catch (error) {
      console.error('Error obteniendo cliente de autenticación:', error.message);
      throw error;
    }
  }

  /**
   * Manejar respuesta del script
   */
  handleResponse(success, data = null, error = null) {
    const response = {
      success,
      timestamp: new Date().toISOString(),
      data,
      error
    };

    console.log(JSON.stringify(response, null, 2));
    process.exit(success ? 0 : 1);
  }

  /**
   * Manejar errores
   */
  handleError(error, context = 'Script') {
    const errorMessage = error.message || 'Error desconocido';
    console.error(`[${context}] Error:`, errorMessage);
    this.handleResponse(false, null, errorMessage);
  }

  /**
   * Formatear clave privada para asegurar el formato correcto
   */
  formatPrivateKey(privateKey) {
    if (!privateKey) {
      throw new Error('Private key is required');
    }

    // Remover espacios y saltos de línea extra
    let cleanKey = privateKey.replace(/\\n/g, '\n').trim();

    // Si no tiene las cabeceras, agregarlas
    if (!cleanKey.includes('-----BEGIN PRIVATE KEY-----')) {
      cleanKey = `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
    }

    return cleanKey;
  }
}

module.exports = GoogleApisBase;
