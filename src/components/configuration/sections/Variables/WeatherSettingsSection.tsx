import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Switch,
  Select,
  VStack,
  Text,
  Card,
  CardBody,
  SimpleGrid,
  Divider,
  Button,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { FiCloud, FiSettings } from 'react-icons/fi';
import { useWeatherConfig } from '../../../../hooks/configuration/useUnifiedConfig';

interface WeatherSettingsSectionProps {
  userRole: 'admin' | 'vocal';
}

/**
 * Componente simplificado que usa directamente el converter de Firestore
 * para la configuración meteorológica unificada
 */
const WeatherSettingsSection: React.FC<WeatherSettingsSectionProps> = ({
  userRole
}) => {
  const { data: config, loading, saving, error, save } = useWeatherConfig();

  const handleSwitchChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    save({ [key]: e.target.checked });
  };
  
  const handleSelectChange = (key: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    save({ [key]: e.target.value });
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <Text>Cargando configuración meteorológica...</Text>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <Alert status="error">
            <AlertIcon />
            Error: {error}
          </Alert>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <Text fontSize="lg" fontWeight="semibold" color="blue.600" display="flex" alignItems="center">
          <FiCloud style={{ marginRight: 8 }} />
          Configuración Meteorológica
        </Text>
        <Text fontSize="xs" color="gray.600" mb={4}>
          Gestiona la activación de servicios meteorológicos y las unidades de medida.
        </Text>
        
        <VStack spacing={4} align="stretch">
          {/* Servicio Principal */}
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
              colorScheme="blue"
              isDisabled={saving}
            />
          </FormControl>

          <Divider />

          {/* AEMET Configuration */}
          <Box>
            <Text fontWeight="semibold" mb={2} color="orange.700">🇪🇸 AEMET - España</Text>
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
                  colorScheme="blue"
                  isDisabled={!config.weatherEnabled || saving}
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
                  colorScheme="blue"
                  isDisabled={!config.weatherEnabled || !config.aemetEnabled || saving}
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
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
              <FormControl>
                <FormLabel fontSize="sm">Temperatura</FormLabel>
                <Select
                  value={config.temperatureUnit}
                  onChange={handleSelectChange('temperatureUnit')}
                  isDisabled={!config.weatherEnabled || saving}
                  size="sm"
                >
                  <option value="celsius">Celsius (°C)</option>
                  <option value="fahrenheit">Fahrenheit (°F)</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm">Velocidad del viento</FormLabel>
                <Select
                  value={config.windSpeedUnit}
                  onChange={handleSelectChange('windSpeedUnit')}
                  isDisabled={!config.weatherEnabled || saving}
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
                  value={config.precipitationUnit}
                  onChange={handleSelectChange('precipitationUnit')}
                  isDisabled={!config.weatherEnabled || saving}
                  size="sm"
                >
                  <option value="mm">Milímetros (mm)</option>
                  <option value="inch">Pulgadas (inch)</option>
                </Select>
              </FormControl>
            </SimpleGrid>
          </Box>

          {/* Status */}
          {saving && (
            <Alert status="info">
              <AlertIcon />
              Guardando configuración...
            </Alert>
          )}
          
          {userRole === 'vocal' && (
            <Alert status="warning" size="sm">
              <AlertIcon />
              <Text fontSize="sm">Como vocal, algunos cambios pueden requerir aprobación del administrador.</Text>
            </Alert>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default WeatherSettingsSection;
