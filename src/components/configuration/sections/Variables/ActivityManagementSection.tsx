import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardBody,
  Heading,
  FormControl,
  FormLabel,
  Select,
  Text,
  SimpleGrid,
  Box,
  Button,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  VStack,
  Badge
} from '@chakra-ui/react';
import { FiCalendar } from 'react-icons/fi';
import { ActivityConfig } from '../../../../business/activities/ActivitiesBusinessLogic';
import { useActivityConfigurationState } from '../../../../hooks/business/useActivityBusinessLogic';

interface ActivityManagementSectionProps {
  config: any;
  setConfig: (cfg: any) => void;
  save: (data: any) => Promise<void>;
}

/**
 * Sección de Gestión de Actividades - UI separada de lógica de negocio
 */
const ActivityManagementSection: React.FC<ActivityManagementSectionProps> = ({
  config,
  setConfig,
  save
}) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Convertir config a ActivityConfig tipado
  const activityConfig: ActivityConfig = useMemo(() => ({
    diasMinimoAntelacionCreacion: config?.diasMinimoAntelacionCreacion ?? 7,
    diasMaximoModificacion: config?.diasMaximoModificacion ?? 3,
    limiteParticipantesPorDefecto: config?.limiteParticipantesPorDefecto ?? 20,
    tiempoMinimoActividad: config?.tiempoMinimoActividad ?? 60,
    tiempoMaximoActividad: config?.tiempoMaximoActividad ?? 240,
    alertasActivasActividades: config?.alertasActivasActividades ?? true,
    requiereAprobacionAdmin: config?.requiereAprobacionAdmin ?? false
  }), [config]);

  // Usar lógica de negocio separada
  const {
    config: businessConfig,
    updateField,
    isValid,
    errors,
    warnings,
    advanceCreationOptions,
    modificationLimitOptions,
    participantsLimitOptions,
    minTimeOptions,
    maxTimeOptions,
    configurationSummary,
    formatDuration
  } = useActivityConfigurationState(activityConfig);

  // Manejadores de UI puros
  const handleFieldChange = useCallback((field: keyof ActivityConfig, value: any) => {
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
        description: 'Configuración de actividades guardada correctamente.', 
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
        <Text fontSize="lg" fontWeight="semibold" color="blue.600" display="flex" alignItems="center">
          <FiCalendar style={{ marginRight: 8 }} />
          Gestión de Actividades
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
        <Box bg="blue.50" p={3} borderRadius="md" mb={4} mt={3}>
          <Text fontSize="sm" fontWeight="medium" color="blue.700">
            Configuración actual
          </Text>
          <Text fontSize="xs" color="blue.600" mt={1}>
            {configurationSummary}
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={2}>
              Antelación mínima para crear actividad
              <Badge colorScheme={businessConfig.diasMinimoAntelacionCreacion > 14 ? 'yellow' : 'green'} size="sm">
                {businessConfig.diasMinimoAntelacionCreacion}d
              </Badge>
            </FormLabel>
            <Select
              value={businessConfig.diasMinimoAntelacionCreacion}
              onChange={(e) => handleFieldChange('diasMinimoAntelacionCreacion', parseInt(e.target.value))}
              size="sm"
            >
              {advanceCreationOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días mínimos de antelación para crear una actividad
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={2}>
              Límite para modificar actividad
              <Badge colorScheme={businessConfig.diasMaximoModificacion > 7 ? 'orange' : 'blue'} size="sm">
                {businessConfig.diasMaximoModificacion}d antes
              </Badge>
            </FormLabel>
            <Select
              value={businessConfig.diasMaximoModificacion}
              onChange={(e) => handleFieldChange('diasMaximoModificacion', parseInt(e.target.value))}
              size="sm"
            >
              {modificationLimitOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días antes de actividad donde ya no se puede modificar
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={2}>
              Límite de participantes por defecto
              <Badge colorScheme={businessConfig.limiteParticipantesPorDefecto > 50 ? 'orange' : 'purple'} size="sm">
                {businessConfig.limiteParticipantesPorDefecto}
              </Badge>
            </FormLabel>
            <Select
              value={businessConfig.limiteParticipantesPorDefecto}
              onChange={(e) => handleFieldChange('limiteParticipantesPorDefecto', parseInt(e.target.value))}
              size="sm"
            >
              {participantsLimitOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Número máximo de participantes por defecto para nuevas actividades
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={2}>
              Tiempo mínimo de actividad
              <Badge colorScheme="teal" size="sm">
                {formatDuration(businessConfig.tiempoMinimoActividad)}
              </Badge>
            </FormLabel>
            <Select
              value={businessConfig.tiempoMinimoActividad}
              onChange={(e) => handleFieldChange('tiempoMinimoActividad', parseInt(e.target.value))}
              size="sm"
            >
              {minTimeOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Duración mínima que debe tener una actividad
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={2}>
              Tiempo máximo de actividad
              <Badge colorScheme="teal" size="sm">
                {formatDuration(businessConfig.tiempoMaximoActividad)}
              </Badge>
            </FormLabel>
            <Select
              value={businessConfig.tiempoMaximoActividad}
              onChange={(e) => handleFieldChange('tiempoMaximoActividad', parseInt(e.target.value))}
              size="sm"
            >
              {maxTimeOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Duración máxima que puede tener una actividad
            </Text>
          </FormControl>
        </SimpleGrid>

        <Box display="flex" justifyContent="flex-end" mt={6}>
          <Button 
            colorScheme="blue" 
            onClick={handleSave} 
            isLoading={loading}
            loadingText="Guardando..."
            isDisabled={!isValid}
            leftIcon={<FiCalendar />}
          >
            Guardar
          </Button>
        </Box>
      </CardBody>
    </Card>
  );
};

export default ActivityManagementSection;
