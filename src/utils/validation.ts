import messages from '../constants/messages';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { handleFirebaseError } from './errorHandling';
import { RolUsuario } from '../types/usuario'; // Añadir esta importación

// Expresión regular única para validación de email (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Verifica si un string tiene un formato de email válido
 * @param email - El email a validar
 * @returns true si el formato es válido, false en caso contrario
 */
export const isValidEmailFormat = (email: string): boolean => {
  return Boolean(email && email.trim() && EMAIL_REGEX.test(email));
};

/**
 * Valida un campo de email
 * @param email - El email a validar
 * @returns String vacío si es válido, o mensaje de error
 */
export const validateEmail = (email: string): string => {
  if (!email.trim()) {
    return messages.validation.emailRequired;
  }
  
  if (!isValidEmailFormat(email)) {
    return messages.validation.emailInvalid;
  }
  return '';
};

/**
 * Valida un campo de contraseña
 * @param password - La contraseña a validar
 * @returns String vacío si es válida, o mensaje de error
 */
export const validatePassword = (password: string): string => {
  if (!password) {
    return messages.validation.passwordRequired;
  }
  if (password.length < 6) {
    return messages.validation.passwordLength;
  }
  return '';
};

/**
 * Confirma si dos contraseñas coinciden
 * @param password - Contraseña principal
 * @param confirmPassword - Contraseña de confirmación
 * @returns String vacío si coinciden, o mensaje de error
 */
export const validatePasswordsMatch = (password: string, confirmPassword: string): string => {
  if (password !== confirmPassword) {
    return messages.validation.passwordMismatch;
  }
  return '';
};

/**
 * Valida un campo de texto requerido
 * @param value - El valor a validar
 * @param errorMessage - El mensaje de error a mostrar
 * @returns String vacío si es válido, o mensaje de error
 */
export const validateRequiredField = (value: string, errorMessage: string): string => {
  if (!value.trim()) {
    return errorMessage;
  }
  return '';
};

/**
 * Verifica si un email está disponible (no registrado)
 * @param email - El email a verificar
 * @returns Promise<boolean> - true si está disponible, false si ya existe
 * @throws Error si hay un problema de validación o conexión
 */
export const checkEmailAvailability = async (email: string): Promise<boolean> => {
  if (!email || !email.trim()) {
    return false;
  }
  
  try {
    // Verificar formato de email antes de hacer consultas
    if (!isValidEmailFormat(email)) {
      throw new Error(messages.validation.emailInvalid);
    }
    
    // Verificar en Firebase Auth
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) {
      return false; // Ya existe en Auth
    }
    
    // También verificar en Firestore
    const usuariosRef = collection(db, 'usuarios');
    const q = query(usuariosRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    
    return snapshot.empty;
  } catch (error: any) {
    // Usar handleFirebaseError para consistencia
    handleFirebaseError(error, messages.validation.emailCheckError);
    throw error;
  }
};

/**
 * Verifica si un rol es válido
 * @param rol - El rol a validar
 * @returns true si el rol es válido, false en caso contrario
 */
export const isValidRol = (rol: string): rol is RolUsuario => {
  return ['admin', 'vocal', 'socio', 'usuario'].includes(rol);
};