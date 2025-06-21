import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  Switch,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Divider,
  Code,
  Link,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select
} from '@chakra-ui/react';
import { FiExternalLink, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useWeatherConfig } from '../../hooks/useWeather';

/**
 * Componente para configurar la integración con Open-Meteo
 */
const WeatherConfiguration: React.FC = () => {
  const { config, loading, error, updateConfig, testConnection, isEnabled } = useWeatherConfig();
  const [formData, setFormData] = useState(config);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const toast = useToast();

  // Sincronizar con la configuración actual
  useEffect(() => {
    setFormData(config);
  }, [config]);

  /**
   * Maneja cambios en el formulario
   */
  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Maneja cambios en la ubicación por defecto
   */
  const handleLocationChange = (field: keyof typeof formData.defaultLocation, value: any) => {
    setFormData(prev => ({
      ...prev,
      defaultLocation: {
        ...prev.defaultLocation,
        [field]: value
      }
    }));
  };

  /**
   * Guarda la configuración
   */
  const handleSave = async () => {
    try {
      await updateConfig(formData);
      toast({
        title: 'Configuración guardada',
        description: 'La configuración meteorológica se ha actualizado correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (err) {
      toast({
        title: 'Error al guardar',
        description: 'No se pudo guardar la configuración meteorológica',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  /**
   * Prueba la conexión con la API
   */
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Guardar temporalmente para hacer la prueba
      await updateConfig(formData);
      
      const success = await testConnection();
        setTestResult({
        success,
        message: success 
          ? 'Conexión exitosa con el servicio meteorológico' 
          : 'No se pudo conectar con la API. Verifica tu configuración.'
      });

      if (success) {
        toast({
          title: 'Conexión exitosa',
          description: 'El servicio meteorológico está funcionando correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Error al probar la conexión'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Box p={6} bg="white" borderRadius="lg" shadow="md">
      <VStack spacing={6} align="stretch">        {/* Título y descripción */}
        <Box>
          <Text fontSize="xl" fontWeight="bold" mb={2}>
            Configuración de Clima
          </Text>
          <Text color="gray.600" fontSize="sm">
            Integra información meteorológica en las actividades usando Open-Meteo API (gratuita)
          </Text>
        </Box>        {/* Información de la API */}
        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle>APIs Meteorológicas Disponibles</AlertTitle>
            <AlertDescription>
              <VStack align="start" spacing={1}>
                <Text>
                  <strong>Open-Meteo</strong>: API meteorológica de código abierto y completamente gratuita.{' '}
                  <Link 
                    href="https://open-meteo.com/" 
                    isExternal 
                    color="blue.500"
                  >
                    Más información <FiExternalLink style={{ display: 'inline' }} />
                  </Link>
                </Text>
                <Text>
                  <strong>AEMET</strong>: Datos oficiales de la Agencia Estatal de Meteorología española.{' '}
                  <Link 
                    href="https://opendata.aemet.es/centrodedescargas/inicio" 
                    isExternal 
                    color="blue.500"
                  >
                    Obtener API key <FiExternalLink style={{ display: 'inline' }} />
                  </Link>
                </Text>
              </VStack>
            </AlertDescription>
          </Box>
        </Alert>

        <Divider />

        {/* Configuración principal */}
        <VStack spacing={4} align="stretch">
          {/* Habilitar/deshabilitar servicio */}
          <FormControl>
            <FormLabel>
              <HStack>
                <Text>Habilitar pronóstico meteorológico</Text>
                <Switch
                  isChecked={formData.enabled}
                  onChange={(e) => handleInputChange('enabled', e.target.checked)}
                  colorScheme="blue"
                />
              </HStack>
            </FormLabel>
            <Text fontSize="sm" color="gray.600">
              Cuando esté habilitado, se mostrará información del clima en las actividades futuras
            </Text>
          </FormControl>          {/* API Key */}
          <FormControl>
            <FormLabel>Unidades de temperatura</FormLabel>
            <Select
              value={formData.temperatureUnit}
              onChange={(e) => handleInputChange('temperatureUnit', e.target.value)}
              isDisabled={!formData.enabled}
            >
              <option value="celsius">Celsius (°C)</option>
              <option value="fahrenheit">Fahrenheit (°F)</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Unidades de velocidad del viento</FormLabel>
            <Select
              value={formData.windSpeedUnit}
              onChange={(e) => handleInputChange('windSpeedUnit', e.target.value)}
              isDisabled={!formData.enabled}
            >
              <option value="kmh">Kilómetros por hora (km/h)</option>
              <option value="ms">Metros por segundo (m/s)</option>
              <option value="mph">Millas por hora (mph)</option>
            </Select>
          </FormControl>          <FormControl>
            <FormLabel>Unidades de precipitación</FormLabel>
            <Select
              value={formData.precipitationUnit}
              onChange={(e) => handleInputChange('precipitationUnit', e.target.value)}
              isDisabled={!formData.enabled}
            >
              <option value="mm">Milímetros (mm)</option>
              <option value="inch">Pulgadas (inch)</option>
            </Select>
          </FormControl>

          <Divider />

          {/* Configuración AEMET */}
          <Box>
            <Text fontWeight="semibold" mb={3}>Configuración AEMET (España)</Text>
            <Text fontSize="sm" color="gray.600" mb={3}>
              Datos oficiales de la Agencia Estatal de Meteorología para ubicaciones en España
            </Text>

            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>
                  <HStack>
                    <Text>Habilitar AEMET para España</Text>
                    <Switch
                      isChecked={formData.aemet.enabled}
                      onChange={(e) => handleInputChange('aemet', { 
                        ...formData.aemet, 
                        enabled: e.target.checked 
                      })}
                      colorScheme="blue"
                      isDisabled={!formData.enabled}
                    />
                  </HStack>
                </FormLabel>
                <Text fontSize="sm" color="gray.600">
                  Usar datos oficiales de AEMET para actividades en España
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>API Key de AEMET</FormLabel>
                <Input
                  type="password"
                  value={formData.aemet.apiKey}
                  onChange={(e) => handleInputChange('aemet', { 
                    ...formData.aemet, 
                    apiKey: e.target.value 
                  })}
                  placeholder="Ingresa tu API key de AEMET"
                  isDisabled={!formData.enabled || !formData.aemet.enabled}
                />
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Obtén tu API key gratuita en{' '}
                  <Link 
                    href="https://opendata.aemet.es/centrodedescargas/inicio" 
                    isExternal 
                    color="blue.500"
                  >
                    opendata.aemet.es
                  </Link>
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>
                  <HStack>
                    <Text>Usar AEMET para ubicaciones en España</Text>
                    <Switch
                      isChecked={formData.aemet.useForSpain}
                      onChange={(e) => handleInputChange('aemet', { 
                        ...formData.aemet, 
                        useForSpain: e.target.checked 
                      })}
                      colorScheme="blue"
                      isDisabled={!formData.enabled || !formData.aemet.enabled}
                    />
                  </HStack>
                </FormLabel>
                <Text fontSize="sm" color="gray.600">
                  Cuando esté activado, se usará AEMET automáticamente para actividades en territorio español
                </Text>
              </FormControl>
            </VStack>
          </Box>

          {/* Ubicación por defecto */}
          <Box>
            <Text fontWeight="semibold" mb={3}>Ubicación por defecto</Text>
            <Text fontSize="sm" color="gray.600" mb={3}>
              Se usa cuando no se especifica ubicación en la actividad
            </Text>

            <VStack spacing={3} align="stretch">
              <FormControl>
                <FormLabel>Nombre de la ubicación</FormLabel>
                <Input
                  value={formData.defaultLocation.name}
                  onChange={(e) => handleLocationChange('name', e.target.value)}
                  placeholder="ej: Madrid, España"
                  isDisabled={!formData.enabled}
                />
              </FormControl>

              <HStack spacing={3}>
                <FormControl>
                  <FormLabel>Latitud</FormLabel>
                  <NumberInput
                    value={formData.defaultLocation.lat}
                    onChange={(_, value) => handleLocationChange('lat', value)}
                    precision={6}
                    step={0.000001}
                    min={-90}
                    max={90}
                    isDisabled={!formData.enabled}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Longitud</FormLabel>
                  <NumberInput
                    value={formData.defaultLocation.lon}
                    onChange={(_, value) => handleLocationChange('lon', value)}
                    precision={6}
                    step={0.000001}
                    min={-180}
                    max={180}
                    isDisabled={!formData.enabled}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </HStack>
            </VStack>
          </Box>
        </VStack>

        {/* Estado y errores */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {testResult && (
          <Alert status={testResult.success ? 'success' : 'error'}>
            <AlertIcon />
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        {/* Estado actual */}
        <Box p={3} bg="gray.50" borderRadius="md">
          <Text fontSize="sm" fontWeight="semibold" mb={2}>Estado actual:</Text>
          <HStack>
            <Box 
              w={3} 
              h={3} 
              borderRadius="full" 
              bg={isEnabled ? 'green.500' : 'red.500'} 
            />
            <Text fontSize="sm">
              {isEnabled ? 'Servicio activo y configurado' : 'Servicio inactivo'}
            </Text>
          </HStack>
        </Box>

        {/* Botones de acción */}
        <HStack spacing={3} justify="flex-end">          <Button
            variant="outline"
            onClick={handleTestConnection}
            isLoading={testing}
            loadingText="Probando..."
            leftIcon={<FiAlertCircle />}
            isDisabled={!formData.enabled}
          >
            Probar conexión
          </Button>

          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={loading}
            loadingText="Guardando..."
            leftIcon={<FiCheck />}
          >
            Guardar configuración
          </Button>
        </HStack>        {/* Información adicional */}
        <Box p={3} bg="blue.50" borderRadius="md">
          <Text fontSize="sm" color="blue.800" fontWeight="semibold" mb={1}>
            ℹ️ Información importante
          </Text>
          <VStack align="start" spacing={1}>
            <Text fontSize="xs" color="blue.700">
              • Los datos meteorológicos se muestran solo para actividades en los próximos 15 días
            </Text>
            <Text fontSize="xs" color="blue.700">
              • Los datos se actualizan automáticamente cada 10 minutos
            </Text>
            <Text fontSize="xs" color="blue.700">
              • Open-Meteo es completamente gratuito y no requiere registro
            </Text>
            <Text fontSize="xs" color="blue.700">
              • Si no se especifica ubicación en la actividad, se usa la ubicación por defecto
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default WeatherConfiguration;
