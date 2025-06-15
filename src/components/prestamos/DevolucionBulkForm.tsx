import React, { useState, useEffect } from 'react';
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Switch,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { Prestamo } from '../../types/prestamo';
import { devolverTodosLosMaterialesActividad } from '../../services/prestamoService';
import DatePicker from '../common/DatePicker';

interface DevolucionBulkFormProps {
  isOpen: boolean;
  onClose: () => void;
  prestamos: Prestamo[];
  actividadNombre: string;
  onSuccess: () => void;
}

interface DevolucionBulkFormData {
  fechaDevolucion: Date;
  observacionesGenerales: string;
  tieneIncidenciaGeneral: boolean;
  tipoIncidenciaGeneral?: 'daño' | 'perdida' | 'mantenimiento' | 'otro';
  gravedadIncidenciaGeneral?: 'baja' | 'media' | 'alta' | 'critica';
  descripcionIncidenciaGeneral?: string;
  configuracionIndividual: boolean;
  materialesIndividuales: Record<string, {
    observaciones: string;
    tieneIncidencia: boolean;
    tipoIncidencia?: 'daño' | 'perdida' | 'mantenimiento' | 'otro';
    gravedadIncidencia?: 'baja' | 'media' | 'alta' | 'critica';
    descripcionIncidencia?: string;
  }>;
}

const TIPOS_INCIDENCIA = [
  { value: 'daño', label: 'Daño o deterioro' },
  { value: 'perdida', label: 'Pérdida' },
  { value: 'mantenimiento', label: 'Requiere mantenimiento' },
  { value: 'otro', label: 'Otro' }
];

const GRAVEDADES_INCIDENCIA = [
  { value: 'baja', label: 'Baja - Daño menor' },
  { value: 'media', label: 'Media - Requiere revisión' },
  { value: 'alta', label: 'Alta - Requiere reparación' },
  { value: 'critica', label: 'Crítica - Material inutilizable' }
];

const DevolucionBulkForm: React.FC<DevolucionBulkFormProps> = ({
  isOpen,
  onClose,
  prestamos,
  actividadNombre,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // Filtrar solo préstamos activos
  const prestamosActivos = prestamos.filter(p => p.estado === 'en_uso' || p.estado === 'por_devolver');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<DevolucionBulkFormData>({
    defaultValues: {
      fechaDevolucion: new Date(),
      observacionesGenerales: '',
      tieneIncidenciaGeneral: false,
      configuracionIndividual: false,
      materialesIndividuales: {}
    }
  });

  const configuracionIndividual = watch('configuracionIndividual');
  const tieneIncidenciaGeneral = watch('tieneIncidenciaGeneral');

  // Inicializar configuración individual para cada material
  useEffect(() => {
    const materialesConfig: Record<string, any> = {};
    prestamosActivos.forEach(prestamo => {
      materialesConfig[prestamo.id!] = {
        observaciones: '',
        tieneIncidencia: false,
        tipoIncidencia: undefined,
        gravedadIncidencia: undefined,
        descripcionIncidencia: ''
      };
    });
    setValue('materialesIndividuales', materialesConfig);
  }, [prestamosActivos, setValue]);

  const onSubmit = async (data: DevolucionBulkFormData) => {
    try {
      setIsSubmitting(true);

      // Construir observaciones para la devolución en bulk
      let observacionesFinal = data.observacionesGenerales;

      if (data.tieneIncidenciaGeneral && !data.configuracionIndividual) {
        // Incidencia general para todos los materiales
        observacionesFinal += `\n[INCIDENCIA GENERAL - ${data.tipoIncidenciaGeneral?.toUpperCase()}]`;
        if (data.gravedadIncidenciaGeneral) {
          observacionesFinal += ` Gravedad: ${data.gravedadIncidenciaGeneral}`;
        }
        if (data.descripcionIncidenciaGeneral) {
          observacionesFinal += ` - ${data.descripcionIncidenciaGeneral}`;
        }
      }

      if (data.configuracionIndividual) {
        // Añadir información de configuración individual
        observacionesFinal += '\n[CONFIGURACIÓN INDIVIDUAL POR MATERIAL]';
        Object.entries(data.materialesIndividuales).forEach(([prestamoId, config]) => {
          const prestamo = prestamosActivos.find(p => p.id === prestamoId);
          if (prestamo && (config.observaciones || config.tieneIncidencia)) {
            observacionesFinal += `\n- ${prestamo.nombreMaterial}: ${config.observaciones}`;
            if (config.tieneIncidencia) {
              observacionesFinal += ` [INCIDENCIA: ${config.tipoIncidencia} - ${config.gravedadIncidencia}]`;
              if (config.descripcionIncidencia) {
                observacionesFinal += ` ${config.descripcionIncidencia}`;
              }
            }
          }
        });
      }

      // Ejecutar devolución en bulk
      const resultado = await devolverTodosLosMaterialesActividad(
        prestamosActivos[0].actividadId!,
        observacionesFinal || `Devolución en lote de la actividad: ${actividadNombre}`
      );

      // Mostrar resultado
      if (resultado.exito > 0) {
        toast({
          title: '¡Devolución completada!',
          description: `Se devolvieron ${resultado.exito} material(es) de la actividad "${actividadNombre}"${resultado.errores.length > 0 ? ` (${resultado.errores.length} errores)` : ''}`,
          status: resultado.errores.length > 0 ? 'warning' : 'success',
          duration: 5000,
          isClosable: true,
        });

        // Si hay errores, mostrarlos en consola para debugging
        if (resultado.errores.length > 0) {
          console.error('Errores en devolución en lote:', resultado.errores);
        }

        onSuccess();
        onClose();
        reset();
      } else {
        toast({
          title: 'Sin materiales para devolver',
          description: `No se encontraron materiales activos para devolver en la actividad "${actividadNombre}"`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }

    } catch (error) {
      console.error('Error en devolución en lote:', error);
      toast({
        title: 'Error en la devolución',
        description: `Ocurrió un error al devolver los materiales de "${actividadNombre}". Intenta nuevamente.`,
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Text>Devolver todos los materiales</Text>
            <Badge colorScheme="blue" fontSize="sm">
              Actividad: {actividadNombre}
            </Badge>
            <Text fontSize="sm" color="gray.600">
              {prestamosActivos.length} material(es) para devolver
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <form onSubmit={handleSubmit(onSubmit)} id="devolucion-bulk-form">
            <VStack spacing={6} align="stretch">
              
              {/* Resumen de materiales */}
              <Box>
                <Text fontWeight="medium" mb={3}>Materiales a devolver:</Text>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Material</Th>
                      <Th>Cantidad</Th>
                      <Th>Estado</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {prestamosActivos.map(prestamo => (
                      <Tr key={prestamo.id}>
                        <Td>{prestamo.nombreMaterial}</Td>
                        <Td>{prestamo.cantidadPrestada}</Td>
                        <Td>
                          <Badge 
                            colorScheme={prestamo.estado === 'en_uso' ? 'green' : 'orange'}
                            size="sm"
                          >
                            {prestamo.estado}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              <Divider />

              {/* Fecha de devolución */}
              <FormControl>
                <FormLabel>Fecha de devolución</FormLabel>
                <Controller
                  name="fechaDevolucion"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={field.onChange}
                      showTimeSelect
                      dateFormat="dd/MM/yyyy HH:mm"
                      maxDate={new Date()}
                    />
                  )}
                />
              </FormControl>

              {/* Observaciones generales */}
              <FormControl>
                <FormLabel>Observaciones generales</FormLabel>
                <Textarea
                  {...register('observacionesGenerales')}
                  placeholder="Observaciones que aplican a todos los materiales de la actividad..."
                  rows={3}
                />
              </FormControl>

              {/* Incidencia general */}
              <FormControl>
                <FormLabel>
                  <HStack>
                    <Switch
                      {...register('tieneIncidenciaGeneral')}
                      colorScheme="orange"
                    />
                    <Text>Reportar incidencia general para todos los materiales</Text>
                  </HStack>
                </FormLabel>
              </FormControl>

              {tieneIncidenciaGeneral && (
                <Box p={4} bg="orange.50" borderRadius="md" borderLeft="4px solid" borderColor="orange.400">
                  <VStack spacing={4} align="stretch">
                    <FormControl isInvalid={!!errors.tipoIncidenciaGeneral}>
                      <FormLabel>Tipo de incidencia</FormLabel>
                      <Select
                        {...register('tipoIncidenciaGeneral', {
                          required: tieneIncidenciaGeneral ? 'Selecciona el tipo de incidencia' : false
                        })}
                        placeholder="Selecciona el tipo de incidencia"
                      >
                        {TIPOS_INCIDENCIA.map(tipo => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>
                        {errors.tipoIncidenciaGeneral?.message}
                      </FormErrorMessage>
                    </FormControl>

                    <FormControl isInvalid={!!errors.gravedadIncidenciaGeneral}>
                      <FormLabel>Gravedad</FormLabel>
                      <Select
                        {...register('gravedadIncidenciaGeneral', {
                          required: tieneIncidenciaGeneral ? 'Selecciona la gravedad' : false
                        })}
                        placeholder="Selecciona la gravedad"
                      >
                        {GRAVEDADES_INCIDENCIA.map(gravedad => (
                          <option key={gravedad.value} value={gravedad.value}>
                            {gravedad.label}
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>
                        {errors.gravedadIncidenciaGeneral?.message}
                      </FormErrorMessage>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Descripción de la incidencia</FormLabel>
                      <Textarea
                        {...register('descripcionIncidenciaGeneral')}
                        placeholder="Describe la incidencia que afecta a todos los materiales..."
                        rows={3}
                      />
                    </FormControl>
                  </VStack>
                </Box>
              )}

              {/* Configuración individual */}
              <FormControl>
                <FormLabel>
                  <HStack>
                    <Switch
                      {...register('configuracionIndividual')}
                      colorScheme="blue"
                    />
                    <Text>Configurar observaciones e incidencias por material individual</Text>
                  </HStack>
                </FormLabel>
              </FormControl>

              {configuracionIndividual && (
                <Box>
                  <Alert status="info" mb={4}>
                    <AlertIcon />
                    Configura observaciones e incidencias específicas para cada material
                  </Alert>

                  <Accordion allowMultiple>
                    {prestamosActivos.map(prestamo => (
                      <AccordionItem key={prestamo.id}>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            <HStack>
                              <Text fontWeight="medium">{prestamo.nombreMaterial}</Text>
                              <Badge size="sm" colorScheme="gray">
                                Cantidad: {prestamo.cantidadPrestada}
                              </Badge>
                            </HStack>
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                          <VStack spacing={4} align="stretch">
                            <FormControl>
                              <FormLabel>Observaciones específicas</FormLabel>
                              <Textarea
                                {...register(`materialesIndividuales.${prestamo.id}.observaciones`)}
                                placeholder={`Observaciones específicas para ${prestamo.nombreMaterial}...`}
                                rows={2}
                              />
                            </FormControl>

                            <FormControl>
                              <FormLabel>
                                <Checkbox
                                  {...register(`materialesIndividuales.${prestamo.id}.tieneIncidencia`)}
                                >
                                  Reportar incidencia para este material
                                </Checkbox>
                              </FormLabel>
                            </FormControl>

                            {watch(`materialesIndividuales.${prestamo.id}.tieneIncidencia`) && (
                              <Box p={3} bg="red.50" borderRadius="md" borderLeft="3px solid" borderColor="red.400">
                                <VStack spacing={3} align="stretch">
                                  <FormControl>
                                    <FormLabel>Tipo de incidencia</FormLabel>
                                    <Select
                                      {...register(`materialesIndividuales.${prestamo.id}.tipoIncidencia`)}
                                      placeholder="Selecciona el tipo"
                                      size="sm"
                                    >
                                      {TIPOS_INCIDENCIA.map(tipo => (
                                        <option key={tipo.value} value={tipo.value}>
                                          {tipo.label}
                                        </option>
                                      ))}
                                    </Select>
                                  </FormControl>

                                  <FormControl>
                                    <FormLabel>Gravedad</FormLabel>
                                    <Select
                                      {...register(`materialesIndividuales.${prestamo.id}.gravedadIncidencia`)}
                                      placeholder="Selecciona la gravedad"
                                      size="sm"
                                    >
                                      {GRAVEDADES_INCIDENCIA.map(gravedad => (
                                        <option key={gravedad.value} value={gravedad.value}>
                                          {gravedad.label}
                                        </option>
                                      ))}
                                    </Select>
                                  </FormControl>

                                  <FormControl>
                                    <FormLabel>Descripción</FormLabel>
                                    <Textarea
                                      {...register(`materialesIndividuales.${prestamo.id}.descripcionIncidencia`)}
                                      placeholder="Describe la incidencia específica..."
                                      rows={2}
                                      size="sm"
                                    />
                                  </FormControl>
                                </VStack>
                              </Box>
                            )}
                          </VStack>
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Box>
              )}

            </VStack>
          </form>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={handleClose} isDisabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="devolucion-bulk-form"
              colorScheme="green"
              isLoading={isSubmitting}
              loadingText="Devolviendo..."
            >
              Devolver todos los materiales ({prestamosActivos.length})
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DevolucionBulkForm;
