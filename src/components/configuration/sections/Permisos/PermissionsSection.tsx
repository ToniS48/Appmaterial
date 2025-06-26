import React from 'react';
import {
  Card,
  CardBody,
  Heading,
  Alert,
  AlertIcon,
  Text,
  Box,
  Button,
  VStack
} from '@chakra-ui/react';
import { FiLock } from 'react-icons/fi';
import { ConfigSettings } from '../../../../types/configuration';
import VocalPermissionsTab from './VocalPermissionsTab';
import UserPermissionsTab from './UserPermissionsTab';

export interface PermissionsSectionProps {
  config: any;
  setConfig: (cfg: any) => void;
  userRole: 'admin' | 'vocal';
  onSave: () => void;
  saveSuccess: boolean;
  saveError: string | null;
}

/**
 * Sección de gestión de permisos del sistema
 * Contiene pestañas para permisos de vocales y usuarios
 */
const PermissionsSection: React.FC<PermissionsSectionProps> = ({
  config,
  setConfig,
  userRole,
  onSave,
  saveSuccess,
  saveError
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
        <Heading size="sm" mb={4} color="purple.600" display="flex" alignItems="center">
          <FiLock style={{ marginRight: 8 }} />
          Gestión de Permisos
        </Heading>
        
        <Alert status="info" mb={4}>
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Gestión de Permisos del Sistema</Text>
            <Text fontSize="sm">
              Administra los permisos para vocales y usuarios del sistema de materiales.
            </Text>
          </Box>
        </Alert>

        <VocalPermissionsTab config={config} setConfig={setConfig} />
        <Box h={{ base: 6, md: 8 }} />
        <UserPermissionsTab config={config} setConfig={setConfig} />

        <VStack align="flex-end" mt={6} spacing={2}>
          {saveError && <Text color="red.500">{saveError}</Text>}
          {saveSuccess && <Text color="green.500">¡Guardado correctamente!</Text>}
          <Button colorScheme="blue" onClick={onSave} alignSelf="flex-end">
            Guardar
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default PermissionsSection;
