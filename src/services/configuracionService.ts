import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface DriveConfig {
  googleDriveUrl: string;
  googleDriveTopoFolder: string;
  googleDriveDocFolder: string;
}

export const obtenerConfiguracionDrive = async (): Promise<DriveConfig> => {
  const defaultConfig: DriveConfig = {
    googleDriveUrl: '',
    googleDriveTopoFolder: '',
    googleDriveDocFolder: ''
  };
  
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