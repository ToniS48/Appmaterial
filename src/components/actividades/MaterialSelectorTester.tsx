/**
 * Componente de prueba específico para validar las optimizaciones realizadas
 * al selector de materiales y medir su rendimiento.
 */
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Box, VStack, Heading, Text, Button, Badge, Code, useToast } from '@chakra-ui/react';
import { useForm, Control } from 'react-hook-form';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { setupSchedulerOptimizer } from '../../utils/reactSchedulerOptimizer';
import MaterialSelector from './MaterialSelector';
import { MaterialField } from '../material/types';

// Definir la interfaz localmente
interface MaterialSelectorProps {
  control: Control<any>;
  name: string;
  error?: any;
  materialesActuales?: MaterialField[];
  cardBg?: string;
  borderColor?: string;
}

/**
 * Componente para probar y validar las optimizaciones realizadas al MaterialSelector
 */
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
    } else {
      if (cleanup) {
        cleanup();
      }
    }
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [activeOptimizations, toast]);
  
  // Manejar inicio/parada del monitoreo
  const handleToggleMonitor = () => {
    setIsMonitoring(prev => !prev);
  };
  
  // Manejar activación/desactivación de optimizaciones
  const handleToggleOptimizations = () => {
    setActiveOptimizations(prev => !prev);
  };
  
  // Limpiar datos de métricas
  const handleClearMetrics = () => {
    performanceMonitor.clearViolations();
    setViolations({ count: 0, averageDuration: 0, byType: {} });
  };
  // Formato para mostrar violaciones por tipo
  const renderViolationsByType = () => {
    return Object.entries(violations.byType).map(([type, count]) => (
      <Badge key={type} colorScheme={type === 'scheduler' ? 'red' : 'orange'} mr={2}>
        {type}: {count.toString()}
      </Badge>
    ));
  };
  
  return (
    <Box p={5} maxWidth="900px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box borderWidth={1} borderRadius="md" p={4} bg="gray.50">
          <Heading size="md" mb={4}>Panel de Control de Pruebas</Heading>
          
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

        <Box borderWidth={1} borderRadius="md" p={4}>          <Heading size="md" mb={4}>
            Componente MaterialSelector {activeOptimizations ? "(Optimizado)" : "(Sin optimizar)"}
          </Heading>
          
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
