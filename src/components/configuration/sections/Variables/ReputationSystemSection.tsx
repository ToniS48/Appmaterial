import React, { useState } from 'react';
import {
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  SimpleGrid,
  Box,
  Select
} from '@chakra-ui/react';
import { FiStar } from 'react-icons/fi';

interface ReputationSystemSectionProps {
  config: any;
  setConfig: (cfg: any) => void;
  save: (data: any) => Promise<void>;
}

/**
 * Sección del Sistema de Puntuación y Reputación
 */
const ReputationSystemSection: React.FC<ReputationSystemSectionProps> = ({
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
      [key]: value,
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
        <Text fontSize="lg" fontWeight="semibold" color="yellow.600" display="flex" alignItems="center">
          <FiStar style={{ marginRight: 8 }} />
          Sistema de Reputación
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">Penalización por retraso</FormLabel>
            <Input
              type="number"
              value={config.penalizacionRetraso || 0}
              onChange={e => handleChange('penalizacionRetraso', Number(e.target.value))}
            />
            <Text fontSize="xs" color="gray.600" mt={1}>
              Puntos a descontar por cada retraso
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Bonificación por devolución temprana</FormLabel>
            <Input
              type="number"
              value={config.bonificacionDevolucionTemprana || 0}
              onChange={e => handleChange('bonificacionDevolucionTemprana', Number(e.target.value))}
            />
            <Text fontSize="xs" color="gray.600" mt={1}>
              Puntos extra por devolución antes del plazo
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Umbral de inactividad de usuario</FormLabel>
            <Select
              value={config.umbraLinactividadUsuario}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('umbraLinactividadUsuario', parseInt(e.target.value))}
            >
              <option value="180">180 días (6 meses)</option>
              <option value="365">365 días (1 año)</option>
              <option value="730">730 días (2 años)</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días sin actividad para marcar usuario como inactivo
            </Text>
          </FormControl>
        </SimpleGrid>
        {error && <Text color="red.500" mt={2}>{error}</Text>}
        {success && <Text color="green.500" mt={2}>¡Guardado correctamente!</Text>}
        <Box display="flex" justifyContent="flex-end" mt={4}>
          <Button colorScheme="blue" onClick={handleSave} isLoading={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </Box>
      </CardBody>
    </Card>
  );
};

export default ReputationSystemSection;
