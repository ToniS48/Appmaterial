/**
 * Servicio para integrar con la Cloud Function de AEMET
 * Resuelve problemas CORS utilizando un proxy en Cloud Functions
 */

import { db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AemetProxyConfig {
  enabled: boolean;
  functionUrl: string;
  appApiKey: string;
}

// Configuración por defecto
const defaultConfig: AemetProxyConfig = {
  enabled: false,
  functionUrl: '',
  appApiKey: ''
};

let config: AemetProxyConfig = { ...defaultConfig };
let aemetApiKey: string = '';

/**
 * Inicializa la configuración del proxy de AEMET
 */
export const initAemetProxy = async (): Promise<boolean> => {
  try {
    // Cargar configuración desde Firestore
    const configDocRef = doc(db, 'configuracion', 'apis');
    const configDoc = await getDoc(configDocRef);
    
    if (!configDoc.exists()) {
      console.warn('⚠️ No se encontró configuración para el proxy de AEMET');
      return false;
    }
    
    const data = configDoc.data();
    
    // Validar que existen los datos necesarios
    if (!data.aemetFunctionUrl || !data.aemetFunctionKey) {
      console.warn('⚠️ Faltan datos de configuración para el proxy de AEMET');
      return false;
    }
    
    // Almacenar configuración
    config = {
      enabled: true,
      functionUrl: data.aemetFunctionUrl,
      appApiKey: data.aemetFunctionKey
    };
    
    // Almacenar API key de AEMET
    if (data.aemetApiKey) {
      aemetApiKey = data.aemetApiKey;
    }
    
    console.log('✅ Proxy AEMET configurado correctamente');
    return true;
    
  } catch (error) {
    console.error('Error al inicializar proxy AEMET:', error);
    return false;
  }
};

/**
 * Obtiene municipios desde AEMET a través del proxy
 */
export const getMunicipios = async (): Promise<any[] | null> => {
  if (!config.enabled || !config.functionUrl || !aemetApiKey) {
    return null;
  }
  
  try {
    const url = `${config.functionUrl}?endpoint=maestro/municipios&appApiKey=${config.appApiKey}&aemetApiKey=${aemetApiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error en proxy AEMET: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo municipios a través del proxy:', error);
    return null;
  }
};

/**
 * Obtiene pronóstico para un municipio específico
 */
export const getPronosticoMunicipio = async (municipioId: string): Promise<any | null> => {
  if (!config.enabled || !config.functionUrl || !aemetApiKey) {
    return null;
  }
  
  try {
    const endpoint = `prediccion/especifica/municipio/diaria/${municipioId}`;
    const url = `${config.functionUrl}?endpoint=${endpoint}&appApiKey=${config.appApiKey}&aemetApiKey=${aemetApiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error en proxy AEMET: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo pronóstico a través del proxy:', error);
    return null;
  }
};

export default {
  initAemetProxy,
  getMunicipios,
  getPronosticoMunicipio
};
