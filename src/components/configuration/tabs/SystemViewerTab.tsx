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
import { ConfigSettings } from '../../../types/configuration';
import SystemVariablesViewer from '../sections/General/SystemVariablesViewer';
import { useSystemConfig } from '../../../services/SystemConfigService';

interface SystemViewerTabProps {
  settings: ConfigSettings;
  userRole: 'admin' | 'vocal';
  onConfigReload?: () => void;
}

/**
 * Pestaña del Visor del Sistema
 * Solo disponible para administradores
 */
const SystemViewerTab: React.FC<SystemViewerTabProps> = ({
  settings,
  userRole,
  onConfigReload
}) => {
  const { loading } = useSystemConfig();

  if (userRole !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <TabPanel>
        <VStack spacing={4} align="center" py={8}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.600">Cargando información del sistema...</Text>
        </VStack>
      </TabPanel>
    );
  }

  return (
    <TabPanel>
      <VStack spacing={8} align="stretch">
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Visor del Sistema</Text>
            <Text>
              Visualiza en tiempo real todas las variables del sistema, 
              su estado actual y configuración técnica.
            </Text>
          </Box>
        </Alert>

        <SystemVariablesViewer />
      </VStack>
    </TabPanel>
  );
};

export default SystemViewerTab;
