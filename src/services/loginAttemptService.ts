import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as crypto from 'crypto-js';

const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

// Función para hashear el email para mayor seguridad
export const hashEmail = (email: string): string => {
  return crypto.SHA256(email).toString();
};

// Verifica el estado actual de bloqueo
export const checkLoginStatus = async (email: string) => {
  try {
    const emailHash = hashEmail(email);
    const attemptsRef = doc(db, "loginAttempts", emailHash);
    const docSnap = await getDoc(attemptsRef);
    
    if (!docSnap.exists()) {
      return {
        blocked: false,
        attemptsRemaining: MAX_LOGIN_ATTEMPTS,
      };
    }
    
    const userData = docSnap.data() || {};
    
    // Verificar si la cuenta está bloqueada
    if (userData.blockedUntil && userData.blockedUntil.toMillis() > Date.now()) {
      return {
        blocked: true,
        blockedUntil: userData.blockedUntil,
        attemptsRemaining: 0,
      };
    }
    
    // Si había un bloqueo pero ya expiró
    if (userData.blockedUntil && userData.blockedUntil.toMillis() <= Date.now()) {
      await updateDoc(attemptsRef, {
        attempts: 0,
        blockedUntil: null,
      });
    }
    
    return {
      blocked: false,
      attemptsRemaining: MAX_LOGIN_ATTEMPTS - (userData.attempts || 0),
    };
  } catch (error) {
    console.error("Error checking login status:", error);
    throw error;
  }
};

// Registra un intento de inicio de sesión
export const recordLoginAttempt = async (email: string, success: boolean, isRegistration = false) => {
  try {
    // Si es un registro, no hacer seguimiento de intentos
    if (isRegistration) {
      return {
        blocked: false,
        attemptsRemaining: MAX_LOGIN_ATTEMPTS
      };
    }
    
    const emailHash = hashEmail(email);
    const attemptsRef = doc(db, "loginAttempts", emailHash);
    const docSnap = await getDoc(attemptsRef);
    const now = new Date();
    
    // Si el inicio de sesión es exitoso, resetear intentos
    if (success) {
      if (docSnap.exists()) {
        await updateDoc(attemptsRef, {
          attempts: 0,
          blockedUntil: null,
          lastAttemptTimestamp: serverTimestamp(),
        });
      }
      return {blocked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS};
    }
    
    // Primer intento fallido
    if (!docSnap.exists()) {
      await setDoc(attemptsRef, {
        email: email,
        attempts: 1,
        lastAttemptTimestamp: serverTimestamp(),
        blockedUntil: null,
      });
      return {
        blocked: false,
        attemptsRemaining: MAX_LOGIN_ATTEMPTS - 1,
      };
    }
    
    const userData = docSnap.data() || {};
    
    // Verificar si la cuenta está bloqueada actualmente
    if (userData.blockedUntil && userData.blockedUntil.toMillis() > Date.now()) {
      return {
        blocked: true,
        blockedUntil: userData.blockedUntil,
        attemptsRemaining: 0,
      };
    }
    
    // Si estaba bloqueada pero ya pasó el tiempo
    if (userData.blockedUntil && userData.blockedUntil.toMillis() <= Date.now()) {
      await updateDoc(attemptsRef, {
        attempts: 1,
        lastAttemptTimestamp: serverTimestamp(),
        blockedUntil: null,
      });
      return {
        blocked: false,
        attemptsRemaining: MAX_LOGIN_ATTEMPTS - 1,
      };
    }
    
    // Incrementar intentos fallidos
    const newAttempts = (userData.attempts || 0) + 1;
    
    // Determinar si debe bloquearse
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      const blockedUntil = new Date(Date.now() + BLOCK_DURATION);
      await updateDoc(attemptsRef, {
        attempts: newAttempts,
        lastAttemptTimestamp: serverTimestamp(),
        blockedUntil: blockedUntil,
      });
      return {
        blocked: true,
        blockedUntil: blockedUntil,
        attemptsRemaining: 0,
      };
    } else {
      await updateDoc(attemptsRef, {
        attempts: newAttempts,
        lastAttemptTimestamp: serverTimestamp(),
      });
      return {
        blocked: false,
        attemptsRemaining: MAX_LOGIN_ATTEMPTS - newAttempts,
      };
    }
  } catch (error) {
    console.error("Error recording login attempt:", error);
    throw error;
  }
};