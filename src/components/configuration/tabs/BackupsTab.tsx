import React, { useState } from 'react';
import {
  Box,
  VStack,
  Alert,
  AlertIcon,
  Text,
  TabPanel,
  Card,
  CardBody,
  Heading,
  FormControl,
  FormLabel,
  Switch,
  SimpleGrid,
  Input,
  Select,
  Button
} from '@chakra-ui/react';
import { useSectionConfig } from '../../../hooks/configuration/useSectionConfig';
import { FiDatabase } from 'react-icons/fi';

const defaultSecurityConfig = {
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
  const { data: config, setData: setConfig, loading, save } = useSectionConfig('security', defaultSecurityConfig);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await save(config);
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
      setSuccess(false);
    }
  };

  if (userRole !== 'admin') {
    return null;
  }
  if (loading) return <Text>Cargando configuración...</Text>;

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

        {/* Configuración de Backup Automático */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={4} color="red.600" display="flex" alignItems="center">
              <FiDatabase style={{ marginRight: 8 }} />
              Backups y Seguridad
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="backup-auto" mb="0" fontSize="sm">
                  Backup automático
                </FormLabel>
                <Switch
                  id="backup-auto"
                  isChecked={config.backupAutomatico || false}
                  onChange={(e) => handleChange('backupAutomatico', e.target.checked)}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Frecuencia de backup</FormLabel>
                <Select
                  value={config.frecuenciaBackup || 'semanal'}
                  onChange={(e) => handleChange('frecuenciaBackup', e.target.value)}
                >
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </Select>
              </FormControl>
            </SimpleGrid>
            {error && <Text color="red.500" mt={2}>{error}</Text>}
            {success && <Text color="green.500" mt={2}>¡Guardado correctamente!</Text>}
            <Box display="flex" justifyContent="flex-end" mt={4}>
              <Button colorScheme="blue" onClick={handleSave} isLoading={loading}>
                Guardar
              </Button>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </TabPanel>
  );
};

export default BackupsTab;
