import { useMemo } from 'react';
import { Actividad } from '../types/actividad';

interface UseActividadPagePermissionsProps {
  actividad: Actividad | null;
  currentUserId?: string;
}

interface UseActividadPagePermissionsReturn {
  esResponsable: boolean;
  puedeEditar: boolean;
  puedeGestionar: boolean;
  totalEnlaces: number;
}

/**
 * Hook para gestionar permisos y cálculos derivados de la actividad
 */
export const useActividadPagePermissions = ({
  actividad,
  currentUserId
}: UseActividadPagePermissionsProps): UseActividadPagePermissionsReturn => {
  
  // Determinar si el usuario actual es responsable
  const esResponsable = useMemo(() => {
    if (!currentUserId || !actividad) return false;
    
    return currentUserId === actividad.creadorId || 
           currentUserId === actividad.responsableActividadId ||
           currentUserId === actividad.responsableMaterialId;
  }, [currentUserId, actividad]);

  // Determinar si puede editar (responsable + actividad no finalizada/cancelada)
  const puedeEditar = useMemo(() => {
    if (!esResponsable || !actividad) return false;
    
    return actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada';
  }, [esResponsable, actividad]);

  // Determinar si puede gestionar (mismas condiciones que editar)
  const puedeGestionar = puedeEditar;

  // Calcular total de enlaces
  const totalEnlaces = useMemo(() => {
    if (!actividad) return 0;
    
    return (
      (actividad.enlacesWikiloc?.length || 0) + 
      (actividad.enlacesTopografias?.length || 0) + 
      (actividad.enlacesDrive?.length || 0) + 
      (actividad.enlacesWeb?.length || 0)
    );
  }, [actividad]);

  return {
    esResponsable,
    puedeEditar,
    puedeGestionar,
    totalEnlaces
  };
};
