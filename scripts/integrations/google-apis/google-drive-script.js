/**
 * Script para Google Drive API
 * Maneja operaciones de Drive usando argumentos de línea de comandos
 */

const GoogleApisBase = require('./google-apis-base');
const { google } = require('googleapis');

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

      const params = {
        pageSize: parseInt(options.pageSize) || 100,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents)'
      };

      // Si hay una query de búsqueda
      if (options.query && options.query !== 'undefined') {
        params.q = options.query;
      }

      // Si hay un folderId específico
      if (options.folderId && options.folderId !== 'undefined') {
        const folderQuery = `'${options.folderId}' in parents`;
        params.q = params.q ? `${params.q} and ${folderQuery}` : folderQuery;
      }

      const response = await drive.files.list(params);
      
      const files = response.data.files || [];
      const formattedFiles = files.map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size || '0',
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        parents: file.parents || []
      }));

      this.handleResponse(true, formattedFiles);
    } catch (error) {
      this.handleError(error, 'Google Drive List');
    }
  }

  /**
   * Crear carpeta en Drive
   */
  async createFolder(name, parentId = null) {
    try {
      const authClient = await this.getAuthClient();
      const drive = google.drive({ version: 'v3', auth: authClient });

      const folderMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder'
      };

      if (parentId && parentId !== 'undefined') {
        folderMetadata.parents = [parentId];
      }

      const response = await drive.files.create({
        resource: folderMetadata,
        fields: 'id, name, createdTime, webViewLink, parents'
      });

      this.handleResponse(true, {
        id: response.data.id,
        name: response.data.name,
        createdTime: response.data.createdTime,
        webViewLink: response.data.webViewLink,
        parents: response.data.parents || []
      });
    } catch (error) {
      this.handleError(error, 'Google Drive Create Folder');
    }
  }

  /**
   * Obtener información de un archivo específico
   */
  async getFile(fileId) {
    try {
      const authClient = await this.getAuthClient();
      const drive = google.drive({ version: 'v3', auth: authClient });

      const response = await drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents, description'
      });

      this.handleResponse(true, {
        id: response.data.id,
        name: response.data.name,
        mimeType: response.data.mimeType,
        size: response.data.size || '0',
        createdTime: response.data.createdTime,
        modifiedTime: response.data.modifiedTime,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
        parents: response.data.parents || [],
        description: response.data.description || ''
      });
    } catch (error) {
      this.handleError(error, 'Google Drive Get File');
    }
  }

  /**
   * Compartir archivo
   */
  async shareFile(fileId, email, role = 'reader') {
    try {
      const authClient = await this.getAuthClient();
      const drive = google.drive({ version: 'v3', auth: authClient });

      const permission = {
        type: 'user',
        role: role, // 'reader', 'writer', 'owner'
        emailAddress: email
      };

      await drive.permissions.create({
        fileId: fileId,
        resource: permission,
        sendNotificationEmail: true
      });

      this.handleResponse(true, {
        fileId: fileId,
        sharedWith: email,
        role: role,
        message: 'Archivo compartido exitosamente'
      });
    } catch (error) {
      this.handleError(error, 'Google Drive Share');
    }
  }

  /**
   * Eliminar archivo
   */
  async deleteFile(fileId) {
    try {
      const authClient = await this.getAuthClient();
      const drive = google.drive({ version: 'v3', auth: authClient });

      await drive.files.delete({
        fileId: fileId
      });

      this.handleResponse(true, {
        fileId: fileId,
        message: 'Archivo eliminado exitosamente'
      });
    } catch (error) {
      this.handleError(error, 'Google Drive Delete');
    }
  }
}

// Procesar argumentos de línea de comandos
async function main() {
  const args = process.argv.slice(2);
  const action = args[0];

  const script = new GoogleDriveScript();

  try {
    switch (action) {
      case 'list':
        const listOptions = {};
        for (let i = 1; i < args.length; i += 2) {
          const key = args[i].replace('--', '');
          const value = args[i + 1];
          if (value && value !== 'undefined') {
            listOptions[key] = value;
          }
        }
        await script.listFiles(listOptions);
        break;

      case 'create-folder':
        const folderName = args[1];
        const parentId = args[2];
        if (!folderName) {
          throw new Error('Nombre de carpeta requerido');
        }
        await script.createFolder(folderName, parentId);
        break;

      case 'get':
        const fileId = args[1];
        if (!fileId) {
          throw new Error('ID de archivo requerido');
        }
        await script.getFile(fileId);
        break;

      case 'share':
        const shareFileId = args[1];
        const email = args[2];
        const role = args[3] || 'reader';
        if (!shareFileId || !email) {
          throw new Error('ID de archivo y email requeridos');
        }
        await script.shareFile(shareFileId, email, role);
        break;

      case 'delete':
        const deleteFileId = args[1];
        if (!deleteFileId) {
          throw new Error('ID de archivo requerido');
        }
        await script.deleteFile(deleteFileId);
        break;

      default:
        console.log('Uso: node google-drive-script.js <action> [options]');
        console.log('Acciones disponibles:');
        console.log('  list --pageSize 10 --query "name contains \'test\'" --folderId <id>');
        console.log('  create-folder <name> [parentId]');
        console.log('  get <fileId>');
        console.log('  share <fileId> <email> [role]');
        console.log('  delete <fileId>');
        process.exit(1);
    }
  } catch (error) {
    script.handleError(error, 'Main');
  }
}

if (require.main === module) {
  main();
}

module.exports = GoogleDriveScript;
