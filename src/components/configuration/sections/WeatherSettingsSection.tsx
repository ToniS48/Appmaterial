import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Select,
  VStack,
  Text,
  Card,
  CardBody,
  Heading,
  SimpleGrid,
  Divider
} from '@chakra-ui/react';
import { FiCloud, FiRadio, FiSettings } from 'react-icons/fi';

interface WeatherSettingsSectionProps {
  userRole: 'admin' | 'vocal';
  config: any;
  setConfig: (cfg: any) => void;
  save: (data: any) => Promise<void>;
}

const WeatherSettingsSection: React.FC<WeatherSettingsSectionProps> = ({
  userRole,
  config,
  setConfig,
  save
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSwitchChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig((prev: any) => ({
      ...prev,
      apis: {
        ...prev.apis,
        [key]: e.target.checked,
      },
    }));
  };
  const handleInputChange = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      apis: {
        ...prev.apis,
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await save(config);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  return (
    <Card>
      <CardBody>
        <Text fontSize="lg" fontWeight="semibold" color="blue.600" display="flex" alignItems="center">
          <FiCloud style={{ marginRight: 8 }} />
          Configuración Meteorológica
        </Text>
        <VStack spacing={4} align="stretch">
          <FormControl display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <FormLabel htmlFor="weatherEnabled" mb="0" fontSize="sm">
                Habilitar servicio meteorológico
              </FormLabel>
              <Text fontSize="xs" color="gray.600" mt={1}>
                Activar/desactivar la integración con servicios de clima
              </Text>
            </Box>
            <Switch
              id="weatherEnabled"
              isChecked={config.apis.weatherEnabled}
              onChange={handleSwitchChange('weatherEnabled')}
              colorScheme="brand"
            />
          </FormControl>

          <Divider />

          {/* Open-Meteo Configuration */}
          <Box>
            <Text fontWeight="semibold" mb={2} color="blue.700" display="flex" alignItems="center">
              <FiRadio style={{ marginRight: 8 }} />
              Open-Meteo (API gratuita)
            </Text>
            <Text fontSize="xs" color="gray.600" mb={3}>
              Servicio meteorológico de código abierto y completamente gratuito. No requiere API key.
            </Text>
            <FormControl>
              <FormLabel fontSize="sm">URL base de Open-Meteo</FormLabel>
              <Input
                name="weatherApiUrl"
                value={config.apis.weatherApiUrl}
                onChange={e => handleInputChange('weatherApiUrl', e.target.value)}
                placeholder="https://api.open-meteo.com/v1/forecast"
                isReadOnly={userRole === 'vocal'}
                bg={userRole === 'vocal' ? "gray.50" : undefined}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                URL base para las consultas meteorológicas globales
              </Text>
            </FormControl>
          </Box>

          <Divider />

          {/* AEMET Configuration (solo switches y uso, sin API key) */}
          <Box>
            <Text fontWeight="semibold" mb={2} color="orange.700">🇪🇸 AEMET - España</Text>
            <Text fontSize="xs" color="gray.600" mb={3}>
              Datos oficiales de la Agencia Estatal de Meteorología española para mayor precisión en territorio español.
            </Text>
            <VStack spacing={3} align="stretch">
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <FormLabel htmlFor="aemetEnabled" mb="0" fontSize="sm">
                    Habilitar AEMET para España
                  </FormLabel>
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Usar datos oficiales de AEMET para actividades en España
                  </Text>
                </Box>
                <Switch
                  id="aemetEnabled"
                  isChecked={config.apis.aemetEnabled}
                  onChange={handleSwitchChange('aemetEnabled')}
                  colorScheme="brand"
                  isDisabled={!config.apis.weatherEnabled}
                />
              </FormControl>
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <FormLabel htmlFor="aemetUseForSpain" mb="0" fontSize="sm">
                    Usar AEMET automáticamente para España
                  </FormLabel>
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Detectar automáticamente ubicaciones españolas y usar AEMET
                  </Text>
                </Box>
                <Switch
                  id="aemetUseForSpain"
                  isChecked={config.apis.aemetUseForSpain}
                  onChange={handleSwitchChange('aemetUseForSpain')}
                  colorScheme="brand"
                  isDisabled={!config.apis.weatherEnabled || !config.apis.aemetEnabled}
                />
              </FormControl>
            </VStack>
          </Box>

          <Divider />

          {/* Configuración de Unidades */}
          <Box>
            <Text fontWeight="semibold" mb={2} color="teal.700" display="flex" alignItems="center">
              <FiSettings style={{ marginRight: 8 }} />
              Configuración de Unidades
            </Text>
            <Text fontSize="xs" color="gray.600" mb={3}>
              Personaliza las unidades de medida para mostrar en los pronósticos.
            </Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
              <FormControl>
                <FormLabel fontSize="sm">Temperatura</FormLabel>
                <Select
                  value={config.apis.temperatureUnit}
                  onChange={e => handleInputChange('temperatureUnit', e.target.value)}
                  isDisabled={!config.apis.weatherEnabled}
                  size="sm"
                >
                  <option value="celsius">Celsius (°C)</option>
                  <option value="fahrenheit">Fahrenheit (°F)</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Velocidad del viento</FormLabel>
                <Select
                  value={config.apis.windSpeedUnit}
                  onChange={e => handleInputChange('windSpeedUnit', e.target.value)}
                  isDisabled={!config.apis.weatherEnabled}
                  size="sm"
                >
                  <option value="kmh">km/h</option>
                  <option value="ms">m/s</option>
                  <option value="mph">mph</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Precipitación</FormLabel>
                <Select
                  value={config.apis.precipitationUnit}
                  onChange={e => handleInputChange('precipitationUnit', e.target.value)}
                  isDisabled={!config.apis.weatherEnabled}
                  size="sm"
                >
                  <option value="mm">Milímetros (mm)</option>
                  <option value="inch">Pulgadas (inch)</option>
                </Select>
              </FormControl>
            </SimpleGrid>
          </Box>
        </VStack>
        {error && <Text color="red.500" mt={2}>{error}</Text>}
        {success && <Text color="green.500" mt={2}>¡Guardado correctamente!</Text>}
        <Box display="flex" justifyContent="flex-end" mt={4}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              background: '#3182ce', color: 'white', padding: '8px 16px', borderRadius: 4, border: 'none', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </Box>
      </CardBody>
    </Card>
  );
};

export default WeatherSettingsSection;
