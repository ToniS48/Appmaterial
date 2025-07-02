import React from 'react';
import {
  Box,
  VStack,
  Alert,
  AlertIcon,
  Text,
  TabPanel,
  Spinner,
  Link,
  Button
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiExternalLink } from 'react-icons/fi';
import { useGoogleApis } from '../../../hooks/useGoogleApis';
import { GoogleApisConfig } from '../../../services/configuracionService';
import ApisGoogleSection from '../sections/API/ApisGoogleSection';
import WeatherServicesSection from '../sections/API/WeatherServicesSection';

const ApisTab: React.FC<{ userRole: 'admin' | 'vocal' }> = ({ userRole }) => {
  const { config: googleConfig, updateConfig: updateGoogleConfig, loading: googleLoading } = useGoogleApis();

  if (googleLoading) {
    return (
      <VStack spacing={4} p={6} align="center">
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.600">Cargando configuración de APIs...</Text>
      </VStack>
    );
  }

  const handleGoogleConfigChange = (newGoogleConfig: GoogleApisConfig) => {
    // Este cambio se manejará a través del hook useGoogleApis
    updateGoogleConfig(newGoogleConfig);
  };

  const saveGoogleConfig = async (googleData: GoogleApisConfig): Promise<void> => {
    await updateGoogleConfig(googleData);
  };

  return (
    <TabPanel>
      <VStack spacing={8} align="stretch">
        <Alert status="info">
          <AlertIcon />
          <Box flex={1}>
            <Text fontWeight="bold">APIs y Servicios Externos</Text>
            <Text>
              Configura las integraciones con servicios externos: Google Maps, servicios meteorológicos, notificaciones y analytics.
            </Text>
          </Box>
        </Alert>
        
        <Alert status="success">
          <AlertIcon />
          <Box flex={1}>
            <Text fontWeight="bold">Google Drive y Calendar</Text>
            <Text mb={2}>
              Para configurar y verificar el estado de Google Drive y Calendar (via Firebase Functions), usa el Dashboard especializado:
            </Text>
            <Button 
              as={RouterLink} 
              to="/testing/google-apis" 
              size="sm" 
              colorScheme="blue" 
              leftIcon={<FiExternalLink />}
            >
              Ir al Dashboard de Google APIs
            </Button>
          </Box>
        </Alert>        
        {userRole === 'admin' && (
          <>
            {/* Configuración Google APIs (Maps, etc.) */}
            {googleConfig && (
              <ApisGoogleSection 
                config={googleConfig} 
                setConfig={handleGoogleConfigChange} 
                save={saveGoogleConfig} 
              />
            )}
            {/* Configuración Weather APIs - Ahora maneja su propia seguridad */}
            <WeatherServicesSection 
              userRole={userRole}
            />
          </>
        )}
      </VStack>
    </TabPanel>
  );
};

export default ApisTab;
