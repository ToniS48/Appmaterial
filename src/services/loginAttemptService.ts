import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as crypto from 'crypto-js';

const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

// Función para hashear el email para mayor seguridad
export const hashEmail = (email: string): string => {
  return crypto.SHA256(email).toString();
};

// Definir correctamente la interfaz de retorno para checkLoginStatus
export interface LoginStatus {
  blocked: boolean;
  attemptsRemaining: number;
  blockedUntil?: Date;
}

// Verifica el estado actual de bloqueo
export const checkLoginStatus = async (email: string): Promise<LoginStatus> => {
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
    
    if (userData.attempts < MAX_LOGIN_ATTEMPTS) {
      return {
        blocked: false,
        attemptsRemaining: MAX_LOGIN_ATTEMPTS - userData.attempts,
      };
    }
    
    // Verificar si el bloqueo ha expirado
    if (userData.blockedUntil) {
      const blockedUntil = new Date(userData.blockedUntil.toDate());
      const now = new Date();
      
      if (blockedUntil > now) {
        return {
          blocked: true,
          attemptsRemaining: 0,
          blockedUntil: blockedUntil
        };
      } else {
        // El bloqueo ha expirado, reiniciar contador
        await updateDoc(attemptsRef, {
          attempts: 0,
          blockedUntil: null,
          lastAttempt: serverTimestamp()
        });
        
        return {
          blocked: false,
          attemptsRemaining: MAX_LOGIN_ATTEMPTS,
        };
      }
    }
    
    return {
      blocked: false,
      attemptsRemaining: MAX_LOGIN_ATTEMPTS - userData.attempts,
    };
  } catch (error) {
    console.error("Error al verificar intentos de login:", error);
    // En caso de error, permitir el acceso
    return {
      blocked: false,
      attemptsRemaining: MAX_LOGIN_ATTEMPTS,
    };
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
    
    // Si el inicio de sesión es exitoso, resetear intentos
    if (success) {
      await setDoc(attemptsRef, {
        email,
        attempts: 0,
        lastAttemptTimestamp: serverTimestamp(),
        blockedUntil: null,
        lastSuccessfulLogin: serverTimestamp()
      }, { merge: true });
      
      console.log('Intentos de login reseteados por login exitoso');
      
      return {
        blocked: false, 
        attemptsRemaining: MAX_LOGIN_ATTEMPTS
      };
    }
    
    // Si es un intento fallido, seguir con el proceso normal
    // pero con mejor manejo de errores
    const docSnap = await getDoc(attemptsRef);
    const now = new Date();
    
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
    // En caso de error, no bloquear el acceso
    return {
      blocked: false,
      attemptsRemaining: MAX_LOGIN_ATTEMPTS - 1
    };
  }
};