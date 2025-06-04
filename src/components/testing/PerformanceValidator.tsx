import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Card,
  CardBody,
  Switch,
  FormControl,
  FormLabel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast
} from '@chakra-ui/react';
import { FiPlay, FiRefreshCw, FiZap, FiActivity } from 'react-icons/fi';
import { usePerformanceMonitor, testOperation, generateSyntheticWorkload } from '../../utils/performanceTestUtils';
import { deferCallback } from '../../utils/performanceUtils';
import { useOptimizedClickHandler } from '../../utils/eventOptimizer';

const PerformanceValidator: React.FC = () => {
  const [isOptimizationEnabled, setIsOptimizationEnabled] = useState(true);
  const [isTestingInProgress, setIsTestingInProgress] = useState(false);
  const { results, startMonitoring, stopMonitoring, resetResults } = usePerformanceMonitor();
  const toast = useToast();

  // Handler optimizado para pruebas
  const optimizedTestHandler = useOptimizedClickHandler(
    async () => {
      const workload = generateSyntheticWorkload('medium');
      await testOperation('Operación Optimizada', async () => {
        if (isOptimizationEnabled) {
          await deferCallback(workload);
        } else {
          workload();
        }
      });
    },
    { throttleDelay: 100 }
  );

  // Handler no optimizado para comparación
  const unoptimizedTestHandler = async () => {
    const workload = generateSyntheticWorkload('heavy');
    await testOperation('Operación No Optimizada', workload);
  };

  const runCompleteTest = async () => {
    setIsTestingInProgress(true);
    startMonitoring();
    resetResults();

    try {
      toast({
        title: 'Iniciando pruebas de rendimiento',
        description: 'Ejecutando batería de pruebas...',
        status: 'info',
        duration: 2000
      });

      // Prueba 1: Clicks rápidos
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        optimizedTestHandler();
      }

      // Prueba 2: Operaciones pesadas
      await testOperation('Operación Pesada', async () => {
        const heavyWorkload = generateSyntheticWorkload('heavy');
        if (isOptimizationEnabled) {
          await deferCallback(heavyWorkload);
        } else {
          heavyWorkload();
        }
      });

      // Prueba 3: Múltiples operaciones concurrentes
      const promises = Array.from({ length: 5 }, (_, i) =>
        testOperation(`Operación Concurrente ${i + 1}`, async () => {
          const workload = generateSyntheticWorkload('medium');
          if (isOptimizationEnabled) {
            await deferCallback(workload);
          } else {
            workload();
          }
        })
      );
      await Promise.all(promises);

      const finalResults = results;
      const score = Math.max(0, 100 - (finalResults.violationCount * 10) - (finalResults.averageExecutionTime * 0.1));

      toast({
        title: 'Pruebas completadas',
        description: `Puntuación: ${score.toFixed(1)}/100 - ${finalResults.violationCount} violaciones detectadas`,
        status: score > 80 ? 'success' : score > 60 ? 'warning' : 'error',
        duration: 5000
      });

    } catch (error) {
      console.error('Error en pruebas:', error);
      toast({
        title: 'Error en pruebas',
        description: 'Ocurrió un error durante las pruebas',
        status: 'error',
        duration: 3000
      });
    } finally {
      setIsTestingInProgress(false);
      stopMonitoring();
    }
  };

  const getScoreColor = () => {
    const score = Math.max(0, 100 - (results.violationCount * 10) - (results.averageExecutionTime * 0.1));
    if (score > 80) return 'green';
    if (score > 60) return 'yellow';
    return 'red';
  };

  return (
    <Card>
      <CardBody>
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="md" mb={2}>
              🚀 Validador de Optimizaciones de Rendimiento
            </Heading>
            <Text color="gray.600">
              Prueba las optimizaciones implementadas para reducir violaciones del scheduler
            </Text>
          </Box>

          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="optimization-toggle" mb="0">
              Optimizaciones Activadas
            </FormLabel>
            <Switch
              id="optimization-toggle"
              isChecked={isOptimizationEnabled}
              onChange={(e) => setIsOptimizationEnabled(e.target.checked)}
              colorScheme="green"
            />
          </FormControl>

          <HStack spacing={4}>
            <Stat>
              <StatLabel>Violaciones</StatLabel>
              <StatNumber color={results.violationCount > 0 ? 'red.500' : 'green.500'}>
                {results.violationCount}
              </StatNumber>
              <StatHelpText>
                {results.violationCount === 0 ? '¡Perfecto!' : 'Necesita optimización'}
              </StatHelpText>
            </Stat>

            <Stat>
              <StatLabel>Tiempo Promedio</StatLabel>
              <StatNumber>
                {results.averageExecutionTime.toFixed(1)}ms
              </StatNumber>
              <StatHelpText>
                {results.averageExecutionTime < 50 ? 'Excelente' : 'Mejorable'}
              </StatHelpText>
            </Stat>

            <Stat>
              <StatLabel>Tasa de Éxito</StatLabel>
              <StatNumber color={getScoreColor()}>
                {results.successRate.toFixed(1)}%
              </StatNumber>
              <StatHelpText>Operaciones sin violaciones</StatHelpText>
            </Stat>
          </HStack>

          <Box>
            <Text fontSize="sm" mb={2} fontWeight="semibold">
              Puntuación General:
            </Text>
            <Badge
              size="lg"
              colorScheme={getScoreColor()}
              fontSize="md"
              px={3}
              py={1}
            >
              {Math.max(0, 100 - (results.violationCount * 10) - (results.averageExecutionTime * 0.1)).toFixed(1)}/100
            </Badge>
          </Box>

          <VStack spacing={3}>
            <HStack spacing={3} width="100%">
              <Button
                leftIcon={<FiPlay />}
                colorScheme="blue"
                onClick={runCompleteTest}
                isLoading={isTestingInProgress}
                loadingText="Probando..."
                flex={1}
              >
                Ejecutar Pruebas Completas
              </Button>
              
              <Button
                leftIcon={<FiRefreshCw />}
                variant="outline"
                onClick={resetResults}
                isDisabled={isTestingInProgress}
              >
                Reset
              </Button>
            </HStack>

            <HStack spacing={3} width="100%">
              <Button
                leftIcon={<FiZap />}
                colorScheme="green"
                variant="outline"
                onClick={optimizedTestHandler}
                size="sm"
                flex={1}
              >
                Prueba Optimizada
              </Button>
              
              <Button
                leftIcon={<FiActivity />}
                colorScheme="red"
                variant="outline"
                onClick={unoptimizedTestHandler}
                size="sm"
                flex={1}
              >
                Prueba No Optimizada
              </Button>
            </HStack>
          </VStack>

          <Box fontSize="sm" color="gray.600" textAlign="center">
            <Text>
              💡 <strong>Tip:</strong> Ejecuta las pruebas con optimizaciones activadas y desactivadas para comparar.
            </Text>
            <Text mt={1}>
              🎯 <strong>Meta:</strong> 0 violaciones, &lt;50ms tiempo promedio, 100% tasa de éxito.
            </Text>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default PerformanceValidator;
