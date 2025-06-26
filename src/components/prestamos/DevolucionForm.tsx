import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import {
  Box, 
  Heading,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  FormErrorMessage,
  SimpleGrid,
  Stack,
  Badge,
  Text,
  Divider,
  useToast,
  Flex
} from '@chakra-ui/react';
import DatePicker from '../common/DatePicker';
import { registrarDevolucion, registrarDevolucionConIncidencia } from '../../services/prestamoService';
import { useAuth } from '../../contexts/AuthContext';
import { Prestamo } from '../../types/prestamo';
import messages from '../../constants/messages'; // Importamos los mensajes centralizados
import { Timestamp } from 'firebase/firestore';

interface DevolucionFormProps {
  prestamo: Prestamo;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface DevolucionFormData {
  fechaDevolucion: Date;
  observaciones: string;
  tieneIncidencia: 'si' | 'no';
  tipoIncidencia?: 'daño' | 'perdida' | 'mantenimiento' | 'otro';
  gravedadIncidencia?: 'baja' | 'media' | 'alta' | 'critica';
  descripcionIncidencia?: string;
}

const DevolucionForm: React.FC<DevolucionFormProps> = ({ prestamo, onSuccess, onCancel }) => {
  const { userProfile } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<DevolucionFormData>({
    defaultValues: {
      fechaDevolucion: new Date(),
      observaciones: '',
      tieneIncidencia: 'no'
    }
  });
  
  // Watch para mostrar/ocultar campos dependiendo de si tiene incidencia
  const tieneIncidencia = watch('tieneIncidencia');
  
  const onSubmit = async (data: DevolucionFormData) => {
    if (!userProfile) return;
    
    try {
      setIsSubmitting(true);
      
      const incidencia = data.tieneIncidencia === 'si' ? {
        tipo: data.tipoIncidencia,
        gravedad: data.gravedadIncidencia,
        descripcion: data.descripcionIncidencia || ''
      } : undefined;
      
      await registrarDevolucionConIncidencia(
        prestamo.id as string, 
        data.observaciones,
        incidencia
      );
      
      toast({
        title: messages.material.devoluciones.devolucionRegistrada,
        description: incidencia 
          ? messages.material.devoluciones.devolucionRegistrada 
          : messages.material.devoluciones.materialDevuelto,
        status: "success",
        duration: 5000,
      });
      
      if (onSuccess) onSuccess();
      
    } catch (error: any) {
      console.error('Error al registrar devolución:', error);
      toast({
        title: "Error",
        description: `No se pudo registrar la devolución: ${error.message}`,
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Box 
      as="form" 
      onSubmit={handleSubmit(onSubmit)}
      p={5} 
      shadow="md" 
      borderWidth="1px" 
      borderRadius="md" 
      bg="white"
    >
      <Heading size="md" mb={4}>{messages.material.devoluciones.registrar}</Heading>
      
      <Divider mb={4} />
      
      {/* Información del material */}
      <Box mb={4} p={3} bg="gray.50" borderRadius="md">
        <Flex justify="space-between" align="center">
          <Text fontWeight="bold" fontSize="lg">{prestamo.nombreMaterial}</Text>
          <Badge colorScheme="blue">{prestamo.cantidadPrestada} unidad(es)</Badge>
        </Flex>
        <Text fontSize="sm">Responsable: {prestamo.nombreUsuario}</Text>
        {prestamo.nombreActividad && (
          <Text fontSize="sm">Actividad: {prestamo.nombreActividad}</Text>
        )}
      </Box>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
        <FormControl isRequired isInvalid={!!errors.fechaDevolucion}>
          <FormLabel>{messages.material.devoluciones.fechaDevolución}</FormLabel>
          <Controller
            name="fechaDevolucion"
            control={control}
            rules={{ required: 'La fecha de devolución es obligatoria' }}
            render={({ field }) => (
              <DatePicker
                name={field.name}
                control={control}
                selected={field.value instanceof Timestamp ? field.value.toDate() : field.value}
                onChange={(date: Date | null) => field.onChange(date ? Timestamp.fromDate(date) : null)}
              />
            )}
          />
          {errors.fechaDevolucion && (
            <FormErrorMessage>{errors.fechaDevolucion.message}</FormErrorMessage>
          )}
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.tieneIncidencia}>
          <FormLabel>{messages.material.devoluciones.tieneIncidencia}</FormLabel>
          <Select {...register('tieneIncidencia', { required: 'Este campo es obligatorio' })}>
            <option value="no">{messages.material.devoluciones.opcionNoIncidencia}</option>
            <option value="si">{messages.material.devoluciones.opcionSiIncidencia}</option>
          </Select>
          {errors.tieneIncidencia && (
            <FormErrorMessage>{errors.tieneIncidencia.message}</FormErrorMessage>
          )}
        </FormControl>
      </SimpleGrid>
      
      {/* Campos adicionales que solo se muestran si hay incidencia */}
      {tieneIncidencia === 'si' && (
        <>
          <Divider mb={4} />
          <Heading size="sm" mb={3}>{messages.material.devoluciones.detallesIncidencia}</Heading>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
            <FormControl isRequired isInvalid={!!errors.tipoIncidencia}>
              <FormLabel>{messages.material.devoluciones.tipoIncidencia}</FormLabel>
              <Select 
                {...register('tipoIncidencia', { 
                  required: tieneIncidencia === 'si' ? 'Seleccione un tipo de incidencia' : false
                })}
              >
                <option value="daño">{messages.material.devoluciones.tiposIncidencia.daño}</option>
                <option value="perdida">{messages.material.devoluciones.tiposIncidencia.perdida}</option>
                <option value="mantenimiento">{messages.material.devoluciones.tiposIncidencia.mantenimiento}</option>
                <option value="otro">{messages.material.devoluciones.tiposIncidencia.otro}</option>
              </Select>
              {errors.tipoIncidencia && (
                <FormErrorMessage>{errors.tipoIncidencia.message}</FormErrorMessage>
              )}
            </FormControl>
            
            <FormControl isRequired isInvalid={!!errors.gravedadIncidencia}>
              <FormLabel>{messages.material.devoluciones.gravedadIncidencia}</FormLabel>
              <Select 
                {...register('gravedadIncidencia', { 
                  required: tieneIncidencia === 'si' ? 'Seleccione la gravedad de la incidencia' : false
                })}
              >
                <option value="baja">{messages.material.devoluciones.nivelesGravedad.baja}</option>
                <option value="media">{messages.material.devoluciones.nivelesGravedad.media}</option>
                <option value="alta">{messages.material.devoluciones.nivelesGravedad.alta}</option>
                <option value="critica">{messages.material.devoluciones.nivelesGravedad.critica}</option>
              </Select>
              {errors.gravedadIncidencia && (
                <FormErrorMessage>{errors.gravedadIncidencia.message}</FormErrorMessage>
              )}
            </FormControl>
          </SimpleGrid>
          
          <FormControl isRequired isInvalid={!!errors.descripcionIncidencia} mb={6}>
            <FormLabel>{messages.material.devoluciones.descripcionIncidencia}</FormLabel>
            <Textarea 
              {...register('descripcionIncidencia', { 
                required: tieneIncidencia === 'si' ? 'La descripción de la incidencia es obligatoria' : false,
                minLength: {
                  value: 10,
                  message: 'La descripción debe tener al menos 10 caracteres'
                }
              })}
              placeholder="Describe con detalle la incidencia detectada"
              rows={4}
            />
            {errors.descripcionIncidencia && (
              <FormErrorMessage>{errors.descripcionIncidencia.message}</FormErrorMessage>
            )}
          </FormControl>
        </>
      )}
      
      <FormControl mb={6} isInvalid={!!errors.observaciones}>
        <FormLabel>{messages.material.devoluciones.observaciones}</FormLabel>
        <Textarea 
          {...register('observaciones')}
          placeholder="Observaciones sobre la devolución"
          rows={3}
        />
        {errors.observaciones && (
          <FormErrorMessage>{errors.observaciones.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      <Stack direction="row" spacing={4} justify="flex-end">
        {onCancel && (
          <Button 
            variant="outline" 
            onClick={onCancel}
            isDisabled={isSubmitting}
          >
            {messages.actions.cancel}
          </Button>
        )}
        
        <Button
          type="submit"
          colorScheme="brand"
          isLoading={isSubmitting}
          loadingText="Registrando devolución"
        >
          {messages.material.devoluciones.registrar}
        </Button>
      </Stack>
    </Box>
  );
};

export default DevolucionForm;
