/**
 * Página principal de Seguimiento de Usuarios
 * Integra el dashboard de seguimiento con la navegación y control de acceso
 */
import React from 'react';
import { 
  Box, 
  Container, 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiTrendingUp } from 'react-icons/fi';
import UsuarioSeguimientoDashboard from '../../components/usuarios/UsuarioSeguimientoDashboard';
import { useAuth } from '../../contexts/AuthContext';

const UsuarioSeguimientoPage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  // Verificar permisos - solo admins y vocales pueden acceder
  const tienePermisos = userProfile && (userProfile.rol === 'admin' || userProfile.rol === 'vocal');

  if (!userProfile) {
    return (
      <Container maxW="container.lg" py={8}>
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>Acceso requerido</AlertTitle>
          <AlertDescription>
            Debes iniciar sesión para acceder al seguimiento de usuarios.
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  if (!tienePermisos) {
    return (
      <Container maxW="container.lg" py={8}>
        <VStack spacing={6}>
          <Alert status="error">
            <AlertIcon />
            <Box>
              <AlertTitle>Acceso restringido</AlertTitle>
              <AlertDescription>
                No tienes permisos para acceder al seguimiento de usuarios. 
                Esta funcionalidad está disponible solo para administradores y vocales.
              </AlertDescription>
            </Box>
          </Alert>
          
          <Text color="gray.600" textAlign="center">
            Si necesitas acceso a esta funcionalidad, contacta con un administrador.
          </Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Box minHeight="100vh" bg="gray.50">
      {/* Breadcrumb de navegación */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4}>
        <Container maxW="container.xl">
          <Breadcrumb spacing="8px" separator=">">
            <BreadcrumbItem>
              <BreadcrumbLink as={RouterLink} to="/" display="flex" alignItems="center">
                <FiHome style={{ marginRight: '4px' }} />
                Inicio
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            <BreadcrumbItem>
              <BreadcrumbLink as={RouterLink} to="/usuarios" display="flex" alignItems="center">
                <FiUsers style={{ marginRight: '4px' }} />
                Usuarios
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink display="flex" alignItems="center" color="blue.600">
                <FiTrendingUp style={{ marginRight: '4px' }} />
                Seguimiento Anual
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Container>
      </Box>

      {/* Contenido principal */}
      <Container maxW="container.xl" py={0}>
        <UsuarioSeguimientoDashboard />
      </Container>

      {/* Información adicional en el footer */}
      <Box bg="white" borderTop="1px" borderColor="gray.200" py={6} mt={8}>
        <Container maxW="container.xl">
          <VStack spacing={2} color="gray.600" fontSize="sm">
            <Text textAlign="center">
              Sistema de Seguimiento de Usuarios - Gestión de estados de aprobación y actividad
            </Text>
            <Text textAlign="center">
              Los usuarios activos son aquellos que han participado en actividades en los últimos 6 meses
            </Text>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default UsuarioSeguimientoPage;
