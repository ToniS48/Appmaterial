import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { 
  Auth, User, UserCredential, 
  createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signOut, onAuthStateChanged, sendPasswordResetEmail 
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../config/firebase';
import { obtenerUsuarioPorId, actualizarUltimoAcceso, actualizarUsuario, obtenerOCrearUsuarioPorId } from '../services/usuarioService';
import { Usuario } from '../types/usuario';
import { toast } from 'react-toastify';
import { handleFirebaseError } from '../utils/errorHandling';
import messages from '../constants/messages';
import { validateEmail } from '../utils/validation';
import { 
  INACTIVITY_TIMEOUT,
  INACTIVITY_WARNING_TIMEOUT,
  WARNING_DURATION
} from '../constants/authConfig';
import { checkLoginStatus, recordLoginAttempt } from '../services/loginAttemptService';

// Modificar la interfaz para corregir los tipos
interface AuthContextType {
  currentUser: User | null;
  userProfile: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>; // Cambiado de Promise<UserCredential> a Promise<void>
  register: (email: string, password: string) => Promise<void>; // Cambiado de Promise<UserCredential> a Promise<void>
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  inactivityWarningVisible: boolean;
  resetInactivityTimer: () => void;
  dismissInactivityWarning: () => void;
  loginBlocked: boolean;
  loginBlockTimeRemaining: number;
  refreshUserProfile: () => Promise<void>;
  isLoading: boolean;
}

// Valor por defecto del contexto (ajustado con los tipos corregidos)
const initialAuthContext: AuthContextType = {
  currentUser: null,
  userProfile: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  inactivityWarningVisible: false,
  resetInactivityTimer: () => {},
  dismissInactivityWarning: () => {},
  loginBlocked: false,
  loginBlockTimeRemaining: 0,
  refreshUserProfile: async () => {},
  isLoading: true,
};

const AuthContext = createContext<AuthContextType>(initialAuthContext);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [inactivityWarningVisible, setInactivityWarningVisible] = useState<boolean>(false);
  const [loginBlocked, setLoginBlocked] = useState<boolean>(false);
  const [loginBlockTimeRemaining, setLoginBlockTimeRemaining] = useState<number>(0);
  const [loginBlockUntil, setLoginBlockUntil] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Estado para controlar la carga

  const isMountedRef = useRef<boolean>(true);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userActivityRef = useRef<number>(Date.now());

  const safeSetState = useCallback((callback: () => void) => {
    if (isMountedRef.current) {
      callback();
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await signOut(auth);
      if (isMountedRef.current) {
        safeSetState(() => {
          setUserProfile(null);
          if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
            warningTimerRef.current = null;
          }
          if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current);
            logoutTimerRef.current = null;
          }
          setInactivityWarningVisible(false);
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      handleFirebaseError(error, messages.auth.session.logoutError);
      throw error;
    }
  }, [safeSetState]);

  const loadUserProfile = async (user: User) => {
    try {
      // Usar la nueva función que crea el perfil si no existe
      const userProfileData = await obtenerOCrearUsuarioPorId(user.uid, user.email || '');
      console.log('Perfil cargado/creado:', userProfileData);
      
      // Verificar si el usuario está activo después de cargar el perfil
      if (!userProfileData.activo) {
        console.log('Usuario inactivo, cerrando sesión');
        await signOut(auth);
        safeSetState(() => {
          setUserProfile(null);
          setCurrentUser(null);
          setLoading(false);
        });
        toast.error(messages.auth.session.accountDisabled);
        return;
      }
      
      // Actualizar último acceso
      await actualizarUltimoAcceso(user.uid);
      
      safeSetState(() => {
        setUserProfile(userProfileData);
        setLoading(false);
      });
    } catch (error) {
      console.error('Error al cargar el perfil:', error);
      safeSetState(() => setLoading(false));
      throw error;
    }
  };

  const refreshUserProfile = async (): Promise<void> => {
    if (currentUser) {
      try {
        await loadUserProfile(currentUser);
      } catch (error) {
        console.error('Error al refrescar el perfil de usuario:', error);
        throw error;
      }
    } else {
      throw new Error('No hay usuario autenticado');
    }
  };

  const dismissInactivityWarning = useCallback(() => {
    if (!isMountedRef.current) return;
    setInactivityWarningVisible(false);
    resetInactivityTimer();
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!isMountedRef.current) return;
    
    userActivityRef.current = Date.now();
    
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    
    setInactivityWarningVisible(false);
    
    if (currentUser) {
      warningTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setInactivityWarningVisible(true);
        }
      }, INACTIVITY_WARNING_TIMEOUT);
      
      logoutTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          logout();
          toast.info(messages.auth.session.inactivityLogout);
        }
      }, INACTIVITY_TIMEOUT);
    }
  }, [currentUser, logout]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUser) {
        const elapsed = Date.now() - userActivityRef.current;
        
        console.debug(`Página visible de nuevo. Tiempo transcurrido: ${elapsed / 1000} segundos`);
        
        if (elapsed >= INACTIVITY_TIMEOUT) {
          console.debug('Tiempo de inactividad excedido, cerrando sesión');
          logout();
          toast.info(messages.auth.session.inactivityLogout);
        } else if (elapsed >= INACTIVITY_WARNING_TIMEOUT) {
          console.debug('Mostrando advertencia de inactividad');
          setInactivityWarningVisible(true);
          
          const remainingTime = INACTIVITY_TIMEOUT - elapsed;
          
          if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current);
          }
          
          logoutTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              logout();
              toast.info(messages.auth.session.inactivityLogout);
            }
          }, remainingTime);
          
        } else {
          console.debug('Reiniciando temporizadores de inactividad');
          resetInactivityTimer();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, logout, resetInactivityTimer]);

  useEffect(() => {
    isMountedRef.current = true;
    let isFirstAuth = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMountedRef.current) return;
      
      // Prevenir múltiples cargas del mismo perfil en sucesión rápida
      if (user && user.email === currentUser?.email && !isFirstAuth) {
        console.log('Ignorando evento de autenticación duplicado');
        return;
      }
      
      isFirstAuth = false;
      console.log('Estado de autenticación cambiado:', user ? `Usuario: ${user.email}` : 'Sin usuario');
      safeSetState(() => setCurrentUser(user));
      
      if (user && isMountedRef.current) {
        await loadUserProfile(user);
        if (isMountedRef.current) {
          resetInactivityTimer();
        }
      } else {
        safeSetState(() => {
          setUserProfile(null);
          setLoading(false);
        });
      }
    });
    
    return () => {
      isMountedRef.current = false;
      unsubscribe();
      
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, [resetInactivityTimer, safeSetState]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (loginBlockUntil && loginBlockUntil.getTime() > Date.now()) {
      interval = setInterval(() => {
        const remaining = loginBlockUntil.getTime() - Date.now();
        if (remaining <= 0) {
          setLoginBlocked(false);
          setLoginBlockTimeRemaining(0);
          setLoginBlockUntil(null);
          if (interval) clearInterval(interval);
        } else {
          setLoginBlockTimeRemaining(remaining);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loginBlockUntil]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      // Verificar estado de inicio de sesión usando el servicio local
      const statusData = await checkLoginStatus(email);
      
      if (statusData.blocked) {
        if (statusData.blockedUntil) {
          const blockUntilDate = new Date(statusData.blockedUntil.toMillis());
          setLoginBlockUntil(blockUntilDate);
          setLoginBlockTimeRemaining(blockUntilDate.getTime() - Date.now());
          setLoginBlocked(true);
        }
        
        throw new Error(messages.auth.security.loginBlocked);
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Registrar intento exitoso
      await recordLoginAttempt(email, true);
      
      setLoginBlocked(false);
      if (isMountedRef.current) {
        resetInactivityTimer();
      }
      
    } catch (error: any) {
      if (error.code && error.code.startsWith('auth/')) {
        try {
          // Registrar intento fallido
          const result = await recordLoginAttempt(email, false);
          
          if (result.blocked && result.blockedUntil) {
            const blockUntilDate = new Date(result.blockedUntil.getTime());
            setLoginBlockUntil(blockUntilDate);
            setLoginBlockTimeRemaining(blockUntilDate.getTime() - Date.now());
            setLoginBlocked(true);
            
            error.message = messages.auth.security.loginBlocked;
          } else if (result.attemptsRemaining > 0) {
            error.message = messages.auth.security.attemptsRemaining.replace(
              '{attempts}', 
              result.attemptsRemaining.toString()
            );
          }
        } catch (recordError) {
          console.error("Error registrando intento de inicio de sesión:", recordError);
        }
      }
      
      handleFirebaseError(error, messages.errors.login);
      throw error;
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    try {
      // Pasar isRegistration=true para evitar conflictos con el sistema de bloqueo
      await recordLoginAttempt(email, true, true); 
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (isMountedRef.current) {
        resetInactivityTimer();
      }
      
    } catch (error) {
      handleFirebaseError(error, messages.errors.register);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    const emailError = validateEmail(email);
    if (emailError) {
      toast.error(emailError);
      throw new Error(emailError);
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      handleFirebaseError(error, messages.errors.resetPassword);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    resetPassword,
    refreshUserProfile,
    inactivityWarningVisible,
    resetInactivityTimer,
    dismissInactivityWarning,
    loginBlocked,
    loginBlockTimeRemaining,
    isLoading // Incluir en el contexto
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};