/**
 * Configuración de ejemplo para Google APIs
 * Copia este archivo como google-apis.ts y configura tus API keys
 */

export const GOOGLE_APIS_CONFIG = {
  // APIs Geográficas
  MAPS_JAVASCRIPT_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  MAPS_EMBED_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_EMBED_API_KEY || '',
  GEOCODING_API_KEY: process.env.REACT_APP_GOOGLE_GEOCODING_API_KEY || '',
  
  // APIs de Productividad
  DRIVE_API_KEY: process.env.REACT_APP_GOOGLE_DRIVE_API_KEY || '',
  CALENDAR_API_KEY: process.env.REACT_APP_GOOGLE_CALENDAR_API_KEY || '',
  
  // APIs de Comunicación
  GMAIL_API_KEY: process.env.REACT_APP_GOOGLE_GMAIL_API_KEY || '',
  CHAT_API_KEY: process.env.REACT_APP_GOOGLE_CHAT_API_KEY || '',
  CLOUD_MESSAGING_API_KEY: process.env.REACT_APP_GOOGLE_FCM_API_KEY || '',
  
  // Configuraciones por defecto
  DEFAULT_MAP_CENTER: {
    lat: 40.4168, // Madrid
    lng: -3.7038
  },
  DEFAULT_MAP_ZOOM: 10,
};

export default GOOGLE_APIS_CONFIG;