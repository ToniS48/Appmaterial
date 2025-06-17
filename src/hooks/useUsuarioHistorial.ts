/**
 * Hook personalizado para gestión del historial de usuarios
 * Facilita el registro automático de eventos y seguimiento de estados
 */
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { 
  TipoEventoUsuario, 
  EstadoAprobacion, 
  EstadoActividad,
  EventoUsuario 
} from '../types/usuarioHistorial';
import { Usuario } from '../types/usuario';
import { usuarioHistorialService } from '../services/domain/UsuarioHistorialService';

interface UseUsuarioHistorialOptions {
  autoActualizarEstado?: boolean; // Si debe actualizar automáticamente el estado del usuario
  mostrarNotificaciones?: boolean; // Si debe mostrar toast notifications
}

interface RegistrarEventoParams {
  usuarioId: string;
  nombreUsuario: string;
  emailUsuario: string;
  tipoEvento: TipoEventoUsuario;
  descripcion: string;
  responsableId?: string;
  responsableNombre?: string;
  actividadId?: string;
  actividadNombre?: string;
  rolAnterior?: string;
  rolNuevo?: string;
  motivoSuspension?: string;
  observaciones?: string;
}

export const useUsuarioHistorial = (options: UseUsuarioHistorialOptions = {}) => {
  const {
    autoActualizarEstado = true,
    mostrarNotificaciones = true
  } = options;

  const toast = useToast();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Registrar un evento en el historial del usuario
   */
  const registrarEvento = useCallback(async (params: RegistrarEventoParams): Promise<string | null> => {
    setCargando(true);
    setError(null);

    try {
      const eventoId = await usuarioHistorialService.registrarEvento({
        ...params,
        fecha: new Date()
      });

      if (mostrarNotificaciones) {
        toast({
          title: 'Evento registrado',
          description: `Se registró: ${params.tipoEvento} para ${params.nombreUsuario}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      return eventoId;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar evento';
      setError(errorMsg);
      
      if (mostrarNotificaciones) {
        toast({
          title: 'Error',
          description: errorMsg,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }

      return null;
    } finally {
      setCargando(false);
    }
  }, [toast, mostrarNotificaciones]);

  /**
   * Registrar evento de registro de nuevo usuario
   */
  const registrarRegistro = useCallback(async (usuario: Usuario, responsableId?: string): Promise<string | null> => {
    return registrarEvento({
      usuarioId: usuario.uid,
      nombreUsuario: `${usuario.nombre} ${usuario.apellidos}`,
      emailUsuario: usuario.email,
      tipoEvento: TipoEventoUsuario.REGISTRO,
      descripcion: `Usuario registrado con rol: ${usuario.rol}`,
      responsableId,
      observaciones: `Registro inicial en el sistema`
    });
  }, [registrarEvento]);

  /**
   * Registrar evento de aprobación de usuario
   */
  const registrarAprobacion = useCallback(async (
    usuario: Usuario, 
    responsableId: string, 
    responsableNombre: string
  ): Promise<string | null> => {
    return registrarEvento({
      usuarioId: usuario.uid,
      nombreUsuario: `${usuario.nombre} ${usuario.apellidos}`,
      emailUsuario: usuario.email,
      tipoEvento: TipoEventoUsuario.APROBACION,
      descripcion: `Usuario aprobado por ${responsableNombre}`,
      responsableId,
      responsableNombre,
      observaciones: `Cambio de estado: pendiente → aprobado`
    });
  }, [registrarEvento]);

  /**
   * Registrar evento de rechazo de usuario
   */
  const registrarRechazo = useCallback(async (
    usuario: Usuario, 
    motivo: string,
    responsableId: string, 
    responsableNombre: string
  ): Promise<string | null> => {
    return registrarEvento({
      usuarioId: usuario.uid,
      nombreUsuario: `${usuario.nombre} ${usuario.apellidos}`,
      emailUsuario: usuario.email,
      tipoEvento: TipoEventoUsuario.RECHAZO,
      descripcion: `Usuario rechazado: ${motivo}`,
      responsableId,
      responsableNombre,
      motivoSuspension: motivo,
      observaciones: `Cambio de estado: pendiente → rechazado`
    });
  }, [registrarEvento]);

  /**
   * Registrar evento de suspensión de usuario
   */
  const registrarSuspension = useCallback(async (
    usuario: Usuario,
    motivo: string,
    responsableId: string,
    responsableNombre: string
  ): Promise<string | null> => {
    return registrarEvento({
      usuarioId: usuario.uid,
      nombreUsuario: `${usuario.nombre} ${usuario.apellidos}`,
      emailUsuario: usuario.email,
      tipoEvento: TipoEventoUsuario.SUSPENSION,
      descripcion: `Usuario suspendido: ${motivo}`,
      responsableId,
      responsableNombre,
      motivoSuspension: motivo,
      observaciones: `Usuario suspendido temporalmente`
    });
  }, [registrarEvento]);

  /**
   * Registrar evento de cambio de rol
   */
  const registrarCambioRol = useCallback(async (
    usuario: Usuario,
    rolAnterior: string,
    rolNuevo: string,
    responsableId: string,
    responsableNombre: string
  ): Promise<string | null> => {
    return registrarEvento({
      usuarioId: usuario.uid,
      nombreUsuario: `${usuario.nombre} ${usuario.apellidos}`,
      emailUsuario: usuario.email,
      tipoEvento: TipoEventoUsuario.CAMBIO_ROL,
      descripcion: `Cambio de rol de ${rolAnterior} a ${rolNuevo}`,
      responsableId,
      responsableNombre,
      rolAnterior,
      rolNuevo,
      observaciones: `Actualización de permisos y accesos`
    });
  }, [registrarEvento]);

  /**
   * Registrar evento de participación en actividad (para calcular actividad)
   */
  const registrarParticipacionActividad = useCallback(async (
    usuario: Usuario,
    actividadId: string,
    actividadNombre: string
  ): Promise<string | null> => {
    return registrarEvento({
      usuarioId: usuario.uid,
      nombreUsuario: `${usuario.nombre} ${usuario.apellidos}`,
      emailUsuario: usuario.email,
      tipoEvento: TipoEventoUsuario.ULTIMA_CONEXION, // Se usa para tracking de actividad
      descripcion: `Participación en actividad: ${actividadNombre}`,
      actividadId,
      actividadNombre,
      observaciones: `Registro de participación para cálculo de actividad`
    });
  }, [registrarEvento]);

  /**
   * Actualizar estado completo del usuario (aprobación y actividad)
   */
  const actualizarEstadoUsuario = useCallback(async (
    usuarioId: string,
    usuario: Usuario
  ): Promise<{
    estadoAprobacion: EstadoAprobacion;
    estadoActividad: EstadoActividad;
    cambios: string[];
  } | null> => {
    if (!autoActualizarEstado) {
      console.warn('autoActualizarEstado está deshabilitado');
      return null;
    }

    setCargando(true);
    setError(null);

    try {
      const resultado = await usuarioHistorialService.actualizarEstadoUsuario(usuarioId, usuario);
      
      if (resultado.cambios.length > 0 && mostrarNotificaciones) {
        toast({
          title: 'Estado actualizado',
          description: `Cambios detectados: ${resultado.cambios.join(', ')}`,
          status: 'info',
          duration: 4000,
          isClosable: true,
        });
      }

      return resultado;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar estado';
      setError(errorMsg);
      
      if (mostrarNotificaciones) {
        toast({
          title: 'Error',
          description: errorMsg,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }

      return null;
    } finally {
      setCargando(false);
    }
  }, [autoActualizarEstado, mostrarNotificaciones, toast]);

  /**
   * Limpiar el estado de error
   */
  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estado
    cargando,
    error,
    
    // Funciones principales
    registrarEvento,
    actualizarEstadoUsuario,
    
    // Funciones específicas para eventos comunes
    registrarRegistro,
    registrarAprobacion,
    registrarRechazo,
    registrarSuspension,
    registrarCambioRol,
    registrarParticipacionActividad,
    
    // Utilidades
    limpiarError
  };
};
