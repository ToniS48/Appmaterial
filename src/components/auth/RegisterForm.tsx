import React, { useState } from 'react';
import { Button, FormControl, FormLabel, Input, FormErrorMessage, Stack, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext'; 
import { registrarUsuario } from '../../services/usuarioService';
import { EstadoAprobacion, EstadoActividad } from '../../types/usuarioHistorial';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const toast = useToast();
  const theme = useTheme();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name) newErrors.name = 'El nombre es obligatorio';
    if (!formData.email) newErrors.email = 'El correo electrónico es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'El correo electrónico no es válido';
    
    if (!formData.password) newErrors.password = 'La contraseña es obligatoria';
    else if (formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      setIsSubmitting(true);
      
      try {
        // Dividir el nombre completo en nombre y apellidos
        const nameParts = formData.name.trim().split(' ');
        const nombre = nameParts[0];
        const apellidos = nameParts.slice(1).join(' ');
        
        // Actualmente solo se registra en consola pero no realiza el registro en Firebase
        console.log('Registro de usuario:', formData);        // Llamar al servicio de registro
        await registrarUsuario({
          email: formData.email,
          password: formData.password,
          nombre,
          apellidos,
          rol: 'invitado', // Cambiado de 'usuario' a 'invitado'
          estadoAprobacion: EstadoAprobacion.PENDIENTE,  // Nuevo usuario requiere aprobación
          estadoActividad: EstadoActividad.INACTIVO     // Sin actividad hasta primera participación
        });
        
        toast({
          title: 'Cuenta creada',
          description: 'Tu cuenta ha sido creada correctamente',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        navigate('/login');
      } catch (error) {
        console.error('Error al crear la cuenta:', error);
        toast({
          title: 'Error al crear la cuenta',
          description: error instanceof Error ? error.message : 'Ha ocurrido un error al crear tu cuenta. Por favor, inténtalo de nuevo.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="form-container">
      <Stack spacing={4}>
        <FormControl isInvalid={!!errors.name}>
          <FormLabel htmlFor="name" className="form-label">Nombre completo</FormLabel>
          <Input
            id="name"
            name="name"             // Cambiar 'nombre' a 'name'
            type="text"
            placeholder="Tu nombre completo"
            value={formData.name}   // Cambiar 'nombre' a 'name'
            onChange={handleChange}
            className="form-control"
            focusBorderColor="brand.400"
            borderColor="var(--color-gray-200)"
          />
          {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
        </FormControl>
        
        <FormControl isInvalid={!!errors.email}>
          <FormLabel htmlFor="email" className="form-label">Correo electrónico</FormLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={handleChange}
            className="form-control"
            focusBorderColor="brand.400"
            borderColor="var(--color-gray-200)"
          />
          {errors.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}
        </FormControl>
        
        <FormControl isInvalid={!!errors.password}>
          <FormLabel htmlFor="password" className="form-label">Contraseña</FormLabel>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="******"
            value={formData.password}
            onChange={handleChange}
            className="form-control"
            focusBorderColor="brand.400"
            borderColor="var(--color-gray-200)"
          />
          {errors.password && <FormErrorMessage>{errors.password}</FormErrorMessage>}
        </FormControl>
        
        <FormControl isInvalid={!!errors.confirmPassword}>
          <FormLabel htmlFor="confirmPassword" className="form-label">Confirmar contraseña</FormLabel>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="******"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="form-control"
            focusBorderColor="brand.400"
            borderColor="var(--color-gray-200)"
          />
          {errors.confirmPassword && <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>}
        </FormControl>
        
        <Button
          type="submit"
          colorScheme="brand"
          isLoading={isSubmitting}
          loadingText="Registrando..."
          w="100%"
          mt={4}
          bg="brand.500"
          _hover={{ bg: 'brand.600' }}
          _active={{ bg: 'brand.700' }}
        >
          Registrarse
        </Button>
      </Stack>
    </form>
  );
};

export default RegisterForm;