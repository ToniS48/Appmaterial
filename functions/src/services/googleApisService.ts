/**
 * Google APIs Service para Firebase Functions
 * 
 * Este servicio maneja la autenticación con Service Account de forma segura
 * en el backend y proporciona endpoints REST para el frontend.
 */

import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

export interface GoogleServiceConfig {
  projectId: string;
  serviceAccountEmail: string;
  privateKey: string;
  scopes: string[];
}

export class GoogleApisService {
  private auth: GoogleAuth;
  private calendar: any;
  private drive: any;

  constructor(config: GoogleServiceConfig) {
    // Configurar autenticación con Service Account
    this.auth = new google.auth.GoogleAuth({
      projectId: config.projectId,
      credentials: {
        client_email: config.serviceAccountEmail,
        private_key: config.privateKey.replace(/\\n/g, '\n'),
      },
      scopes: config.scopes,
    });

    // Inicializar servicios
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  /**
   * CALENDAR API METHODS
   */

  async getCalendarEvents(calendarId: string = 'primary', options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  } = {}) {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: options.timeMin || new Date().toISOString(),
        timeMax: options.timeMax,
        maxResults: options.maxResults || 10,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return {
        success: true,
        data: response.data.items || [],
      };
    } catch (error: any) {
      console.error('Error getting calendar events:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createCalendarEvent(calendarId: string = 'primary', eventData: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    location?: string;
    attendees?: Array<{ email: string }>;
  }) {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: eventData,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error creating calendar event:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async updateCalendarEvent(calendarId: string = 'primary', eventId: string, eventData: any) {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: eventData,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error updating calendar event:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deleteCalendarEvent(calendarId: string = 'primary', eventId: string) {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Error deleting calendar event:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getCalendars() {
    try {
      const response = await this.calendar.calendarList.list();

      return {
        success: true,
        data: response.data.items || [],
      };
    } catch (error: any) {
      console.error('Error getting calendars:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * DRIVE API METHODS
   */

  async listDriveFiles(query?: string, pageSize: number = 10) {
    try {
      const response = await this.drive.files.list({
        q: query,
        pageSize,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, parents)',
      });

      return {
        success: true,
        data: response.data.files || [],
      };
    } catch (error: any) {
      console.error('Error listing drive files:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createDriveFolder(name: string, parentId?: string) {
    try {
      const fileMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentId && { parents: [parentId] }),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id, name, webViewLink',
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error creating drive folder:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async uploadDriveFile(name: string, content: string, mimeType: string, parentId?: string) {
    try {
      const fileMetadata = {
        name,
        ...(parentId && { parents: [parentId] }),
      };

      const media = {
        mimeType,
        body: content,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name, webViewLink, webContentLink',
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error uploading drive file:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deleteDriveFile(fileId: string) {
    try {
      await this.drive.files.delete({
        fileId,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Error deleting drive file:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async shareDriveFile(fileId: string, email: string, role: 'reader' | 'writer' | 'owner' = 'reader') {
    try {
      const permission = {
        type: 'user',
        role,
        emailAddress: email,
      };

      await this.drive.permissions.create({
        fileId,
        requestBody: permission,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Error sharing drive file:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
