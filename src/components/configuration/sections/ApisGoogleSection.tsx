import React, { useState } from 'react';
import { Card, CardBody, Heading, VStack, FormControl, FormLabel, Input, InputGroup, InputRightElement, IconButton, Button, Text } from '@chakra-ui/react';
import { FiKey, FiEye, FiEyeOff } from 'react-icons/fi';
import { GoogleApisConfig } from '../../../services/configuracionService';

const apiFields: { key: keyof GoogleApisConfig; label: string }[] = [
  { key: 'driveApiKey', label: 'Google Drive API Key' },
  { key: 'mapsEmbedApiKey', label: 'Maps Embed API Key' },
  { key: 'calendarApiKey', label: 'Calendar API Key' },
  { key: 'gmailApiKey', label: 'Gmail API Key' },
  { key: 'chatApiKey', label: 'Chat API Key' },
  { key: 'cloudMessagingApiKey', label: 'Cloud Messaging API Key' }
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

  const handleChange = (key: keyof GoogleApisConfig, value: string) => {
    setConfig({ ...config, [key]: value });
  };

  const handleToggleShow = (key: keyof GoogleApisConfig) => {
    setShow(s => ({ ...s, [key]: !s[key] }));
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
          Google APIs (solo admin)
        </Heading>
        <VStack spacing={4} align="stretch">
          {apiFields.map(({ key, label }) => (
            <FormControl key={key}>
              <FormLabel fontSize="sm">{label}</FormLabel>
              <InputGroup>
                <Input
                  type={show[key] ? 'text' : 'password'}
                  value={config[key] || ''}
                  onChange={e => handleChange(key, e.target.value)}
                  placeholder="Introduce la API Key"
                  autoComplete="off"
                />
                <InputRightElement>
                  <IconButton
                    aria-label={show[key] ? 'Ocultar' : 'Mostrar'}
                    icon={show[key] ? <FiEyeOff /> : <FiEye />}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleShow(key)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
          ))}
        </VStack>
        {error && <Text color="red.500" mt={2}>{error}</Text>}
        {success && <Text color="green.500" mt={2}>¡Guardado correctamente!</Text>}
        <Button colorScheme="blue" onClick={handleSave} isLoading={loading} alignSelf="flex-end" mt={4} style={{ display: 'block', marginLeft: 'auto' }}>
          Guardar
        </Button>
      </CardBody>
    </Card>
  );
};

export default ApisGoogleSection;
