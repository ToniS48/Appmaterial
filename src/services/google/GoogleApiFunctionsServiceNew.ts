/**
 * Servicio de Google APIs que ejecuta scripts Node.js
 * 
 * Este servicio reemplaza la implementación del servidor Express
 * y utiliza scripts Node.js ejecutados a través de un servidor simplificado.
 */

import { auth } from '../../config/firebase';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

export interface CalendarListEntry {
  id: string;
  summary: string;
  description?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  parents?: string[];
}

export interface DriveFolder {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  parents?: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class GoogleApiFunctionsService {
  private baseUrl: string;

  constructor() {
    // URL base del servidor de scripts Node.js
    this.baseUrl = 'http://localhost:3001/api';
  }

  /**
   * Obtener token de autenticación del usuario actual
   */
  private async getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error obteniendo token de autenticación:', error);
      throw new Error('Error de autenticación');
    }
  }

  /**
   * Ejecutar script Node.js a través del servidor
   */
  private async executeScript(scriptName: string, args: string[] = []): Promise<ApiResponse<any>> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${this.baseUrl}/execute-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          script: scriptName,
          args: args
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de red' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`Error ejecutando script ${scriptName}:`, error);
      return {
        success: false,
        error: error.message || 'Error desconocido',
      };
    }
  }

  /**
   * Health check usando script
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/verification/health`);
      return await response.json();
    } catch (error) {
      // Fallback al script si el endpoint simple falla
      const response = await this.executeScript('google-verification-script.js', ['health']);
      
      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || 'Error en health check');
    }
  }

  /**
   * CALENDAR API METHODS
   */

  async getEvents(options: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  } = {}): Promise<CalendarEvent[]> {
    const args = ['events'];
    
    if (options.calendarId) {
      args.push('--calendarId', options.calendarId);
    }
    if (options.timeMin) {
      args.push('--timeMin', options.timeMin);
    }
    if (options.timeMax) {
      args.push('--timeMax', options.timeMax);
    }
    if (options.maxResults) {
      args.push('--maxResults', options.maxResults.toString());
    }

    const response = await this.executeScript('google-calendar-script.js', args);

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Error obteniendo eventos del calendario:', response.error);
    return [];
  }

  async createEvent(eventData: {
    calendarId?: string;
    summary: string;
    description?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    location?: string;
    attendees?: Array<{ email: string }>;
  }): Promise<CalendarEvent | null> {
    const args = ['create', JSON.stringify(eventData)];

    const response = await this.executeScript('google-calendar-script.js', args);

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Error creando evento:', response.error);
    return null;
  }

  async listCalendars(): Promise<CalendarListEntry[]> {
    const response = await this.executeScript('google-calendar-script.js', ['calendars']);

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Error listando calendarios:', response.error);
    return [];
  }

  /**
   * DRIVE API METHODS
   */

  async listFiles(query?: string, pageSize: number = 10): Promise<DriveFile[]> {
    const args = ['list'];
    
    if (query) {
      args.push('--query', query);
    }
    
    args.push('--pageSize', pageSize.toString());

    const response = await this.executeScript('google-drive-script.js', args);

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Error listando archivos de Drive:', response.error);
    return [];
  }

  async createFolder(name: string, parentId?: string): Promise<DriveFolder | null> {
    const args = ['create-folder', name];
    
    if (parentId) {
      args.push(parentId);
    }

    const response = await this.executeScript('google-drive-script.js', args);

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Error creando carpeta:', response.error);
    return null;
  }

  async getFile(fileId: string): Promise<DriveFile | null> {
    const response = await this.executeScript('google-drive-script.js', ['get', fileId]);

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Error obteniendo archivo:', response.error);
    return null;
  }

  async shareFile(fileId: string, email: string, role: string = 'reader'): Promise<boolean> {
    const response = await this.executeScript('google-drive-script.js', ['share', fileId, email, role]);

    if (response.success) {
      return true;
    }

    console.error('Error compartiendo archivo:', response.error);
    return false;
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const response = await this.executeScript('google-drive-script.js', ['delete', fileId]);

    if (response.success) {
      return true;
    }

    console.error('Error eliminando archivo:', response.error);
    return false;
  }
}

// Crear instancia única
export const googleApiFunctionsService = new GoogleApiFunctionsService();
export default GoogleApiFunctionsService;
