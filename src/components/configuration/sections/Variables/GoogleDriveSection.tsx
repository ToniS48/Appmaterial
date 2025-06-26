import React, { useState } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Card,
  CardBody,
  Heading,
  Button,
  useToast
} from '@chakra-ui/react';

interface GoogleDriveSectionProps {
  userRole: 'admin' | 'vocal';
  config: any;
  setConfig: (cfg: any) => void;
  save: (data: any) => Promise<void>;
}

const GoogleDriveSection: React.FC<GoogleDriveSectionProps> = ({
  userRole,
  config,
  setConfig,
  save
}) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleInputChange = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      apis: {
        ...prev.apis,
        [key]: value,
      },
    }));
  };
  const handleSave = async () => {
    setLoading(true);
    try {
      await save(config);
      toast({ title: 'Guardado', description: 'Configuración de Google Drive guardada.', status: 'success' });
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo guardar la configuración.', status: 'error' });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card>
      <CardBody>
        <FormControl mb={4}>
          <FormLabel>URL de Google Drive</FormLabel>
          <Input
            value={config.googleDriveUrl || ''}
            onChange={e => handleInputChange('googleDriveUrl', e.target.value)}
            isDisabled={userRole !== 'admin'}
          />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Carpeta Topografía</FormLabel>
          <Input
            value={config.googleDriveTopoFolder || ''}
            onChange={e => handleInputChange('googleDriveTopoFolder', e.target.value)}
            isDisabled={userRole !== 'admin'}
          />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Carpeta Documentos</FormLabel>
          <Input
            value={config.googleDriveDocFolder || ''}
            onChange={e => handleInputChange('googleDriveDocFolder', e.target.value)}
            isDisabled={userRole !== 'admin'}
          />
        </FormControl>
        <Button colorScheme="blue" onClick={handleSave} isLoading={loading} isDisabled={userRole !== 'admin'}>
          Guardar
        </Button>
      </CardBody>
    </Card>
  );
};

export default GoogleDriveSection;
