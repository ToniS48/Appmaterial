import React, { useState } from 'react';
import {
  TabPanel,
  VStack,
  Text,
  Alert,
  AlertIcon,
  Box,
  Spinner
} from '@chakra-ui/react';
import { usePermissionsConfig } from '../../../hooks/configuration/useUnifiedConfig';
import PermissionsSection from '../sections/Permisos/PermissionsSection';

const defaultPermissionsConfig = {
  vocalPermissions: [],
  userPermissions: [],
};

interface PermissionsTabProps {
  userRole: 'admin' | 'vocal';
}

/**
 * Pestaña de Configuración de Permisos
 * Solo disponible para administradores
 */
const PermissionsTab: React.FC<PermissionsTabProps> = ({
  userRole
}) => {
  const { data: permissions, setData: setPermissions, loading, save } = usePermissionsConfig();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      await save(permissions);
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
      setSuccess(false);
    }
  };

  if (loading) {
    return (
      <VStack spacing={4} p={6} align="center">
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.600">Cargando configuración de permisos...</Text>
      </VStack>
    );
  }

  return (
    <TabPanel>
      <VStack spacing={8} align="stretch">
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Permisos del Sistema</Text>
            <Text>
              Configura los permisos de acceso y edición para cada sección del sistema.
            </Text>
          </Box>
        </Alert>
        <PermissionsSection
          config={permissions}
          setConfig={setPermissions}
          userRole={userRole}
          onSave={handleSave}
          saveSuccess={success}
          saveError={error}
        />
      </VStack>
    </TabPanel>
  );
};

export default PermissionsTab;
