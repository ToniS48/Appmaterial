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
  Button,
  useToast
} from '@chakra-ui/react';
import { FiTool } from 'react-icons/fi';

interface MaterialManagementSectionProps {
  config: any;
  setConfig: (cfg: any) => void;
  save: (data: any) => Promise<void>;
}

/**
 * Sección de Gestión de Material
 */
const MaterialManagementSection: React.FC<MaterialManagementSectionProps> = ({
  config,
  setConfig,
  save
}) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const handleChange = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };
  const handleSave = async () => {
    setLoading(true);
    try {
      await save(config);
      toast({ title: 'Guardado', description: 'Configuración de material guardada.', status: 'success' });
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo guardar la configuración.', status: 'error' });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card>
      <CardBody>
        <Text fontSize="lg" fontWeight="semibold" color="orange.600" display="flex" alignItems="center">
          <FiTool style={{ marginRight: 8 }} />
          Gestión de Materiales
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">Porcentaje mínimo de stock</FormLabel>
            <Select
              value={config.porcentajeStockMinimo}
              onChange={(e) => handleChange('porcentajeStockMinimo', parseInt(e.target.value))}
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
              value={config.diasRevisionPeriodica}
              onChange={(e) => handleChange('diasRevisionPeriodica', parseInt(e.target.value))}
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
              value={config.tiempoMinimoEntrePrestamos}
              onChange={(e) => handleChange('tiempoMinimoEntrePrestamos', parseInt(e.target.value))}
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
              value={config.diasAntelacionRevision}
              onChange={(e) => handleChange('diasAntelacionRevision', parseInt(e.target.value))}
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button colorScheme="blue" onClick={handleSave} isLoading={loading}>
            Guardar
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default MaterialManagementSection;
