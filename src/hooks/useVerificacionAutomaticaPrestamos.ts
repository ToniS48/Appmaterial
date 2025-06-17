import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { configurarVerificacionAutomatica } from '../services/prestamoService';

/**
 * Hook para gestionar la verificación automática de préstamos vencidos
 * Solo se ejecuta para administradores (optimizado para evitar ejecuciones múltiples)
 */
export const useVerificacionAutomaticaPrestamos = () => {
  const { userProfile } = useAuth();
  const cancelarVerificacion = useRef<(() => void) | null>(null);
  const isConfigured = useRef<boolean>(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Función debounced para configurar verificación
  const configurarVerificacionDebounced = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (!isConfigured.current && userProfile?.rol === 'admin') {
        console.log('🚀 Iniciando verificación automática de préstamos (solo admin)...');
        
        // Configurar verificación automática
        cancelarVerificacion.current = configurarVerificacionAutomatica();
        isConfigured.current = true;
      }
    }, 500); // Debounce de 500ms
  }, [userProfile?.rol]);

  useEffect(() => {
    // Solo ejecutar para administradores
    if (!userProfile || userProfile.rol !== 'admin') {
      // Limpiar si ya no es admin
      if (isConfigured.current && cancelarVerificacion.current) {
        cancelarVerificacion.current();
        cancelarVerificacion.current = null;
        isConfigured.current = false;
      }
      return;
    }

    configurarVerificacionDebounced();

    // Cleanup cuando el componente se desmonta o cambia el usuario
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (cancelarVerificacion.current) {
        cancelarVerificacion.current();
        cancelarVerificacion.current = null;
        isConfigured.current = false;
      }
    };
  }, [userProfile, configurarVerificacionDebounced]);

  // Función para ejecutar verificación manual
  const ejecutarVerificacionManual = async () => {
    if (!userProfile || userProfile.rol !== 'admin') {
      console.warn('⚠️ Solo los administradores pueden ejecutar verificación manual');
      return null;
    }

    try {
      const { marcarPrestamosVencidosAutomaticamente } = await import('../services/prestamoService');
      return await marcarPrestamosVencidosAutomaticamente();
    } catch (error) {
      console.error('❌ Error en verificación manual:', error);
      throw error;
    }
  };

  return {
    ejecutarVerificacionManual,
    isActive: userProfile?.rol === 'admin'
  };
};
