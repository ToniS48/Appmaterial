import React from 'react';
import {
  TabPanel,
  VStack,
  Alert,
  AlertIcon,
  Text
} from '@chakra-ui/react';
import { ConfigSettings } from '../../../types/configuration';
import { PermissionsSection } from '../sections';

interface PermissionsTabProps {
  settings: ConfigSettings;
  userRole: 'admin' | 'vocal';
  onVariableChange: (key: string, value: any) => void;
}

/**
 * Pestaña de Configuración de Permisos
 * Solo disponible para administradores
 */
const PermissionsTab: React.FC<PermissionsTabProps> = ({
  settings,
  userRole,
  onVariableChange
}) => {
  return (
    <TabPanel>
      <VStack spacing={6} align="stretch">
        <Alert status="info">
          <AlertIcon />
          <Text>
            <Text fontWeight="bold" display="inline">Gestión de Permisos - </Text>
            Administra los permisos y accesos de vocales y usuarios del sistema de materiales.
          </Text>
        </Alert>

        <PermissionsSection
          settings={settings}
          userRole={userRole}
          onVariableChange={onVariableChange}
        />
      </VStack>
    </TabPanel>
  );
};

export default PermissionsTab;
