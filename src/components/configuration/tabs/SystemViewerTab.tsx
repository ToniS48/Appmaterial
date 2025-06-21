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
import SystemVariablesViewer from '../../admin/SystemVariablesViewer';

interface SystemViewerTabProps {
  settings: ConfigSettings;
  userRole: 'admin' | 'vocal';
}

/**
 * Pestaña del Visor del Sistema
 * Solo disponible para administradores
 */
const SystemViewerTab: React.FC<SystemViewerTabProps> = ({
  settings,
  userRole
}) => {
  if (userRole !== 'admin') {
    return null;
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
