import React, { useState } from 'react';
import { 
  Card, 
  CardBody, 
  Heading, 
  VStack, 
  HStack,
  FormControl, 
  FormLabel, 
  Input, 
  InputGroup, 
  InputRightElement, 
  IconButton, 
  Button, 
  Text, 
  Box,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Badge,
  SimpleGrid
} from '@chakra-ui/react';
import { FiKey, FiEye, FiEyeOff, FiMap, FiMessageSquare, FiSettings } from 'react-icons/fi';
import type { GoogleApisConfig } from '../../../../services/configuracionService';
import CryptoJS from "crypto-js";

const apiFields: { key: keyof GoogleApisConfig; label: string; section: string }[] = [
  // APIs Geográficas
  { key: 'mapsJavaScriptApiKey', label: 'Maps JavaScript API Key', section: 'Geográficas' },
  { key: 'mapsEmbedApiKey', label: 'Maps Embed API Key', section: 'Geográficas' },
  { key: 'geocodingApiKey', label: 'Geocoding API Key', section: 'Geográficas' },
  
  // APIs de Comunicación
  { key: 'gmailApiKey', label: 'Gmail API Key', section: 'Comunicación' },
  { key: 'chatApiKey', label: 'Chat API Key', section: 'Comunicación' },
  { key: 'cloudMessagingApiKey', label: 'Cloud Messaging API Key', section: 'Comunicación' },
  
  // APIs de Análisis y Datos
  { key: 'analyticsApiKey', label: 'Google Analytics API Key', section: 'Análisis y Datos' },
  { key: 'bigQueryApiKey', label: 'BigQuery API Key', section: 'Análisis y Datos' },
  
  // APIs de Infraestructura
  { key: 'pubSubApiKey', label: 'Pub/Sub API Key', section: 'Infraestructura' },
  { key: 'extensionsApiKey', label: 'Firebase Extensions API Key', section: 'Infraestructura' }
];

const configFields: { key: keyof GoogleApisConfig; label: string; type: 'number' | 'boolean' }[] = [
  // Configuraciones de Maps
  { key: 'mapsDefaultZoom', label: 'Zoom por defecto (Maps)', type: 'number' },
  { key: 'mapsDefaultLatitude', label: 'Latitud por defecto', type: 'number' },
  { key: 'mapsDefaultLongitude', label: 'Longitud por defecto', type: 'number' },
  
  // Estados de habilitación
  { key: 'mapsEnabled', label: 'Habilitar Google Maps', type: 'boolean' },
  { key: 'driveEnabled', label: 'Habilitar Google Drive', type: 'boolean' },
  { key: 'calendarEnabled', label: 'Habilitar Google Calendar', type: 'boolean' },
  { key: 'gmailEnabled', label: 'Habilitar Gmail', type: 'boolean' },
  { key: 'chatEnabled', label: 'Habilitar Google Chat', type: 'boolean' },
  { key: 'cloudMessagingEnabled', label: 'Habilitar Cloud Messaging', type: 'boolean' },
  { key: 'analyticsEnabled', label: 'Habilitar Google Analytics', type: 'boolean' },
  { key: 'bigQueryEnabled', label: 'Habilitar BigQuery', type: 'boolean' },
  { key: 'pubSubEnabled', label: 'Habilitar Pub/Sub', type: 'boolean' },
  { key: 'extensionsEnabled', label: 'Habilitar Firebase Extensions', type: 'boolean' }
];

interface ApisGoogleSectionProps {
  config: GoogleApisConfig;
  setConfig: (cfg: GoogleApisConfig) => void;
  save: (data: GoogleApisConfig) => Promise<void>;
}

const ApisGoogleSection: React.FC<ApisGoogleSectionProps> = ({ config, setConfig, save }) => {
  const [show, setShow] = React.useState<{ [k in keyof GoogleApisConfig]?: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encrypt = (value: string) => {
    if (!value) return "";
    return CryptoJS.AES.encrypt(value, process.env.REACT_APP_API_ENCRYPT_KEY || "default_key").toString();
  };
  const decrypt = (value: string) => {
    if (!value) return "";
    try {
      const bytes = CryptoJS.AES.decrypt(value, process.env.REACT_APP_API_ENCRYPT_KEY || "default_key");
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return value;
    }
  };

  const handleConfigChange = (key: keyof GoogleApisConfig, value: string | number | boolean) => {
    setConfig({ ...config, [key]: value });
  };

  const handleApiKeyChange = (key: keyof GoogleApisConfig, value: string) => {
    setConfig({ ...config, [key]: encrypt(value) });
  };

  const handleToggleShow = (key: keyof GoogleApisConfig) => {
    setShow(s => ({ ...s, [key as string]: !s[key] }));
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
        <Heading size="sm" mb={4} color="blue.600" display="flex" alignItems="center">
          <FiKey style={{ marginRight: 8 }} />
          Google Maps & Services APIs
        </Heading>
        
        <VStack spacing={6} align="stretch">
          {/* Info sobre servicios backend */}
          <Box bg="blue.50" p={3} borderRadius="md" border="1px solid" borderColor="blue.200">
            <Text fontSize="sm" color="blue.800">
              📋 <strong>Google Drive y Calendar:</strong> Estos servicios ahora se ejecutan automáticamente en el backend 
              con Service Account. No requieren configuración manual de API keys.
            </Text>
            <Text fontSize="sm" color="blue.700" mt={2}>
              🔧 <strong>APIs Avanzadas:</strong> Analytics, BigQuery, Pub/Sub y Extensions están disponibles para 
              funcionalidades avanzadas de análisis y arquitectura distribuida.
            </Text>
          </Box>

          {/* API Keys Section */}
          <Box>
            <Heading size="xs" mb={3} color="gray.600" display="flex" alignItems="center">
              <FiKey size={16} style={{ marginRight: 6 }} />
              API Keys
            </Heading>
            
            {/* Group API fields by section */}
            {['Geográficas', 'Productividad', 'Comunicación'].map(section => (
              <Box key={section} mb={4}>
                <Badge colorScheme="blue" mb={2} fontSize="xs">
                  {section === 'Geográficas' && <FiMap style={{ display: 'inline', marginRight: 4 }} />}
                  {section === 'Comunicación' && <FiMessageSquare style={{ display: 'inline', marginRight: 4 }} />}
                  {section === 'Productividad' && <FiSettings style={{ display: 'inline', marginRight: 4 }} />}
                  {section}
                </Badge>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  {apiFields
                    .filter(field => field.section === section)
                    .map(({ key, label }) => (
                      <FormControl key={key as string} size="sm">
                        <FormLabel fontSize="sm">{label}</FormLabel>
                        <InputGroup size="sm">
                          <Input
                            type={show[key] ? "text" : "password"}
                            value={decrypt(config[key] as string || "")}
                            onChange={e => handleApiKeyChange(key, e.target.value)}
                            autoComplete="off"
                            placeholder="Ingresa tu API key..."
                          />
                          <InputRightElement>
                            <IconButton
                              aria-label={show[key] ? "Ocultar" : "Mostrar"}
                              icon={show[key] ? <FiEyeOff /> : <FiEye />}
                              size="xs"
                              onClick={() => handleToggleShow(key)}
                            />
                          </InputRightElement>
                        </InputGroup>
                      </FormControl>
                    ))}
                </SimpleGrid>
              </Box>
            ))}
          </Box>

          <Divider />

          {/* Configuration Section */}
          <Box>
            <Heading size="xs" mb={3} color="gray.600" display="flex" alignItems="center">
              <FiSettings size={16} style={{ marginRight: 6 }} />
              Configuraciones
            </Heading>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {configFields.map(({ key, label, type }) => {
                const keyString = key as string;
                return (
                  <FormControl key={keyString} size="sm">
                    <FormLabel fontSize="sm">{label}</FormLabel>
                    
                    {type === 'boolean' ? (
                      <HStack>
                        <Switch
                          isChecked={config[key] as boolean || false}
                          onChange={e => handleConfigChange(key, e.target.checked)}
                          colorScheme="blue"
                          size="sm"
                        />
                        <Text fontSize="sm" color="gray.600">
                          {config[key] ? 'Habilitado' : 'Deshabilitado'}
                        </Text>
                      </HStack>
                    ) : (
                      <NumberInput
                        value={config[key] as number || 0}
                        onChange={(_, value) => handleConfigChange(key, value || 0)}
                        size="sm"
                        min={keyString.includes('Latitude') ? -90 : keyString.includes('Longitude') ? -180 : keyString.includes('Zoom') ? 1 : 0}
                        max={keyString.includes('Latitude') ? 90 : keyString.includes('Longitude') ? 180 : keyString.includes('Zoom') ? 21 : undefined}
                        step={keyString.includes('Latitude') || keyString.includes('Longitude') ? 0.0001 : 1}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    )}
                  </FormControl>
                );
              })}
            </SimpleGrid>
          </Box>
        </VStack>

        {error && <Text color="red.500" mt={4} fontSize="sm">{error}</Text>}
        {success && <Text color="green.500" mt={4} fontSize="sm">¡Configuración guardada correctamente!</Text>}
        
        <Box display="flex" justifyContent="flex-end" mt={6}>
          <Button 
            colorScheme="blue" 
            onClick={handleSave} 
            isLoading={loading}
            size="sm"
          >
            Guardar Configuración
          </Button>
        </Box>
      </CardBody>
    </Card>
  );
};

export default ApisGoogleSection;
