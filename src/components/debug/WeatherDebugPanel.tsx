import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Heading,
  Divider,
  useToast,
  Collapse,
  IconButton
} from '@chakra-ui/react';
import { FiChevronDown, FiChevronUp, FiRefreshCw } from 'react-icons/fi';
import { weatherService } from '../../services/weatherService';
import { obtenerConfiguracionMeteorologica } from '../../services/configuracionService';

// Interfaces para tipado
interface AemetTestResult {
  location: string;
  success: boolean;
  data: {
    current: number;
    daily: number;
  } | null;
}

interface AemetTestStatus {
  success: boolean;
  results: AemetTestResult[];
  successCount: number;
  totalCount: number;
  timestamp: string;
}

interface WeatherDebugStatus {
  isEnabled: boolean;
  config: any;
  lastTest: any;
  lastAemetTest: AemetTestStatus | null;
  loading: boolean;
}

/**
 * Componente temporal para debuggear el estado del servicio meteorológico
 * Solo se debe usar durante desarrollo para verificar la configuración
 */
const WeatherDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<WeatherDebugStatus>({
    isEnabled: false,
    config: null,
    lastTest: null,
    lastAemetTest: null,
    loading: true
  });
  const toast = useToast();

  const checkWeatherStatus = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    
    try {
      // Obtener configuración actual
      const config = await obtenerConfiguracionMeteorologica();
      await weatherService.configure(config);
      
      const isEnabled = weatherService.isEnabled();
      const serviceConfig = weatherService.getConfig();
      
      // Probar conexión si está habilitado
      let testResult = null;
      if (isEnabled) {
        try {
          const testForecast = await weatherService.getWeatherForecast(undefined, 1);
          testResult = {
            success: testForecast !== null,
            data: testForecast,
            timestamp: new Date().toLocaleTimeString()
          };
        } catch (error) {
          testResult = {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
            timestamp: new Date().toLocaleTimeString()
          };
        }
      }
        setStatus({
        isEnabled,
        config: serviceConfig,
        lastTest: testResult,
        lastAemetTest: null, // Inicializar como null
        loading: false
      });
      
    } catch (error) {
      console.error('Error verificando estado meteorológico:', error);
      setStatus(prev => ({ 
        ...prev, 
        loading: false,
        lastTest: {
          success: false,
          error: error instanceof Error ? error.message : 'Error verificando estado',
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    }
  };

  // Test específico para AEMET
  const testAemet = async () => {
    try {
      console.log('🇪🇸 Iniciando test específico de AEMET...');
        // Ubicaciones de prueba en España
      const testLocations = [
        { name: 'Madrid', lat: 40.4168, lon: -3.7038 },
        { name: 'Barcelona', lat: 41.3851, lon: 2.1734 },
        { name: 'Valencia', lat: 39.4699, lon: -0.3763 },
        { name: 'Sevilla', lat: 37.3891, lon: -5.9845 }
      ];
      
      const aemetResults: AemetTestResult[] = [];
      
      for (const location of testLocations) {
        console.log(`🌍 Probando AEMET para ${location.name}...`);
        
        const forecast = await weatherService.getWeatherForecast(location, 3);
          aemetResults.push({
          location: location.name,
          success: !!forecast,
          data: forecast ? {
            current: forecast.current?.temperature.current || 0,
            daily: forecast.daily.length
          } : null
        });
        
        // Esperar un poco entre peticiones para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('🇪🇸 Resultados del test de AEMET:', aemetResults);
      
      const successCount = aemetResults.filter(r => r.success).length;
      
      setStatus(prev => ({
        ...prev,
        lastAemetTest: {
          success: successCount > 0,
          results: aemetResults,
          successCount,
          totalCount: testLocations.length,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      
      toast({
        title: 'Test AEMET completado',
        description: `${successCount}/${testLocations.length} ubicaciones exitosas`,
        status: successCount > 0 ? 'success' : 'warning',
        duration: 5000,
        isClosable: true
      });
      
    } catch (error) {
      console.error('🇪🇸 Error en test de AEMET:', error);
      toast({
        title: 'Error en test AEMET',
        description: error instanceof Error ? error.message : 'Error desconocido',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  useEffect(() => {
    checkWeatherStatus();
  }, []);

  const handleTest = async () => {
    await checkWeatherStatus();
    
    if (status.lastTest?.success) {
      toast({
        title: 'Prueba exitosa',
        description: 'El servicio meteorológico está funcionando correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } else {
      toast({
        title: 'Prueba fallida',
        description: status.lastTest?.error || 'No se pudo conectar con el servicio',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  return (
    <Box 
      position="fixed" 
      bottom={4} 
      right={4} 
      zIndex={1000}
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      shadow="lg"
      maxW="400px"
    >
      <HStack 
        p={3} 
        bg="blue.50" 
        borderRadius="md md 0 0"
        justify="space-between"
        cursor="pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <HStack>
          <Text fontWeight="bold" fontSize="sm">
            🌤️ Estado del Clima
          </Text>
          <Badge colorScheme={status.isEnabled ? 'green' : 'red'}>
            {status.isEnabled ? 'Habilitado' : 'Deshabilitado'}
          </Badge>
        </HStack>
        <IconButton
          icon={isOpen ? <FiChevronUp /> : <FiChevronDown />}
          size="sm"
          variant="ghost"
          aria-label="Toggle panel"
        />
      </HStack>
      
      <Collapse in={isOpen}>
        <VStack p={4} spacing={3} align="stretch">
          {/* Estado del servicio */}
          <Box>
            <Text fontSize="xs" fontWeight="bold" mb={1}>Estado del Servicio:</Text>
            <HStack>
              <Badge colorScheme={status.isEnabled ? 'green' : 'red'}>
                {status.isEnabled ? 'Activo' : 'Inactivo'}
              </Badge>
              {status.config?.aemet?.enabled && (
                <Badge colorScheme="blue">AEMET</Badge>
              )}
            </HStack>
          </Box>

          {/* Configuración */}
          {status.config && (
            <Box>
              <Text fontSize="xs" fontWeight="bold" mb={1}>Configuración:</Text>
              <Text fontSize="xs">
                📍 {status.config.defaultLocation.name}
              </Text>
              <Text fontSize="xs">
                🌡️ {status.config.temperatureUnit} | 💨 {status.config.windSpeedUnit}
              </Text>
            </Box>
          )}

          {/* Última prueba */}
          {status.lastTest && (
            <Box>
              <Text fontSize="xs" fontWeight="bold" mb={1}>Última prueba:</Text>
              <Alert status={status.lastTest.success ? 'success' : 'error'} size="sm">
                <AlertIcon />
                <Box fontSize="xs">
                  <AlertTitle>
                    {status.lastTest.success ? 'Conexión OK' : 'Error'}
                  </AlertTitle>
                  <AlertDescription>
                    {status.lastTest.success 
                      ? `Datos obtenidos a las ${status.lastTest.timestamp}`
                      : status.lastTest.error
                    }
                  </AlertDescription>
                </Box>
              </Alert>
            </Box>
          )}

          {/* Datos de prueba */}
          {status.lastTest?.data && status.lastTest.success && (
            <Box>
              <Text fontSize="xs" fontWeight="bold" mb={1}>Datos de muestra:</Text>
              <Code fontSize="xs" p={2} borderRadius="sm">
                {status.lastTest.data.daily[0]?.description} |{' '}
                {Math.round(status.lastTest.data.daily[0]?.temperature.min || 0)}°-
                {Math.round(status.lastTest.data.daily[0]?.temperature.max || 0)}°C
              </Code>
            </Box>
          )}

          {/* Resultados del test AEMET */}
          {status.lastAemetTest && (
            <Box>
              <Text fontSize="xs" fontWeight="bold" mb={1}>Resultados del test AEMET:</Text>
              <VStack spacing={1} align="stretch">
                {status.lastAemetTest.results.map((result: any, index: number) => (
                  <Box key={index} p={2} borderRadius="md" 
                    bg={result.success ? 'green.50' : 'red.50'}
                    borderWidth={1}
                    borderColor={result.success ? 'green.300' : 'red.300'}
                  >
                    <Text fontSize="xs" fontWeight="semibold">
                      {result.location}
                    </Text>
                    <Text fontSize="xs">
                      {result.success 
                        ? `🌟 Datos recibidos: ${result.data?.daily} días`
                        : '❌ No se pudo obtener datos'
                      }
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          <Divider />

          {/* Acciones */}
          <VStack spacing={2}>
            <Button 
              size="sm" 
              colorScheme="blue" 
              leftIcon={<FiRefreshCw />}
              onClick={handleTest}
              isLoading={status.loading}
              w="full"
            >
              Probar conexión
            </Button>
            
            <Button 
              size="sm" 
              colorScheme="teal" 
              onClick={testAemet}
              isLoading={status.loading}
              w="full"
            >
              Test AEMET
            </Button>
            
            {!status.isEnabled && (
              <Alert status="warning" size="sm">
                <AlertIcon />
                <AlertDescription fontSize="xs">
                  Ir a Configuración → Clima para habilitar
                </AlertDescription>
              </Alert>
            )}
          </VStack>
        </VStack>
      </Collapse>
    </Box>
  );
};

export default WeatherDebugPanel;
