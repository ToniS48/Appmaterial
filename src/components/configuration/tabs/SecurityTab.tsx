import React from 'react';
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
  Select
} from '@chakra-ui/react';
import { ConfigSettings } from '../../../types/configuration';

interface SecurityTabProps {
  settings: ConfigSettings;
  userRole: 'admin' | 'vocal';
  onVariableChange: (key: string, value: any) => void;
}

/**
 * Pestaña de Configuración de Seguridad
 * Solo disponible para administradores
 */
const SecurityTab: React.FC<SecurityTabProps> = ({
  settings,
  userRole,
  onVariableChange
}) => {
  if (userRole !== 'admin') {
    return null;
  }

  return (
    <TabPanel>
      <VStack spacing={8} align="stretch">
        <Alert status="warning">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Configuración de Seguridad - Solo Administradores</Text>
            <Text>
              Configura parámetros de seguridad, backup automático y políticas del sistema.
              Estos cambios pueden afectar la seguridad y estabilidad del sistema.
            </Text>
          </Box>
        </Alert>

        {/* Configuración de Backup Automático */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={4} color="red.600">
              🔒 Backup y Seguridad
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="backup-auto" mb="0" fontSize="sm">
                  Backup automático
                </FormLabel>
                <Switch
                  id="backup-auto"
                  isChecked={settings.backupAutomatico || false}
                  onChange={(e) => onVariableChange('backupAutomatico', e.target.checked)}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Frecuencia de backup</FormLabel>
                <Select
                  value={settings.frecuenciaBackup || 'semanal'}
                  onChange={(e) => onVariableChange('frecuenciaBackup', e.target.value)}
                >
                  <option value="diario">Diario</option>                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </Select>
              </FormControl>
            </SimpleGrid>          </CardBody>
        </Card>

        {/* TODO: Añadir más secciones de seguridad según sea necesario */}
        {/* <AuthenticationSection /> */}
        {/* <AuditLogSection /> */}
      </VStack>
    </TabPanel>
  );
};

export default SecurityTab;
