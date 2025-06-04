import { getAuth, signOut } from 'firebase/auth';

/**
 * Función simplificada para reiniciar el estado de autenticación
 */
export const resetAuthState = async (): Promise<boolean> => {
  try {
    const auth = getAuth();
    if (auth.currentUser) {
      await signOut(auth);
    }
    
    // 2. Limpiar localStorage de Firebase
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('firebase:')) {
        localStorage.removeItem(key);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error al reiniciar autenticación:', error);
    return false;
  }
};