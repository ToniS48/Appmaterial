import React from 'react';
import {
  Box,
  VStack,
  Alert,
  AlertIcon,
  Text,
  TabPanel,
  Spinner,
  Divider,
  SimpleGrid
} from '@chakra-ui/react';
import { useVariablesConfig, useApisConfig } from '../../../hooks/configuration/useUnifiedConfig';
import NotificationSection from '../sections/Variables/NotificationSection';
import LoanManagementSection from '../sections/Variables/LoanManagementSection';
import ActivityManagementSection from '../sections/Variables/ActivityManagementSection';
import ReputationSystemSection from '../sections/Variables/ReputationSystemSection';
import ReportsSection from '../sections/Variables/ReportsSection';
import WeatherSettingsSection from '../sections/Variables/WeatherSettingsSection';

const VariablesTab: React.FC<{ userRole: 'admin' | 'vocal' }> = ({ userRole }) => {
  const { 
    data: variables, 
    setData: setVariables, 
    loading: loadingVariables, 
    save: saveVariables 
  } = useVariablesConfig();
  
  const { 
    data: apis, 
    setData: setApis, 
    loading: loadingApis, 
    save: saveApis 
  } = useApisConfig();
  if (loadingVariables || loadingApis) {
    return (
      <VStack spacing={4} p={6} align="center">
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.600">Cargando variables del sistema...</Text>
      </VStack>
    );
  }

  // Configuración meteorológica combinada (variables + APIs)
  const weatherConfig = {
    weatherEnabled: variables.weatherEnabled,
    aemetEnabled: variables.aemetEnabled,
    aemetUseForSpain: variables.aemetUseForSpain,
    temperatureUnit: variables.temperatureUnit,
    windSpeedUnit: variables.windSpeedUnit,
    precipitationUnit: variables.precipitationUnit,
    weatherApiUrl: apis.weatherApiUrl,
    aemetApiKey: apis.aemetApiKey
  };

  const setWeatherConfig = (newConfig: any) => {
    const {
      aemetApiKey,
      weatherApiUrl,
      weatherEnabled,
      aemetEnabled,
      aemetUseForSpain,
      temperatureUnit,
      windSpeedUnit,
      precipitationUnit
    } = newConfig;
    
    // Actualizar variables (flags y unidades)
    setVariables(prev => ({
      ...prev,
      weatherEnabled,
      aemetEnabled,
      aemetUseForSpain,
      temperatureUnit,
      windSpeedUnit,
      precipitationUnit
    }));
    
    // Actualizar APIs (claves y URLs)
    setApis(prev => ({
      ...prev,
      aemetApiKey: aemetApiKey || '',
      weatherApiUrl: weatherApiUrl || ''
    }));
  };
  // Funciones wrapper para compatibilidad de tipos con las secciones
  const saveVariablesWrapper = async (data: any) => {
    await saveVariables(data);
  };

  const saveWeatherConfigWrapper = async (newConfig: any) => {
    const {
      aemetApiKey,
      weatherApiUrl,
      weatherEnabled,
      aemetEnabled,
      aemetUseForSpain,
      temperatureUnit,
      windSpeedUnit,
      precipitationUnit
    } = newConfig;
    
    // Guardar en paralelo en ambos documentos
    await Promise.all([
      saveVariables({
        ...variables,
        weatherEnabled,
        aemetEnabled,
        aemetUseForSpain,
        temperatureUnit,
        windSpeedUnit,
        precipitationUnit
      }),
      saveApis({
        ...apis,
        aemetApiKey: aemetApiKey || '',
        weatherApiUrl: weatherApiUrl || ''
      })
    ]);
  };
  return (
    <TabPanel>
      <VStack spacing={6} align="stretch">
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Variables del Sistema</Text>
            <Text fontSize="sm">
              Configura los parámetros operacionales que controlan el comportamiento de la aplicación.
              Los valores se guardan automáticamente en Firestore.
            </Text>
          </Box>
        </Alert>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>          {/* Loan Management */}
          <LoanManagementSection 
            config={variables} 
            setConfig={setVariables} 
            save={saveVariablesWrapper} 
            userRole={userRole} 
          />
          
          {/* Activity Management */}
          <ActivityManagementSection 
            config={variables} 
            setConfig={setVariables} 
            save={saveVariablesWrapper}
          />
          
          {/* Reputation System */}
          <ReputationSystemSection 
            config={variables} 
            setConfig={setVariables} 
            save={saveVariablesWrapper}
          />
          
          {/* Reports */}
          <ReportsSection 
            config={variables} 
            setConfig={setVariables} 
            save={saveVariablesWrapper}
          />
          
          {/* Notifications - Usamos las variables unificadas */}
          <NotificationSection 
            config={variables} 
            setConfig={setVariables} 
            save={saveVariablesWrapper}
          />
        </SimpleGrid>

        <Divider />        {/* Weather Settings - Span full width */}
        <WeatherSettingsSection 
          config={weatherConfig} 
          setConfig={setWeatherConfig} 
          save={saveWeatherConfigWrapper} 
          userRole={userRole} 
        />
      </VStack>
    </TabPanel>
  );
};

export default VariablesTab;
