import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Switch,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  Heading,
  Card,
  CardBody,
  Progress,
  Divider
} from '@chakra-ui/react';
import { FiActivity, FiZap, FiTrendingUp, FiCheck } from 'react-icons/fi';

interface PerformanceMetrics {
  violationCount: number;
  averageDuration: number;
  taskCount: number;
  maxDuration: number;
}

const PerformanceTestComponent: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    violationCount: 0,
    averageDuration: 0,
    taskCount: 0,
    maxDuration: 0
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [optimizationsEnabled, setOptimizationsEnabled] = useState(true);

  // Simular un componente con violaciones de rendimiento
  const performHeavyTask = () => {
    const start = performance.now();
    
    if (optimizationsEnabled) {
      // Versión optimizada - usar requestIdleCallback
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          // Simular trabajo pesado pero en idle time
          let result = 0;
          for (let i = 0; i < 100000; i++) {
            result += Math.random() * i;
          }
          console.log('Tarea optimizada completada:', result);
        });
      } else {
        setTimeout(() => {
          let result = 0;
          for (let i = 0; i < 100000; i++) {
            result += Math.random() * i;
          }
          console.log('Tarea optimizada completada (fallback):', result);
        }, 0);
      }
    } else {
      // Versión sin optimizar - bloquea el hilo principal
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.random() * i;
      }
      console.log('Tarea sin optimizar completada:', result);
    }
    
    const end = performance.now();
    console.log(`Tiempo de ejecución: ${end - start}ms`);
  };

  // Monitoreo de rendimiento
  useEffect(() => {
    if (!isMonitoring) return;

    let observer: PerformanceObserver | null = null;
    let violationCount = 0;
    let totalDuration = 0;
    let taskCount = 0;
    let maxDuration = 0;

    // Monitorear tareas largas
    if ('PerformanceObserver' in window) {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask' || entry.duration > 16) {
            violationCount++;
            totalDuration += entry.duration;
            taskCount++;
            maxDuration = Math.max(maxDuration, entry.duration);
            
            setMetrics({
              violationCount,
              averageDuration: totalDuration / taskCount,
              taskCount,
              maxDuration
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('LongTask API no disponible, usando métricas básicas');
      }
    }

    // Interceptar violaciones del scheduler de React
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('Violation') || message.includes('handler took')) {
        violationCount++;
        setMetrics(prev => ({
          ...prev,
          violationCount: violationCount
        }));
      }
      originalWarn.apply(console, args);
    };

    return () => {
      if (observer) {
        observer.disconnect();
      }
      console.warn = originalWarn;
    };
  }, [isMonitoring]);

  const resetMetrics = () => {
    setMetrics({
      violationCount: 0,
      averageDuration: 0,
      taskCount: 0,
      maxDuration: 0
    });
  };

  const getPerformanceScore = () => {
    if (!isMonitoring) return 100;
    
    // Calcular puntuación basada en violaciones y duración
    const violationPenalty = metrics.violationCount * 10;
    const durationPenalty = Math.max(0, (metrics.averageDuration - 16) / 2);
    const score = Math.max(0, 100 - violationPenalty - durationPenalty);
    
    return Math.round(score);
  };

  const performanceScore = getPerformanceScore();

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb={2}>Monitor de Rendimiento React</Heading>
          <Text color="gray.600">
            Herramienta para verificar las optimizaciones de scheduler violations
          </Text>
        </Box>

        {/* Panel de Control */}
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Panel de Control</Heading>
            
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="monitoring" mb="0" mr={4}>
                    Monitoreo de rendimiento
                  </FormLabel>
                  <Switch
                    id="monitoring"
                    isChecked={isMonitoring}
                    onChange={(e) => setIsMonitoring(e.target.checked)}
                    colorScheme="blue"
                  />
                </FormControl>
                
                <Badge colorScheme={isMonitoring ? "green" : "gray"}>
                  {isMonitoring ? "Activo" : "Inactivo"}
                </Badge>
              </HStack>

              <HStack justify="space-between">
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="optimizations" mb="0" mr={4}>
                    Optimizaciones habilitadas
                  </FormLabel>
                  <Switch
                    id="optimizations"
                    isChecked={optimizationsEnabled}
                    onChange={(e) => setOptimizationsEnabled(e.target.checked)}
                    colorScheme="green"
                  />
                </FormControl>
                
                <Badge colorScheme={optimizationsEnabled ? "green" : "red"}>
                  {optimizationsEnabled ? "ON" : "OFF"}
                </Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Métricas de Rendimiento */}
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Métricas de Rendimiento</Heading>
            
            <VStack spacing={4} align="stretch">
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="semibold">Puntuación de Rendimiento</Text>
                  <Badge 
                    colorScheme={
                      performanceScore >= 80 ? "green" :
                      performanceScore >= 60 ? "yellow" : "red"
                    }
                    fontSize="lg"
                  >
                    {performanceScore}/100
                  </Badge>
                </HStack>
                <Progress 
                  value={performanceScore} 
                  colorScheme={
                    performanceScore >= 80 ? "green" :
                    performanceScore >= 60 ? "yellow" : "red"
                  }
                  size="lg"
                />
              </Box>

              <Divider />

              <HStack justify="space-between">
                <VStack spacing={1} align="start">
                  <HStack>
                    <FiActivity />
                    <Text fontWeight="semibold">Violaciones Detectadas</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color={metrics.violationCount === 0 ? "green.500" : "red.500"}>
                    {metrics.violationCount}
                  </Text>
                </VStack>

                <VStack spacing={1} align="start">
                  <HStack>
                    <FiZap />
                    <Text fontWeight="semibold">Duración Promedio</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color={metrics.averageDuration <= 16 ? "green.500" : "orange.500"}>
                    {metrics.averageDuration.toFixed(1)}ms
                  </Text>
                </VStack>

                <VStack spacing={1} align="start">
                  <HStack>
                    <FiTrendingUp />
                    <Text fontWeight="semibold">Duración Máxima</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="bold" color={metrics.maxDuration <= 50 ? "green.500" : "red.500"}>
                    {metrics.maxDuration.toFixed(1)}ms
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Botones de Prueba */}
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Pruebas de Rendimiento</Heading>
            
            <VStack spacing={3}>
              <HStack spacing={3} w="100%">
                <Button
                  onClick={performHeavyTask}
                  colorScheme="blue"
                  leftIcon={<FiZap />}
                  flex={1}
                >
                  Ejecutar Tarea Pesada
                </Button>
                
                <Button
                  onClick={resetMetrics}
                  variant="outline"
                  leftIcon={<FiCheck />}
                >
                  Resetear Métricas
                </Button>
              </HStack>

              {optimizationsEnabled ? (
                <Alert status="success">
                  <AlertIcon />
                  Las optimizaciones están activas. Las tareas se ejecutarán de manera diferida.
                </Alert>
              ) : (
                <Alert status="warning">
                  <AlertIcon />
                  Las optimizaciones están desactivadas. Las tareas pueden causar violaciones.
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Consejos */}
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Consejos de Optimización</Heading>
            
            <VStack spacing={2} align="start">
              <Text>• Mantén las tareas por debajo de 16ms para evitar violaciones</Text>
              <Text>• Usa requestIdleCallback para tareas no críticas</Text>
              <Text>• Throttle los event handlers para evitar ejecuciones múltiples</Text>
              <Text>• Memoiza componentes y cálculos costosos con useMemo</Text>
              <Text>• Usa useCallback para handlers complejos</Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default PerformanceTestComponent;
