/**
 * Dashboard de estado de Google APIs - Mock temporal
 * NOTA: Google APIs temporalmente deshabilitadas
 */

import React from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  VStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge
} from '@chakra-ui/react';

const GoogleApisDashboard: React.FC = () => {
  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Dashboard de Google APIs</Heading>
        
        <Alert status="warning">
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <AlertTitle>Google APIs temporalmente deshabilitadas</AlertTitle>
            <AlertDescription>
              Las APIs de Google están temporalmente deshabilitadas mientras se 
              implementa la solución backend con Firebase Functions para el manejo 
              seguro de Service Accounts.
            </AlertDescription>
          </VStack>
        </Alert>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          <Card>
            <CardHeader>
              <Heading size="md">Google Calendar</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={2}>
                <Badge colorScheme="red">Deshabilitado</Badge>
                <Text fontSize="sm" color="gray.600">
                  API de Calendar temporalmente no disponible
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Google Drive</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={2}>
                <Badge colorScheme="red">Deshabilitado</Badge>
                <Text fontSize="sm" color="gray.600">
                  API de Drive temporalmente no disponible
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Google Maps</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="start" spacing={2}>
                <Badge colorScheme="red">Deshabilitado</Badge>
                <Text fontSize="sm" color="gray.600">
                  API de Maps temporalmente no disponible
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card>
          <CardHeader>
            <Heading size="md">Información del Sistema</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="start" spacing={3}>
              <Text><strong>Estado:</strong> APIs temporalmente deshabilitadas</Text>
              <Text><strong>Razón:</strong> Migración a backend con Firebase Functions</Text>
              <Text><strong>Solución:</strong> Implementar endpoints REST en el backend</Text>
              <Text fontSize="sm" color="gray.600">
                Las librerías googleapis y google-auth-library no son compatibles 
                con navegadores web. Se necesita un backend para manejar la 
                autenticación con Service Account de forma segura.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default GoogleApisDashboard;
