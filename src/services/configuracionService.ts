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

const defaultConfig: ConfiguracionGlobal = {
  googleDriveUrl: '',
  googleDriveTopoFolder: '',
  googleDriveDocFolder: '',  weather: {
    enabled: false,
    defaultLocation: {
      lat: 40.4168,
      lon: -3.7038,
      name: 'Madrid, España'
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
            lat: data.weather?.defaultLocation?.lat || 40.4168,
            lon: data.weather?.defaultLocation?.lon || -3.7038,
            name: data.weather?.defaultLocation?.name || 'Madrid, España'
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