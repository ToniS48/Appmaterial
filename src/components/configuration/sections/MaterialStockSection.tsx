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
  Button
} from '@chakra-ui/react';
import { FiPackage } from 'react-icons/fi';

interface MaterialStockSectionProps {
  config: any;
  setConfig: (cfg: any) => void;
  save: (data: any) => Promise<void>;
}

const MaterialStockSection: React.FC<MaterialStockSectionProps> = ({ config, setConfig, save }) => {
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
        <Text fontSize="lg" fontWeight="semibold" color="orange.600" display="flex" alignItems="center">
          <FiPackage style={{ marginRight: 8 }} />
          Gestión de Stock y Mantenimiento
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">Porcentaje mínimo de stock</FormLabel>
            <Select
              value={config.variables.porcentajeStockMinimo}
              onChange={e => handleChange('porcentajeStockMinimo', parseInt(e.target.value))}
            >
              <option value="10">10%</option>
              <option value="15">15%</option>
              <option value="20">20%</option>
              <option value="25">25%</option>
              <option value="30">30%</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Porcentaje mínimo de stock antes de alerta
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Días de revisión periódica</FormLabel>
            <Select
              value={config.variables.diasRevisionPeriodica}
              onChange={e => handleChange('diasRevisionPeriodica', parseInt(e.target.value))}
            >
              <option value="90">90 días (3 meses)</option>
              <option value="180">180 días (6 meses)</option>
              <option value="365">365 días (1 año)</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Frecuencia de revisión periódica del material
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

          <FormControl>
            <FormLabel fontSize="sm">Días de antelación para revisión</FormLabel>
            <Select
              value={config.variables.diasAntelacionRevision}
              onChange={e => handleChange('diasAntelacionRevision', parseInt(e.target.value))}
            >
              <option value="15">15 días antes</option>
              <option value="30">30 días antes</option>
              <option value="60">60 días antes</option>
              <option value="90">90 días antes</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días de antelación para recordar revisión de material
            </Text>
          </FormControl>
        </SimpleGrid>
        {error && <Text color="red.500" mt={2}>{error}</Text>}
        {success && <Text color="green.500" mt={2}>¡Guardado correctamente!</Text>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button colorScheme="blue" onClick={handleSave} isLoading={loading}>
            Guardar
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default MaterialStockSection;
