// Utilidades de validación básicas
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Valida un email
 */
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'El email es requerido';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'El formato del email no es válido';
  }
  
  return null;
};

/**
 * Valida una contraseña
 */
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'La contraseña es requerida';
  }
  
  if (password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  
  return null;
};

/**
 * Valida confirmación de contraseña
 */
export const validatePasswordConfirmation = (password: string, confirmation: string): string | null => {
  if (password !== confirmation) {
    return 'Las contraseñas no coinciden';
  }
  
  return null;
};

/**
 * Valida un campo requerido
 */
export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} es requerido`;
  }
  
  return null;
};

/**
 * Valida si es un email válido (sin mensaje específico)
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida si es un rol válido
 */
export const isValidRole = (rol: string): boolean => {
  return ['admin', 'vocal', 'socio', 'usuario'].includes(rol);
};

/**
 * Verifica si un email está disponible en Firebase
 */
export const checkEmailAvailability = async (email: string): Promise<boolean> => {
  try {
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.empty; // true si está disponible (no existe)
  } catch (error) {
    console.error('Error checking email availability:', error);
    throw new Error('Error al verificar disponibilidad del email');
  }
};
