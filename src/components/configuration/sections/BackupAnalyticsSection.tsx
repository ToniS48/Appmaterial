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
import { SectionProps } from '../../../types/configuration';

interface BackupAnalyticsSectionProps extends SectionProps {}

const BackupAnalyticsSection: React.FC<BackupAnalyticsSectionProps> = ({
  userRole,
  settings,
  handleApiChange,
  handleApiSwitchChange
}) => {
  // Solo mostrar para administradores
  if (userRole !== 'admin') {
    return null;
  }

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
                value={settings.apis.backupApiKey}
                onChange={(e) => handleApiChange('backupApiKey', e.target.value)}
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
                isChecked={settings.apis.analyticsEnabled}
                onChange={handleApiSwitchChange('analyticsEnabled')}
                colorScheme="brand"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Clave de Analytics</FormLabel>
              <Input
                name="analyticsKey"
                value={settings.apis.analyticsKey}
                onChange={(e) => handleApiChange('analyticsKey', e.target.value)}
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
