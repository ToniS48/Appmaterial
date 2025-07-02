/**
 * Hook para Google APIs usando Firebase Functions
 * 
 * Este hook reemplaza la implementación mock y proporciona
 * acceso real a Google APIs a través del backend seguro.
 */

import { useState, useEffect } from 'react';
import { googleApiFunctionsService, CalendarEvent, DriveFile } from './GoogleApiFunctionsServiceCallable';
import { auth } from '../../config/firebase';

export interface UseGoogleApiFunctionsReturn {
  // Estado
  isAuthenticated: boolean;
  isInitialized: boolean;
  isConfigured: boolean;
  authStatus: 'loading' | 'authenticated' | 'error';
  error: string | null;
  
  // Servicios
  calendarService: typeof googleApiFunctionsService | null;
  driveService: typeof googleApiFunctionsService | null;
  
  // Métodos de utilidad
  reinitialize: () => Promise<boolean>;
  healthCheck: () => Promise<{ success: boolean; message?: string; error?: string }>;
  
  // Métodos de Calendar
  getCalendarEvents: (options?: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }) => Promise<CalendarEvent[]>;
  
  createCalendarEvent: (eventData: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    location?: string;
    attendees?: Array<{ email: string }>;
  }, calendarId?: string) => Promise<CalendarEvent | null>;
  
  // Métodos de Drive
  listDriveFiles: (query?: string, pageSize?: number) => Promise<DriveFile[]>;
  createDriveFolder: (name: string, parentId?: string) => Promise<any>;
  uploadDriveFile: (file: File, parentId?: string, name?: string) => Promise<DriveFile | null>;
}

export const useGoogleApiFunctions = (): UseGoogleApiFunctionsReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthenticated(true);
        setAuthStatus('authenticated');
        setError(null);
        console.log('Google API Functions: Usuario autenticado');
      } else {
        setIsAuthenticated(false);
        setAuthStatus('error');
        setError('Usuario no autenticado');
        console.log('Google API Functions: Usuario no autenticado');
      }
      setIsInitialized(true);
    });

    return unsubscribe;
  }, []);

  const reinitialize = async (): Promise<boolean> => {
    try {
      setAuthStatus('loading');
      const user = auth.currentUser;
      
      if (user) {
        setIsAuthenticated(true);
        setAuthStatus('authenticated');
        setError(null);
        return true;
      } else {
        setIsAuthenticated(false);
        setAuthStatus('error');
        setError('Usuario no autenticado');
        return false;
      }
    } catch (err: any) {
      setAuthStatus('error');
      setError(err.message);
      return false;
    }
  };

  const healthCheck = async () => {
    if (!isAuthenticated) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    return await googleApiFunctionsService.healthCheck();
  };

  // Métodos de Calendar
  const getCalendarEvents = async (options?: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }): Promise<CalendarEvent[]> => {
    if (!isAuthenticated) {
      console.warn('getCalendarEvents: Usuario no autenticado');
      return [];
    }

    return await googleApiFunctionsService.getCalendarEvents(
      options?.calendarId || 'primary',
      options?.timeMin ? new Date(options.timeMin) : undefined,
      options?.timeMax ? new Date(options.timeMax) : undefined
    );
  };

  const createCalendarEvent = async (eventData: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    location?: string;
    attendees?: Array<{ email: string }>;
  }, calendarId: string = 'primary'): Promise<CalendarEvent | null> => {
    if (!isAuthenticated) {
      console.warn('createCalendarEvent: Usuario no autenticado');
      return null;
    }

    return await googleApiFunctionsService.createCalendarEvent(calendarId, eventData);
  };

  // Métodos de Drive
  const listDriveFiles = async (query?: string, pageSize?: number): Promise<DriveFile[]> => {
    if (!isAuthenticated) {
      console.warn('listDriveFiles: Usuario no autenticado');
      return [];
    }

    // Adaptamos los parámetros para la interfaz del servicio
    return await googleApiFunctionsService.listDriveFiles(undefined, query);
  };

  const createDriveFolder = async (name: string, parentId?: string) => {
    if (!isAuthenticated) {
      console.warn('createDriveFolder: Usuario no autenticado');
      return null;
    }

    return await googleApiFunctionsService.createDriveFolder(name, parentId);
  };

  const uploadDriveFile = async (
    file: File, 
    parentId?: string,
    name?: string
  ): Promise<DriveFile | null> => {
    if (!isAuthenticated) {
      console.warn('uploadDriveFile: Usuario no autenticado');
      return null;
    }

    return await googleApiFunctionsService.uploadDriveFile(file, parentId, name);
  };

  return {
    // Estado
    isAuthenticated,
    isInitialized,
    isConfigured: isAuthenticated, // Consideramos configurado si está autenticado
    authStatus,
    error,
    
    // Servicios (para compatibilidad con interfaz anterior)
    calendarService: isAuthenticated ? googleApiFunctionsService : null,
    driveService: isAuthenticated ? googleApiFunctionsService : null,
    
    // Métodos
    reinitialize,
    healthCheck,
    
    // Métodos específicos
    getCalendarEvents,
    createCalendarEvent,
    listDriveFiles,
    createDriveFolder,
    uploadDriveFile,
  };
};
