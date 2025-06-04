import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface DriveConfig {
  googleDriveUrl: string;
  googleDriveTopoFolder: string;
  googleDriveDocFolder: string;
}

interface ConfiguracionGlobal {
  googleDriveUrl: string;
  googleDriveTopoFolder: string;
  googleDriveDocFolder: string;
}

const defaultConfig: ConfiguracionGlobal = {
  googleDriveUrl: '',
  googleDriveTopoFolder: '',
  googleDriveDocFolder: ''
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
        googleDriveDocFolder: data.googleDriveDocFolder || ''
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