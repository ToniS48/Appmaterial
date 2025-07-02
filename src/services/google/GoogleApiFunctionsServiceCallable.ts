/**
 * Servicio de Google APIs que consume Firebase Functions Callable
 * 
 * Este servicio usa Firebase Functions callable para acceso seguro a Google APIs.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';

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

/**
 * Servicio de Google APIs usando Firebase Callable Functions
 */
class GoogleApiFunctionsService {
  private healthCheckFunc = httpsCallable(functions, 'googleApisHealthCheck');
  private getCalendarEventsFunc = httpsCallable(functions, 'getCalendarEvents');
  private listDriveFilesFunc = httpsCallable(functions, 'listDriveFiles');

  /**
   * Health check del servicio
   */
  async healthCheck(): Promise<any> {
    try {
      console.log('🔍 Verificando estado del servicio Google APIs...');
      const result = await this.healthCheckFunc();
      console.log('✅ Health check exitoso:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error en health check:', error);
      
      // Si las funciones no están disponibles, retornar mock data
      if (error instanceof Error && error.message.includes('Function not found')) {
        console.log('⚠️ Funciones no disponibles, usando modo mock local');
        return {
          success: true,
          status: 'mock',
          service: 'Google APIs Functions (Local Mock)',
          timestamp: new Date().toISOString(),
          environment: {
            nodeVersion: 'browser',
            hasGoogleProjectId: false,
            hasGoogleClientEmail: false,
            hasGooglePrivateKey: false,
            mode: 'local-mock'
          },
          note: 'Firebase Functions no está disponible, usando datos mock locales'
        };
      }
      
      throw error;
    }
  }

  // ================================
  // GOOGLE CALENDAR METHODS
  // ================================

  /**
   * Obtener eventos del calendario
   */
  async getCalendarEvents(
    calendarId: string = 'primary',
    startDate?: Date,
    endDate?: Date
  ): Promise<CalendarEvent[]> {
    try {
      console.log('🗓️ Obteniendo eventos del calendario...', { calendarId, startDate, endDate });
      
      const result = await this.getCalendarEventsFunc({
        calendarId,
        timeMin: startDate?.toISOString(),
        timeMax: endDate?.toISOString()
      });

      const data = result.data as any;
      
      if (!data.success) {
        throw new Error(data.message || 'Error obteniendo eventos');
      }

      console.log('✅ Eventos obtenidos:', data.events?.length || 0);
      return data.events || [];
    } catch (error) {
      console.error('❌ Error obteniendo eventos del calendario:', error);
      
      // Fallback a datos mock locales
      if (error instanceof Error && error.message.includes('Function not found')) {
        console.log('⚠️ Usando datos mock locales para eventos del calendario');
        return [
          {
            id: 'local-mock-event-1',
            summary: 'Evento Mock Local - Revisión de materiales',
            start: { dateTime: new Date().toISOString() },
            end: { dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
            description: 'Evento de prueba generado localmente (funciones no disponibles)'
          },
          {
            id: 'local-mock-event-2',
            summary: 'Evento Mock Local - Planificación',
            start: { dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() },
            end: { dateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString() },
            description: 'Evento de planificación mock local'
          }
        ];
      }
      
      throw error;
    }
  }

  /**
   * Crear evento en el calendario
   */
  async createCalendarEvent(
    calendarId: string,
    eventData: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    try {
      console.log('📅 Creando evento del calendario...', eventData);
      
      // Por ahora mock - será implementado después
      const mockEvent: CalendarEvent = {
        id: `mock-${Date.now()}`,
        summary: eventData.summary || 'Nuevo evento',
        start: eventData.start || { dateTime: new Date().toISOString() },
        end: eventData.end || { dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() },
        description: eventData.description
      };

      console.log('✅ Evento creado (mock):', mockEvent.id);
      return mockEvent;
    } catch (error) {
      console.error('❌ Error creando evento:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de calendarios
   */
  async getCalendars(): Promise<CalendarListEntry[]> {
    try {
      console.log('📋 Obteniendo lista de calendarios...');
      
      // Mock data por ahora
      const mockCalendars: CalendarListEntry[] = [
        {
          id: 'primary',
          summary: 'Calendario Principal',
          backgroundColor: '#039BE5'
        },
        {
          id: 'materiales@fichamaterial.com',
          summary: 'Calendario de Materiales',
          backgroundColor: '#D50000'
        }
      ];

      console.log('✅ Calendarios obtenidos:', mockCalendars.length);
      return mockCalendars;
    } catch (error) {
      console.error('❌ Error obteniendo calendarios:', error);
      throw error;
    }
  }

  // ================================
  // GOOGLE DRIVE METHODS
  // ================================

  /**
   * Listar archivos de Drive
   */
  async listDriveFiles(
    folderId?: string,
    query?: string
  ): Promise<DriveFile[]> {
    try {
      console.log('📁 Listando archivos de Drive...', { folderId, query });
      
      const result = await this.listDriveFilesFunc({
        folderId,
        query
      });

      const data = result.data as any;
      
      if (!data.success) {
        throw new Error(data.message || 'Error listando archivos');
      }

      console.log('✅ Archivos obtenidos:', data.files?.length || 0);
      return data.files || [];
    } catch (error) {
      console.error('❌ Error listando archivos de Drive:', error);
      
      // Fallback a datos mock locales
      if (error instanceof Error && error.message.includes('Function not found')) {
        console.log('⚠️ Usando datos mock locales para archivos de Drive');
        return [
          {
            id: 'local-mock-file-1',
            name: 'Mock Local - Reporte Materiales.pdf',
            mimeType: 'application/pdf',
            size: '1024000',
            modifiedTime: new Date().toISOString(),
            webViewLink: 'https://drive.google.com/local-mock-file-1'
          },
          {
            id: 'local-mock-file-2',
            name: 'Mock Local - Inventario.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: '512000',
            modifiedTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            webViewLink: 'https://drive.google.com/local-mock-file-2'
          }
        ];
      }
      
      throw error;
    }
  }

  /**
   * Crear carpeta en Drive
   */
  async createDriveFolder(
    name: string,
    parentId?: string
  ): Promise<DriveFile> {
    try {
      console.log('📁 Creando carpeta en Drive...', { name, parentId });
      
      // Mock por ahora
      const mockFolder: DriveFile = {
        id: `folder-${Date.now()}`,
        name,
        mimeType: 'application/vnd.google-apps.folder',
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        webViewLink: `https://drive.google.com/drive/folders/folder-${Date.now()}`
      };

      console.log('✅ Carpeta creada (mock):', mockFolder.id);
      return mockFolder;
    } catch (error) {
      console.error('❌ Error creando carpeta:', error);
      throw error;
    }
  }

  /**
   * Subir archivo a Drive
   */
  async uploadDriveFile(
    file: File,
    parentId?: string,
    name?: string
  ): Promise<DriveFile> {
    try {
      console.log('⬆️ Subiendo archivo a Drive...', { fileName: file.name, size: file.size, parentId });
      
      // Mock por ahora
      const mockFile: DriveFile = {
        id: `file-${Date.now()}`,
        name: name || file.name,
        mimeType: file.type,
        size: file.size.toString(),
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        webViewLink: `https://drive.google.com/file/d/file-${Date.now()}/view`
      };

      console.log('✅ Archivo subido (mock):', mockFile.id);
      return mockFile;
    } catch (error) {
      console.error('❌ Error subiendo archivo:', error);
      throw error;
    }
  }

  /**
   * Métodos adicionales con implementación mock temporal
   */
  async updateCalendarEvent(calendarId: string, eventId: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
    console.log('✏️ Actualizando evento (mock)...', { eventId, eventData });
    return this.createCalendarEvent(calendarId, { ...eventData, id: eventId });
  }

  async deleteCalendarEvent(calendarId: string, eventId: string): Promise<boolean> {
    console.log('🗑️ Eliminando evento (mock)...', { calendarId, eventId });
    return true;
  }

  async deleteDriveFile(fileId: string): Promise<boolean> {
    console.log('🗑️ Eliminando archivo (mock)...', { fileId });
    return true;
  }

  async shareDriveFile(fileId: string, email: string, role: 'reader' | 'writer' | 'commenter' = 'reader'): Promise<boolean> {
    console.log('🔗 Compartiendo archivo (mock)...', { fileId, email, role });
    return true;
  }
}

// Exportar instancia singleton
export const googleApiFunctionsService = new GoogleApiFunctionsService();

// Exportar clase para testing
export { GoogleApiFunctionsService };
