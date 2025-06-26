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
  Divider,
  Button
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

  if (!config || typeof config.aemetEnabled === 'undefined') {
    return (
      <Card><CardBody><Text color="red.500">No se pudo cargar la configuración meteorológica o faltan campos requeridos (por ejemplo, 'aemetEnabled'). Por favor, revisa la colección 'configuracion/apis' en Firebase y asegúrate de que todos los campos existen. Si el error persiste, elimina la caché del navegador y recarga la página.</Text></CardBody></Card>
    );
  }

  const handleSwitchChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig((prev: any) => ({
      ...prev,
      [key]: e.target.checked,
    }));
  };
  
  const handleInputChange = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [key]: value,
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
        <Text fontSize="xs" color="gray.600" mb={4}>
          Gestiona la activación de servicios meteorológicos y las unidades de medida.
          La configuración de APIs se encuentra en la pestaña correspondiente.
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
              isChecked={config.weatherEnabled}
              onChange={handleSwitchChange('weatherEnabled')}
              colorScheme="brand"
            />
          </FormControl>

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
                  isChecked={config.aemetEnabled}
                  onChange={handleSwitchChange('aemetEnabled')}
                  colorScheme="brand"
                  isDisabled={!config.weatherEnabled}
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
                  isChecked={config.aemetUseForSpain}
                  onChange={handleSwitchChange('aemetUseForSpain')}
                  colorScheme="brand"
                  isDisabled={!config.weatherEnabled}
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
                  value={config.temperatureUnit || ''}
                  onChange={e => handleInputChange('temperatureUnit', e.target.value)}
                  isDisabled={!config.weatherEnabled}
                  size="sm"
                >
                  <option value="celsius">Celsius (°C)</option>
                  <option value="fahrenheit">Fahrenheit (°F)</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Velocidad del viento</FormLabel>
                <Select
                  value={config.windSpeedUnit || ''}
                  onChange={e => handleInputChange('windSpeedUnit', e.target.value)}
                  isDisabled={!config.weatherEnabled}
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
                  value={config.precipitationUnit || ''}
                  onChange={e => handleInputChange('precipitationUnit', e.target.value)}
                  isDisabled={!config.weatherEnabled}
                  size="sm"
                >
                  <option value="mm">Milímetros (mm)</option>
                  <option value="inch">Pulgadas (inch)</option>
                </Select>
              </FormControl>
            </SimpleGrid>
          </Box>

          <Divider />

          {/* AEMET API Key (solo para admin) */}
          {/* Esta sección ha sido eliminada de Variables. Si se requiere, debe ir en la pestaña de APIs. */}
        </VStack>        {error && <Text color="red.500" mt={2}>{error}</Text>}
        {success && <Text color="green.500" mt={2}>¡Guardado correctamente!</Text>}
        <Box display="flex" justifyContent="flex-end" mt={4}>
          <Button
            onClick={handleSave}
            isLoading={loading}
            loadingText="Guardando..."
            colorScheme="blue"
            size="sm"
            isDisabled={userRole === 'vocal'}
          >
            Guardar
          </Button>
        </Box>
      </CardBody>
    </Card>
  );
};

export default WeatherSettingsSection;
