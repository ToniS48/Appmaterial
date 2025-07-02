/**
 * Servicio de configuración optimizado
 * Eliminadas duplicaciones, uso correcto de FirestoreConverters
 */

import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  weatherConfigConverter, 
  materialConfigConverter,
  systemConfigConverter,
  googleApisConfigConverter,
  safeFirestoreUpdate,
  WeatherConfig,
  MaterialConfig,
  SystemConfig,
  GoogleApisConfig
} from './firestore/FirestoreConverters';

/**
 * Servicio genérico para cualquier configuración
 */
export class ConfigurationService {
  /**
   * Obtiene configuración usando converter específico si existe
   */
  static async getConfig<T extends Record<string, any>>(
    documentId: string, 
    converter?: any,
    defaultValue?: T
  ): Promise<T> {
    try {
      const docRef = doc(db, 'configuracion', documentId);
      
      if (converter) {
        const docRefWithConverter = docRef.withConverter(converter.getConverter());
        const docSnap = await getDoc(docRefWithConverter);
        
        if (docSnap.exists()) {
          return docSnap.data() as T;
        } else if (defaultValue) {
          // Crear con valores por defecto
          const defaultData = converter.createDefault();
          await setDoc(docRefWithConverter, defaultData);
          return defaultData;
        }
      } else {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { ...defaultValue, ...docSnap.data() } as T;
        }
      }
      
      throw new Error(`Configuración ${documentId} no encontrada`);
    } catch (error) {
      console.error(`Error obteniendo configuración ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Guarda configuración usando converter específico si existe
   */
  static async saveConfig<T extends Record<string, any>>(
    documentId: string,
    data: T,
    converter?: any
  ): Promise<void> {
    try {
      const docRef = doc(db, 'configuracion', documentId);
      
      if (converter) {
        const docRefWithConverter = docRef.withConverter(converter.getConverter());
        await setDoc(docRefWithConverter, data as any, { merge: true });
      } else {
        await setDoc(docRef, data as any, { merge: true });
      }
    } catch (error) {
      console.error(`Error guardando configuración ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Lista todos los documentos de configuración disponibles
   */
  static async listConfigurations(): Promise<string[]> {
    try {
      const configCollection = collection(db, 'configuracion');
      const snapshot = await getDocs(configCollection);
      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Error listando configuraciones:', error);
      throw error;
    }
  }
}

// Funciones específicas optimizadas para cada tipo de configuración

export const WeatherConfigService = {
  async get(): Promise<WeatherConfig> {
    return ConfigurationService.getConfig('weather', weatherConfigConverter);
  },
  
  async save(config: WeatherConfig): Promise<void> {
    return ConfigurationService.saveConfig('weather', config, weatherConfigConverter);
  },
  
  async update(updates: Partial<WeatherConfig>): Promise<void> {
    const current = await this.get();
    return this.save({ ...current, ...updates });
  }
};

export const MaterialConfigService = {
  async get(): Promise<MaterialConfig> {
    return ConfigurationService.getConfig('material', materialConfigConverter);
  },
  
  async save(config: MaterialConfig): Promise<void> {
    return ConfigurationService.saveConfig('material', config, materialConfigConverter);
  },
  
  async update(updates: Partial<MaterialConfig>): Promise<void> {
    const current = await this.get();
    return this.save({ ...current, ...updates });
  }
};

export const SystemConfigService = {
  async get(): Promise<SystemConfig> {
    return ConfigurationService.getConfig('system', systemConfigConverter);
  },
  
  async save(config: SystemConfig): Promise<void> {
    return ConfigurationService.saveConfig('system', config, systemConfigConverter);
  },
  
  async update(updates: Partial<SystemConfig>): Promise<void> {
    const current = await this.get();
    return this.save({ ...current, ...updates });
  }
};

export const GoogleApisConfigService = {
  async get(): Promise<GoogleApisConfig> {
    return ConfigurationService.getConfig('googleApis', googleApisConfigConverter);
  },
  
  async save(config: GoogleApisConfig): Promise<void> {
    return ConfigurationService.saveConfig('googleApis', config, googleApisConfigConverter);
  },
  
  async update(updates: Partial<GoogleApisConfig>): Promise<void> {
    const current = await this.get();
    return this.save({ ...current, ...updates });
  }
};

// Para configuraciones sin converter específico
export const GenericConfigService = {
  async get<T extends Record<string, any>>(documentId: string, defaultValue: T): Promise<T> {
    return ConfigurationService.getConfig(documentId, null, defaultValue);
  },
  
  async save<T extends Record<string, any>>(documentId: string, config: T): Promise<void> {
    return ConfigurationService.saveConfig(documentId, config);
  },
  
  async update<T extends Record<string, any>>(documentId: string, updates: Partial<T>, defaultValue: T): Promise<void> {
    const current = await this.get(documentId, defaultValue);
    return this.save(documentId, { ...current, ...updates });
  }
};

// Exportar servicio principal
export default ConfigurationService;

// Exportar tipos para uso externo
export type { GoogleApisConfig, WeatherConfig, MaterialConfig, SystemConfig };

// Funciones de compatibilidad hacia atrás para la API existente
export const obtenerConfiguracionMeteorologica = async (): Promise<WeatherConfig> => {
  return WeatherConfigService.get();
};

export const guardarConfiguracionMeteorologica = async (config: WeatherConfig): Promise<void> => {
  return WeatherConfigService.save(config);
};

export const obtenerConfiguracionMaterial = async (): Promise<MaterialConfig> => {
  return MaterialConfigService.get();
};

export const guardarConfiguracionMaterial = async (config: MaterialConfig): Promise<void> => {
  return MaterialConfigService.save(config);
};

export const obtenerConfiguracionSistema = async (): Promise<SystemConfig> => {
  return SystemConfigService.get();
};

export const guardarConfiguracionSistema = async (config: SystemConfig): Promise<void> => {
  return SystemConfigService.save(config);
};

export const obtenerConfiguracionGoogleApis = async (): Promise<GoogleApisConfig> => {
  return GoogleApisConfigService.get();
};

export const guardarConfiguracionGoogleApis = async (config: GoogleApisConfig): Promise<void> => {
  return GoogleApisConfigService.save(config);
};

// Funciones adicionales que faltan
export const obtenerConfiguracionDrive = async () => {
  const googleConfig = await GoogleApisConfigService.get();
  return {
    driveApiKey: googleConfig.driveApiKey,
    driveEnabled: googleConfig.driveEnabled
  };
};

export const guardarConfiguracionGeneral = async (config: any): Promise<void> => {
  // Función de compatibilidad - redirigir según el tipo de configuración
  if (config.porcentajeStockMinimo !== undefined) {
    return MaterialConfigService.save(config);
  }
  if (config.weatherEnabled !== undefined) {
    return WeatherConfigService.save(config);
  }
  if (config.appName !== undefined) {
    return SystemConfigService.save(config);
  }
  throw new Error('Tipo de configuración no reconocido');
};

export const actualizarConfiguracionMeteorologica = async (config: WeatherConfig): Promise<void> => {
  return WeatherConfigService.save(config);
};
