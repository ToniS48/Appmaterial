import React from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Card,
  CardBody,
  Heading
} from '@chakra-ui/react';
import { SectionProps } from '../../../types/configuration';

interface GoogleDriveSectionProps extends SectionProps {}

const GoogleDriveSection: React.FC<GoogleDriveSectionProps> = ({
  userRole,
  settings,
  handleApiChange
}) => {
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
              value={settings.apis.googleDriveUrl}
              onChange={(e) => handleApiChange('googleDriveUrl', e.target.value)}
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
              value={settings.apis.googleDriveTopoFolder}
              onChange={(e) => handleApiChange('googleDriveTopoFolder', e.target.value)}
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
              value={settings.apis.googleDriveDocFolder}
              onChange={(e) => handleApiChange('googleDriveDocFolder', e.target.value)}
              isReadOnly={userRole === 'vocal'}
              bg={userRole === 'vocal' ? "gray.50" : undefined}
              placeholder={userRole === 'vocal' ? "Solo administradores pueden modificar" : "documentos"}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              Nombre de la subcarpeta que contiene los documentos del club
            </Text>
          </FormControl>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default GoogleDriveSection;
