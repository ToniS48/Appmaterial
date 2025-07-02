import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Select,
  Text,
  SimpleGrid,
  Button,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  VStack,
  Box,
  Badge
} from '@chakra-ui/react';
import { FiTool } from 'react-icons/fi';
import { MaterialConfig } from '../../../../business/material/MaterialBusinessLogic';
import { useMaterialConfigurationState } from '../../../../hooks/business/useMaterialBusinessLogic';

interface MaterialManagementSectionProps {
  config: any;
  setConfig: (cfg: any) => void;
  save: (data: any) => Promise<void>;
}

/**
 * Sección de Gestión de Material - UI separada de lógica de negocio
 */
const MaterialManagementSection: React.FC<MaterialManagementSectionProps> = ({
  config,
  setConfig,
  save
}) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Convertir config a MaterialConfig tipado
  const materialConfig: MaterialConfig = useMemo(() => ({
    porcentajeStockMinimo: config?.porcentajeStockMinimo ?? 10,
    diasRevisionPeriodica: config?.diasRevisionPeriodica ?? 90,
    tiempoMinimoEntrePrestamos: config?.tiempoMinimoEntrePrestamos ?? 0
  }), [config]);

  // Usar lógica de negocio separada
  const {
    config: businessConfig,
    updateField,
    isValid,
    errors,
    warnings,
    stockPercentageOptions,
    revisionDaysOptions,
    timeBetweenLoansOptions,
    configurationSummary
  } = useMaterialConfigurationState(materialConfig);

  // Manejadores de UI puros
  const handleFieldChange = useCallback((field: keyof MaterialConfig, value: number) => {
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
        description: 'Configuración de material guardada correctamente.', 
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
        <Text fontSize="lg" fontWeight="semibold" color="orange.600" display="flex" alignItems="center">
          <FiTool style={{ marginRight: 8 }} />
          Gestión de Materiales
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
        <Box bg="orange.50" p={3} borderRadius="md" mb={4} mt={3}>
          <Text fontSize="sm" fontWeight="medium" color="orange.700">
            Configuración actual
          </Text>
          <Text fontSize="xs" color="orange.600" mt={1}>
            {configurationSummary}
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={2}>
              Porcentaje mínimo de stock
              <Badge colorScheme={businessConfig.porcentajeStockMinimo < 15 ? 'red' : 'green'} size="sm">
                {businessConfig.porcentajeStockMinimo}%
              </Badge>
            </FormLabel>
            <Select
              value={businessConfig.porcentajeStockMinimo}
              onChange={(e) => handleFieldChange('porcentajeStockMinimo', parseInt(e.target.value))}
              size="sm"
            >
              {stockPercentageOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Porcentaje mínimo de stock disponible antes de mostrar alertas
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={2}>
              Días de revisión periódica
              <Badge colorScheme={businessConfig.diasRevisionPeriodica > 120 ? 'yellow' : 'blue'} size="sm">
                {businessConfig.diasRevisionPeriodica}d
              </Badge>
            </FormLabel>
            <Select
              value={businessConfig.diasRevisionPeriodica}
              onChange={(e) => handleFieldChange('diasRevisionPeriodica', parseInt(e.target.value))}
              size="sm"
            >
              {revisionDaysOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Frecuencia para revisar el estado del material
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={2}>
              Tiempo mínimo entre préstamos
              <Badge colorScheme={businessConfig.tiempoMinimoEntrePrestamos === 0 ? 'green' : 'orange'} size="sm">
                {businessConfig.tiempoMinimoEntrePrestamos === 0 ? 'Sin límite' : `${businessConfig.tiempoMinimoEntrePrestamos}h`}
              </Badge>
            </FormLabel>
            <Select
              value={businessConfig.tiempoMinimoEntrePrestamos}
              onChange={(e) => handleFieldChange('tiempoMinimoEntrePrestamos', parseInt(e.target.value))}
              size="sm"
            >
              {timeBetweenLoansOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Tiempo mínimo que debe transcurrir entre préstamos del mismo usuario
            </Text>
          </FormControl>
        </SimpleGrid>

        <Box display="flex" justifyContent="flex-end" mt={6}>
          <Button 
            colorScheme="orange" 
            onClick={handleSave} 
            isLoading={loading}
            loadingText="Guardando..."
            isDisabled={!isValid}
            leftIcon={<FiTool />}
          >
            Guardar
          </Button>
        </Box>
      </CardBody>
    </Card>
  );
};

export default MaterialManagementSection;
