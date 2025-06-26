import React, { useState } from 'react';
import { Card, CardBody, Heading, FormControl, FormLabel, Switch, Select, Text, SimpleGrid, Button } from '@chakra-ui/react';

interface BackupsSectionProps {
  config: {
    backupAutomatico: boolean;
    frecuenciaBackup: string;
  };
  setConfig: (cfg: any) => void;
  save: (data: any) => Promise<void>;
  success: boolean;
  setSuccess: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
}

const BackupsSection: React.FC<BackupsSectionProps> = ({ config, setConfig, save, success, setSuccess, error, setError }) => {
  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await save(config);
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardBody>
        <Heading size="sm" mb={4} color="red.600">Backups y Seguridad</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="backup-auto" mb="0" fontSize="sm">Backup automático</FormLabel>
            <Switch
              id="backup-auto"
              isChecked={config.backupAutomatico || false}
              onChange={e => handleChange('backupAutomatico', e.target.checked)}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">Frecuencia de backup</FormLabel>
            <Select
              value={config.frecuenciaBackup || 'semanal'}
              onChange={e => handleChange('frecuenciaBackup', e.target.value)}
            >
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </Select>
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

export default BackupsSection;
