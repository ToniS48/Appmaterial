import React from 'react';
import { Card, CardBody, Heading, VStack, FormControl, FormLabel, Input, Text } from '@chakra-ui/react';
import { FiKey } from 'react-icons/fi';

interface WeatherApiKeySectionProps {
  config: { aemet: { apiKey: string } };
  setConfig: (cfg: { aemet: { apiKey: string } }) => void;
  userRole: 'admin' | 'vocal';
  save?: (data: { aemet: { apiKey: string } }) => Promise<void>;
}

const WeatherApiKeySection: React.FC<WeatherApiKeySectionProps> = ({
  config,
  setConfig,
  userRole,
  save
}) => {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
        <Heading size="sm" mb={4} color="orange.700" display="flex" alignItems="center">
          <FiKey style={{ marginRight: 8 }} />
          API Key Meteorológica
        </Heading>
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel fontSize="sm">API Key de AEMET</FormLabel>
            <Input
              name="aemetApiKey"
              value={config.aemet.apiKey || ''}
              onChange={e => setConfig({ ...config, aemet: { ...config.aemet, apiKey: e.target.value } })}
              placeholder="Introduce tu API key de AEMET"
              type={userRole === 'vocal' ? 'password' : 'text'}
              isReadOnly={userRole === 'vocal'}
              bg={userRole === 'vocal' ? 'gray.50' : undefined}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              {userRole === 'vocal'
                ? 'Solo administradores pueden modificar las claves de API'
                : (<>
                    Obtén tu API key gratuita en{' '}
                    <Text as="span" color="blue.500" textDecoration="underline">opendata.aemet.es</Text>
                  </>)}
            </Text>
          </FormControl>
        </VStack>
        {error && <Text color="red.500" mt={2}>{error}</Text>}
        {success && <Text color="green.500" mt={2}>¡Guardado correctamente!</Text>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={handleSave}
            style={{ background: '#3182ce', color: 'white', padding: '8px 16px', borderRadius: 4, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
            disabled={userRole === 'vocal' || loading}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </CardBody>
    </Card>
  );
};

export default WeatherApiKeySection;
