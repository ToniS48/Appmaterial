import React from 'react';
import {
  Card,
  CardBody,
  Heading,
  Alert,
  AlertIcon,
  Text,
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { ConfigSettings } from '../../../types/configuration';
import VocalPermissionsTab from './VocalPermissionsTab';
import UserPermissionsTab from './UserPermissionsTab';

interface PermissionsSectionProps {
  settings: ConfigSettings;
  userRole: 'admin' | 'vocal';
  onVariableChange: (key: string, value: any) => void;
}

/**
 * Sección de gestión de permisos del sistema
 * Contiene pestañas para permisos de vocales y usuarios
 */
const PermissionsSection: React.FC<PermissionsSectionProps> = ({
  settings,
  userRole,
  onVariableChange
}) => {
  if (userRole !== 'admin') {
    return (
      <Card>
        <CardBody>
          <Alert status="warning">
            <AlertIcon />
            <Text>Solo los administradores pueden gestionar permisos del sistema.</Text>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <Heading size="sm" mb={4} color="purple.600">
          🔐 Gestión de Permisos
        </Heading>
        
        <Alert status="info" mb={4}>
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Gestión de Permisos del Sistema</Text>
            <Text fontSize="sm">
              Administra los permisos para vocales y usuarios del sistema de materiales.            </Text>
          </Box>
        </Alert>

        <Tabs variant="enclosed" colorScheme="purple" defaultIndex={0}>
          <TabList>
            <Tab _selected={{ bg: "purple.100", borderColor: "purple.300" }}>
              👥 Permisos de Vocales
            </Tab>
            <Tab _selected={{ bg: "blue.100", borderColor: "blue.300" }}>
              👤 Permisos de Usuarios
            </Tab>
          </TabList>          <TabPanels>
            {/* Pestaña de Permisos de Vocales */}
            <TabPanel>
              <VocalPermissionsTab onVariableChange={onVariableChange} />
            </TabPanel>

            {/* Pestaña de Permisos de Usuarios */}
            <TabPanel>
              <UserPermissionsTab onVariableChange={onVariableChange} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </CardBody>
    </Card>
  );
};

export default PermissionsSection;
