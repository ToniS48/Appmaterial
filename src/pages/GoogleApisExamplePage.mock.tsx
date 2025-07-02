/**
 * Página de ejemplo para Google APIs - Mock temporal
 * NOTA: Google APIs temporalmente deshabilitadas
 */

import React from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardBody,
  CardHeader,
  Text,
  Badge
} from '@chakra-ui/react';

const GoogleApisExamplePage: React.FC = () => {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={4}>
            Google APIs - Página de Ejemplo
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Demostración de integración con Google APIs
          </Text>
        </Box>

        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <AlertTitle>APIs temporalmente deshabilitadas</AlertTitle>
            <AlertDescription>
              La integración con Google APIs está temporalmente deshabilitada 
              mientras se implementa la solución backend con Firebase Functions 
              para el manejo seguro de Service Accounts.
            </AlertDescription>
          </VStack>
        </Alert>

        <VStack spacing={6} align="stretch">
          <Card>
            <CardHeader>
              <Heading size="md">Google Calendar Integration</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                <Badge colorScheme="red">Deshabilitado</Badge>
                <Text>
                  Funcionalidades incluidas:
                </Text>
                <VStack align="start" spacing={1} pl={4}>
                  <Text>• Listado de calendarios</Text>
                  <Text>• Creación de eventos</Text>
                  <Text>• Sincronización con Firestore</Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Google Drive Integration</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                <Badge colorScheme="red">Deshabilitado</Badge>
                <Text>
                  Funcionalidades incluidas:
                </Text>
                <VStack align="start" spacing={1} pl={4}>
                  <Text>• Subida de archivos</Text>
                  <Text>• Gestión de carpetas</Text>
                  <Text>• Compartir documentos</Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Google Maps Integration</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={3}>
                <Badge colorScheme="red">Deshabilitado</Badge>
                <Text>
                  Funcionalidades incluidas:
                </Text>
                <VStack align="start" spacing={1} pl={4}>
                  <Text>• Mapas interactivos</Text>
                  <Text>• Geocodificación</Text>
                  <Text>• Marcadores personalizados</Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>

        <Card bg="blue.50" borderColor="blue.200">
          <CardHeader>
            <Heading size="md" color="blue.800">
              Próximos Pasos
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack align="start" spacing={3}>
              <Text color="blue.800">
                Para restaurar la funcionalidad de Google APIs:
              </Text>
              <VStack align="start" spacing={1} pl={4}>
                <Text>1. Implementar Firebase Functions para manejar Service Accounts</Text>
                <Text>2. Crear endpoints REST para cada API (Calendar, Drive, Maps)</Text>
                <Text>3. Actualizar el frontend para usar los endpoints del backend</Text>
                <Text>4. Configurar autenticación segura entre frontend y backend</Text>
              </VStack>
              <Text fontSize="sm" color="blue.600" mt={2}>
                Esta arquitectura garantiza que las credenciales del Service Account 
                permanezcan seguras en el backend y no se expongan en el navegador.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default GoogleApisExamplePage;
