import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Switch,
  VStack,
  Text,
  Card,
  CardBody,
  Heading
} from '@chakra-ui/react';

interface BackupAnalyticsSectionProps {
  config: any;
  setConfig: (cfg: any) => void;
  userRole: 'admin' | 'vocal';
}

const BackupAnalyticsSection: React.FC<BackupAnalyticsSectionProps> = ({
  config,
  setConfig,
  userRole
}) => {
  // Solo mostrar para administradores
  if (userRole !== 'admin') {
    return null;
  }

  const handleChange = (section: string, key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  return (
    <>
      <Card>
        <CardBody>
          <Heading size="sm" mb={4} color="purple.600">
            💾 Servicios de Backup
          </Heading>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel fontSize="sm">Clave de API para backup</FormLabel>
              <Input
                name="backupApiKey"
                value={config.apis?.backupApiKey || ''}
                onChange={e => handleChange('apis', 'backupApiKey', e.target.value)}
                placeholder="Clave de API para servicio de backup automático"
                type="password"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                Para servicios de backup en la nube (AWS S3, Google Cloud, etc.)
              </Text>
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Heading size="sm" mb={4} color="orange.600">
            📊 Servicios de Analytics
          </Heading>
          <VStack spacing={4} align="stretch">
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <FormLabel htmlFor="analyticsEnabled" mb="0" fontSize="sm">
                  Habilitar analytics
                </FormLabel>
                <Text fontSize="xs" color="gray.600" mt={1}>
                  Recopilar estadísticas de uso de la aplicación
                </Text>
              </Box>
              <Switch
                id="analyticsEnabled"
                isChecked={config.variables?.analyticsEnabled || false}
                onChange={e => handleChange('variables', 'analyticsEnabled', e.target.checked)}
                colorScheme="brand"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Clave de Analytics</FormLabel>
              <Input
                name="analyticsKey"
                value={config.apis?.analyticsKey || ''}
                onChange={e => handleChange('apis', 'analyticsKey', e.target.value)}
                placeholder="Clave de Google Analytics o similar"
                type="password"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                Para servicios como Google Analytics, Mixpanel, etc.
              </Text>
            </FormControl>
          </VStack>
        </CardBody>
      </Card>
    </>
  );
};

export default BackupAnalyticsSection;
