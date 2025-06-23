import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface DriveConfig {
  googleDriveUrl: string;
  googleDriveTopoFolder: string;
  googleDriveDocFolder: string;
}

interface WeatherConfig {
  enabled: boolean;
  defaultLocation: {
    lat: number;
    lon: number;
    name: string;
  };
  temperatureUnit: 'celsius' | 'fahrenheit';
  windSpeedUnit: 'kmh' | 'ms' | 'mph';
  precipitationUnit: 'mm' | 'inch';
  aemet: {
    enabled: boolean;
    apiKey: string;
    useForSpain: boolean;
  };
}

interface ConfiguracionGlobal {
  googleDriveUrl: string;
  googleDriveTopoFolder: string;
  googleDriveDocFolder: string;
  weather?: WeatherConfig;
}

// Tipado para las API Keys de Google
export interface GoogleApisConfig {
  driveApiKey: string;
  mapsEmbedApiKey: string;
  calendarApiKey: string;
  gmailApiKey: string;
  chatApiKey: string;
  cloudMessagingApiKey: string;
}

const defaultConfig: ConfiguracionGlobal = {
  googleDriveUrl: '',
  googleDriveTopoFolder: '',
  googleDriveDocFolder: '',  weather: {
    enabled: false,
    defaultLocation: {
      lat: 40.618828,
      lon: -0.099803,
      name: 'Morella, España'
    },
    temperatureUnit: 'celsius',
    windSpeedUnit: 'kmh',
    precipitationUnit: 'mm',
    aemet: {
      enabled: false,
      apiKey: '',
      useForSpain: true
    }
  }
};

const defaultGoogleApisConfig: GoogleApisConfig = {
  driveApiKey: '',
  mapsEmbedApiKey: '',
  calendarApiKey: '',
  gmailApiKey: '',
  chatApiKey: '',
  cloudMessagingApiKey: ''
};

export const obtenerConfiguracion = async (): Promise<ConfiguracionGlobal> => {
  try {
    const docRef = doc(db, "configuracion", "global");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        googleDriveUrl: data.googleDriveUrl || '',
        googleDriveTopoFolder: data.googleDriveTopoFolder || '',
        googleDriveDocFolder: data.googleDriveDocFolder || '',        weather: {
          enabled: data.weather?.enabled || false,
          defaultLocation: {
            lat: data.weather?.defaultLocation?.lat || 40.618828,
            lon: data.weather?.defaultLocation?.lon || -0.099803,
            name: data.weather?.defaultLocation?.name || 'Morella, España'
          },
          temperatureUnit: data.weather?.temperatureUnit || 'celsius',
          windSpeedUnit: data.weather?.windSpeedUnit || 'kmh',
          precipitationUnit: data.weather?.precipitationUnit || 'mm',
          aemet: {
            enabled: data.weather?.aemet?.enabled || false,
            apiKey: data.weather?.aemet?.apiKey || '',
            useForSpain: data.weather?.aemet?.useForSpain ?? true
          }
        }
      };
    }
    
    return defaultConfig;
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    return defaultConfig;
  }
};

export const obtenerConfiguracionDrive = async (): Promise<string> => {
  try {
    const config = await obtenerConfiguracion();
    return config.googleDriveUrl;
  } catch (error) {
    console.error("Error al obtener configuración de Drive:", error);
    return '';
  }
};

/**
 * Actualiza la configuración meteorológica
 */
export const actualizarConfiguracionMeteorologica = async (weatherConfig: WeatherConfig): Promise<void> => {
  try {
    const docRef = doc(db, "configuracion", "global");
    
    // Obtener configuración actual
    const currentConfig = await obtenerConfiguracion();
    
    // Actualizar solo la configuración meteorológica
    const updatedConfig = {
      ...currentConfig,
      weather: weatherConfig
    };
    
    await setDoc(docRef, updatedConfig, { merge: true });
  } catch (error) {
    console.error("Error al actualizar configuración meteorológica:", error);
    throw new Error("No se pudo guardar la configuración meteorológica");
  }
};

/**
 * Obtiene solo la configuración meteorológica
 */
export const obtenerConfiguracionMeteorologica = async (): Promise<WeatherConfig> => {
  try {
    const config = await obtenerConfiguracion();
    return config.weather || defaultConfig.weather!;
  } catch (error) {
    console.error("Error al obtener configuración meteorológica:", error);
    return defaultConfig.weather!;
  }
};

/**
 * Actualiza la configuración global (incluyendo apis)
 */
export const guardarConfiguracionGlobal = async (config: ConfiguracionGlobal): Promise<void> => {
  try {
    const docRef = doc(db, 'configuracion', 'global');
    await setDoc(docRef, config, { merge: true });
  } catch (error) {
    console.error('Error al guardar configuración global:', error);
    throw new Error('No se pudo guardar la configuración global');
  }
};

/**
 * Obtiene la sección de apis (GoogleApisConfig) desde el documento global
 */
export const obtenerGoogleApisConfig = async (): Promise<GoogleApisConfig> => {
  try {
    const docRef = doc(db, 'configuracion', 'global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        driveApiKey: data.apis?.driveApiKey || '',
        mapsEmbedApiKey: data.apis?.mapsEmbedApiKey || '',
        calendarApiKey: data.apis?.calendarApiKey || '',
        gmailApiKey: data.apis?.gmailApiKey || '',
        chatApiKey: data.apis?.chatApiKey || '',
        cloudMessagingApiKey: data.apis?.cloudMessagingApiKey || ''
      };
    }
    return defaultGoogleApisConfig;
  } catch (error) {
    console.error('Error al obtener Google APIs config:', error);
    return defaultGoogleApisConfig;
  }
};

/**
 * Guarda la sección de apis (GoogleApisConfig) dentro del documento global y actualiza el resto de valores
 */
export const guardarGoogleApisConfig = async (apisConfig: GoogleApisConfig): Promise<void> => {
  try {
    const docRef = doc(db, 'configuracion', 'global');
    const docSnap = await getDoc(docRef);
    let currentConfig = docSnap.exists() ? docSnap.data() : {};
    // Actualizar solo la sección apis
    const updatedConfig = {
      ...currentConfig,
      apis: apisConfig
    };
    await setDoc(docRef, updatedConfig, { merge: true });
  } catch (error) {
    console.error('Error al guardar Google APIs config:', error);
    throw new Error('No se pudo guardar la configuración de APIs de Google');
  }
};

// NUEVA ORGANIZACIÓN DE CONFIGURACIÓN POR SECCIÓN
// Cada función accede a un documento diferente en la colección 'configuracion'

// General (variables generales, material, etc.)
export const obtenerConfiguracionGeneral = async (): Promise<any> => {
  try {
    const docRef = doc(db, 'configuracion', 'general');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    // Devuelve valores por defecto si no existe
    return {};
  } catch (error) {
    console.error('Error al obtener configuración general:', error);
    return {};
  }
};

export const guardarConfiguracionGeneral = async (data: any): Promise<void> => {
  try {
    const docRef = doc(db, 'configuracion', 'general');
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error('Error al guardar configuración general:', error);
  }
};

// APIs (API keys, servicios externos)
export const obtenerConfiguracionApis = async (): Promise<any> => {
  try {
    const docRef = doc(db, 'configuracion', 'apis');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {};
  } catch (error) {
    console.error('Error al obtener configuración de APIs:', error);
    return {};
  }
};

export const guardarConfiguracionApis = async (data: any): Promise<void> => {
  try {
    const docRef = doc(db, 'configuracion', 'apis');
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error('Error al guardar configuración de APIs:', error);
  }
};

// Weather (configuración meteorológica)
export const obtenerConfiguracionWeather = async (): Promise<any> => {
  try {
    const docRef = doc(db, 'configuracion', 'weather');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {};
  } catch (error) {
    console.error('Error al obtener configuración meteorológica:', error);
    return {};
  }
};

export const guardarConfiguracionWeather = async (data: any): Promise<void> => {
  try {
    const docRef = doc(db, 'configuracion', 'weather');
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error('Error al guardar configuración meteorológica:', error);
  }
};

// Security (seguridad)
export const obtenerConfiguracionSecurity = async (): Promise<any> => {
  try {
    const docRef = doc(db, 'configuracion', 'security');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {};
  } catch (error) {
    console.error('Error al obtener configuración de seguridad:', error);
    return {};
  }
};

export const guardarConfiguracionSecurity = async (data: any): Promise<void> => {
  try {
    const docRef = doc(db, 'configuracion', 'security');
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error('Error al guardar configuración de seguridad:', error);
  }
};

// Permissions (permisos)
export const obtenerConfiguracionPermissions = async (): Promise<any> => {
  try {
    const docRef = doc(db, 'configuracion', 'permissions');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {};
  } catch (error) {
    console.error('Error al obtener configuración de permisos:', error);
    return {};
  }
};

export const guardarConfiguracionPermissions = async (data: any): Promise<void> => {
  try {
    const docRef = doc(db, 'configuracion', 'permissions');
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error('Error al guardar configuración de permisos:', error);
  }
};