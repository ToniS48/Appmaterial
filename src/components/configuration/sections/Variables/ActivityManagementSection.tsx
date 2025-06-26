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
import { FiCalendar } from 'react-icons/fi';

interface ActivityManagementSectionProps {
  config: any;
  setConfig: (cfg: any) => void;
  save: (data: any) => Promise<void>;
}

/**
 * Sección de Gestión de Actividades
 */
const ActivityManagementSection: React.FC<ActivityManagementSectionProps> = ({
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
        <Text fontSize="lg" fontWeight="semibold" color="blue.600" display="flex" alignItems="center">
          <FiCalendar style={{ marginRight: 8 }} />
          Gestión de Actividades
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">Antelación mínima para crear actividad</FormLabel>
            <Select
              value={config.diasMinimoAntelacionCreacion}
              onChange={e => handleChange('diasMinimoAntelacionCreacion', parseInt(e.target.value))}
            >
              <option value="1">1 día</option>
              <option value="3">3 días</option>
              <option value="7">7 días</option>
              <option value="14">14 días</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días mínimos de antelación para crear una actividad
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Límite para modificar actividad</FormLabel>
            <Select
              value={config.diasMaximoModificacion}
              onChange={e => handleChange('diasMaximoModificacion', parseInt(e.target.value))}
            >
              <option value="1">1 día antes</option>
              <option value="2">2 días antes</option>
              <option value="3">3 días antes</option>
              <option value="7">7 días antes</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días antes de actividad donde ya no se puede modificar
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Límite de participantes por defecto</FormLabel>
            <Select
              value={config.limiteParticipantesPorDefecto}
              onChange={e => handleChange('limiteParticipantesPorDefecto', parseInt(e.target.value))}
            >
              <option value="10">10 participantes</option>
              <option value="15">15 participantes</option>
              <option value="20">20 participantes</option>
              <option value="25">25 participantes</option>
              <option value="30">30 participantes</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Límite por defecto de participantes en nuevas actividades
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
              background: '#805ad5', color: 'white', padding: '8px 16px', borderRadius: 4, border: 'none', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </Box>
      </CardBody>
    </Card>
  );
};

export default ActivityManagementSection;
