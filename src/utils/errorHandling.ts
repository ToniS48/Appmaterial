import { toast } from 'react-toastify';
import messages from '../constants/messages';

interface FirebaseError {
  code?: string;
  message: string;
}

/**
 * Obtiene un mensaje de error formateado basado en el error recibido
 * @param error - Error de Firebase o cualquier error
 * @param defaultMessage - Mensaje por defecto si no hay código de error específico
 * @returns El mensaje de error formateado
 */
export const getErrorMessage = (error: FirebaseError | any, defaultMessage?: string): string => {
  if (!error) return defaultMessage || messages.errors.general;
  
  // Si es un error de Firebase con código
  if (error.code && typeof error.code === 'string') {
    // Verificar explícitamente si el código existe en nuestros mensajes
    const firebaseErrors = messages.firebase.errors as Record<string, string>;
    const errorMessage = firebaseErrors[error.code];
    
    if (errorMessage) {
      return errorMessage;
    }
    
    // Si no tenemos un mensaje específico para este código
    return error.message || defaultMessage || messages.errors.general;
  }
  
  // Para errores con mensaje personalizado
  if (error.message) {
    return error.message;
  }
  
  // Para cualquier otro tipo de error
  return defaultMessage || messages.errors.general;
};

/**
 * Maneja errores de Firebase mostrando un toast y devolviendo el mensaje
 * @param error - Error de Firebase o cualquier error
 * @param defaultMessage - Mensaje por defecto si no hay código de error específico
 * @returns El mensaje de error formateado
 * @note Esta función muestra un toast con el mensaje de error
 */
export const handleFirebaseErrorWithToast = (error: any, defaultMessage: string = 'Ha ocurrido un error'): string => {
  const errorMessage = getErrorMessage(error, defaultMessage);
  toast.error(errorMessage);
  
  return errorMessage;
};

/**
 * Maneja errores sin mostrar toast (para casos donde se quiere controlar la UI manualmente)
 * @param error - Error de Firebase o cualquier error
 * @param defaultMessage - Mensaje por defecto si no hay código de error específico
 * @returns El mensaje de error formateado
 */
export const handleFirebaseError = (error: any, defaultMessage: string = 'Ha ocurrido un error'): string => {
  return getErrorMessage(error, defaultMessage);
};