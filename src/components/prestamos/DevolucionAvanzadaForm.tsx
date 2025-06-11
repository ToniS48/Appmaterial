import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Box,
  useToast,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { Prestamo } from '../../types/prestamo';
import { registrarDevolucionConIncidencia } from '../../services/prestamoService';
import DatePicker from '../common/DatePicker';

interface DevolucionAvanzadaFormProps {
  isOpen: boolean;
  onClose: () => void;
  prestamo: Prestamo;
  onSuccess: () => void;
}

interface DevolucionFormData {
  fechaDevolucion: Date;
  cantidadDevuelta: number;
  observaciones: string;
  motivoNoDevuelto?: string;
  tieneIncidencia: 'si' | 'no';
  tipoIncidencia?: 'daño' | 'perdida' | 'mantenimiento' | 'otro';
  gravedadIncidencia?: 'baja' | 'media' | 'alta' | 'critica';
  descripcionIncidencia?: string;
}

const MOTIVOS_NO_DEVUELTO = [
  { value: 'actividad_extendida', label: 'Actividad extendida' },
  { value: 'mantenimiento_pendiente', label: 'Mantenimiento pendiente' },
  { value: 'transporte', label: 'Problemas de transporte' },
  { value: 'uso_continuado', label: 'Requiere uso continuado' },
  { value: 'otro', label: 'Otro motivo' }
];

const DevolucionAvanzadaForm: React.FC<DevolucionAvanzadaFormProps> = ({
  isOpen,
  onClose,
  prestamo,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset
  } = useForm<DevolucionFormData>({
    defaultValues: {
      fechaDevolucion: new Date(),
      cantidadDevuelta: prestamo.cantidadPrestada,
      observaciones: '',
      motivoNoDevuelto: '',
      tieneIncidencia: 'no'
    }
  });

  const cantidadDevuelta = watch('cantidadDevuelta');
  const tieneIncidencia = watch('tieneIncidencia');
  const cantidadNoDevuelta = prestamo.cantidadPrestada - cantidadDevuelta;

  const onSubmit = async (data: DevolucionFormData) => {
    try {
      setIsSubmitting(true);

      // Construir incidencia si se reporta alguna
      const incidencia = data.tieneIncidencia === 'si' ? {
        tipo: data.tipoIncidencia,
        gravedad: data.gravedadIncidencia,
        descripcion: data.descripcionIncidencia || ''
      } : undefined;

      // Construir observaciones completas
      let observacionesCompletas = data.observaciones || '';
      
      if (cantidadNoDevuelta > 0) {
        observacionesCompletas += `\n\n--- DEVOLUCIÓN PARCIAL ---`;
        observacionesCompletas += `\nCantidad devuelta: ${data.cantidadDevuelta} de ${prestamo.cantidadPrestada}`;
        observacionesCompletas += `\nCantidad no devuelta: ${cantidadNoDevuelta}`;
        if (data.motivoNoDevuelto) {
          const motivoLabel = MOTIVOS_NO_DEVUELTO.find(m => m.value === data.motivoNoDevuelto)?.label || data.motivoNoDevuelto;
          observacionesCompletas += `\nMotivo no devolución: ${motivoLabel}`;
        }
      }

      await registrarDevolucionConIncidencia(
        prestamo.id as string,
        observacionesCompletas,
        incidencia
      );

      toast({
        title: "Devolución registrada",
        description: cantidadNoDevuelta > 0 
          ? `Se han devuelto ${data.cantidadDevuelta} de ${prestamo.cantidadPrestada} unidades`
          : "Devolución completa registrada exitosamente",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      reset();
      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Error al registrar devolución:', error);
      toast({
        title: "Error",
        description: `No se pudo registrar la devolución: ${error.message}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Registrar Devolución</ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <VStack spacing={5} align="stretch">
              {/* Información del préstamo */}
              <Box p={4} bg="gray.50" borderRadius="md">
                <HStack justify="space-between" align="center" mb={2}>
                  <Text fontWeight="bold" fontSize="lg">{prestamo.nombreMaterial}</Text>
                  <Badge colorScheme="blue" fontSize="md">
                    {prestamo.cantidadPrestada} unidad{prestamo.cantidadPrestada > 1 ? 'es' : ''}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  Responsable: {prestamo.nombreUsuario}
                </Text>
                {prestamo.nombreActividad && (
                  <Text fontSize="sm" color="gray.600">
                    Actividad: {prestamo.nombreActividad}
                  </Text>
                )}
              </Box>

              {/* Fecha de devolución */}
              <FormControl isRequired isInvalid={!!errors.fechaDevolucion}>
                <FormLabel>Fecha de devolución</FormLabel>
                <Controller
                  name="fechaDevolucion"
                  control={control}
                  rules={{ required: 'La fecha de devolución es obligatoria' }}
                  render={({ field }) => (
                    <DatePicker
                      selectedDate={field.value}
                      onChange={(date: Date | null) => field.onChange(date)}
                    />
                  )}
                />
                {errors.fechaDevolucion && (
                  <FormErrorMessage>{errors.fechaDevolucion.message}</FormErrorMessage>
                )}
              </FormControl>

              {/* Cantidad a devolver - solo si la cantidad prestada es mayor a 1 */}
              {prestamo.cantidadPrestada > 1 && (
                <FormControl isRequired isInvalid={!!errors.cantidadDevuelta}>
                  <FormLabel>Cantidad a devolver</FormLabel>
                  <Controller
                    name="cantidadDevuelta"
                    control={control}
                    rules={{
                      required: 'Especifica la cantidad a devolver',
                      min: { value: 1, message: 'Debe devolver al menos 1 unidad' },
                      max: { 
                        value: prestamo.cantidadPrestada, 
                        message: `No puedes devolver más de ${prestamo.cantidadPrestada} unidades` 
                      }
                    }}
                    render={({ field }) => (
                      <NumberInput
                        value={field.value}
                        onChange={(valueString, valueNumber) => field.onChange(valueNumber)}
                        min={1}
                        max={prestamo.cantidadPrestada}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    )}
                  />
                  {errors.cantidadDevuelta && (
                    <FormErrorMessage>{errors.cantidadDevuelta.message}</FormErrorMessage>
                  )}
                  
                  {/* Mostrar información sobre cantidad no devuelta */}
                  {cantidadNoDevuelta > 0 && (
                    <Alert status="warning" mt={2} size="sm">
                      <AlertIcon />
                      <Text fontSize="sm">
                        Quedarán {cantidadNoDevuelta} unidad{cantidadNoDevuelta > 1 ? 'es' : ''} sin devolver
                      </Text>
                    </Alert>
                  )}
                </FormControl>
              )}

              {/* Motivo para lo no devuelto - solo si hay cantidad pendiente */}
              {cantidadNoDevuelta > 0 && (
                <FormControl isInvalid={!!errors.motivoNoDevuelto}>
                  <FormLabel>Motivo para las unidades no devueltas</FormLabel>
                  <Select
                    {...register('motivoNoDevuelto', {
                      required: 'Especifica el motivo para las unidades no devueltas'
                    })}
                    placeholder="Selecciona un motivo"
                  >
                    {MOTIVOS_NO_DEVUELTO.map(motivo => (
                      <option key={motivo.value} value={motivo.value}>
                        {motivo.label}
                      </option>
                    ))}
                  </Select>
                  {errors.motivoNoDevuelto && (
                    <FormErrorMessage>{errors.motivoNoDevuelto.message}</FormErrorMessage>
                  )}
                </FormControl>
              )}

              {/* Observaciones generales */}
              <FormControl isInvalid={!!errors.observaciones}>
                <FormLabel>Observaciones</FormLabel>
                <Textarea
                  {...register('observaciones')}
                  placeholder="Observaciones sobre la devolución..."
                  rows={3}
                />
                {errors.observaciones && (
                  <FormErrorMessage>{errors.observaciones.message}</FormErrorMessage>
                )}
              </FormControl>

              <Divider />

              {/* Reporte de incidencias */}
              <FormControl>
                <FormLabel>¿Hay alguna incidencia que reportar?</FormLabel>
                <Select {...register('tieneIncidencia')}>
                  <option value="no">No, todo está en orden</option>
                  <option value="si">Sí, hay una incidencia</option>
                </Select>
              </FormControl>

              {/* Campos de incidencia - solo si se reporta una */}
              {tieneIncidencia === 'si' && (
                <VStack spacing={4} align="stretch" p={4} bg="red.50" borderRadius="md">
                  <Text fontWeight="bold" color="red.700">Detalles de la incidencia</Text>
                  
                  <FormControl isRequired isInvalid={!!errors.tipoIncidencia}>
                    <FormLabel>Tipo de incidencia</FormLabel>
                    <Select
                      {...register('tipoIncidencia', {
                        required: 'Selecciona el tipo de incidencia'
                      })}
                      placeholder="Selecciona el tipo"
                    >
                      <option value="daño">Daño en el material</option>
                      <option value="perdida">Pérdida del material</option>
                      <option value="mantenimiento">Requiere mantenimiento</option>
                      <option value="otro">Otro</option>
                    </Select>
                    {errors.tipoIncidencia && (
                      <FormErrorMessage>{errors.tipoIncidencia.message}</FormErrorMessage>
                    )}
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.gravedadIncidencia}>
                    <FormLabel>Gravedad</FormLabel>
                    <Select
                      {...register('gravedadIncidencia', {
                        required: 'Selecciona la gravedad'
                      })}
                      placeholder="Selecciona la gravedad"
                    >
                      <option value="baja">Baja - Problema menor</option>
                      <option value="media">Media - Requiere atención</option>
                      <option value="alta">Alta - Problema serio</option>
                      <option value="critica">Crítica - Material inutilizable</option>
                    </Select>
                    {errors.gravedadIncidencia && (
                      <FormErrorMessage>{errors.gravedadIncidencia.message}</FormErrorMessage>
                    )}
                  </FormControl>

                  <FormControl isRequired isInvalid={!!errors.descripcionIncidencia}>
                    <FormLabel>Descripción detallada</FormLabel>
                    <Textarea
                      {...register('descripcionIncidencia', {
                        required: 'Describe la incidencia',
                        minLength: {
                          value: 10,
                          message: 'La descripción debe tener al menos 10 caracteres'
                        }
                      })}
                      placeholder="Describe con detalle la incidencia..."
                      rows={4}
                    />
                    {errors.descripcionIncidencia && (
                      <FormErrorMessage>{errors.descripcionIncidencia.message}</FormErrorMessage>
                    )}
                  </FormControl>
                </VStack>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button
                variant="outline"
                onClick={handleCancel}
                isDisabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                colorScheme="green"
                isLoading={isSubmitting}
                loadingText="Registrando..."
              >
                Registrar Devolución
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default DevolucionAvanzadaForm;
