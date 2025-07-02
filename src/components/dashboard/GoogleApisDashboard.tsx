/**
 * Dashboard de estado de Google APIs - Con Firebase Functions y APIs Avanzadas
 */

import React, { useState, useEffect } from 'react';
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
  Badge,
  Button,
  Spinner,
  HStack,
  useToast,
  Divider
} from '@chakra-ui/react';

import { googleApiFunctionsService } from '../../services/google';
import useAdvancedGoogleServices from '../../hooks/useAdvancedGoogleServices';
import useGoogleApisVerification from '../../hooks/useGoogleApisVerification';

const GoogleApisDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  const toast = useToast();
  
  // Hook para verificación de scripts Node.js
  const {
    verification,
    loading: verificationLoading,
    error: verificationError,
    verifyApis,
    getHealthStatus
  } = useGoogleApisVerification();
  
  // Hook para servicios avanzados
  const {
    status: advancedStatus,
    loading: advancedLoading,
    isAnalyticsReady,
    isBigQueryReady,
    refreshStatus
  } = useAdvancedGoogleServices();

  const checkServerHealth = async () => {
    setIsLoading(true);
    try {
      const isHealthy = await getHealthStatus();
      
      if (isHealthy) {
        // Si el servidor está saludable, verificar las APIs
        await verifyApis();
        
        toast({
          title: 'Servidor funcionando',
          description: 'Los scripts de Google APIs están funcionando correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Servidor no disponible');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      toast({
        title: 'Error de conexión',
        description: `No se pudo conectar con el servidor: ${errorMessage}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkServerHealth();
  }, []);

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="blue.600">
          Dashboard de Google APIs
        </Heading>

        {/* Estado de los Scripts Node.js */}
        <Card>
          <CardHeader>
            <HStack justifyContent="space-between">
              <Heading size="md">Estado de Scripts Node.js</Heading>
              <Button 
                size="sm" 
                onClick={checkServerHealth}
                isLoading={isLoading || verificationLoading}
                colorScheme="blue"
              >
                Verificar
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack align="start" spacing={3}>
              {verificationError && (
                <Alert status="error" size="sm">
                  <AlertIcon />
                  <AlertDescription>{verificationError}</AlertDescription>
                </Alert>
              )}
              
              {verification && (
                <>
                  <HStack>
                    <Badge colorScheme={verification.success ? "green" : "yellow"}>
                      {verification.success ? "Operativo" : "Con advertencias"}
                    </Badge>
                    <Text fontSize="sm" color="gray.500">
                      Verificado: {new Date(verification.timestamp).toLocaleString()}
                    </Text>
                  </HStack>
                  
                  {verification.errors.length > 0 && (
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" color="orange.600">
                        Advertencias:
                      </Text>
                      {verification.errors.map((error, index) => (
                        <Text key={index} fontSize="xs" color="orange.500" ml={2}>
                          • {error}
                        </Text>
                      ))}
                    </Box>
                  )}
                </>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* APIs del Backend (Service Account) */}
        <VStack spacing={4} align="stretch">
          <Heading size="md">APIs del Backend (Service Account)</Heading>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Card>
              <CardHeader>
                <Heading size="sm">Google Calendar</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Badge colorScheme={verification?.summary?.backend?.configured ? "green" : "red"}>
                    {verification?.summary?.backend?.configured ? "Operativo" : "Error"}
                  </Badge>
                  <Text fontSize="sm" color="gray.600">
                    {verification?.summary?.backend?.configured 
                      ? "API de Calendar disponible a través de scripts Node.js"
                      : "Service Account no configurado"}
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="sm">Google Drive</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Badge colorScheme={verification?.summary?.backend?.configured ? "green" : "red"}>
                    {verification?.summary?.backend?.configured ? "Operativo" : "Error"}
                  </Badge>
                  <Text fontSize="sm" color="gray.600">
                    {verification?.summary?.backend?.configured 
                      ? "API de Drive disponible a través de scripts Node.js"
                      : "Service Account no configurado"}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
        
        <Divider />
        
        {/* APIs Avanzadas */}
        <VStack spacing={4} align="stretch">
          <Heading size="md">APIs Avanzadas</Heading>
          
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            {/* Google Analytics */}
            <Card>
              <CardHeader>
                <Heading size="sm">Google Analytics</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Badge colorScheme={isAnalyticsReady ? "green" : "gray"}>
                    {isAnalyticsReady ? "Activo" : "Inactivo"}
                  </Badge>
                  <Text fontSize="sm" color="gray.600">
                    {advancedStatus.analytics.enabled 
                      ? "Análisis y métricas de uso"
                      : "Analytics no habilitado"}
                  </Text>
                  {advancedStatus.analytics.error && (
                    <Text fontSize="xs" color="red.500">
                      {advancedStatus.analytics.error}
                    </Text>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* BigQuery */}
            <Card>
              <CardHeader>
                <Heading size="sm">BigQuery</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Badge colorScheme={isBigQueryReady ? "green" : "gray"}>
                    {isBigQueryReady ? "Activo" : "Inactivo"}
                  </Badge>
                  <Text fontSize="sm" color="gray.600">
                    {advancedStatus.bigQuery.enabled 
                      ? "Análisis avanzado de datos"
                      : "BigQuery no habilitado"}
                  </Text>
                  {advancedStatus.bigQuery.error && (
                    <Text fontSize="xs" color="red.500">
                      {advancedStatus.bigQuery.error}
                    </Text>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Pub/Sub */}
            <Card>
              <CardHeader>
                <Heading size="sm">Cloud Pub/Sub</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Badge colorScheme="gray">
                    Pendiente
                  </Badge>
                  <Text fontSize="sm" color="gray.600">
                    Mensajería asíncrona
                  </Text>
                  <Text fontSize="xs" color="orange.500">
                    Implementación futura
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            {/* Firebase Extensions */}
            <Card>
              <CardHeader>
                <Heading size="sm">Firebase Extensions</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Badge colorScheme="gray">
                    Pendiente
                  </Badge>
                  <Text fontSize="sm" color="gray.600">
                    Extensiones avanzadas
                  </Text>
                  <Text fontSize="xs" color="orange.500">
                    Implementación futura
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>

        <Divider />

        {/* Estado General */}
        <Card>
          <CardHeader>
            <Heading size="md">Estado General</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="start" spacing={2}>
              {isLoading || verificationLoading ? (
                <HStack>
                  <Spinner size="sm" />
                  <Text fontSize="sm">Verificando...</Text>
                </HStack>
              ) : (
                <>
                  <Badge colorScheme={verification?.success ? "green" : "red"}>
                    {verification?.success ? "Operativo" : "Error"}
                  </Badge>
                  <Text fontSize="sm" color="gray.600">
                    Sistema de Google APIs via Scripts Node.js
                  </Text>
                  {verification?.timestamp && (
                    <Text fontSize="xs" color="gray.500">
                      Última verificación: {new Date(verification.timestamp).toLocaleString()}
                    </Text>
                  )}
                </>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Botones de Acción */}
        <HStack spacing={4} justify="flex-end">
          <Button 
            colorScheme="blue" 
            onClick={checkServerHealth} 
            isLoading={isLoading || verificationLoading}
            size="sm"
          >
            Verificar Backend
          </Button>
          <Button 
            colorScheme="green" 
            onClick={refreshStatus} 
            isLoading={advancedLoading}
            size="sm"
          >
            Actualizar APIs
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default GoogleApisDashboard;
