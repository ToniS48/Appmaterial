/**
 * Servicios de Google APIs - Con Scripts Node.js
 * 
 * Implementación que ejecuta scripts Node.js independientes para acceso seguro a Google APIs.
 * Los servicios mock siguen disponibles como fallback.
 */

// Exportar servicio principal con scripts Node.js
export { 
  googleApiFunctionsService
} from './GoogleApiFunctionsService';

export { default as GoogleApiFunctionsService } from './GoogleApiFunctionsService';

// Exportar servicios mock como fallback
export { GoogleBaseService } from './GoogleBaseService.mock';
export { GoogleCalendarService } from './GoogleCalendarService.mock';
export { GoogleDriveService } from './GoogleDriveService.mock';

// Re-exportar hooks
export { 
  useGoogleServices, 
  checkGoogleServicesConfiguration,
  checkGoogleServicesConfigurationAsync
} from './useGoogleServices';

export { useGoogleApiFunctions } from './useGoogleApiFunctions';

// Re-exportar tipos que siguen siendo válidos
export type { 
  GoogleAuthConfig, 
  GoogleApiAuth 
} from './GoogleBaseService.mock';

export type { 
  CalendarEvent, 
  CalendarListEntry 
} from './GoogleCalendarService.mock';

export type { 
  DriveFile, 
  DriveFolder 
} from './GoogleDriveService.mock';

// Tipos y interfaces comunes
export interface GoogleServiceConfig {
  projectId: string;
  clubEmail: string;
  clubName: string;
  driveFolder?: string;
  calendarId?: string;
  spreadsheetId?: string;
}

export interface MaterialLoanEvent {
  materialName: string;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  description?: string;
  location?: string;
}

export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
}
