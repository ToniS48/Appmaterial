import React, { useState } from 'react';
import {
  Card,
  CardBody,
  Heading,
  FormControl,
  FormLabel,
  Select,
  Text,
  SimpleGrid,
  Box
} from '@chakra-ui/react';
import { FiRepeat } from 'react-icons/fi';

interface LoanManagementSectionProps {
  userRole: 'admin' | 'vocal';
  config: any;
  setConfig: (cfg: any) => void;
  save: (data: any) => Promise<void>;
}

/**
 * Sección de Gestión de Préstamos y Devoluciones
 */
const LoanManagementSection: React.FC<LoanManagementSectionProps> = ({
  userRole,
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
        <Text fontSize="lg" fontWeight="semibold" color="cyan.600" display="flex" alignItems="center">
          <FiRepeat style={{ marginRight: 8 }} />
          Gestión de Préstamos
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">Días de gracia para devolución</FormLabel>
            <Select
              value={config.variables.diasGraciaDevolucion}
              onChange={e => handleChange('diasGraciaDevolucion', parseInt(e.target.value))}
            >
              <option value="1">1 día</option>
              <option value="2">2 días</option>
              <option value="3">3 días</option>
              <option value="5">5 días</option>
              <option value="7">7 días</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días adicionales después del fin de actividad para devolver material
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Días máximos de retraso</FormLabel>
            <Select
              value={config.variables.diasMaximoRetraso}
              onChange={e => handleChange('diasMaximoRetraso', parseInt(e.target.value))}
            >
              <option value="7">7 días</option>
              <option value="15">15 días</option>
              <option value="30">30 días</option>
              <option value="45">45 días</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días máximos de retraso antes de aplicar penalizaciones
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Días de bloqueo por retraso grave</FormLabel>
            <Select
              value={config.variables.diasBloqueoPorRetraso}
              onChange={e => handleChange('diasBloqueoPorRetraso', parseInt(e.target.value))}
            >
              <option value="15">15 días</option>
              <option value="30">30 días</option>
              <option value="60">60 días</option>
              <option value="90">90 días</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días de bloqueo automático por retrasos graves
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Tiempo mínimo entre préstamos</FormLabel>
            <Select
              value={config.variables.tiempoMinimoEntrePrestamos}
              onChange={e => handleChange('tiempoMinimoEntrePrestamos', parseInt(e.target.value))}
            >
              <option value="0">Sin restricción</option>
              <option value="1">1 día</option>
              <option value="2">2 días</option>
              <option value="7">7 días</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Tiempo mínimo entre préstamos del mismo material
            </Text>
          </FormControl>
        </SimpleGrid>
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

export default LoanManagementSection;
