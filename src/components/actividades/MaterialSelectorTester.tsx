/**
 * Componente de prueba específico para validar las optimizaciones realizadas
 * al selector de materiales y medir su rendimiento.
 */
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Box, VStack, Heading, Text, Button, Badge, Code, useToast } from '@chakra-ui/react';
import { useForm, Control } from 'react-hook-form';

import { PerformanceMonitor } from '../../utils/performanceTestUtils';
import { setupSchedulerOptimizer } from '../../utils/reactSchedulerOptimizer';
import MaterialSelector from './MaterialSelector';
import { Material } from '../../types/material';

import { performanceMonitor } from '../../utils/performanceMonitor';
import { setupSchedulerOptimizer } from '../../utils/reactSchedulerOptimizer';
import MaterialSelector from './MaterialSelector';
import { MaterialField } from '../material/types';


// Definir la interfaz localmente
interface MaterialSelectorProps {
  control: Control<any>;
  name: string;
  error?: any;

  materialesActuales?: Material[];
  materialesActuales?: MaterialField[];

  cardBg?: string;
  borderColor?: string;
}

/**

 * Componente de prueba específico para validar las optimizaciones realizadas
 * al selector de materiales y medir su rendimiento.
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

  const [performanceResults, setPerformanceResults] = useState({
    violationCount: 0,
    averageExecutionTime: 0,
    maxExecutionTime: 0,
    totalOperations: 0,
    successRate: 100
  });

  const toast = useToast();
  
  // Usar react-hook-form para crear un control válido
  const { control } = useForm();


  // Instancia del monitor de rendimiento
  const performanceMonitor = PerformanceMonitor.getInstance();

  // Efectos
  useEffect(() => {
    // Suscribirse al monitor de rendimiento
    const unsubscribe = performanceMonitor.subscribe((results) => {
      setPerformanceResults(results);
      setViolations({
        count: results.violationCount,
        averageDuration: results.averageExecutionTime,
        byType: { scheduler: results.violationCount }
      });
    });

    if (isMonitoring) {
      performanceMonitor.startMonitoring();
    } else {
      performanceMonitor.stopMonitoring();
    }

    return () => {
      unsubscribe();
      performanceMonitor.stopMonitoring();

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

    let cleanup = () => {};

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

    performanceMonitor.reset();
    setPerformanceResults({
      violationCount: 0,
      averageExecutionTime: 0,
      maxExecutionTime: 0,
      totalOperations: 0,
      successRate: 100
    });
    setViolations({ count: 0, averageDuration: 0, byType: {} });
  };  // Formato para mostrar violaciones por tipo

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


  // Calcular puntuación de rendimiento
  const getPerformanceScore = () => {
    return Math.max(0, 100 - (performanceResults.violationCount * 10) - (performanceResults.averageExecutionTime * 0.1));
  };

  const getScoreColor = () => {
    const score = getPerformanceScore();
    if (score > 80) return 'green';
    if (score > 60) return 'yellow';
    return 'red';
  };

  
  return (
    <Box p={5} maxWidth="900px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box borderWidth={1} borderRadius="md" p={4} bg="gray.50">

          <Heading size="md" mb={4}>Panel de Control de Pruebas de Rendimiento</Heading>

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

            <Heading size="sm" mb={3}>Métricas de Rendimiento en Tiempo Real</Heading>
            
            <VStack spacing={2} align="stretch">
              <Text>
                Violaciones detectadas: <Badge colorScheme={performanceResults.violationCount > 0 ? "red" : "green"}>
                  {performanceResults.violationCount}
                </Badge>
              </Text>
              
              <Text>
                Tiempo promedio: <Code>{performanceResults.averageExecutionTime.toFixed(2)}ms</Code>
              </Text>
              
              <Text>
                Tiempo máximo: <Code>{performanceResults.maxExecutionTime.toFixed(2)}ms</Code>
              </Text>
              
              <Text>
                Operaciones totales: <Badge colorScheme="blue">{performanceResults.totalOperations}</Badge>
              </Text>
              
              <Text>
                Tasa de éxito: <Badge colorScheme={performanceResults.successRate > 90 ? "green" : "yellow"}>
                  {performanceResults.successRate.toFixed(1)}%
                </Badge>
              </Text>
              
              <Text>
                Puntuación general: <Badge colorScheme={getScoreColor()} fontSize="md">
                  {getPerformanceScore().toFixed(1)}/100
                </Badge>
              </Text>
              
              {violations.count > 0 && (
                <Box>
                  <Text mb={1} fontSize="sm">Tipos de violaciones:</Text>
                  <Box>{renderViolationsByType()}</Box>
                </Box>
              )}
            </VStack>
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
