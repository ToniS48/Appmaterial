import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { obtenerOCrearUsuarioPorId, actualizarUltimoAcceso } from '../services/usuarioService';
import { Usuario } from '../types/usuario';
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

  // Función simple para iniciar sesión - usa directamente Firebase
  const login = async (email: string, password: string): Promise<void> => {
    try {
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
    } catch (error) {
      console.error("Error en logout:", error);
      handleFirebaseError(error, "Error al cerrar sesión");
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
        const updatedProfile = await obtenerOCrearUsuarioPorId(currentUser.uid, currentUser.email || '');
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
      const userProfileData = await obtenerOCrearUsuarioPorId(user.uid, user.email || '');
      
      // Verificar si el usuario está activo
      if (!userProfileData.activo) {
        console.log('Usuario inactivo, cerrando sesión');
        await signOut(auth);
        toast.error(messages.auth.session.accountDisabled);
        return;
      }
      
      // Actualizar último acceso
      await actualizarUltimoAcceso(user.uid);
      setUserProfile(userProfileData);
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    }
  };

  // Efecto para manejar cambios de autenticación
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
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

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