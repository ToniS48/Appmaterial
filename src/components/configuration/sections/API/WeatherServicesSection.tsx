import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
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
import { FiEye, FiEyeOff } from 'react-icons/fi';
import CryptoJS from "crypto-js";

interface WeatherServicesSectionProps {
  userRole: 'admin' | 'vocal';
  config: any;
  setConfig: (cfg: any) => void;
  save?: (data: any) => Promise<void>;
}

const WeatherServicesSection: React.FC<WeatherServicesSectionProps> = ({
  userRole,
  config,
  setConfig,
  save
}) => {
  // Acceso directo a la configuración (sin estructura anidada apis)
  const apis = config && typeof config === 'object' ? config : {};

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAemetKey, setShowAemetKey] = useState(false);
  const [aemetKeyInput, setAemetKeyInput] = useState<string>("");

  // Funciones de encriptado/desencriptado
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

  // Sincronizar el valor local con el prop config cuando cambia
  React.useEffect(() => {
    setAemetKeyInput(decrypt(apis.aemetApiKey ?? ""));
    // eslint-disable-next-line
  }, [apis.aemetApiKey]);

  // Handlers para cambios de input
  const handleInputChange = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAemetKeyChange = (value: string) => {
    setAemetKeyInput(value);
    setConfig((prev: any) => ({
      ...prev,
      aemetApiKey: encrypt(value),
    }));
  };
  const handleSave = async () => {
    if (!save) return;
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
        <Heading size="sm" mb={4} color="blue.600">
          🔑 APIs Meteorológicas
        </Heading>
        <VStack spacing={4} align="stretch">
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
                value={apis.weatherApiUrl ?? ""}
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

          {/* AEMET API Key Configuration */}
          <Box>
            <Text fontWeight="semibold" mb={2} color="orange.700">🇪🇸 AEMET - España</Text>
            <Text fontSize="xs" color="gray.600" mb={3}>
              Configuración de la API Key para acceder a los datos oficiales de AEMET.
            </Text>
            <FormControl>
              <FormLabel fontSize="sm">API Key de AEMET</FormLabel>
              <InputGroup>
                <Input
                  name="aemetApiKey"
                  type={showAemetKey ? "text" : "password"}
                  value={aemetKeyInput}
                  onChange={e => handleAemetKeyChange(e.target.value)}
                  placeholder="Introduce tu API key de AEMET"
                  isReadOnly={userRole === 'vocal'}
                  bg={userRole === 'vocal' ? "gray.50" : undefined}
                  autoComplete="off"
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showAemetKey ? "Ocultar" : "Mostrar"}
                    icon={showAemetKey ? <FiEyeOff /> : <FiEye />}
                    size="sm"
                    onClick={() => setShowAemetKey(!showAemetKey)}
                    isDisabled={userRole === 'vocal'}
                  />
                </InputRightElement>
              </InputGroup>
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
          </Box>
        </VStack>
        
        {error && <Text color="red.500" mt={2}>{error}</Text>}
        {success && <Text color="green.500" mt={2}>¡Guardado correctamente!</Text>}
        
        {save && (
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
        )}
      </CardBody>
    </Card>
  );
};

export default WeatherServicesSection;
