import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@chakra-ui/react';
import {
  crearConversacion,
  obtenerConversacionesUsuario,
  escucharMensajes,
  enviarMensaje,
  marcarMensajesComoLeidos,
  buscarMensajes,
  eliminarMensaje,
  editarMensaje,
  abandonarConversacion
} from '../services/mensajeriaService';
import {
  Conversacion,
  Mensaje,
  ParticipanteConversacion,
  NuevaConversacion,
  NuevoMensaje,
  FiltroMensajes
} from '../types/mensaje';

interface MensajeriaContextType {
  // Estado
  conversaciones: Conversacion[];
  conversacionActual: Conversacion | null;
  mensajes: Mensaje[];
  cargandoConversaciones: boolean;
  cargandoMensajes: boolean;
  mensajesNoLeidos: number;
  error: string | null;

  // Acciones de conversaciones
  crearNuevaConversacion: (datos: NuevaConversacion) => Promise<string>;
  seleccionarConversacion: (conversacionId: string) => void;
  salirConversacion: (conversacionId: string) => Promise<void>;
  cargarConversaciones: () => Promise<void>;
  
  // Acciones de mensajes
  enviarNuevoMensaje: (datos: NuevoMensaje) => Promise<void>;
  editarMensajeExistente: (mensajeId: string, nuevoContenido: string) => Promise<void>;
  eliminarMensajeExistente: (mensajeId: string) => Promise<void>;
  marcarComoLeido: (conversacionId: string) => Promise<void>;
  buscarEnMensajes: (filtros: FiltroMensajes) => Promise<Mensaje[]>;
  
  // Utilidades
  limpiarError: () => void;
}

const MensajeriaContext = createContext<MensajeriaContextType | undefined>(undefined);

export const MensajeriaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const toast = useToast();
  
  // Estados
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [conversacionActual, setConversacionActual] = useState<Conversacion | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargandoConversaciones, setCargandoConversaciones] = useState(false);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Listeners de tiempo real
  const [unsubscribeMensajes, setUnsubscribeMensajes] = useState<(() => void) | null>(null);

  // Función para manejar errores
  const manejarError = useCallback((error: any, mensaje: string) => {
    console.error(mensaje, error);
    setError(mensaje);
    toast({
      title: "Error",
      description: mensaje,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  }, [toast]);

  // Función para limpiar errores
  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  // Función para cargar conversaciones
  const cargarConversaciones = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setCargandoConversaciones(true);
      setError(null);
      
      const conversacionesObtenidas = await obtenerConversacionesUsuario(currentUser.uid);
      setConversaciones(conversacionesObtenidas);
      
    } catch (error) {
      manejarError(error, 'Error al cargar conversaciones');
    } finally {
      setCargandoConversaciones(false);
    }
  }, [currentUser, manejarError]);

  // Función para crear conversación
  const crearNuevaConversacion = useCallback(async (datos: NuevaConversacion): Promise<string> => {
    if (!currentUser || !userProfile) throw new Error('Usuario no autenticado');
    
    try {
      setCargandoConversaciones(true);
      setError(null);
        const conversacion = await crearConversacion(
        datos,
        currentUser.uid,
        userProfile.nombre + ' ' + userProfile.apellidos,
        userProfile.rol
      );
      
      toast({
        title: "Éxito",
        description: "Conversación creada correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Recargar conversaciones
      await cargarConversaciones();
      
      return conversacion.id;
    } catch (error) {
      manejarError(error, 'Error al crear conversación');
      throw error;
    } finally {
      setCargandoConversaciones(false);
    }
  }, [currentUser, userProfile, manejarError, toast, cargarConversaciones]);

  // Función para seleccionar conversación
  const seleccionarConversacion = useCallback(async (conversacionId: string) => {
    if (!currentUser) return;
    
    try {
      setCargandoMensajes(true);
      
      // Limpiar listener anterior de mensajes
      if (unsubscribeMensajes) {
        unsubscribeMensajes();
        setUnsubscribeMensajes(null);
      }
      
      // Encontrar conversación
      const conversacion = conversaciones.find(c => c.id === conversacionId);
      setConversacionActual(conversacion || null);
      
      // Configurar listener de mensajes en tiempo real
      const unsubscribe = escucharMensajes(conversacionId, (mensajesActualizados: Mensaje[]) => {
        setMensajes(mensajesActualizados);
        setCargandoMensajes(false);
      });
      setUnsubscribeMensajes(() => unsubscribe);
      
    } catch (error) {
      manejarError(error, 'Error al cargar conversación');
      setCargandoMensajes(false);
    }
  }, [currentUser, conversaciones, manejarError, unsubscribeMensajes]);

  // Función para enviar mensaje
  const enviarNuevoMensaje = useCallback(async (datos: NuevoMensaje) => {
    if (!currentUser || !userProfile) return;
    
    try {      await enviarMensaje(
        datos,
        currentUser.uid,
        userProfile.nombre + ' ' + userProfile.apellidos,
        userProfile.rol
      );
      // Los mensajes se actualizan automáticamente via el listener en tiempo real
    } catch (error) {
      manejarError(error, 'Error al enviar mensaje');
    }
  }, [currentUser, userProfile, manejarError]);

  // Función para editar mensaje
  const editarMensajeExistente = useCallback(async (mensajeId: string, nuevoContenido: string) => {
    if (!currentUser) return;
    
    try {
      await editarMensaje(mensajeId, nuevoContenido, currentUser.uid);
      
      toast({
        title: "Mensaje editado",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      manejarError(error, 'Error al editar mensaje');
    }
  }, [currentUser, manejarError, toast]);

  // Función para eliminar mensaje
  const eliminarMensajeExistente = useCallback(async (mensajeId: string) => {
    if (!currentUser) return;
    
    try {
      await eliminarMensaje(mensajeId, currentUser.uid);
      
      toast({
        title: "Mensaje eliminado",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      manejarError(error, 'Error al eliminar mensaje');
    }
  }, [currentUser, manejarError, toast]);
  // Función para marcar mensajes como leídos
  const marcarComoLeido = useCallback(async (conversacionId: string) => {
    if (!currentUser) return;
    
    try {
      // Obtener el último mensaje de la conversación para marcar como leído
      if (mensajes.length === 0) return;
      
      const ultimoMensaje = mensajes[mensajes.length - 1];
      await marcarMensajesComoLeidos(conversacionId, currentUser.uid, ultimoMensaje.id);
    } catch (error) {
      console.error('Error al marcar mensajes como leídos:', error);
    }
  }, [currentUser, mensajes]);

  // Función para salir de conversación
  const salirConversacion = useCallback(async (conversacionId: string) => {
    if (!currentUser) return;
    
    try {
      await abandonarConversacion(conversacionId, currentUser.uid);
      
      toast({
        title: "Has salido de la conversación",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Si es la conversación actual, cerrarla
      if (conversacionActual?.id === conversacionId) {
        setConversacionActual(null);
        setMensajes([]);
        if (unsubscribeMensajes) {
          unsubscribeMensajes();
          setUnsubscribeMensajes(null);
        }
      }
      
      // Recargar conversaciones
      await cargarConversaciones();
      
    } catch (error) {
      manejarError(error, 'Error al salir de la conversación');
    }
  }, [currentUser, conversacionActual, unsubscribeMensajes, manejarError, toast, cargarConversaciones]);

  // Función para buscar mensajes
  const buscarEnMensajes = useCallback(async (filtros: FiltroMensajes): Promise<Mensaje[]> => {
    try {
      return await buscarMensajes(filtros);
    } catch (error) {
      manejarError(error, 'Error al buscar mensajes');
      return [];
    }
  }, [manejarError]);

  // Cargar conversaciones cuando cambie el usuario
  useEffect(() => {
    if (currentUser) {
      cargarConversaciones();
    } else {
      // Limpiar estado cuando no hay usuario
      setConversaciones([]);
      setConversacionActual(null);
      setMensajes([]);
      setMensajesNoLeidos(0);
      
      // Limpiar listeners
      if (unsubscribeMensajes) {
        unsubscribeMensajes();
        setUnsubscribeMensajes(null);
      }
    }
  }, [currentUser, cargarConversaciones]);

  // Limpiar listeners al desmontar
  useEffect(() => {
    return () => {
      if (unsubscribeMensajes) {
        unsubscribeMensajes();
      }
    };
  }, [unsubscribeMensajes]);

  const value: MensajeriaContextType = {
    // Estado
    conversaciones,
    conversacionActual,
    mensajes,
    cargandoConversaciones,
    cargandoMensajes,
    mensajesNoLeidos,
    error,
    
    // Acciones de conversaciones
    crearNuevaConversacion,
    seleccionarConversacion,
    salirConversacion,
    cargarConversaciones,
    
    // Acciones de mensajes
    enviarNuevoMensaje,
    editarMensajeExistente,
    eliminarMensajeExistente,
    marcarComoLeido,
    buscarEnMensajes,
    
    // Utilidades
    limpiarError,
  };

  return (
    <MensajeriaContext.Provider value={value}>
      {children}
    </MensajeriaContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useMensajeria = () => {
  const context = useContext(MensajeriaContext);
  if (context === undefined) {
    throw new Error('useMensajeria debe ser usado dentro de un MensajeriaProvider');
  }
  return context;
};
