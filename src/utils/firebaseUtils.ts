import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Verifica la conexión con Firebase realizando una consulta simple
 * @returns {Promise<boolean>} Verdadero si la conexión es exitosa
 */
export const verificarConexionFirebase = async (): Promise<boolean> => {
  try {
    // Intenta obtener un solo documento de cualquier colección
    const coleccionesRef = collection(db, 'actividades');
    const q = query(coleccionesRef, limit(1));
    await getDocs(q);
    console.log("Conexión a Firebase verificada correctamente");
    return true;
  } catch (error) {
    console.error("Error al conectar con Firebase:", error);
    return false;
  }
};