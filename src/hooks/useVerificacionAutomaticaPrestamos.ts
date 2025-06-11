import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { configurarVerificacionAutomatica } from '../services/prestamoService';

/**
 * Hook para gestionar la verificación automática de préstamos vencidos
 * Solo se ejecuta para administradores
 */
export const useVerificacionAutomaticaPrestamos = () => {
  const { userProfile } = useAuth();
  const cancelarVerificacion = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Solo ejecutar para administradores
    if (!userProfile || userProfile.rol !== 'admin') {
      return;
    }

    console.log('🚀 Iniciando verificación automática de préstamos (solo admin)...');

    // Configurar verificación automática
    cancelarVerificacion.current = configurarVerificacionAutomatica();

    // Cleanup cuando el componente se desmonta o cambia el usuario
    return () => {
      if (cancelarVerificacion.current) {
        cancelarVerificacion.current();
        cancelarVerificacion.current = null;
      }
    };
  }, [userProfile]);

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
