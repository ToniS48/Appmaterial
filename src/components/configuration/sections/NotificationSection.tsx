import React, { useState } from 'react';
import {
  Card,
  CardBody,
  Heading,
  FormControl,
  FormLabel,
  Select,
  Text,
  SimpleGrid
} from '@chakra-ui/react';
import { FiBell } from 'react-icons/fi';

interface NotificationSectionProps {
  config: any;
  setConfig: (cfg: any) => void;
  save: (data: any) => Promise<void>;
}

/**
 * Sección de Notificaciones Automáticas
 */
const NotificationSection: React.FC<NotificationSectionProps> = ({
  config,
  setConfig,
  save
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      variables: {
        ...prev.variables,
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
        <Text fontSize="lg" fontWeight="semibold" color="pink.600" display="flex" alignItems="center">
          <FiBell style={{ marginRight: 8 }} />
          Notificaciones del Sistema
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">Recordatorio pre-actividad</FormLabel>
            <Select
              value={config.variables?.recordatorioPreActividad || 1}
              onChange={e => handleChange('recordatorioPreActividad', parseInt(e.target.value))}
            >
              <option value="1">1 día antes</option>
              <option value="3">3 días antes</option>
              <option value="7">7 días antes</option>
              <option value="14">14 días antes</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días de antelación para recordar actividades próximas
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Recordatorio de devolución</FormLabel>
            <Select
              value={config.variables?.recordatorioDevolucion || 1}
              onChange={e => handleChange('recordatorioDevolucion', parseInt(e.target.value))}
            >
              <option value="1">1 día antes</option>
              <option value="2">2 días antes</option>
              <option value="3">3 días antes</option>
              <option value="5">5 días antes</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días de antelación para recordar devoluciones de material
            </Text>
          </FormControl>
        </SimpleGrid>
        {error && <Text color="red.500" mt={2}>{error}</Text>}
        {success && <Text color="green.500" mt={2}>¡Guardado correctamente!</Text>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              background: '#38A169', color: 'white', padding: '8px 16px', borderRadius: 4, border: 'none', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </CardBody>
    </Card>
  );
};

export default NotificationSection;
