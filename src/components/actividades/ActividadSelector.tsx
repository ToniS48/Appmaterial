import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
  Text,
  Button,
  useToast
} from '@chakra-ui/react';
import { listarActividades, obtenerActividad } from '../../services/actividadService';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { Actividad } from '../../types/actividad';

interface ActividadSelectorProps {
  name: string;
  control: Control<any>;
  errors?: FieldErrors;
  label?: string;
  isRequired?: boolean;
  filterByEstado?: string[];
  preselectedActividadId?: string; // Nueva propiedad para actividad preseleccionada
  onActivitySelected?: (actividad: Actividad | null) => void;
}

const ActividadSelector: React.FC<ActividadSelectorProps> = ({
  name,
  control,
  errors,
  label = "Actividad",
  isRequired = false,
  filterByEstado = ["planificada", "en_curso"],
  preselectedActividadId,
  onActivitySelected
}) => {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedPreselected, setLoadedPreselected] = useState(false);
  const toast = useToast();

  // Cargar actividad preseleccionada si existe
  useEffect(() => {
    const fetchPreselectedActividad = async () => {
      if (!preselectedActividadId) return;
      
      try {
        setIsLoading(true);
        const actividad = await obtenerActividad(preselectedActividadId);
        
        setActividades([actividad]);
        setLoadedPreselected(true);
        
        // Notificar al componente padre
        if (onActivitySelected) {
          onActivitySelected(actividad);
        }
      } catch (error) {
        console.error('Error al cargar actividad preseleccionada:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar la actividad preseleccionada',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (preselectedActividadId && !loadedPreselected) {
      fetchPreselectedActividad();
    }
  }, [preselectedActividadId, onActivitySelected, toast, loadedPreselected]);

  // Cargar lista de actividades solo cuando sea necesario
  useEffect(() => {
    // Si hay actividad preseleccionada y ya se cargó, no cargar otras
    if (preselectedActividadId && loadedPreselected) return;
    
    const fetchActividades = async () => {
      try {
        setIsLoading(true);
        const actividadesData = await listarActividades({ 
          estado: filterByEstado 
        });
        setActividades(actividadesData);
      } catch (error) {
        console.error('Error al cargar actividades:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las actividades',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActividades();
  }, [toast, filterByEstado, preselectedActividadId, loadedPreselected]);

  // Formatear fecha
  const formatFecha = (fecha: any): string => {
    if (!fecha) return '';
    
    const date = fecha instanceof Date 
      ? fecha 
      : fecha.toDate ? fecha.toDate() : new Date(fecha);
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <FormControl isRequired={isRequired} isInvalid={!!errors?.[name]}>
      <FormLabel>{label}</FormLabel>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            placeholder={preselectedActividadId ? undefined : "Seleccionar actividad"}
            isDisabled={isLoading || (actividades.length === 0 && !preselectedActividadId)}
            onChange={e => {
              field.onChange(e);
              if (onActivitySelected) {
                const selectedActivity = actividades.find(a => a.id === e.target.value) || null;
                onActivitySelected(selectedActivity);
              }
            }}
          >
            {!preselectedActividadId && <option value="">Sin actividad relacionada</option>}
            {actividades.map(actividad => (
              <option key={actividad.id} value={actividad.id}>
                {actividad.nombre} - {formatFecha(actividad.fechaInicio)}
              </option>
            ))}
          </Select>
        )}
      />
      {isLoading && (
        <Text fontSize="sm" color="gray.500" mt={1}>
          Cargando actividades...
        </Text>
      )}
      {!isLoading && actividades.length === 0 && !preselectedActividadId && (
        <Text fontSize="sm" color="gray.500" mt={1}>
          No hay actividades disponibles
        </Text>
      )}
      {errors?.[name] && (
        <FormErrorMessage>{errors[name]?.message?.toString()}</FormErrorMessage>
      )}
    </FormControl>
  );
};

export default ActividadSelector;
