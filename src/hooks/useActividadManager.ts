import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { Actividad } from '../types/actividad';
import { actualizarActividad } from '../services/actividadService';
import { Timestamp } from 'firebase/firestore';
import { validateActividad } from '../utils/actividadUtils';

/**
 * Hook personalizado para gestionar operaciones comunes con actividades
 * @param actividadId Identificador opcional de la actividad a gestionar
 */
export const useActividadManager = (actividadId?: string) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [actividad, setActividad] = useState<Actividad | null>(null);
  
  /**
   * Función centralizada para actualizar actividades
   */
  const handleActualizacionActividad = async (
    id: string,
    dataToUpdate: Partial<Actividad>,
    successMessage: string,
    errorMessage: string,
    callback?: () => void
  ) => {
    try {
      // Validar datos si son críticos (comprobamos si se están actualizando campos importantes)
      if ('nombre' in dataToUpdate || 'lugar' in dataToUpdate || 
          'fechaInicio' in dataToUpdate || 'fechaFin' in dataToUpdate ||
          'tipo' in dataToUpdate || 'subtipo' in dataToUpdate) {
        
        // Combinar datos actuales con nuevos datos para validación completa
        const dataToValidate = actividad ? { ...actividad, ...dataToUpdate } : dataToUpdate;
        const validationError = validateActividad(dataToValidate);
        
        if (validationError) {
          toast({
            title: "Error de validación",
            description: validationError,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return;
        }
      }
      
      setLoading(true);
      
      // Añadir timestamp de actualización automáticamente
      const dataWithTimestamp = {
        ...dataToUpdate,
        fechaActualizacion: Timestamp.fromDate(new Date())
      };
      
      // Actualizar actividad en la base de datos
      const actividadActualizada = await actualizarActividad(id, dataWithTimestamp);
      
      // Actualizar estado local si es necesario
      if (actividadId === id) {
        setActividad(actividadActualizada);
      }
      
      // Mostrar mensaje de éxito
      toast({
        title: "¡Éxito!",
        description: successMessage,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Ejecutar callback si existe
      if (callback && typeof callback === 'function') {
        callback();
      }
      
      return actividadActualizada;
    } catch (error) {
      console.error('Error al actualizar actividad:', error);
      
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      }
  };
  
  return {
    loading,
    actividad,
    setActividad,
    handleActualizacionActividad
  };
};
