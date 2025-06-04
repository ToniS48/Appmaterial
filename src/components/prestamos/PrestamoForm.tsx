import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormErrorMessage,
  Stack,
  useToast,
  SimpleGrid,
  Textarea,
  Alert,
  AlertIcon,
  Text,
} from '@chakra-ui/react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import messages from '../../constants/messages';
import { useAuth } from '../../contexts/AuthContext';
import DatePicker from '../common/DatePicker';
import { crearPrestamo, actualizarEstadoPrestamo, actualizarPrestamo } from '../../services/prestamoService';
import { listarMateriales, obtenerMaterial } from '../../services/materialService';
import { listarUsuarios } from '../../services/usuarioService';
import { listarActividades, obtenerActividad } from '../../services/actividadService';
import { Prestamo, EstadoPrestamo } from '../../types/prestamo';
import { Actividad } from '../../types/actividad';
import { Usuario } from '../../types/usuario';
import { Material } from '../../types/material';
import { Timestamp } from 'firebase/firestore';
import ActividadSelector from '../actividades/ActividadSelector';
import { setupSchedulerOptimizer } from '../../utils/reactSchedulerOptimizer';

interface PrestamoFormData {
  materialId: string;
  usuarioId: string;
  actividadId?: string;
  fechaPrestamo: Date;
  fechaDevolucionPrevista: Date;
  estado: EstadoPrestamo;
  cantidadPrestada: number;
  observaciones?: string;
}

interface PrestamoFormProps {
  prestamo?: Prestamo;
  onSuccess?: () => void;
  onCancel?: () => void;
  preselectedMaterialId?: string;
  preselectedUsuarioId?: string;
  preselectedActividadId?: string;
}

const ESTADOS_PRESTAMO = [
  { value: 'en_uso', label: 'En uso' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'devuelto', label: 'Devuelto' },
  { value: 'perdido', label: 'Perdido' },
  { value: 'estropeado', label: 'Estropeado' }
];

const PrestamoForm: React.FC<PrestamoFormProps> = ({ 
  prestamo, 
  onSuccess, 
  onCancel,
  preselectedMaterialId,
  preselectedUsuarioId,
  preselectedActividadId
}) => {
  // OPTIMIZACIONES DE RENDIMIENTO
  // =============================
  useEffect(() => {
    const cleanup = setupSchedulerOptimizer();
    return cleanup;
  }, []);

  // Estados y contextos
  const { currentUser, userProfile } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [materiales, setMateriales] = useState<any[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [materialSeleccionado, setMaterialSeleccionado] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] = useState<Actividad | null>(null);
  
  // Configuración del formulario con React Hook Form
  const { 
    register, 
    handleSubmit, 
    control,
    formState: { errors }, 
    setValue,
    watch,
    reset
  } = useForm<PrestamoFormData>({
    defaultValues: prestamo ? {
      ...prestamo,
      fechaPrestamo: prestamo.fechaPrestamo instanceof Timestamp ? 
        prestamo.fechaPrestamo.toDate() : prestamo.fechaPrestamo,
      fechaDevolucionPrevista: prestamo.fechaDevolucionPrevista instanceof Timestamp ? 
        prestamo.fechaDevolucionPrevista.toDate() : prestamo.fechaDevolucionPrevista,
    } : {
      materialId: preselectedMaterialId || '',
      usuarioId: preselectedUsuarioId || '',
      actividadId: preselectedActividadId || '',
      fechaPrestamo: new Date(),
      fechaDevolucionPrevista: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 semanas por defecto
      estado: 'en_uso',
      cantidadPrestada: 1
    }
  });

  const materialId = watch('materialId');
  const cantidadPrestada = watch('cantidadPrestada');
  
  // Cargar datos necesarios al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar usuarios activos
        const usuariosData = await listarUsuarios();
        setUsuarios(usuariosData.filter(u => u.activo));
        
        // Cargar materiales disponibles
        const materialesData = await listarMateriales({ estado: 'disponible' });
        setMateriales(materialesData);
        
        // Cargar actividades planificadas o en curso
        const actividadesData = await listarActividades({
          estado: ['planificada', 'en_curso']
        });
        setActividades(actividadesData);
        
        // Si es edición, cargar también el material seleccionado
        if (prestamo?.materialId) {
          const material = await obtenerMaterial(prestamo.materialId);
          setMaterialSeleccionado(material);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };
    
    fetchData();
  }, [prestamo]);
  
  // Cargar actividad preseleccionada
  useEffect(() => {
    if (preselectedActividadId) {
      const loadPreselectedActivity = async () => {
        try {
          const activity = await obtenerActividad(preselectedActividadId);
          setSelectedActivity(activity);
          setValue('actividadId', preselectedActividadId);
        } catch (error) {
          console.error('Error al cargar actividad preseleccionada:', error);
        }
      };
      
      loadPreselectedActivity();
    }
  }, [preselectedActividadId, setValue]);

  // Actualizar material seleccionado cuando cambia el ID
  useEffect(() => {
    if (materialId) {
      const material = materiales.find(m => m.id === materialId);
      setMaterialSeleccionado(material);
      
      // Ajustar cantidad máxima disponible
      if (material && (material.cantidadDisponible || material.cantidadDisponible === 0)) {
        const maxCantidad = material.cantidadDisponible;
        if (cantidadPrestada > maxCantidad) {
          setValue('cantidadPrestada', maxCantidad);
        }
      }
    }  }, [materialId, materiales, setValue, cantidadPrestada]);

  const handleActivitySelect = (actividad: Actividad | null) => {
    setSelectedActivity(actividad);
    if (actividad && actividad.materiales && actividad.materiales.length > 0) {
      const materialActividad = actividad.materiales[0];
      if (materialActividad && !materialId) {
        setValue('materialId', materialActividad.materialId);
      }
    }
  };

  // Función para enviar el formulario
  const onSubmit: SubmitHandler<PrestamoFormData> = async (data) => {
    if (!userProfile) return;
    
    if (materialSeleccionado && materialSeleccionado.cantidadDisponible < data.cantidadPrestada) {
      toast({
        title: messages.prestamos.errorCantidad,
        description: messages.prestamos.cantidadInsuficiente.replace(
          '{cantidad}', 
          materialSeleccionado.cantidadDisponible.toString()
        ),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const material = materiales.find(m => m.id === data.materialId);
      const usuario = usuarios.find(u => u.uid === data.usuarioId);
      const actividad = data.actividadId ? 
        actividades.find(a => a.id === data.actividadId) : undefined;
      
      const prestamoData: Omit<Prestamo, 'id'> = {
        ...data,
        nombreMaterial: material?.nombre || 'Material desconocido',
        nombreUsuario: usuario ? `${usuario.nombre} ${usuario.apellidos}` : 'Usuario desconocido',
        nombreActividad: actividad?.nombre,
        registradoPor: userProfile.uid
      };

      let resultado;
      if (prestamo?.id) {
        // Actualizar préstamo existente
        resultado = await actualizarPrestamo(prestamo.id, prestamoData);
        toast({
          title: messages.prestamos.actualizado,
          description: messages.prestamos.actualizadoExito,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Crear nuevo préstamo
        resultado = await crearPrestamo(prestamoData);
        toast({
          title: messages.prestamos.registrado,
          description: messages.prestamos.registradoExito,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        reset();
      }
      
      // Ejecutar callback de éxito si existe
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error al guardar préstamo:", error);
      toast({
        title: messages.errors.general,
        description: messages.errors.errorGuardarPrestamo,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box 
      as="form" 
      onSubmit={handleSubmit(onSubmit)}
      className="form-container"
      p={5} 
      shadow="md" 
      borderWidth="1px" 
      borderRadius="md" 
      bg="white"
    >
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
        {/* CAMPOS BÁSICOS */}
        <FormControl isRequired isInvalid={!!errors.materialId}>
          <FormLabel>{messages.formularios.prestamo.material}</FormLabel>
          <Select {...register('materialId')} placeholder={messages.formularios.prestamo.seleccioneMaterial}>
            {materiales.map(material => (
              <option key={material.id} value={material.id}>
                {material.nombre} ({material.cantidadDisponible} {messages.formularios.prestamo.disponibles})
              </option>
            ))}
          </Select>
          {errors.materialId && (
            <FormErrorMessage>{errors.materialId.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.usuarioId}>
          <FormLabel>{messages.formularios.prestamo.usuario}</FormLabel>
          <Select {...register('usuarioId')} placeholder={messages.formularios.prestamo.seleccioneUsuario}>
            {usuarios.map(usuario => (
              <option key={usuario.uid} value={usuario.uid}>
                {usuario.nombre} {usuario.apellidos}
              </option>
            ))}
          </Select>
          {errors.usuarioId && (
            <FormErrorMessage>{errors.usuarioId.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
      </SimpleGrid>

      <Stack spacing={4}>
        <FormControl isRequired isInvalid={!!errors.fechaPrestamo}>
          <FormLabel>{messages.formularios.prestamo.fechaPrestamo}</FormLabel>
          <Controller
            control={control}
            name="fechaPrestamo"
            render={({ field }) => (
              <DatePicker 
                {...field} 
                control={control}
                selected={field.value instanceof Timestamp ? field.value.toDate() : field.value}
                onChange={(date: Date | null) => field.onChange(date ? Timestamp.fromDate(date) : null)}
              />
            )}
          />
          {errors.fechaPrestamo && (
            <FormErrorMessage>{errors.fechaPrestamo.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.fechaDevolucionPrevista}>
          <FormLabel>{messages.formularios.prestamo.fechaDevolucionPrevista}</FormLabel>
          <Controller
            control={control}
            name="fechaDevolucionPrevista"
            render={({ field }) => (
              <DatePicker 
                {...field} 
                control={control} 
                selected={field.value instanceof Timestamp ? field.value.toDate() : field.value}
                onChange={(date: Date | null) => field.onChange(date ? Timestamp.fromDate(date) : null)}
              />
            )}
          />
          {errors.fechaDevolucionPrevista && (
            <FormErrorMessage>{errors.fechaDevolucionPrevista.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.estado}>
          <FormLabel>{messages.formularios.prestamo.estado}</FormLabel>
          <Select {...register('estado')}>
            {ESTADOS_PRESTAMO.map(estado => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </Select>
          {errors.estado && (
            <FormErrorMessage>{errors.estado.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.cantidadPrestada}>
          <FormLabel>{messages.formularios.prestamo.cantidadPrestada}</FormLabel>
          <NumberInput
            min={1}
            max={materialSeleccionado?.cantidadDisponible || 1}
            value={cantidadPrestada}
            onChange={(valueString) => setValue('cantidadPrestada', parseInt(valueString))}
          >
            <NumberInputField {...register('cantidadPrestada')} />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          {errors.cantidadPrestada && (
            <FormErrorMessage>{errors.cantidadPrestada.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>

        <FormControl isInvalid={!!errors.observaciones}>
          <FormLabel>{messages.formularios.prestamo.observaciones}</FormLabel>
          <Textarea {...register('observaciones')} />
          {errors.observaciones && (
            <FormErrorMessage>{errors.observaciones.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
      </Stack>

      <Stack direction="row" spacing={4} mt={6}>
        <Button colorScheme="blue" type="submit" isLoading={isSubmitting}>
          {prestamo ? messages.prestamos.actualizar : messages.prestamos.registrar}
        </Button>
        <Button onClick={onCancel}>{messages.formularios.prestamo.cancelar}</Button>
      </Stack>
    </Box>
  );
};

export default PrestamoForm;