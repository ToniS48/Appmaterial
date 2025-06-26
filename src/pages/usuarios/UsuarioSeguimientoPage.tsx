/**
 * Página principal de Gestión de Usuarios
 * Integra el dashboard de gestión con la navegación y control de acceso
 */
import React from 'react';
import { 
  Box, 
  Container, 
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import DashboardUsuarios from '../../components/usuarios/DashboardUsuarios';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';

const UsuarioSeguimientoPage: React.FC = () => {
  const { userProfile } = useAuth();
  
  // Verificar permisos - solo admins y vocales pueden acceder
  const tienePermisos = userProfile && (userProfile.rol === 'admin' || userProfile.rol === 'vocal');  if (!userProfile) {
    return (
      <DashboardLayout title="Gestión de Usuarios">
        <Container maxW="container.lg" py={8}>
          <Alert status="warning">
            <AlertIcon />
            <AlertTitle>Acceso requerido</AlertTitle>
            <AlertDescription>
              Debes iniciar sesión para acceder al seguimiento de usuarios.
            </AlertDescription>
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }
  if (!tienePermisos) {
    return (
      <DashboardLayout title="Gestión de Usuarios">
        <Container maxW="container.lg" py={8}>
          <VStack spacing={6}>
            <Alert status="error">
              <AlertIcon />
              <Box>
                <AlertTitle>Acceso restringido</AlertTitle>
                <AlertDescription>
                  No tienes permisos para acceder a la gestión de usuarios. 
                  Esta funcionalidad está disponible solo para administradores y vocales.
                </AlertDescription>
              </Box>
            </Alert>
            
            <Text color="gray.600" textAlign="center">
              Si necesitas acceso a esta funcionalidad, contacta con un administrador.
            </Text>
          </VStack>
        </Container>
      </DashboardLayout>
    );
  }  return (
    <DashboardLayout title="Gestión de Usuarios">
      {/* Contenido principal */}
      <DashboardUsuarios />

      {/* Información adicional en el footer */}
      <Box bg="white" borderRadius="md" borderWidth="1px" p={6} mt={8}>
        <VStack spacing={2} color="gray.600" fontSize="sm">
          <Text textAlign="center">
            Sistema de Gestión de Usuarios - Administración completa de usuarios del sistema
          </Text>
          <Text textAlign="center">
            Incluye gestión, seguimiento, estadísticas y herramientas de diagnóstico
          </Text>
        </VStack>
      </Box>
    </DashboardLayout>
  );
};

export default UsuarioSeguimientoPage;
