/**
 * Script para Google Drive
 * Uso: node scripts/google-drive-files.js [action] [options]
 */

const { google } = require('googleapis');
const GoogleApisBase = require('./google-apis-base');

class GoogleDriveScript extends GoogleApisBase {
  constructor() {
    super();
  }

  /**
   * Listar archivos de Drive
   */
  async listFiles(options = {}) {
    try {
      const authClient = await this.getAuthClient();
      const drive = google.drive({ version: 'v3', auth: authClient });

      const requestOptions = {
        pageSize: options.pageSize || 100,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents)',
      };

      // Agregar query de búsqueda si se proporciona
      if (options.query && options.query !== 'undefined') {
        requestOptions.q = options.query;
      }

      // Agregar folderId si se proporciona
      if (options.folderId && options.folderId !== 'undefined') {
        const folderQuery = `'${options.folderId}' in parents`;
        requestOptions.q = requestOptions.q ? `${requestOptions.q} and ${folderQuery}` : folderQuery;
      }

      const response = await drive.files.list(requestOptions);
      
      const files = (response.data.files || []).map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        parents: file.parents || []
      }));

      this.handleResponse(true, files);

    } catch (error) {
      this.handleError(error, 'Google Drive List');
    }
  }

  /**
   * Crear carpeta en Drive
   */
  async createFolder(folderData) {
    try {
      const authClient = await this.getAuthClient();
      const drive = google.drive({ version: 'v3', auth: authClient });

      const fileMetadata = {
        name: folderData.name,
        mimeType: 'application/vnd.google-apps.folder'
      };

      if (folderData.parentId) {
        fileMetadata.parents = [folderData.parentId];
      }

      const response = await drive.files.create({
        resource: fileMetadata,
        fields: 'id, name, webViewLink'
      });

      this.handleResponse(true, {
        id: response.data.id,
        name: response.data.name,
        webViewLink: response.data.webViewLink
      });

    } catch (error) {
      this.handleError(error, 'Google Drive Create Folder');
    }
  }

  /**
   * Subir archivo a Drive
   */
  async uploadFile(fileData) {
    try {
      const authClient = await this.getAuthClient();
      const drive = google.drive({ version: 'v3', auth: authClient });

      const fileMetadata = {
        name: fileData.name
      };

      if (fileData.parentId) {
        fileMetadata.parents = [fileData.parentId];
      }

      const media = {
        mimeType: fileData.mimeType,
        body: fileData.content // Esto debería ser un stream o buffer
      };

      const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, webContentLink'
      });

      this.handleResponse(true, {
        id: response.data.id,
        name: response.data.name,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink
      });

    } catch (error) {
      this.handleError(error, 'Google Drive Upload');
    }
  }

  /**
   * Compartir archivo
   */
  async shareFile(shareData) {
    try {
      const authClient = await this.getAuthClient();
      const drive = google.drive({ version: 'v3', auth: authClient });

      const permission = {
        role: shareData.role || 'reader', // reader, writer, commenter
        type: shareData.type || 'user', // user, group, domain, anyone
      };

      if (shareData.emailAddress) {
        permission.emailAddress = shareData.emailAddress;
      }

      const response = await drive.permissions.create({
        fileId: shareData.fileId,
        resource: permission,
        sendNotificationEmail: shareData.sendNotification || false
      });

      this.handleResponse(true, {
        permissionId: response.data.id,
        role: response.data.role,
        type: response.data.type
      });

    } catch (error) {
      this.handleError(error, 'Google Drive Share');
    }
  }
}

// Ejecutar script si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const script = new GoogleDriveScript();

  // Parsear argumentos
  const action = args[0] || 'listFiles';
  const options = {};

  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      // Convertir números
      if (key === 'pageSize' && !isNaN(value)) {
        options[key] = parseInt(value);
      } else {
        options[key] = value;
      }
    }
  }

  // Ejecutar acción
  switch (action) {
    case 'listFiles':
      script.listFiles(options);
      break;
    case 'createFolder':
      if (options.name) {
        script.createFolder(options);
      } else {
        script.handleError(new Error('name requerido para createFolder'), 'Arguments');
      }
      break;
    case 'uploadFile':
      script.handleError(new Error('uploadFile no implementado en CLI'), 'Not Implemented');
      break;
    case 'shareFile':
      if (options.fileId) {
        script.shareFile(options);
      } else {
        script.handleError(new Error('fileId requerido para shareFile'), 'Arguments');
      }
      break;
    default:
      script.handleError(new Error(`Acción desconocida: ${action}`), 'Arguments');
  }
}

module.exports = GoogleDriveScript;
