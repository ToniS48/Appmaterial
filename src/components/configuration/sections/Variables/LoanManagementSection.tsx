import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardBody,
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
import { FiRepeat } from 'react-icons/fi';
import { LoanConfig } from '../../../../business/loans/LoansBusinessLogic';
import { useLoanConfigurationState } from '../../../../hooks/business/useLoanBusinessLogic';

interface LoanManagementSectionProps {
  userRole: 'admin' | 'vocal';
  config: any;
  setConfig: (cfg: any) => void;
  save: (data: any) => Promise<void>;
}

/**
 * Sección de Gestión de Préstamos y Devoluciones - UI separada de lógica de negocio
 */
const LoanManagementSection: React.FC<LoanManagementSectionProps> = ({
  userRole,
  config,
  setConfig,
  save
}) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Convertir config a LoanConfig tipado
  const loanConfig: LoanConfig = useMemo(() => ({
    diasMinimoAntelacionPrestamo: config?.diasMinimoAntelacionPrestamo ?? 1,
    diasMaximoAdelantoPrestamo: config?.diasMaximoAdelantoPrestamo ?? 30,
    diasLimiteDevolucion: config?.diasLimiteDevolucion ?? 14,
    penalizacionPorDiaRetraso: config?.penalizacionPorDiaRetraso ?? 1,
    limitePrestamosSimultaneos: config?.limitePrestamosSimultaneos ?? 3,
    alertasActivasPrestamos: config?.alertasActivasPrestamos ?? true,
    alertasActivasDevoluciones: config?.alertasActivasDevoluciones ?? true
  }), [config]);

  // Usar lógica de negocio separada
  const {
    config: businessConfig,
    updateField,
    isValid,
    errors,
    warnings,
    advanceDaysOptions,
    maxAdvanceOptions,
    returnLimitOptions,
    penaltyOptions,
    simultaneousLoansOptions,
    configurationSummary
  } = useLoanConfigurationState(loanConfig);

  // Manejadores de UI puros
  const handleFieldChange = useCallback((field: keyof LoanConfig, value: any) => {
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
        description: 'Configuración de préstamos guardada correctamente.', 
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
        <Text fontSize="lg" fontWeight="semibold" color="cyan.600" display="flex" alignItems="center">
          <FiRepeat style={{ marginRight: 8 }} />
          Gestión de Préstamos
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
        <Box bg="cyan.50" p={3} borderRadius="md" mb={4} mt={3}>
          <Text fontSize="sm" fontWeight="medium" color="cyan.700">
            Configuración actual
          </Text>
          <Text fontSize="xs" color="cyan.600" mt={1}>
            {configurationSummary}
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={2}>
              Antelación mínima para préstamo
              <Badge colorScheme={businessConfig.diasMinimoAntelacionPrestamo > 7 ? 'yellow' : 'green'} size="sm">
                {businessConfig.diasMinimoAntelacionPrestamo}d
              </Badge>
            </FormLabel>
            <Select
              value={businessConfig.diasMinimoAntelacionPrestamo}
              onChange={(e) => handleFieldChange('diasMinimoAntelacionPrestamo', parseInt(e.target.value))}
              size="sm"
            >
              {advanceDaysOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días mínimos de antelación para solicitar un préstamo
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={2}>
              Adelanto máximo permitido
              <Badge colorScheme={businessConfig.diasMaximoAdelantoPrestamo > 60 ? 'orange' : 'blue'} size="sm">
                {businessConfig.diasMaximoAdelantoPrestamo}d
              </Badge>
            </FormLabel>
            <Select
              value={businessConfig.diasMaximoAdelantoPrestamo}
              onChange={(e) => handleFieldChange('diasMaximoAdelantoPrestamo', parseInt(e.target.value))}
              size="sm"
            >
              {maxAdvanceOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días máximos con los que se puede solicitar un préstamo por adelantado
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={2}>
              Límite de devolución
              <Badge colorScheme={businessConfig.diasLimiteDevolucion > 21 ? 'yellow' : 'green'} size="sm">
                {businessConfig.diasLimiteDevolucion}d
              </Badge>
            </FormLabel>
            <Select
              value={businessConfig.diasLimiteDevolucion}
              onChange={(e) => handleFieldChange('diasLimiteDevolucion', parseInt(e.target.value))}
              size="sm"
            >
              {returnLimitOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días máximos para devolver el material prestado
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={2}>
              Penalización por día de retraso
              <Badge colorScheme={businessConfig.penalizacionPorDiaRetraso === 0 ? 'green' : businessConfig.penalizacionPorDiaRetraso > 5 ? 'red' : 'orange'} size="sm">
                {businessConfig.penalizacionPorDiaRetraso === 0 ? 'Sin penalización' : `${businessConfig.penalizacionPorDiaRetraso}pts`}
              </Badge>
            </FormLabel>
            <Select
              value={businessConfig.penalizacionPorDiaRetraso}
              onChange={(e) => handleFieldChange('penalizacionPorDiaRetraso', parseInt(e.target.value))}
              size="sm"
            >
              {penaltyOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Puntos de penalización por cada día de retraso en la devolución
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" display="flex" alignItems="center" gap={2}>
              Préstamos simultáneos
              <Badge colorScheme={businessConfig.limitePrestamosSimultaneos > 5 ? 'orange' : 'blue'} size="sm">
                {businessConfig.limitePrestamosSimultaneos}
              </Badge>
            </FormLabel>
            <Select
              value={businessConfig.limitePrestamosSimultaneos}
              onChange={(e) => handleFieldChange('limitePrestamosSimultaneos', parseInt(e.target.value))}
              size="sm"
            >
              {simultaneousLoansOptions.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Número máximo de préstamos simultáneos por usuario
            </Text>
          </FormControl>
        </SimpleGrid>

        <Box display="flex" justifyContent="flex-end" mt={6}>
          <Button 
            colorScheme="cyan" 
            onClick={handleSave} 
            isLoading={loading}
            loadingText="Guardando..."
            isDisabled={!isValid}
            leftIcon={<FiRepeat />}
          >
            Guardar
          </Button>
        </Box>
      </CardBody>
    </Card>
  );
};

export default LoanManagementSection;
