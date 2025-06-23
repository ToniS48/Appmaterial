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
import { FiFileText } from 'react-icons/fi';

interface ReportsSectionProps {
  config: any;
  setConfig: (cfg: any) => void;
  save: (data: any) => Promise<void>;
}

/**
 * Sección de Configuración de Reportes
 */
const ReportsSection: React.FC<ReportsSectionProps> = ({
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
        <Heading size="sm" mb={4} color="teal.600">
          <FiFileText />&nbsp; Configuración de Reportes
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">Días de historial en reportes</FormLabel>
            <Select
              value={config.variables.diasHistorialReportes}
              onChange={e => handleChange('diasHistorialReportes', parseInt(e.target.value))}
            >
              <option value="90">90 días (3 meses)</option>
              <option value="180">180 días (6 meses)</option>
              <option value="365">365 días (1 año)</option>
              <option value="730">730 días (2 años)</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Período de historial incluido en reportes automáticos
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Límite de elementos en exportación</FormLabel>
            <Select
              value={config.variables.limiteElementosExportacion}
              onChange={e => handleChange('limiteElementosExportacion', parseInt(e.target.value))}
            >
              <option value="500">500 elementos</option>
              <option value="1000">1000 elementos</option>
              <option value="2000">2000 elementos</option>
              <option value="5000">5000 elementos</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Máximo número de elementos en exportaciones
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
              background: '#319795', color: 'white', padding: '8px 16px', borderRadius: 4, border: 'none', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </Box>
      </CardBody>
    </Card>
  );
};

export default ReportsSection;
