import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { 
  obtenerNotificacionesUsuario, 
  marcarNotificacionComoLeida, 
  marcarTodasLeidas,
  suscribirseANotificaciones
} from '../services/notificacionService';
import { useToast } from '@chakra-ui/react';
import { useAuth } from './AuthContext';
import { Notificacion } from '../types/notificacion';
import messages from '../constants/messages';

interface NotificacionContextType {
  notificaciones: Notificacion[];
  notificacionesNoLeidas: number;
  cargando: boolean;
  error: string | null;
  cargarNotificaciones: () => Promise<void>;
  marcarComoLeida: (notificacionId: string) => Promise<void>;
  marcarTodasComoLeidas: () => Promise<void>;
  limpiarError: () => void;
}

const NotificacionContext = createContext<NotificacionContextType | undefined>(undefined);

export const NotificacionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { currentUser } = useAuth();

  // Calcular el número de notificaciones no leídas
  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  // Cargar notificaciones del usuario actual
  const cargarNotificaciones = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    try {
      setCargando(true);
      setError(null);
      
      const notificacionesData = await obtenerNotificacionesUsuario(currentUser.uid);
      setNotificaciones(notificacionesData);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      setError('No se pudieron cargar las notificaciones');
    } finally {
      setCargando(false);
    }
  }, [currentUser?.uid]);

  // Añadir un listener en tiempo real para notificaciones
  useEffect(() => {
    if (!currentUser?.uid) return;
    
    // Iniciar el listener y guardar la función para desuscribirse
    const unsubscribe = suscribirseANotificaciones(
      currentUser.uid,
      (nuevasNotificaciones) => {
        setNotificaciones(nuevasNotificaciones);
      },
      (error) => {
        console.error('Error en el listener de notificaciones:', error);
        setError('Error al escuchar notificaciones en tiempo real');
      }
    );
    
    // Limpieza cuando el componente se desmonte o cambie el usuario
    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Marcar una notificación como leída
  const marcarComoLeida = async (notificacionId: string) => {
    try {
      await marcarNotificacionComoLeida(notificacionId);
      
      // Actualizar estado local
      setNotificaciones(prevState => 
        prevState.map(notif => 
          notif.id === notificacionId 
            ? { ...notif, leida: true } 
            : notif
        )
      );
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      toast({
        title: 'Error',
        description: messages.notificaciones.marcarLeidaError,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Marcar todas las notificaciones como leídas
  const marcarTodasComoLeidas = async () => {
    if (!currentUser?.uid) return;
    
    try {
      await marcarTodasLeidas(currentUser.uid);
      
      // Actualizar estado local
      setNotificaciones(prevState => 
        prevState.map(notif => ({ ...notif, leida: true }))
      );
      
      toast({
        title: 'Éxito',
        description: messages.notificaciones.marcarTodasLeidasExito,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      toast({
        title: 'Error',
        description: messages.notificaciones.marcarTodasLeidasError,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Limpiar errores
  const limpiarError = () => setError(null);

  // Cargar notificaciones al iniciar o cambiar de usuario
  useEffect(() => {
    if (currentUser?.uid) {
      cargarNotificaciones();
    } else {
      setNotificaciones([]);
    }
  }, [currentUser?.uid, cargarNotificaciones]);

  const value = {
    notificaciones,
    notificacionesNoLeidas,
    cargando,
    error,
    cargarNotificaciones,
    marcarComoLeida,
    marcarTodasComoLeidas,
    limpiarError
  };

  return (
    <NotificacionContext.Provider value={value}>
      {children}
    </NotificacionContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useNotificaciones = () => {
  const context = useContext(NotificacionContext);
  if (context === undefined) {
    throw new Error('useNotificaciones debe ser usado dentro de un NotificacionProvider');
  }
  return context;
};