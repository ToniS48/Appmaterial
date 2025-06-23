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
import { useSectionConfig } from '../../../hooks/configuration/useSectionConfig';
import { GoogleApisConfig } from '../../../services/configuracionService';
import ApisGoogleSection from '../sections/ApisGoogleSection';
import WeatherApiKeySection from '../sections/WeatherApiKeySection';

const defaultGoogleApisConfig: GoogleApisConfig = {
  driveApiKey: '',
  mapsEmbedApiKey: '',
  calendarApiKey: '',
  gmailApiKey: '',
  chatApiKey: '',
  cloudMessagingApiKey: ''
};

const ApisTab: React.FC<{ userRole: 'admin' | 'vocal' }> = ({ userRole }) => {
  const { data: apis, setData: setApis, loading: loadingApis, save: saveApis } = useSectionConfig('apis', defaultGoogleApisConfig);
  // Configuración meteorológica (AEMET)
  const { data: weather, setData: setWeather, loading: loadingWeather, save: saveWeather } = useSectionConfig('weather', {
    aemet: { apiKey: '' }
  });

  if (loadingApis || loadingWeather) return <Spinner size="lg" />;

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
          </Box>
        </Alert>
        {userRole === 'admin' && (
          <>
            <ApisGoogleSection config={apis} setConfig={setApis} save={saveApis} />
            {/* Sección para la API de AEMET */}
            <WeatherApiKeySection config={weather} setConfig={setWeather} userRole={userRole} save={saveWeather} />
          </>
        )}
      </VStack>
    </TabPanel>
  );
};

export default ApisTab;
