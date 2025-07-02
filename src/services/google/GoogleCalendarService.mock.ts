/**
 * Mock temporal de GoogleCalendarService
 * Este archivo reemplaza temporalmente la implementación real de Google Calendar API
 * hasta que se implemente la solución backend con Firebase Functions
 */

import { GoogleBaseService, GoogleAuthConfig } from './GoogleBaseService.mock';

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

export class GoogleCalendarService extends GoogleBaseService {
  constructor(config: GoogleAuthConfig) {
    super(config);
    console.warn('GoogleCalendarService: Usando mock temporal. Calendar API deshabilitada.');
  }

  async getCalendars(): Promise<CalendarListEntry[]> {
    console.warn('GoogleCalendarService: getCalendars() - mock temporal, retornando array vacío');
    return [];
  }

  async getEvents(options: { timeMin?: string; timeMax?: string; maxResults?: number; calendarId?: string } = {}): Promise<CalendarEvent[]> {
    console.warn('GoogleCalendarService: getEvents() - mock temporal, retornando array vacío');
    console.warn('GoogleCalendarService: getEvents() llamado con opciones:', options);
    return [];
  }

  async createEvent(calendarId: string = 'primary', event: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    console.warn('GoogleCalendarService: createEvent() - mock temporal, retornando null');
    return null;
  }

  async updateEvent(calendarId: string = 'primary', eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    console.warn('GoogleCalendarService: updateEvent() - mock temporal, retornando null');
    return null;
  }

  async deleteEvent(calendarId: string = 'primary', eventId: string): Promise<boolean> {
    console.warn('GoogleCalendarService: deleteEvent() - mock temporal, retornando false');
    return false;
  }
}
