import React, { useState } from 'react';
import {
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
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
        <Text fontSize="lg" fontWeight="semibold" color="teal.600" display="flex" alignItems="center" mb={4}>
          <FiFileText style={{ marginRight: 8 }} />
          Configuración de Reportes
        </Text>
        <FormControl mb={4}>
          <FormLabel>Días historial de reportes</FormLabel>
          <Input
            type="number"
            value={config.diasHistorialReportes || 0}
            onChange={e => handleChange('diasHistorialReportes', Number(e.target.value))}
          />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Límite elementos exportación</FormLabel>
          <Input
            type="number"
            value={config.limiteElementosExportacion || 0}
            onChange={e => handleChange('limiteElementosExportacion', Number(e.target.value))}
          />
        </FormControl>
        <Button colorScheme="blue" onClick={handleSave} isLoading={loading}>Guardar</Button>
        {error && <Text color="red.500" mt={2}>{error}</Text>}
        {success && <Text color="green.500" mt={2}>¡Guardado correctamente!</Text>}
      </CardBody>
    </Card>
  );
};

export default ReportsSection;
