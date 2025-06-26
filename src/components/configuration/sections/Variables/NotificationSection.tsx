import React, { useState } from 'react';
import {
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text
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
        <Text fontSize="lg" fontWeight="semibold" color="pink.600" display="flex" alignItems="center">
          <FiBell style={{ marginRight: 8 }} />
          Notificaciones del Sistema
        </Text>
        <FormControl mb={4}>
          <FormLabel>Recordatorio Pre-Actividad (días)</FormLabel>
          <Input
            type="number"
            value={config.recordatorioPreActividad || 0}
            onChange={e => handleChange('recordatorioPreActividad', Number(e.target.value))}
          />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Recordatorio Devolución (días)</FormLabel>
          <Input
            type="number"
            value={config.recordatorioDevolucion || 0}
            onChange={e => handleChange('recordatorioDevolucion', Number(e.target.value))}
          />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Notificación Retraso Devolución (días)</FormLabel>
          <Input
            type="number"
            value={config.notificacionRetrasoDevolucion || 0}
            onChange={e => handleChange('notificacionRetrasoDevolucion', Number(e.target.value))}
          />
        </FormControl>
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

export default NotificationSection;
