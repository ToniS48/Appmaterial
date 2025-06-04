/**
 * Componente de prueba específico para validar las optimizaciones realizadas
 * al selector de materiales y medir su rendimiento.
 */
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useForm, Control } from 'react-hook-form';
import { Box, VStack, Heading, Text, Button, Badge, Code, useToast } from '@chakra-ui/react';
import { Material } from '../../types/material';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { setupSchedulerOptimizer } from '../../utils/reactSchedulerOptimizer';
import MaterialSelector from './MaterialSelector';

// Definir la interfaz localmente
interface MaterialSelectorProps {
  control: Control<any>;
  name: string;
  error?: any;
  materialesActuales?: Material[];
  cardBg?: string;
  borderColor?: string;
}

const MaterialSelectorTester: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [violations, setViolations] = useState<{ 
    count: number; 
    averageDuration: number; 
    byType: Record<string, number>;
  }>({ count: 0, averageDuration: 0, byType: {} });
  const [activeOptimizations, setActiveOptimizations] = useState(false);
  const toast = useToast();
  
  // Usar react-hook-form para crear un control válido
  const { control } = useForm();
  
  // Limpiar al montar/desmontar
  let cleanup = () => {};

  // Efectos
  useEffect(() => {
    // Trackear si el componente está montado
    let isMounted = true;
    
    // Iniciar monitoreo
    if (isMonitoring) {
      performanceMonitor.clearViolations();
      performanceMonitor.start({
        onViolation: () => {
          // Actualizar las estadísticas de violaciones periódicamente
          if (isMounted) {
            setViolations({...performanceMonitor.getViolationSummary()});
          }
        }
      });
    } else {
      // Detener monitoreo si estaba activo
      performanceMonitor.stop();
    }
    
    return () => {
      isMounted = false;
      performanceMonitor.stop();
    };
  }, [isMonitoring]);
  
  // Aplicar optimizaciones según el estado del switch
  useLayoutEffect(() => {
    if (activeOptimizations) {
      cleanup = setupSchedulerOptimizer();
      
      toast({
        title: "Optimizaciones activadas",
        description: "Se han aplicado optimizaciones al componente",
        status: "success",
        duration: 3000,
      });
    }
    
    return cleanup;
  }, [activeOptimizations, toast]);

  // Handlers para los controles
  const handleToggleMonitor = () => {
    setIsMonitoring(!isMonitoring);
  };

  const handleToggleOptimizations = () => {
    setActiveOptimizations(!activeOptimizations);
  };

  const handleClearMetrics = () => {
    performanceMonitor.clearViolations();
    setViolations({ count: 0, averageDuration: 0, byType: {} });
  };

  // Formato para mostrar violaciones por tipo
  const renderViolationsByType = () => {
    return Object.entries(violations.byType).map(([type, count]) => (
      <Badge key={type} colorScheme={type === 'scheduler' ? 'red' : 'orange'} mr={2}>
        {type}: {String(count)}
      </Badge>
    ));
  };

  return (
    <Box p={5} maxWidth="900px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box borderWidth={1} borderRadius="md" p={4} bg="gray.50">
          <Heading size="md" mb={4}>Panel de Control de Pruebas de Rendimiento</Heading>
          
          <Box mb={4}>
            <Button 
              colorScheme={isMonitoring ? "red" : "blue"}
              onClick={handleToggleMonitor}
              mr={2}
            >
              {isMonitoring ? "Detener Monitoreo" : "Iniciar Monitoreo"}
            </Button>
            
            <Button 
              colorScheme={activeOptimizations ? "green" : "gray"}
              onClick={handleToggleOptimizations}
              mr={2}
            >
              {activeOptimizations ? "Desactivar Optimizaciones" : "Activar Optimizaciones"}
            </Button>
            
            <Button onClick={handleClearMetrics} variant="outline">
              Limpiar Métricas
            </Button>
          </Box>
          
          <Box borderWidth={1} borderRadius="md" p={3} bg="white">
            <Heading size="sm" mb={2}>Métricas de Rendimiento</Heading>
            
            <Text>
              Violaciones detectadas: <Badge colorScheme={violations.count > 0 ? "red" : "green"}>{violations.count}</Badge>
            </Text>
            
            {violations.count > 0 && (
              <>
                <Text>
                  Duración promedio: <Code>{violations.averageDuration.toFixed(2)}ms</Code>
                </Text>
                <Text mb={1}>Tipos de violaciones:</Text>
                <Box>{renderViolationsByType()}</Box>
              </>
            )}
          </Box>
        </Box>

        <Box borderWidth={1} borderRadius="md" p={4}>
          <Heading size="md" mb={4}>
            Componente MaterialSelector {activeOptimizations ? "(Optimizado)" : "(Sin optimizar)"}
            {isMonitoring && <Badge ml={2} colorScheme="blue">MONITOREANDO</Badge>}
          </Heading>
          
          <Text fontSize="sm" color="gray.600" mb={4}>
            💡 Interactúa con el selector para generar métricas. Las optimizaciones deberían reducir 
            significativamente las violaciones del scheduler.
          </Text>

          <Box position="relative" p={1} border="1px dashed" borderColor="gray.200">
            <MaterialSelector 
              control={control} 
              name="materialesPrueba"
            />
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default MaterialSelectorTester;

// Export vacío para asegurar que es un módulo
export {};
