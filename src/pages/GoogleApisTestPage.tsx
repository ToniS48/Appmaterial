/**
 * Página de prueba para Google APIs Functions
 */

import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  Code,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { googleApiFunctionsService } from '../services/google/GoogleApiFunctionsService';

const GoogleApisTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const testHealthCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await googleApiFunctionsService.healthCheck();
      setHealthData(result);
      toast({
        title: 'Health Check Exitoso',
        description: 'La conexión con el servidor Express está funcionando',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      toast({
        title: 'Error en Health Check',
        description: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const testCalendarEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const events = await googleApiFunctionsService.getEvents();
      setCalendarEvents(events);
      toast({
        title: 'Eventos del Calendario',
        description: `Obtenidos ${events.length} eventos del servidor Express`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      toast({
        title: 'Error obteniendo eventos',
        description: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const testDriveFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const files = await googleApiFunctionsService.listFiles();
      setDriveFiles(files);
      toast({
        title: 'Archivos de Drive',
        description: `Obtenidos ${files.length} archivos del servidor Express`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      toast({
        title: 'Error obteniendo archivos',
        description: errorMsg,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={6} maxW="container.lg" mx="auto">
      <VStack spacing={6} align="stretch">
        <Heading size="lg" color="blue.600">
          🧪 Prueba de Google APIs Functions
        </Heading>

        <Text color="gray.600">
          Esta página permite probar la conexión con el servidor Express para Google APIs.
        </Text>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <VStack spacing={4} align="stretch">
          <Button
            colorScheme="blue"
            onClick={testHealthCheck}
            isLoading={loading}
            leftIcon={loading ? <Spinner size="sm" /> : undefined}
          >
            🔍 Probar Health Check
          </Button>

          <Button
            colorScheme="green"
            onClick={testCalendarEvents}
            isLoading={loading}
            leftIcon={loading ? <Spinner size="sm" /> : undefined}
          >
            🗓️ Probar Eventos del Calendario
          </Button>

          <Button
            colorScheme="purple"
            onClick={testDriveFiles}
            isLoading={loading}
            leftIcon={loading ? <Spinner size="sm" /> : undefined}
          >
            📁 Probar Archivos de Drive
          </Button>
        </VStack>

        {healthData && (
          <Box p={4} borderWidth={1} borderRadius="md" bg="green.50">
            <Heading size="sm" mb={2}>📊 Datos del Health Check:</Heading>
            <Code p={4} borderRadius="md" display="block" whiteSpace="pre-wrap">
              {JSON.stringify(healthData, null, 2)}
            </Code>
          </Box>
        )}

        {calendarEvents.length > 0 && (
          <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50">
            <Heading size="sm" mb={2}>🗓️ Eventos del Calendario ({calendarEvents.length}):</Heading>
            <Code p={4} borderRadius="md" display="block" whiteSpace="pre-wrap">
              {JSON.stringify(calendarEvents, null, 2)}
            </Code>
          </Box>
        )}

        {driveFiles.length > 0 && (
          <Box p={4} borderWidth={1} borderRadius="md" bg="purple.50">
            <Heading size="sm" mb={2}>📁 Archivos de Drive ({driveFiles.length}):</Heading>
            <Code p={4} borderRadius="md" display="block" whiteSpace="pre-wrap">
              {JSON.stringify(driveFiles, null, 2)}
            </Code>
          </Box>
        )}

        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Información:</Text>
            <Text>
              Las APIs de Google están disponibles a través del servidor Express local.
              Asegúrate de que el servidor de scripts esté ejecutándose en el puerto 3001.
            </Text>
          </Box>
        </Alert>
      </VStack>
    </Box>
  );
};

export default GoogleApisTestPage;
