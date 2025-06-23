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
        <Heading size="sm" mb={4} color="blue.600">
          🔗 Enlaces de Google Drive del Club {userRole === 'vocal' && '(Solo lectura)'}
        </Heading>
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel fontSize="sm">URL principal de Google Drive</FormLabel>
            <Input
              name="googleDriveUrl"
              value={config.apis.googleDriveUrl}
              onChange={e => handleInputChange('googleDriveUrl', e.target.value)}
              isReadOnly={userRole === 'vocal'}
              bg={userRole === 'vocal' ? "gray.50" : undefined}
              placeholder={userRole === 'vocal' ? "Solo administradores pueden modificar" : "https://drive.google.com/drive/folders/XXXX"}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              {userRole === 'vocal'
                ? 'Solo administradores pueden modificar los enlaces del club'
                : 'URL de la carpeta compartida principal del club'
              }
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Subcarpeta de Topografías</FormLabel>
            <Input
              name="googleDriveTopoFolder"
              value={config.apis.googleDriveTopoFolder}
              onChange={e => handleInputChange('googleDriveTopoFolder', e.target.value)}
              isReadOnly={userRole === 'vocal'}
              bg={userRole === 'vocal' ? "gray.50" : undefined}
              placeholder={userRole === 'vocal' ? "Solo administradores pueden modificar" : "topografias"}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              Nombre de la subcarpeta que contiene las topografías
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Subcarpeta de Documentos</FormLabel>
            <Input
              name="googleDriveDocFolder"
              value={config.apis.googleDriveDocFolder}
              onChange={e => handleInputChange('googleDriveDocFolder', e.target.value)}
              isReadOnly={userRole === 'vocal'}
              bg={userRole === 'vocal' ? "gray.50" : undefined}
              placeholder={userRole === 'vocal' ? "Solo administradores pueden modificar" : "documentos"}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              Nombre de la subcarpeta que contiene los documentos del club
            </Text>
          </FormControl>
          <Button colorScheme="blue" onClick={handleSave} isLoading={loading} alignSelf="flex-end">
            Guardar
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default GoogleDriveSection;
