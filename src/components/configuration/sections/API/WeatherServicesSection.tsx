import React, { useState, useEffect } from 'react';
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
  Button,
  Alert,
  AlertIcon,
  AlertDescription,
  Badge,
  HStack,
  Tooltip
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiShield, FiRefreshCw, FiServer, FiCloud } from 'react-icons/fi';
import { useSecureApisConfig } from '../../../../hooks/configuration/useSecureApisConfig';

interface WeatherServicesSectionProps {
  userRole: 'admin' | 'vocal';
}

const WeatherServicesSection: React.FC<WeatherServicesSectionProps> = ({
  userRole
}) => {
  // Usar el hook seguro de APIs
  const {
    data: config,
    setData: setConfig,
    loading: configLoading,
    saving,
    error: configError,
    setAemetApiKey,
    validateAemetApiKey
  } = useSecureApisConfig();

  const [showAemetKey, setShowAemetKey] = useState(false);
  const [aemetKeyInput, setAemetKeyInput] = useState<string>("");
  const [validatingKey, setValidatingKey] = useState(false);
  const [keyValidation, setKeyValidation] = useState<{
    isValid: boolean;
    lastChecked: Date | null;
  }>({ isValid: false, lastChecked: null });

  // Sincronizar el valor local con la configuración
  useEffect(() => {
    setAemetKeyInput(config.aemetApiKey || "");
  }, [config.aemetApiKey]);

  // Handlers para cambios de input
  const handleInputChange = (key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAemetKeyChange = (value: string) => {
    setAemetKeyInput(value);
    setConfig((prev) => ({
      ...prev,
      aemetApiKey: value,
    }));
    // Reset validation when key changes
    setKeyValidation({ isValid: false, lastChecked: null });
  };

  // Guardar API key de AEMET de forma segura
  const handleSaveAemetKey = async () => {
    if (!aemetKeyInput.trim()) return;
    
    const success = await setAemetApiKey(aemetKeyInput.trim());
    
    if (success) {
      // Validar la key después de guardarla
      await handleValidateKey();
    }
  };

  // Validar API key
  const handleValidateKey = async () => {
    setValidatingKey(true);
    try {
      const isValid = await validateAemetApiKey();
      setKeyValidation({
        isValid,
        lastChecked: new Date()
      });
    } catch (error) {
      console.error('Error validando API key:', error);
      setKeyValidation({
        isValid: false,
        lastChecked: new Date()
      });
    } finally {
      setValidatingKey(false);
    }
  };
  if (configLoading) {
    return (
      <Card>
        <CardBody>
          <Text>Cargando configuración...</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Header con información de seguridad */}
          <Box>
            <HStack justify="space-between" align="center" mb={2}>
              <Heading size="sm" color="blue.600">
                🔑 APIs Meteorológicas
              </Heading>
              <Badge colorScheme="green" variant="subtle">
                <HStack spacing={1}>
                  <FiShield />
                  <Text fontSize="xs">Encriptación Segura</Text>
                </HStack>
              </Badge>
            </HStack>
            <Text fontSize="xs" color="gray.600">
              Las API keys se almacenan encriptadas con claves únicas por usuario
            </Text>
          </Box>

          {/* Mostrar errores si los hay */}
          {configError && (
            <Alert status="error" size="sm">
              <AlertIcon />
              <AlertDescription>{configError}</AlertDescription>
            </Alert>
          )}

          {/* Open-Meteo Configuration */}
          <Box>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel>Open-Meteo API URL</FormLabel>
                <Input
                  value={config.weatherApiUrl || ''}
                  onChange={(e) => handleInputChange('weatherApiUrl', e.target.value)}
                  placeholder="https://api.open-meteo.com/v1/forecast"
                />
              </FormControl>
            </SimpleGrid>
          </Box>

          <Divider />

          {/* Cloud Functions Configuration for AEMET Proxy - MOVED TO ApisGoogleSection */}
          <Box>
            <Heading size="sm" mb={3}>
              <HStack>
                <FiServer />
                <Text>Firebase Functions Proxy para AEMET</Text>
              </HStack>
            </Heading>
            
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">Configuración movida</Text>
                <Text fontSize="sm">
                  La configuración del proxy para AEMET ahora se encuentra en la sección "Google Maps & Services APIs"
                  para centralizar todas las configuraciones de APIs externas.
                </Text>
              </Box>
            </Alert>
          </Box>

          <Divider />

          {/* AEMET API Key Configuration */}
          <Box>
            <HStack justify="space-between" align="center" mb={2}>
              <Text fontWeight="semibold" color="orange.700">🇪🇸 AEMET - España</Text>
              {keyValidation.lastChecked && (
                <Badge 
                  colorScheme={keyValidation.isValid ? "green" : "red"}
                  variant="subtle"
                  fontSize="xs"
                >
                  {keyValidation.isValid ? "✓ Válida" : "✗ Inválida"}
                </Badge>
              )}
            </HStack>
            
            <Text fontSize="xs" color="gray.600" mb={3}>
              API Key oficial de AEMET para datos meteorológicos de España. 
              <Text as="span" color="orange.600"> Se almacena encriptada.</Text>
            </Text>
            
            <VStack spacing={3} align="stretch">
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
              
              <Text fontSize="xs" color="gray.500">
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

            {/* Botones de acción para AEMET */}
            {userRole === 'admin' && (
              <HStack spacing={2}>
                <Button
                  size="sm"
                  colorScheme="orange"
                  onClick={handleSaveAemetKey}
                  isLoading={saving}
                  loadingText="Guardando..."
                  isDisabled={!aemetKeyInput.trim()}
                  leftIcon={<FiShield />}
                >
                  Guardar Key Encriptada
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  onClick={handleValidateKey}
                  isLoading={validatingKey}
                  loadingText="Validando..."
                  isDisabled={!aemetKeyInput.trim()}
                  leftIcon={<FiRefreshCw />}
                >
                  Validar Key
                </Button>
              </HStack>
            )}

            {/* Información de validación */}
            {keyValidation.lastChecked && (
              <Alert 
                status={keyValidation.isValid ? "success" : "warning"} 
                size="sm"
                borderRadius="md"
              >
                <AlertIcon />
                <AlertDescription fontSize="xs">
                  {keyValidation.isValid 
                    ? `API key válida (verificada el ${keyValidation.lastChecked.toLocaleString()})`
                    : `API key inválida o no verificable (${keyValidation.lastChecked.toLocaleString()})`
                  }
                </AlertDescription>
              </Alert>
            )}
            </VStack>
          </Box>

          {/* Información adicional de seguridad */}
          <Box bg="blue.50" p={3} borderRadius="md" border="1px solid" borderColor="blue.200">
            <Text fontSize="xs" color="blue.800" fontWeight="semibold" mb={1}>
              🔒 Información de Seguridad
            </Text>
            <VStack spacing={1} align="start">
              <Text fontSize="xs" color="blue.700">
                • Las API keys se encriptan usando claves únicas por usuario
              </Text>
              <Text fontSize="xs" color="blue.700">
                • Solo el usuario que las guardó puede acceder a ellas
              </Text>
              <Text fontSize="xs" color="blue.700">
                • Las claves se reencriptan automáticamente cada 30 días
              </Text>
              <Text fontSize="xs" color="blue.700">
                • No se almacenan claves de encriptación en el frontend
              </Text>
            </VStack>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default WeatherServicesSection;
