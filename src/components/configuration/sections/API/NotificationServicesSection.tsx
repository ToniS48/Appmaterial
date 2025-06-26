import React, { useState } from 'react';
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
  Heading,
  Button,
  useToast
} from '@chakra-ui/react';

interface NotificationServicesSectionProps {
  userRole: 'admin' | 'vocal';
  config: any;
  setConfig: (cfg: any) => void;
  save: (data: any) => Promise<void>;
}

const NotificationServicesSection: React.FC<NotificationServicesSectionProps> = ({
  userRole,
  config,
  setConfig,
  save
}) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSwitchChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig((prev: any) => ({
      ...prev,
      apis: {
        ...prev.apis,
        [key]: e.target.checked,
      },
    }));
  };
  const handleInputChange = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      apis: {
        ...prev.apis,
        [key]: value,
      },
    }));
  };
  const handleChange = (group: string, key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value,
      },
    }));
  };
  const handleSave = async () => {
    setLoading(true);
    try {
      await save(config);
      toast({ title: 'Guardado', description: 'Configuración de notificaciones guardada.', status: 'success' });
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo guardar la configuración.', status: 'error' });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card>
      <CardBody>
        <Heading size="sm" mb={4} color="green.600">
          🔔 Servicios de Notificaciones
        </Heading>
        <VStack spacing={4} align="stretch">
          <FormControl display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <FormLabel htmlFor="notificationsEnabled" mb="0" fontSize="sm">
                Habilitar notificaciones automáticas
              </FormLabel>
              <Text fontSize="xs" color="gray.600" mt={1}>
                Activar/desactivar el sistema de notificaciones
              </Text>
            </Box>
            <Switch
              id="notificationsEnabled"
              isChecked={config.variables?.notificationsEnabled || false}
              onChange={e => handleChange('variables', 'notificationsEnabled', e.target.checked)}
              colorScheme="brand"
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Clave del servicio de correo</FormLabel>
            <Input
              name="emailServiceKey"
              value={config.apis.emailServiceKey}
              onChange={e => handleInputChange('emailServiceKey', e.target.value)}
              placeholder="Clave de API para servicio de correo"
              type={userRole === 'vocal' ? 'password' : 'text'}
              isReadOnly={userRole === 'vocal'}
              bg={userRole === 'vocal' ? "gray.50" : undefined}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              {userRole === 'vocal'
                ? 'Solo administradores pueden modificar las claves'
                : 'Para servicios como SendGrid, Mailgun, etc.'
              }
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Clave del servicio SMS</FormLabel>
            <Input
              name="smsServiceKey"
              value={config.apis.smsServiceKey}
              onChange={e => handleInputChange('smsServiceKey', e.target.value)}
              placeholder="Clave de API para servicio SMS"
              type={userRole === 'vocal' ? 'password' : 'text'}
              isReadOnly={userRole === 'vocal'}
              bg={userRole === 'vocal' ? "gray.50" : undefined}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              {userRole === 'vocal'
                ? 'Solo administradores pueden modificar las claves'
                : 'Para servicios como Twilio, Nexmo, etc.'
              }
            </Text>
          </FormControl>
          <Button colorScheme="blue" onClick={handleSave} isLoading={loading} alignSelf="flex-end">
            Guardar
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default NotificationServicesSection;
