import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { obtenerOCrearUsuario, actualizarUltimoAcceso } from '../services/usuarioService';
import { Usuario } from '../types/usuario';
import { EstadoActividad } from '../types/usuarioHistorial';
import { toast } from 'react-toastify';
import { handleFirebaseError } from '../utils/errorHandling';
import messages from '../constants/messages';

// Interfaz simplificada para el contexto
interface AuthContextType {
  currentUser: User | null;
  userProfile: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

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

  // Configurar persistencia al cargar el componente
  useEffect(() => {
    const configurarPersistencia = async () => {
      try {
        // Usar persistencia local para mantener la sesión incluso cuando se cierra el navegador
        await setPersistence(auth, browserLocalPersistence);
        console.log('Persistencia de autenticación configurada como LOCAL');
      } catch (error) {
        console.error('Error al configurar persistencia de autenticación:', error);
      }
    };
    
    configurarPersistencia();
  }, []);

  // Función simple para iniciar sesión - usa directamente Firebase
  const login = async (email: string, password: string): Promise<void> => {
    try {
      // La persistencia ya está configurada globalmente, así que simplemente iniciamos sesión
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error en login:', error);
      handleFirebaseError(error, "Error al iniciar sesión");
      throw error;
    }
  };
  // Función simple para cerrar sesión
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      // Forzar redirección inmediata al login
      window.location.href = '/login';
    } catch (error) {
      console.error("Error en logout:", error);
      handleFirebaseError(error, "Error al cerrar sesión");
      // Incluso si hay error, redirigir al login como medida de seguridad
      window.location.href = '/login';
      throw error;
    }
  };

  // Función para restablecer contraseña
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Se ha enviado un correo para restablecer tu contraseña');
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      handleFirebaseError(error, "Error al enviar email de restablecimiento");
      throw error;
    }
  };

  // Función para actualizar el perfil de usuario
  const refreshUserProfile = async (): Promise<void> => {
    if (currentUser) {
      try {
        const updatedProfile = await obtenerOCrearUsuario(currentUser.uid, currentUser.email || '');
        setUserProfile(updatedProfile);
      } catch (error) {
        console.error('Error al actualizar perfil de usuario:', error);
        throw error;
      }
    }
  };
  // Función para cargar el perfil del usuario
  const loadUserProfile = async (user: User) => {
    try {
      const userProfileData = await obtenerOCrearUsuario(user.uid, user.email || '');
      
      // Verificar si el usuario está eliminado
      if (userProfileData.eliminado === true) {
        console.log('Usuario eliminado, cerrando sesión');
        await signOut(auth);
        toast.error('Esta cuenta ha sido eliminada. Contacta con un administrador.');
        return;
      }
      
      // Verificar si el usuario está suspendido
      if (userProfileData.estadoActividad === 'suspendido') {
        console.log('Usuario suspendido, cerrando sesión');
        await signOut(auth);
        toast.error('Tu cuenta ha sido suspendida. Contacta con un administrador.');
        return;
      }
      
      // Permitir acceso pero mostrar advertencias según el estado
      if (userProfileData.estadoAprobacion === 'pendiente') {
        toast.warning('Tu cuenta está pendiente de aprobación. Algunas funcionalidades pueden estar limitadas.');
      } else if (userProfileData.estadoAprobacion === 'rechazado') {
        toast.warning('Tu cuenta ha sido rechazada. Contacta con un administrador.');
      }
      
      // Actualizar último acceso
      await actualizarUltimoAcceso(user.uid);
      setUserProfile(userProfileData);
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    }
  };  // Efecto para manejar cambios de autenticación (CORREGIDO para evitar bucles)
  useEffect(() => {
    console.log('Configurando listener de autenticación...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Estado de autenticación cambiado:', user ? `Usuario: ${user.email}` : 'Sin usuario');
      
      if (user) {
        setCurrentUser(user);
        await loadUserProfile(user);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        
        // Si no hay usuario y estamos en una ruta protegida, redirigir
        const currentPath = window.location.pathname;
        const publicRoutes = ['/login', '/register', '/'];
        
        if (!publicRoutes.includes(currentPath)) {
          console.log('Usuario no autenticado en ruta protegida, redirigiendo...');
          window.location.href = '/login';
        }
      }
      
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, []); // ✅ CORRECCIÓN: Solo ejecutar una vez al montar
  // Reemplazar el useEffect de reconexión por uno que maneje el estado de conexión
  useEffect(() => {
    const handleConnectionChange = () => {
      // Solo mostrar mensaje cuando recuperamos la conexión en desarrollo
      if (navigator.onLine && process.env.NODE_ENV === 'development') {
        console.log("Conexión a Internet restaurada, Firebase Auth sincronizará automáticamente");
        
        // No necesitamos hacer nada aquí explícitamente
        // Firebase Auth intentará automáticamente usar las credenciales persistentes
        // gracias a la configuración de persistencia
        
        // Si el usuario sigue sin estar autenticado después de recuperar la conexión,
        // podríamos mostrar un mensaje para que inicie sesión manualmente
        setTimeout(() => {
          if (!currentUser && process.env.NODE_ENV === 'development') {
            console.log('La reconexión automática no restauró la sesión, puede que necesite iniciar sesión nuevamente');
          }
        }, 3000); // Dar tiempo a Firebase para intentar reconectar
      } else if (!navigator.onLine && process.env.NODE_ENV === 'development') {
        console.log("Conexión a Internet perdida");
      }
    };
    
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    
    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, [currentUser]);  // Exponer variables para debugging en desarrollo (solo cuando hay cambios reales)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).authDebug = {
        currentUser,
        userProfile,
        loading,
        authContext: {
          currentUser,
          userProfile,
          loading,
          login,
          logout,
          resetPassword,
          refreshUserProfile
        }
      };
      
      // También exponer variables individuales para compatibilidad
      (window as any).currentUser = currentUser;
      (window as any).userProfile = userProfile;
    }
  }, [currentUser, userProfile, loading, login, logout, resetPassword, refreshUserProfile]);

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    logout,
    resetPassword,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
