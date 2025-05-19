import React from 'react';
import {
  Box, Heading, VStack, Card, CardBody, Avatar, 
  Text, Divider, Button, FormControl, FormLabel, Input, 
  FormHelperText, Spinner, Center, Alert, AlertIcon, SimpleGrid
} from '@chakra-ui/react';
import { FiUser, FiEdit } from 'react-icons/fi';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Timestamp, FieldValue } from 'firebase/firestore';

/**
 * Página de perfil de usuario
 */
const ProfilePage: React.FC = () => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout title="Mi Perfil">
        <Center h="300px">
          <Spinner size="xl" color="brand.500" />
        </Center>
      </DashboardLayout>
    );
  }

  if (!userProfile) {
    return (
      <DashboardLayout title="Mi Perfil">
        <Alert status="error" mx="auto" maxW="500px" mt={10}>
          <AlertIcon />
          No se pudo cargar la información del perfil
        </Alert>
      </DashboardLayout>
    );
  }

  const formatearFecha = (fecha: Timestamp | Date | FieldValue | undefined): string => {
    if (!fecha) return 'No disponible';
    
    try {
      if ('seconds' in fecha) {
        // Es un Timestamp de Firestore
        return new Date(fecha.seconds * 1000).toLocaleDateString();
      } else if (fecha instanceof Date) {
        return fecha.toLocaleDateString();
      } else {
        return 'Formato desconocido';
      }
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return 'No disponible';
    }
  };

  return (
    <DashboardLayout title="Mi Perfil">
      <Box maxW="1000px" mx="auto" p={4}>
        <Card mb={6} variant="outline">
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              <VStack align="center" spacing={4}>
                <Avatar 
                  size="2xl" 
                  name={`${userProfile.nombre} ${userProfile.apellidos || ''}`} 
                  src={userProfile.avatarUrl || undefined}
                />
                <Text fontWeight="bold" fontSize="xl">
                  {`${userProfile.nombre} ${userProfile.apellidos || ''}`}
                </Text>
                <Text color="gray.500">{userProfile.email}</Text>
                <Text bg="brand.50" color="brand.700" px={3} py={1} borderRadius="full">
                  {userProfile.rol === 'admin' ? 'Administrador' : 
                   userProfile.rol === 'vocal' ? 'Vocal' : 
                   userProfile.rol === 'socio' ? 'Socio' : 'Invitado'}
                </Text>
              </VStack>
              
              <Box>
                <Heading size="md" mb={4}>Información Personal</Heading>
                <VStack align="start" spacing={4}>
                  <FormControl>
                    <FormLabel>Nombre</FormLabel>
                    <Input value={userProfile.nombre} isReadOnly />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Apellidos</FormLabel>
                    <Input value={userProfile.apellidos || ''} isReadOnly />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input value={userProfile.email} isReadOnly />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Teléfono</FormLabel>
                    <Input value={userProfile.telefono || ''} isReadOnly />
                    <FormHelperText>Este dato solo es visible para administradores</FormHelperText>
                  </FormControl>
                </VStack>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>Estadísticas</Heading>
              <VStack align="start" spacing={3}>
                <Text>Última conexión: {formatearFecha(userProfile.ultimaConexion)}</Text>
                <Text>Miembro desde: {formatearFecha(userProfile.fechaCreacion)}</Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>Acciones</Heading>
              <VStack align="stretch" spacing={3}>
                <Button colorScheme="brand" leftIcon={<FiEdit />}>
                  Editar Perfil
                </Button>
                <Button variant="outline">
                  Cambiar Contraseña
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Box>
    </DashboardLayout>
  );
};

export default ProfilePage;