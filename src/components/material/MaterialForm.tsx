import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  Select, 
  Textarea, 
  FormErrorMessage,
  Stack,
  Heading,
  Divider,
  useToast,
  SimpleGrid,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import DatePicker from '../common/DatePicker';
import { crearMaterial, actualizarMaterial } from '../../services/materialService';
import { useAuth } from '../../contexts/AuthContext';
import messages from '../../constants/messages';

// Importamos el nuevo componente QR
import MaterialQRCode from './MaterialQRCode';

// Componentes específicos para cada tipo de material
import CuerdaForm from './CuerdaForm';
import AnclajeForm from './AnclajeForm';
import VariosForm from './VariosForm';

// Tipos de estado de material disponibles
const ESTADOS_MATERIAL = [
  { value: 'disponible', label: 'Disponible', color: 'green' },
  { value: 'prestado', label: 'Prestado', color: 'orange' },
  { value: 'mantenimiento', label: 'Mantenimiento', color: 'blue' },
  { value: 'baja', label: 'Baja', color: 'gray' },
  { value: 'perdido', label: 'Perdido', color: 'red' }
];

// Props de entrada para el formulario
interface MaterialFormProps {
  material?: any; // Material existente para editar (opcional)
  onSuccess?: () => void; // Callback para ejecutar al guardar exitosamente
  onCancel?: () => void; // Callback para cancelar
}

const MaterialForm: React.FC<MaterialFormProps> = ({ 
  material, 
  onSuccess, 
  onCancel 
}) => {
  // Estados y contextos
  const { currentUser } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tipoMaterial, setTipoMaterial] = useState(material?.tipo || '');
  const [savedMaterial, setSavedMaterial] = useState<any>(null);
  
  // Modal para mostrar el código QR
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Configuración del formulario con React Hook Form
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue,
    watch,
    reset,
    control
  } = useForm({
    defaultValues: material || {
      nombre: '',
      tipo: '',
      estado: 'disponible',
      fechaAdquisicion: new Date(),
      fechaUltimaRevision: new Date(),
      proximaRevision: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 meses por defecto
      observaciones: '',
      codigo: '' // Nuevo campo para código personalizado
    }
  });

  // Actualizar el estado del tipo de material cuando cambia
  const watchTipo = watch('tipo');
  useEffect(() => {
    setTipoMaterial(watchTipo);
  }, [watchTipo]);

  // Función para enviar el formulario
  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Preparamos los datos según el tipo de material
      const materialData = {
        ...data,
        fechaAdquisicion: data.fechaAdquisicion,
        fechaUltimaRevision: data.fechaUltimaRevision,
        proximaRevision: data.proximaRevision,
      };
      
      // Si es una cuerda y tiene año de fabricación, convertirlo a fecha completa (1 de enero del año especificado)
      if (data.tipo === 'cuerda' && data.fechaFabricacion) {
        const year = parseInt(data.fechaFabricacion);
        if (!isNaN(year)) {
          materialData.fechaFabricacion = new Date(year, 0, 1); // 1 de enero del año especificado
        }
      }

      // Si no hay código personalizado, generar uno automático basado en el tipo
      if (!materialData.codigo || materialData.codigo.trim() === '') {
        const prefix = data.tipo === 'cuerda' ? 'CRD' : 
                      data.tipo === 'anclaje' ? 'ANJ' : 'MAT';
        const timestamp = Date.now().toString().slice(-6);
        materialData.codigo = `${prefix}-${timestamp}`;
      }

      let resultado;
      
      // Guardar o actualizar el material en Firestore
      if (material?.id) {
        resultado = await actualizarMaterial(material.id, materialData);
        toast({
          title: "Material actualizado",
          description: "Se ha actualizado el material correctamente",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        
        // Guardar referencia al material actualizado para mostrar el QR
        setSavedMaterial({
          id: material.id,
          ...materialData
        });
        
      } else {
        resultado = await crearMaterial(materialData);
        toast({
          title: "Material creado",
          description: "Se ha registrado el nuevo material correctamente",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        
        // Guardar referencia al nuevo material para mostrar el QR
        setSavedMaterial(resultado);
        
        // Resetear formulario para un nuevo registro
        reset();
      }
      
      // Mostrar el modal con el código QR
      onOpen();
      
      // Ejecutar callback de éxito si existe
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error al guardar material:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar el material. Por favor, inténtalo de nuevo.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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
        <Heading size="md" mb={4}>
          {material ? 'Editar Material' : 'Nuevo Material'}
        </Heading>
        
        <Divider mb={4} />
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
          {/* CAMPOS BÁSICOS */}
          <FormControl isRequired isInvalid={!!errors.nombre}>
            <FormLabel>Nombre del material</FormLabel>
            <Input 
              {...register('nombre', { 
                required: 'El nombre es obligatorio',
                maxLength: { value: 100, message: 'El nombre es demasiado largo' }
              })} 
            />
            {errors.nombre && (
              <FormErrorMessage>{errors.nombre.message?.toString()}</FormErrorMessage>
            )}
          </FormControl>
          
          <FormControl isInvalid={!!errors.codigo}>
            <FormLabel>Código (opcional)</FormLabel>
            <Input 
              id="codigo"
              {...register('codigo')}
              placeholder="Código personalizado (se generará uno automático si se deja vacío)" 
            />
            {errors.codigo && (
              <FormErrorMessage>{errors.codigo.message?.toString()}</FormErrorMessage>
            )}
          </FormControl>
          
          <FormControl isRequired isInvalid={!!errors.tipo}>
            <FormLabel>Tipo de material</FormLabel>
            <Select 
              {...register('tipo', { 
                required: 'Seleccione un tipo de material' 
              })}
              placeholder="Seleccione un tipo"
            >
              <option value="cuerda">Cuerdas</option>
              <option value="anclaje">Anclajes</option>
              <option value="varios">Varios</option>
            </Select>
            {errors.tipo && (
              <FormErrorMessage>{errors.tipo.message?.toString()}</FormErrorMessage>
            )}
          </FormControl>
          
          <FormControl isRequired isInvalid={!!errors.estado}>
            <FormLabel>Estado</FormLabel>
            <Select 
              {...register('estado', { 
                required: 'Seleccione un estado' 
              })}
            >
              {ESTADOS_MATERIAL.map(estado => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </Select>
            {errors.estado && (
              <FormErrorMessage>{errors.estado.message?.toString()}</FormErrorMessage>
            )}
          </FormControl>
            <FormControl isRequired isInvalid={!!errors.fechaAdquisicion}>
            <FormLabel>Fecha de adquisición</FormLabel>
            <Controller
              name="fechaAdquisicion"
              control={control}
              rules={{ required: 'La fecha de adquisición es obligatoria' }}
              render={({ field }) => (
                <DatePicker
                  selectedDate={field.value}
                  onChange={(date: Date | null) => field.onChange(date)}
                />
              )}
            />
            {errors.fechaAdquisicion && (
              <FormErrorMessage>{errors.fechaAdquisicion.message?.toString()}</FormErrorMessage>
            )}
          </FormControl>
            <FormControl isRequired isInvalid={!!errors.fechaUltimaRevision}>
            <FormLabel>Última revisión</FormLabel>
            <Controller
              name="fechaUltimaRevision"
              control={control}
              rules={{ required: 'La fecha de última revisión es obligatoria' }}
              render={({ field }) => (
                <DatePicker
                  selectedDate={field.value}
                  onChange={(date: Date | null) => field.onChange(date)}
                />
              )}
            />
            {errors.fechaUltimaRevision && (
              <FormErrorMessage>{errors.fechaUltimaRevision.message?.toString()}</FormErrorMessage>
            )}
          </FormControl>
            <FormControl isRequired isInvalid={!!errors.proximaRevision}>
            <FormLabel>Próxima revisión</FormLabel>
            <Controller
              name="proximaRevision"
              control={control}
              rules={{ required: 'La fecha de próxima revisión es obligatoria' }}
              render={({ field }) => (
                <DatePicker
                  selectedDate={field.value}
                  onChange={(date: Date | null) => field.onChange(date)}
                />
              )}
            />
            {errors.proximaRevision && (
              <FormErrorMessage>{errors.proximaRevision.message?.toString()}</FormErrorMessage>
            )}
          </FormControl>
        </SimpleGrid>
        
        <FormControl mb={5} isInvalid={!!errors.observaciones}>
          <FormLabel>Observaciones</FormLabel>
          <Textarea 
            {...register('observaciones')} 
            placeholder="Observaciones adicionales sobre el material"
            rows={3}
          />
          {errors.observaciones && (
            <FormErrorMessage>{errors.observaciones.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
        
        <Divider mb={5} />
        
        {/* RENDERIZADO CONDICIONAL SEGÚN TIPO */}
        {tipoMaterial && (
          <Box mb={5}>
            <Heading size="sm" mb={3}>
              Detalles específicos
              <Badge ml={2} colorScheme={
                tipoMaterial === 'cuerda' ? 'blue' : 
                tipoMaterial === 'anclaje' ? 'orange' : 
                'purple'
              }>
                {tipoMaterial === 'cuerda' ? 'Cuerda' : 
                 tipoMaterial === 'anclaje' ? 'Anclaje' : 
                 'Material Varios'}
              </Badge>
            </Heading>
            
            {tipoMaterial === 'cuerda' && (
              <CuerdaForm 
                register={register} 
                errors={errors} 
                control={control} 
                setValue={setValue}
                watch={watch}
              />
            )}
            
            {tipoMaterial === 'anclaje' && (
              <AnclajeForm 
                register={register} 
                errors={errors} 
                control={control}
              />
            )}
            
            {tipoMaterial === 'varios' && (
              <VariosForm 
                register={register} 
                errors={errors} 
                control={control}
              />
            )}
          </Box>
        )}
        
        <Stack direction="row" spacing={4} justify="flex-end">
          {onCancel && (
            <Button 
              variant="outline" 
              onClick={onCancel}
              isDisabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
          
          <Button
            type="submit"
            colorScheme="brand"
            isLoading={isSubmitting}
            loadingText={messages.loading.processing}
          >
            {material ? messages.material.actualizar : messages.material.guardar}
          </Button>
        </Stack>
      </Box>
      
      {/* Modal para mostrar el código QR */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{messages.material.qrGenerado}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {savedMaterial && (
              <MaterialQRCode material={savedMaterial} />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default MaterialForm;