import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Switch,
  Select,
  Textarea,
  VStack,
  HStack,
  Box,
  useToast,
  Alert,
  AlertIcon,
  Badge,
  SimpleGrid
} from '@chakra-ui/react';
import { FiBell } from 'react-icons/fi';
import { NotificationConfig } from '../../../../business/notifications/NotificationsBusinessLogic';
import { useNotificationConfigurationState } from '../../../../hooks/business/useNotificationBusinessLogic';

interface NotificationSectionProps {
  config: any;
  setConfig: (cfg: any) => void;
  save: (data: any) => Promise<void>;
}

/**
 * Sección de Notificaciones Automáticas - UI separada de lógica de negocio
 */
const NotificationSection: React.FC<NotificationSectionProps> = ({
  config,
  setConfig,
  save
}) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Convertir config a NotificationConfig tipado
  const notificationConfig: NotificationConfig = useMemo(() => ({
    emailActivo: config?.emailActivo ?? true,
    smsActivo: config?.smsActivo ?? false,
    pushActivo: config?.pushActivo ?? true,
    minutosAntes: config?.minutosAntes ?? 15,
    horasAntes: config?.horasAntes ?? 2,
    diasAntes: config?.diasAntes ?? 1,
    notificarCreacion: config?.notificarCreacion ?? true,
    notificarModificacion: config?.notificarModificacion ?? true,
    notificarCancelacion: config?.notificarCancelacion ?? true,
    notificarRecordatorio: config?.notificarRecordatorio ?? true,
    tiempoRecordatorio: config?.tiempoRecordatorio ?? 60,
    templateEmail: config?.templateEmail ?? '',
    templateSms: config?.templateSms ?? ''
  }), [config]);

  // Usar lógica de negocio separada
  const {
    config: businessConfig,
    updateField,
    isValid,
    errors,
    warnings,
    minutesOptions,
    hoursOptions,
    daysOptions,
    reminderTimeOptions,
    configurationSummary,
    getDefaultEmailTemplate,
    getDefaultSmsTemplate
  } = useNotificationConfigurationState(notificationConfig);

  // Manejadores de UI puros
  const handleFieldChange = useCallback((field: keyof NotificationConfig, value: any) => {
    updateField(field, value);
    setConfig((prev: any) => ({ ...prev, [field]: value }));
  }, [updateField, setConfig]);

  const handleSave = useCallback(async () => {
    if (!isValid) {
      toast({
        title: 'Errores de validación',
        description: 'Por favor, corrige los errores antes de guardar',
        status: 'error',
        duration: 3000
      });
      return;
    }

    setLoading(true);
    try {
      await save(config);
      toast({ 
        title: 'Guardado', 
        description: 'Configuración de notificaciones guardada correctamente.', 
        status: 'success',
        duration: 2000
      });
    } catch (e) {
      toast({ 
        title: 'Error', 
        description: 'No se pudo guardar la configuración.', 
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  }, [isValid, save, config, toast]);

  return (
    <Card>
      <CardBody>
        <Text fontSize="lg" fontWeight="semibold" color="purple.600" display="flex" alignItems="center">
          <FiBell style={{ marginRight: 8 }} />
          Notificaciones Automáticas
        </Text>

        {/* Mostrar estado de validación */}
        {errors.length > 0 && (
          <Alert status="error" mt={3} mb={4}>
            <AlertIcon />
            <VStack align="stretch" spacing={1}>
              {errors.map((error: string, index: number) => (
                <Text key={index} fontSize="sm">{error}</Text>
              ))}
            </VStack>
          </Alert>
        )}

        {warnings.length > 0 && (
          <Alert status="warning" mt={3} mb={4}>
            <AlertIcon />
            <VStack align="stretch" spacing={1}>
              {warnings.map((warning: string, index: number) => (
                <Text key={index} fontSize="sm">{warning}</Text>
              ))}
            </VStack>
          </Alert>
        )}

        {/* Resumen de configuración */}
        <Box bg="purple.50" p={3} borderRadius="md" mb={4} mt={3}>
          <Text fontSize="sm" fontWeight="medium" color="purple.700">
            Configuración actual
          </Text>
          <Text fontSize="xs" color="purple.600" mt={1}>
            {configurationSummary}
          </Text>
        </Box>

        {/* Métodos de notificación */}
        <Box mb={6}>
          <Text fontSize="md" fontWeight="semibold" mb={3}>Métodos de notificación</Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="email-notifications" mb="0" fontSize="sm">
                Email
                <Badge ml={2} colorScheme={businessConfig.emailActivo ? 'green' : 'gray'}>
                  {businessConfig.emailActivo ? 'Activo' : 'Inactivo'}
                </Badge>
              </FormLabel>
              <Switch
                id="email-notifications"
                isChecked={businessConfig.emailActivo}
                onChange={(e) => handleFieldChange('emailActivo', e.target.checked)}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="sms-notifications" mb="0" fontSize="sm">
                SMS
                <Badge ml={2} colorScheme={businessConfig.smsActivo ? 'green' : 'gray'}>
                  {businessConfig.smsActivo ? 'Activo' : 'Inactivo'}
                </Badge>
              </FormLabel>
              <Switch
                id="sms-notifications"
                isChecked={businessConfig.smsActivo}
                onChange={(e) => handleFieldChange('smsActivo', e.target.checked)}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="push-notifications" mb="0" fontSize="sm">
                Push
                <Badge ml={2} colorScheme={businessConfig.pushActivo ? 'green' : 'gray'}>
                  {businessConfig.pushActivo ? 'Activo' : 'Inactivo'}
                </Badge>
              </FormLabel>
              <Switch
                id="push-notifications"
                isChecked={businessConfig.pushActivo}
                onChange={(e) => handleFieldChange('pushActivo', e.target.checked)}
              />
            </FormControl>
          </SimpleGrid>
        </Box>

        {/* Configuración de tiempo */}
        <Box mb={6}>
          <Text fontSize="md" fontWeight="semibold" mb={3}>Tiempo de anticipación</Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Minutos antes</FormLabel>
              <Select
                value={businessConfig.minutosAntes}
                onChange={(e) => handleFieldChange('minutosAntes', parseInt(e.target.value))}
                size="sm"
              >
                {minutesOptions.map((option: any) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Horas antes</FormLabel>
              <Select
                value={businessConfig.horasAntes}
                onChange={(e) => handleFieldChange('horasAntes', parseInt(e.target.value))}
                size="sm"
              >
                {hoursOptions.map((option: any) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Días antes</FormLabel>
              <Select
                value={businessConfig.diasAntes}
                onChange={(e) => handleFieldChange('diasAntes', parseInt(e.target.value))}
                size="sm"
              >
                {daysOptions.map((option: any) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>
          </SimpleGrid>
        </Box>

        {/* Eventos a notificar */}
        <Box mb={6}>
          <Text fontSize="md" fontWeight="semibold" mb={3}>Eventos a notificar</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="notify-creation" mb="0" fontSize="sm">
                Creación de actividades
              </FormLabel>
              <Switch
                id="notify-creation"
                isChecked={businessConfig.notificarCreacion}
                onChange={(e) => handleFieldChange('notificarCreacion', e.target.checked)}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="notify-modification" mb="0" fontSize="sm">
                Modificación de actividades
              </FormLabel>
              <Switch
                id="notify-modification"
                isChecked={businessConfig.notificarModificacion}
                onChange={(e) => handleFieldChange('notificarModificacion', e.target.checked)}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="notify-cancellation" mb="0" fontSize="sm">
                Cancelación de actividades
              </FormLabel>
              <Switch
                id="notify-cancellation"
                isChecked={businessConfig.notificarCancelacion}
                onChange={(e) => handleFieldChange('notificarCancelacion', e.target.checked)}
              />
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="notify-reminder" mb="0" fontSize="sm">
                Recordatorios
              </FormLabel>
              <Switch
                id="notify-reminder"
                isChecked={businessConfig.notificarRecordatorio}
                onChange={(e) => handleFieldChange('notificarRecordatorio', e.target.checked)}
              />
            </FormControl>
          </SimpleGrid>
        </Box>

        <Box display="flex" justifyContent="flex-end" mt={6}>
          <Button 
            colorScheme="purple" 
            onClick={handleSave} 
            isLoading={loading}
            loadingText="Guardando..."
            isDisabled={!isValid}
            leftIcon={<FiBell />}
          >
            Guardar
          </Button>
        </Box>
      </CardBody>
    </Card>
  );
};

export default NotificationSection;
