import { useToast } from '@chakra-ui/react';
import { finalizarActividad } from '../services/actividadService';
import { Actividad } from '../types/actividad';

interface UseActividadPageActionsProps {
  actividadId?: string;
  actividad: Actividad | null;
  addedToCalendar: boolean;
  setAddedToCalendar: (value: boolean) => void;
  saveActividad: () => Promise<boolean>;
  updateInfo: (data: Partial<Actividad>) => void;
  exitAllEditingModes: () => void;
}

interface UseActividadPageActionsReturn {
  handleAddToCalendar: () => void;
  handleFinalizarActividad: () => Promise<void>;
  handleSaveChanges: () => Promise<void>;
  handleCancelarActividad: () => void;
  formatDate: (date: any) => string;
  getEstadoColor: (estado: string) => string;
}

/**
 * Hook para gestionar todas las acciones de la página de actividad
 * (calendario, finalizar, guardar, cancelar, utilidades)
 */
export const useActividadPageActions = ({
  actividadId,
  actividad,
  addedToCalendar,
  setAddedToCalendar,
  saveActividad,
  updateInfo,
  exitAllEditingModes
}: UseActividadPageActionsProps): UseActividadPageActionsReturn => {
  const toast = useToast();

  // Añadir actividad al calendario local
  const handleAddToCalendar = () => {
    if (!actividadId || addedToCalendar) return;
    
    try {
      let activitiesArray = [];
      const saved = localStorage.getItem('calendarActivities');
      
      if (saved) {
        activitiesArray = JSON.parse(saved);
      }
      
      if (!activitiesArray.includes(actividadId)) {
        activitiesArray.push(actividadId);
        localStorage.setItem('calendarActivities', JSON.stringify(activitiesArray));
        setAddedToCalendar(true);
        
        toast({
          title: "Actividad añadida al calendario",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (e) {
      console.error('Error saving to localStorage', e);
      toast({
        title: "Error",
        description: "No se pudo añadir al calendario",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Función para finalizar actividad
  const handleFinalizarActividad = async () => {
    if (!actividadId) return;
    
    try {
      await finalizarActividad(actividadId);
      toast({
        title: "Actividad finalizada",
        description: "La actividad ha sido marcada como finalizada",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Recargar datos
      await saveActividad();
    } catch (error) {
      console.error('Error al finalizar actividad:', error);
      toast({
        title: "Error",
        description: "No se pudo finalizar la actividad",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Manejador de guardado con salida de modo edición
  const handleSaveChanges = async () => {
    const result = await saveActividad();
    if (result) {
      exitAllEditingModes();
      toast({
        title: "Cambios guardados",
        description: "Los cambios se han guardado correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Función para cancelar actividad
  const handleCancelarActividad = () => {
    if (!actividad) return;
    
    updateInfo({ estado: 'cancelada' });
    toast({
      title: "Actividad cancelada",
      description: "La actividad ha sido cancelada correctamente",
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
  };

  // Obtener color para el estado de la actividad
  const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case 'planificada': return 'yellow';
      case 'en_curso': return 'green';
      case 'finalizada': return 'blue';
      case 'cancelada': return 'red';
      default: return 'gray';
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (date: any): string => {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    handleAddToCalendar,
    handleFinalizarActividad,
    handleSaveChanges,
    handleCancelarActividad,
    formatDate,
    getEstadoColor
  };
};
