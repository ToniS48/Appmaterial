import React from 'react';
import {
  Box,
  VStack,
  Alert,
  AlertIcon,
  Text,
  TabPanel,
  Spinner
} from '@chakra-ui/react';
import { useApisConfig } from '../../../hooks/configuration/useUnifiedConfig';
import ApisGoogleSection from '../sections/API/ApisGoogleSection';
import WeatherServicesSection from '../sections/API/WeatherServicesSection';

const ApisTab: React.FC<{ userRole: 'admin' | 'vocal' }> = ({ userRole }) => {
  const { data: config, setData: setConfig, loading, save } = useApisConfig();

  if (loading) {
    return (
      <VStack spacing={4} p={6} align="center">
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.600">Cargando configuración de APIs...</Text>
      </VStack>
    );
  }

  // Separar configuraciones de Google y Weather
  const googleConfig = {
    driveApiKey: config.driveApiKey,
    mapsEmbedApiKey: config.mapsEmbedApiKey,
    calendarApiKey: config.calendarApiKey,
    gmailApiKey: config.gmailApiKey,
    chatApiKey: config.chatApiKey,
    cloudMessagingApiKey: config.cloudMessagingApiKey
  };

  const weatherConfig = {
    weatherApiUrl: config.weatherApiUrl,
    aemetApiKey: config.aemetApiKey
  };

  const handleGoogleConfigChange = (newGoogleConfig: any) => {
    setConfig(prev => ({ ...prev, ...newGoogleConfig }));
  };

  const handleWeatherConfigChange = (newWeatherConfig: any) => {
    setConfig(prev => ({ ...prev, ...newWeatherConfig }));
  };
  const saveGoogleConfig = async (googleData: any): Promise<void> => {
    const updatedConfig = { ...config, ...googleData };
    await save(updatedConfig);
  };

  const saveWeatherConfig = async (weatherData: any): Promise<void> => {
    const updatedConfig = { ...config, ...weatherData };
    await save(updatedConfig);
  };

  return (
    <TabPanel>
      <VStack spacing={8} align="stretch">
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">APIs y Servicios Externos</Text>
            <Text>
              Configura las integraciones con servicios externos: Google Drive, servicios meteorológicos, notificaciones, backup y analytics.
            </Text>
          </Box>        </Alert>        
        {userRole === 'admin' && (
          <>
            <ApisGoogleSection 
              config={googleConfig} 
              setConfig={handleGoogleConfigChange} 
              save={saveGoogleConfig} 
            />
            <WeatherServicesSection 
              userRole={userRole} 
              config={weatherConfig} 
              setConfig={handleWeatherConfigChange}
              save={saveWeatherConfig}
            />
          </>
        )}
      </VStack>
    </TabPanel>
  );
};

export default ApisTab;
