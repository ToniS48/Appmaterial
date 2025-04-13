import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  Select, 
  FormErrorMessage,
  Stack,
  Heading,
  Divider,
  useToast,
  SimpleGrid,
  Switch,
  Textarea
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import messages from '../../constants/messages';
import { actualizarUsuario, crearUsuario } from '../../services/usuarioService';
import { Usuario, RolUsuario } from '../../types/usuario';

// Interfaz extendida para el formulario
interface UsuarioFormData {
  uid?: string;
  email: string;
  nombre: string;
  apellidos: string;
  rol: RolUsuario;
  activo: boolean;
  telefono?: string;
  telefonosEmergencia?: string; // En el formulario lo manejamos como string para facilidad de uso
  password?: string;
  observaciones?: string;
}

// Función para convertir Usuario a UsuarioFormData
const usuarioToFormData = (usuario: Usuario): UsuarioFormData => {
  return {
    uid: usuario.uid,
    email: usuario.email,
    nombre: usuario.nombre,
    apellidos: usuario.apellidos,
    rol: usuario.rol,
    activo: usuario.activo,
    telefono: usuario.telefono,
    // Convertir array a string separado por comas para el formulario
    telefonosEmergencia: usuario.telefonosEmergencia?.join(', '),
    observaciones: usuario.observaciones
  };
};

interface UsuarioFormProps {
  usuario?: Usuario; 
  onSuccess?: () => void;
  onCancel?: () => void;
  isVocalMode?: boolean; // Nuevo prop para indicar si estamos en modo vocal
}

const UsuarioForm: React.FC<UsuarioFormProps> = ({ 
  usuario, 
  onSuccess, 
  onCancel,
  isVocalMode
}) => {
  // Estados y contextos
  const { userProfile } = useAuth(); // Usa userProfile en lugar de currentUser
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Configuración del formulario con React Hook Form
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue,
    watch
  } = useForm<UsuarioFormData>({
    defaultValues: usuario ? usuarioToFormData(usuario) : {
      nombre: '',
      apellidos: '',
      email: '',
      rol: 'socio' as RolUsuario,
      activo: true,
      telefono: '',
      telefonosEmergencia: ''
    }
  });

  // Función para enviar el formulario
  const onSubmit: SubmitHandler<UsuarioFormData> = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Preparar datos del usuario
      const userData = {
        ...data,
        // Convertir string a array para teléfonos de emergencia
        telefonosEmergencia: data.telefonosEmergencia 
          ? data.telefonosEmergencia.split(',').map((tel: string) => tel.trim())
          : []
      };

      if (isVocalMode) {
        toast({
          title: messages.formularios.modoVocal,
          description: messages.formularios.modoVocalDesc,
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      let resultado;
      if (usuario) {
        // Actualizar usuario existente
        resultado = await actualizarUsuario(usuario.uid, userData);
        toast({
          title: "Usuario actualizado",
          description: "El usuario ha sido actualizado con éxito",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Crear nuevo usuario - Verificar que password esté definido
        if (!userData.password) {
          toast({
            title: "Error",
            description: "La contraseña es obligatoria para crear un nuevo usuario",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return;
        }
        
        // Ahora TypeScript sabe que password no puede ser undefined
        resultado = await crearUsuario({
          nombre: userData.nombre,
          apellidos: userData.apellidos,
          email: userData.email,
          password: userData.password,
          rol: userData.rol,
          activo: userData.activo,
          telefono: userData.telefono,
          telefonosEmergencia: userData.telefonosEmergencia,
          observaciones: userData.observaciones
        });
        
        toast({
          title: "Usuario creado",
          description: "El usuario ha sido creado con éxito",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Ejecutar callback de éxito si existe
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar el usuario. Por favor, inténtalo de nuevo.",
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
      <Heading size="md" mb={4}>
        {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
      </Heading>
      
      <Divider mb={4} />
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
        {/* CAMPOS BÁSICOS */}
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
            {...register('email', { 
              required: 'El email es obligatorio',
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Formato de email inválido'
              }
            })} 
            type="email" 
          />
          {errors.email && (
            <FormErrorMessage>{errors.email.message?.toString()}</FormErrorMessage>
          )}
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
        
        <FormControl isInvalid={!!errors.rol}>
          <FormLabel>Rol</FormLabel>
          <Select 
            {...register('rol', { required: 'Seleccione un rol' })}
            isDisabled={(usuario && !isVocalMode && userProfile?.rol !== 'admin')}
          >
            {!isVocalMode && userProfile?.rol === 'admin' && (
              <>
                <option value="admin">Administrador</option>
                <option value="vocal">Vocal</option>
              </>
            )}
            <option value="socio">Socio</option>
            <option value="invitado">Invitado</option> {/* Cambiado de "Usuario" a "Invitado" */}
          </Select>
          {errors.rol && (
            <FormErrorMessage>{errors.rol.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
        
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="activo" mb="0">
            Usuario activo
          </FormLabel>
          <Switch 
            id="activo"
            {...register('activo')}
            defaultChecked={usuario ? usuario.activo : true}
            colorScheme="brand" 
          />
        </FormControl>
      </SimpleGrid>
      
      <FormControl mb={5} isInvalid={!!errors.telefonosEmergencia}>
        <FormLabel>Teléfonos de emergencia</FormLabel>
        <Input 
          {...register('telefonosEmergencia')} 
          placeholder="Separados por comas (ej: 666123456, 666789012)"
        />
        <FormErrorMessage>
          {errors.telefonosEmergencia && errors.telefonosEmergencia.message?.toString()}
        </FormErrorMessage>
      </FormControl>
      
      {!usuario && (
        <FormControl mb={5} isInvalid={!!errors.password}>
          <FormLabel>Contraseña</FormLabel>
          <Input 
            {...register('password', { 
              required: !usuario && 'La contraseña es obligatoria',
              minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
            })} 
            type="password"
            placeholder={usuario ? "Dejar en blanco para mantener la contraseña actual" : ""}
          />
          {errors.password && (
            <FormErrorMessage>{errors.password.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
      )}
      
      <FormControl mb={5} isInvalid={!!errors.observaciones}>
        <FormLabel>Observaciones</FormLabel>
        <Textarea 
          {...register('observaciones')} 
          placeholder="Observaciones adicionales sobre el usuario"
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
          loadingText={messages.loading.processing}
        >
          {usuario ? messages.actions.edit : messages.actions.save}
        </Button>
      </Stack>
    </Box>
  );
};

export default UsuarioForm;