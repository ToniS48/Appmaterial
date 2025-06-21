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
import MaterialDropdownManagerFunctional from '../../admin/MaterialDropdownManagerFunctional';

interface DropdownsTabProps {
  settings: ConfigSettings;
  userRole: 'admin' | 'vocal';
}

/**
 * Pestaña de Gestión de Formularios de Material
 * Solo disponible para administradores
 */
const DropdownsTab: React.FC<DropdownsTabProps> = ({
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
            <Text fontWeight="bold">Gestión de Formularios de Material</Text>
            <Text>
              Administra las categorías, marcas, estados y otros campos desplegables 
              utilizados en los formularios de material del sistema.
            </Text>
          </Box>
        </Alert>

        <MaterialDropdownManagerFunctional />
      </VStack>
    </TabPanel>
  );
};

export default DropdownsTab;
