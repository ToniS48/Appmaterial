import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  FormErrorMessage,
  Stack,
  Heading,
  Divider,
  useToast,
  SimpleGrid,
  Textarea,
  Avatar,
  Center,
  VStack
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { actualizarUsuario } from '../../services/usuarioService';
import { Usuario } from '../../types/usuario';

interface PerfilFormData {
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;
  telefonosEmergencia?: string;
  observaciones?: string;
}

const PerfilForm: React.FC = () => {
  const { userProfile, refreshUserProfile } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Convertir datos del usuario para el formulario
  const getFormValues = (): PerfilFormData => {
    return {
      nombre: userProfile?.nombre || '',
      apellidos: userProfile?.apellidos || '',
      email: userProfile?.email || '',
      telefono: userProfile?.telefono || '',
      telefonosEmergencia: userProfile?.telefonosEmergencia?.join(', ') || '',
      observaciones: userProfile?.observaciones || ''
    };
  };

  // Configuración del formulario con React Hook Form
  const { 
    register, 
    handleSubmit, 
    formState: { errors }
  } = useForm<PerfilFormData>({
    defaultValues: getFormValues()
  });

  // Función para enviar el formulario
  const onSubmit: SubmitHandler<PerfilFormData> = async (data) => {
    if (!userProfile?.uid) {
      toast({
        title: 'Error',
        description: 'No se pudo identificar al usuario actual',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Procesar teléfonos de emergencia
      const telefonosEmergencia = data.telefonosEmergencia
        ? data.telefonosEmergencia.split(',').map(tel => tel.trim())
        : undefined;

      // Preparar datos a actualizar
      const updateData: Partial<Usuario> = {
        nombre: data.nombre,
        apellidos: data.apellidos,
        telefono: data.telefono,
        telefonosEmergencia,
        observaciones: data.observaciones
      };
      
      // Actualizar perfil en Firestore
      await actualizarUsuario(userProfile.uid, updateData);
      
      // Recargar datos del perfil
      if (refreshUserProfile) {
        await refreshUserProfile();
      }
      
      toast({
        title: 'Perfil actualizado',
        description: 'Tu información ha sido actualizada correctamente',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `No se pudo actualizar el perfil: ${error.message}`,
        status: 'error',
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
      p={6} 
      shadow="md" 
      borderWidth="1px" 
      borderRadius="md" 
      bg="white"
    >
      <VStack spacing={6} mb={6}>
        <Heading size="md">Mi Perfil</Heading>
        <Center>
          <Avatar 
            size="2xl" 
            name={`${userProfile?.nombre} ${userProfile?.apellidos}`} 
          />
        </Center>
      </VStack>
      
      <Divider mb={6} />
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
        <FormControl isRequired isInvalid={!!errors.nombre}>
          <FormLabel>Nombre</FormLabel>
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
        
        <FormControl isInvalid={!!errors.apellidos}>
          <FormLabel>Apellidos</FormLabel>
          <Input 
            {...register('apellidos', { 
              maxLength: { value: 100, message: 'Los apellidos son demasiado largos' }
            })} 
          />
          {errors.apellidos && (
            <FormErrorMessage>{errors.apellidos.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.email}>
          <FormLabel>Email</FormLabel>
          <Input 
            {...register('email')} 
            type="email" 
            readOnly 
            bg="gray.50"
          />
        </FormControl>
        
        <FormControl isInvalid={!!errors.telefono}>
          <FormLabel>Teléfono</FormLabel>
          <Input 
            {...register('telefono')} 
            type="tel" 
          />
          {errors.telefono && (
            <FormErrorMessage>{errors.telefono.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
      </SimpleGrid>
      
      <FormControl mb={5} isInvalid={!!errors.telefonosEmergencia}>
        <FormLabel>Teléfonos de emergencia (separados por comas)</FormLabel>
        <Input 
          {...register('telefonosEmergencia')} 
          placeholder="Ej: 666111222, 666333444" 
        />
        {errors.telefonosEmergencia && (
          <FormErrorMessage>{errors.telefonosEmergencia.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      <FormControl mb={5} isInvalid={!!errors.observaciones}>
        <FormLabel>Observaciones</FormLabel>
        <Textarea 
          {...register('observaciones')} 
          placeholder="Alergias, condiciones médicas, etc."
          rows={3}
        />
        {errors.observaciones && (
          <FormErrorMessage>{errors.observaciones.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      <Stack direction="row" spacing={4} justify="flex-end">
        <Button
          type="submit"
          colorScheme="brand"
          isLoading={isSubmitting}
          loadingText="Guardando..."
        >
          Guardar Cambios
        </Button>
      </Stack>
    </Box>
  );
};

export default PerfilForm;