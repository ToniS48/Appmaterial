/**
 * Tipos para Google APIs
 */

declare global {
  interface Window {
    google?: {
      maps: {
        Map: any;
        Marker: any;
        InfoWindow: any;
        LatLng: any;
        event: any;
        places: any;
        geometry: any;
      };
    };
    gapi?: {
      load: (libraries: string, callback: () => void) => void;
      client: {
        init: (config: any) => Promise<void>;
        calendar: {
          events: {
            insert: (params: any) => { execute: () => Promise<any> };
          };
        };
      };
      auth2: {
        getAuthInstance: () => any;
      };
    };
  }
}

export interface GoogleMapsOptions {
  zoom?: number;
  center?: { lat: number; lng: number };
  mapTypeId?: string;
  disableDefaultUI?: boolean;
  zoomControl?: boolean;
  mapTypeControl?: boolean;
  scaleControl?: boolean;
  streetViewControl?: boolean;
  rotateControl?: boolean;
  fullscreenControl?: boolean;
}

export interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{ email: string }>;
}

export {};