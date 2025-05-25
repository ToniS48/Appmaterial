import { useState, useEffect } from 'react';
import { listarUsuarios } from '../services/usuarioService';
import { obtenerPrestamosPorActividad } from '../services/prestamoService';
import { Usuario } from '../types/usuario';
import { Prestamo } from '../types/prestamo';
import { Actividad } from '../types/actividad';

interface UseActividadPageDataProps {
  actividad: Actividad | null;
  actividadId?: string;
  loading: boolean;
}

interface UseActividadPageDataReturn {
  participantes: Usuario[];
  prestamos: Prestamo[];
  addedToCalendar: boolean;
  setAddedToCalendar: (value: boolean) => void;
  loadingData: boolean;
  errorData: string | null;
  reloadData: () => Promise<void>;
}

/**
 * Hook para gestionar la carga de datos adicionales de la página de actividad
 * (participantes, préstamos, estado del calendario)
 */
export const useActividadPageData = ({
  actividad,
  actividadId,
  loading
}: UseActividadPageDataProps): UseActividadPageDataReturn => {
  const [participantes, setParticipantes] = useState<Usuario[]>([]);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [addedToCalendar, setAddedToCalendar] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [errorData, setErrorData] = useState<string | null>(null);

  // Función para cargar participantes
  const cargarParticipantes = async (): Promise<Usuario[]> => {
    if (!actividad?.participanteIds?.length) return [];
    
    const usuariosData = await listarUsuarios();
    return usuariosData.filter(u => actividad.participanteIds.includes(u.uid));
  };

  // Función para cargar préstamos
  const cargarPrestamos = async (): Promise<Prestamo[]> => {
    if (!actividadId) return [];
    return await obtenerPrestamosPorActividad(actividadId);
  };

  // Función para verificar estado del calendario
  const verificarCalendario = (): boolean => {
    if (!actividadId) return false;
    
    try {
      const addedActivities = localStorage.getItem('calendarActivities');
      if (addedActivities) {
        const activitiesArray = JSON.parse(addedActivities);
        return activitiesArray.includes(actividadId);
      }
    } catch (e) {
      console.error('Error parsing calendar activities from localStorage', e);
    }
    return false;
  };

  // Función para recargar todos los datos
  const reloadData = async () => {
    if (!actividad || loading) return;

    setLoadingData(true);
    setErrorData(null);

    try {
      const [participantesData, prestamosData] = await Promise.all([
        cargarParticipantes(),
        cargarPrestamos()
      ]);

      setParticipantes(participantesData);
      setPrestamos(prestamosData);
      setAddedToCalendar(verificarCalendario());
    } catch (error) {
      console.error('Error al cargar datos adicionales:', error);
      setErrorData('Error al cargar los datos de la actividad');
    } finally {
      setLoadingData(false);
    }
  };

  // Cargar datos cuando cambia la actividad
  useEffect(() => {
    reloadData();
  }, [actividad, loading]);

  // Verificar calendario por separado
  useEffect(() => {
    setAddedToCalendar(verificarCalendario());
  }, [actividadId]);

  return {
    participantes,
    prestamos,
    addedToCalendar,
    setAddedToCalendar,
    loadingData,
    errorData,
    reloadData
  };
};
