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

interface NotificationServicesSectionProps extends SectionProps {}

const NotificationServicesSection: React.FC<NotificationServicesSectionProps> = ({
  userRole,
  settings,
  handleApiChange,
  handleApiSwitchChange
}) => {
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
              isChecked={settings.apis.notificationsEnabled}
              onChange={handleApiSwitchChange('notificationsEnabled')}
              colorScheme="brand"
            />
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Clave del servicio de correo</FormLabel>
            <Input
              name="emailServiceKey"
              value={settings.apis.emailServiceKey}
              onChange={(e) => handleApiChange('emailServiceKey', e.target.value)}
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
              value={settings.apis.smsServiceKey}
              onChange={(e) => handleApiChange('smsServiceKey', e.target.value)}
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
        </VStack>
      </CardBody>
    </Card>
  );
};

export default NotificationServicesSection;
