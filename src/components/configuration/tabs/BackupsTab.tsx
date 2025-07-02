import React, { useState } from 'react';
import {
  Box,
  VStack,
  Alert,
  AlertIcon,
  Text,
  TabPanel,
  Spinner
} from '@chakra-ui/react';
import { useConfig } from '../../../hooks/configuration/useUnifiedConfig';
import BackupsSection from '../sections/Backups/BackupsSection';

const defaultBackupsConfig = {
  backupAutomatico: false,
  frecuenciaBackup: 'semanal',
};

interface BackupsTabProps {
  userRole: 'admin' | 'vocal';
}

/**
 * Pestaña de Configuración de Backups
 * Solo disponible para administradores
 */
const BackupsTab: React.FC<BackupsTabProps> = ({ userRole }) => {
  const { data: backups, setData: setBackups, loading, save } = useConfig('backups', defaultBackupsConfig);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función wrapper para compatibilidad de tipos
  const saveWrapper = async (data: any) => {
    await save(data);
  };

  if (userRole !== 'admin') {
    return null;
  }
  if (loading) {
    return (
      <VStack spacing={4} p={6} align="center">
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.600">Cargando configuración de seguridad...</Text>
      </VStack>
    );
  }

  return (
    <TabPanel>
      <VStack spacing={8} align="stretch">
        <Alert status="warning">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Configuración de Backups - Solo Administradores</Text>
            <Text>
              Gestiona la configuración de backup y seguridad del sistema. Solo los administradores pueden modificar estos parámetros.
            </Text>
          </Box>
        </Alert>
        <BackupsSection config={backups} setConfig={setBackups} save={saveWrapper} success={success} setSuccess={setSuccess} error={error} setError={setError} />
      </VStack>
    </TabPanel>
  );
};

export default BackupsTab;
