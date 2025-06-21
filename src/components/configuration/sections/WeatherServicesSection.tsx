import React from 'react';
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
import { SectionProps } from '../../../types/configuration';

interface WeatherServicesSectionProps extends SectionProps {}

const WeatherServicesSection: React.FC<WeatherServicesSectionProps> = ({
  userRole,
  settings,
  handleApiChange,
  handleApiSwitchChange
}) => {
  return (
    <Card>
      <CardBody>
        <Heading size="sm" mb={4} color="blue.600">
          🌤️ Servicios Meteorológicos
        </Heading>
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
              isChecked={settings.apis.weatherEnabled}
              onChange={handleApiSwitchChange('weatherEnabled')}
              colorScheme="brand"
            />
          </FormControl>

          <Divider />

          {/* Open-Meteo Configuration */}
          <Box>
            <Text fontWeight="semibold" mb={2} color="blue.700">📡 Open-Meteo (API gratuita)</Text>
            <Text fontSize="xs" color="gray.600" mb={3}>
              Servicio meteorológico de código abierto y completamente gratuito. No requiere API key.
            </Text>
            
            <FormControl>
              <FormLabel fontSize="sm">URL base de Open-Meteo</FormLabel>
              <Input
                name="weatherApiUrl"
                value={settings.apis.weatherApiUrl}
                onChange={(e) => handleApiChange('weatherApiUrl', e.target.value)}
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

          {/* AEMET Configuration */}
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
                  isChecked={settings.apis.aemetEnabled}
                  onChange={handleApiSwitchChange('aemetEnabled')}
                  colorScheme="brand"
                  isDisabled={!settings.apis.weatherEnabled}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">API Key de AEMET</FormLabel>
                <Input
                  name="aemetApiKey"
                  value={settings.apis.aemetApiKey}
                  onChange={(e) => handleApiChange('aemetApiKey', e.target.value)}
                  placeholder="Introduce tu API key de AEMET"
                  type={userRole === 'vocal' ? 'password' : 'text'}
                  isReadOnly={userRole === 'vocal'}
                  bg={userRole === 'vocal' ? "gray.50" : undefined}
                  isDisabled={!settings.apis.weatherEnabled || !settings.apis.aemetEnabled}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {userRole === 'vocal' 
                    ? 'Solo administradores pueden modificar las claves de API' 
                    : (
                      <>
                        Obtén tu API key gratuita en{' '}
                        <Text as="span" color="blue.500" textDecoration="underline">
                          opendata.aemet.es
                        </Text>
                      </>
                    )
                  }
                </Text>
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
                  isChecked={settings.apis.aemetUseForSpain}
                  onChange={handleApiSwitchChange('aemetUseForSpain')}
                  colorScheme="brand"
                  isDisabled={!settings.apis.weatherEnabled || !settings.apis.aemetEnabled}
                />
              </FormControl>
            </VStack>
          </Box>

          <Divider />

          {/* Configuración de Unidades */}
          <Box>
            <Text fontWeight="semibold" mb={2} color="teal.700">⚙️ Configuración de Unidades</Text>
            <Text fontSize="xs" color="gray.600" mb={3}>
              Personaliza las unidades de medida para mostrar en los pronósticos.
            </Text>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
              <FormControl>
                <FormLabel fontSize="sm">Temperatura</FormLabel>
                <Select
                  value={settings.apis.temperatureUnit}
                  onChange={(e) => handleApiChange('temperatureUnit', e.target.value)}
                  isDisabled={!settings.apis.weatherEnabled}
                  size="sm"
                >
                  <option value="celsius">Celsius (°C)</option>
                  <option value="fahrenheit">Fahrenheit (°F)</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Velocidad del viento</FormLabel>
                <Select
                  value={settings.apis.windSpeedUnit}
                  onChange={(e) => handleApiChange('windSpeedUnit', e.target.value)}
                  isDisabled={!settings.apis.weatherEnabled}
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
                  value={settings.apis.precipitationUnit}
                  onChange={(e) => handleApiChange('precipitationUnit', e.target.value)}
                  isDisabled={!settings.apis.weatherEnabled}
                  size="sm"
                >
                  <option value="mm">Milímetros (mm)</option>
                  <option value="inch">Pulgadas (inch)</option>
                </Select>
              </FormControl>
            </SimpleGrid>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default WeatherServicesSection;
