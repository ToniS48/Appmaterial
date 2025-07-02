/**
 * Servicio de Google APIs que consume Firebase Functions
 * 
 * Este servicio reemplaza la implementación mock y proporciona
 * acceso real a Google APIs a través de endpoints seguros del backend.
 */

import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '../../config/firebase';

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
   * Realizar petición HTTP a Firebase Functions
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      
      const config: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        config.body = JSON.stringify(data);
      }

      let url = `${this.baseUrl}/${endpoint}`;
      
      if (method === 'GET' && data) {
        // Filtrar parámetros undefined/null antes de crear la URL
        const filteredData: Record<string, string> = {};
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            filteredData[key] = String(value);
          }
        });
        
        if (Object.keys(filteredData).length > 0) {
          url += `?${new URLSearchParams(filteredData).toString()}`;
        }
      }

      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error de red' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`Error en ${endpoint}:`, error);
      return {
        success: false,
        error: error.message || 'Error desconocido',
      };
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
    const response = await this.makeRequest<CalendarEvent[]>('google/calendar/events', 'GET', {
      calendarId: options.calendarId || 'primary',
      timeMin: options.timeMin,
      timeMax: options.timeMax,
      maxResults: options.maxResults || 10,
    });

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Error obteniendo eventos de calendario:', response.error);
    return [];
  }

  async createEvent(eventData: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    location?: string;
    attendees?: Array<{ email: string }>;
  }, calendarId: string = 'primary'): Promise<CalendarEvent | null> {
    const response = await this.makeRequest<CalendarEvent>('google/calendar/events', 'POST', {
      calendarId,
      eventData,
    });

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Error creando evento de calendario:', response.error);
    return null;
  }

  async updateEvent(
    eventId: string, 
    eventData: Partial<CalendarEvent>, 
    calendarId: string = 'primary'
  ): Promise<CalendarEvent | null> {
    const response = await this.makeRequest<CalendarEvent>('google/calendar/events', 'PUT', {
      calendarId,
      eventId,
      eventData,
    });

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Error actualizando evento de calendario:', response.error);
    return null;
  }

  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<boolean> {
    const response = await this.makeRequest('google/calendar/events', 'DELETE', {
      calendarId,
      eventId,
    });

    if (response.success) {
      return true;
    }

    console.error('Error eliminando evento de calendario:', response.error);
    return false;
  }

  async getCalendars(): Promise<CalendarListEntry[]> {
    const response = await this.makeRequest<CalendarListEntry[]>('google/calendar/calendars', 'GET');

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Error obteniendo calendarios:', response.error);
    return [];
  }

  /**
   * DRIVE API METHODS
   */

  async listFiles(query?: string, pageSize: number = 10): Promise<DriveFile[]> {
    const response = await this.makeRequest<DriveFile[]>('google/drive/files', 'GET', {
      query,
      pageSize,
    });

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Error listando archivos de Drive:', response.error);
    return [];
  }

  async createFolder(name: string, parentId?: string): Promise<DriveFolder | null> {
    const response = await this.makeRequest<DriveFolder>('google/drive/folders', 'POST', {
      name,
      parentId,
    });

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Error creando carpeta en Drive:', response.error);
    return null;
  }

  async uploadFile(
    name: string, 
    content: string, 
    mimeType: string, 
    parentId?: string
  ): Promise<DriveFile | null> {
    const response = await this.makeRequest<DriveFile>('google/drive/files', 'POST', {
      name,
      content,
      mimeType,
      parentId,
    });

    if (response.success && response.data) {
      return response.data;
    }

    console.error('Error subiendo archivo a Drive:', response.error);
    return null;
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const response = await this.makeRequest('google/drive/files', 'DELETE', {
      fileId,
    });

    if (response.success) {
      return true;
    }

    console.error('Error eliminando archivo de Drive:', response.error);
    return false;
  }

  async shareFile(fileId: string, email: string, role: 'reader' | 'writer' | 'owner' = 'reader'): Promise<boolean> {
    const response = await this.makeRequest('google/drive/share', 'POST', {
      fileId,
      email,
      role,
    });

    if (response.success) {
      return true;
    }

    console.error('Error compartiendo archivo de Drive:', response.error);
    return false;
  }

  /**
   * HEALTH CHECK
   */
  async healthCheck(): Promise<{ success: boolean; message?: string; error?: string }> {
    const response = await this.makeRequest('verification/health', 'GET');
    return response;
  }
}

// Instancia única del servicio
export const googleApiFunctionsService = new GoogleApiFunctionsService();

// Exportar clase para testing
export { GoogleApiFunctionsService };
