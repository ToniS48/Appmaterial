import React from 'react';
import {
  Box,
  VStack,
  Alert,
  AlertIcon,
  Text,
  TabPanel
} from '@chakra-ui/react';
import { ConfigSettings } from '../../../types/configuration';
import WeatherServicesSection from '../sections/WeatherServicesSection';
import NotificationServicesSection from '../sections/NotificationServicesSection';
import BackupAnalyticsSection from '../sections/BackupAnalyticsSection';
import GoogleDriveSection from '../sections/GoogleDriveSection';

interface ApisTabProps {
  settings: ConfigSettings;
  userRole: 'admin' | 'vocal';
  onSettingsChange: (newSettings: Partial<ConfigSettings>) => void;
  onVariableChange?: (key: string, value: any) => void;
  onApiChange?: (apiName: string, value: string | boolean) => void;
}

/**
 * Pestaña de APIs y Servicios Externos
 * Contiene configuraciones para integraciones externas del sistema
 */
const ApisTab: React.FC<ApisTabProps> = ({
  settings,
  userRole,
  onSettingsChange,
  onApiChange = () => {},
  onVariableChange = () => {}
}) => {
  const handleApiSwitchChange = (apiName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onApiChange(apiName, e.target.checked);
  };
  return (
    <TabPanel>
      <VStack spacing={8} align="stretch">
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">APIs y Servicios Externos</Text>
            <Text>
              Configura las integraciones con servicios externos: Google Drive, 
              servicios meteorológicos, notificaciones, backup y analytics.
            </Text>
          </Box>
        </Alert>        {/* URLs de Google Drive */}
        <GoogleDriveSection 
          userRole={userRole}
          settings={settings} 
          handleApiChange={onApiChange}
          handleApiSwitchChange={handleApiSwitchChange}
          handleVariableChange={onVariableChange}
          isLoading={false}
          onSettingsChange={onSettingsChange}
        />

        {/* Servicios Meteorológicos */}
        <WeatherServicesSection 
          userRole={userRole}
          settings={settings} 
          handleApiChange={onApiChange}
          handleApiSwitchChange={handleApiSwitchChange}
          handleVariableChange={onVariableChange}
          isLoading={false}
          onSettingsChange={onSettingsChange}
        />        {/* Servicios de Notificaciones */}
        <NotificationServicesSection 
          userRole={userRole}
          settings={settings} 
          handleApiChange={onApiChange}
          handleApiSwitchChange={handleApiSwitchChange}
          handleVariableChange={onVariableChange}
          isLoading={false}
          onSettingsChange={onSettingsChange}
        />

        {/* Backup y Analytics */}
        <BackupAnalyticsSection 
          userRole={userRole}
          settings={settings} 
          handleApiChange={onApiChange}
          handleApiSwitchChange={handleApiSwitchChange}
          handleVariableChange={onVariableChange}
          isLoading={false}
          onSettingsChange={onSettingsChange}
        />
      </VStack>
    </TabPanel>
  );
};

export default ApisTab;
