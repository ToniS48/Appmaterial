import React from 'react';
import {
  TabPanel,
  VStack,
  Alert,
  AlertIcon,
  Text,
  Box
} from '@chakra-ui/react';
import FirestoreSchemaManager from '../sections/System/FirestoreSchemaManager';

interface FirestoreSchemaTabProps {
  userRole: 'admin' | 'vocal';
}

/**
 * Pestaña de Esquemas de Firestore
 * Solo disponible para administradores
 */
const FirestoreSchemaTab: React.FC<FirestoreSchemaTabProps> = ({ userRole }) => {
  // Solo disponible para administradores
  if (userRole !== 'admin') {
    return null;
  }

  return (
    <TabPanel>
      <VStack spacing={6} align="stretch">
        <Alert status="warning">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Administración de Esquemas de Firestore - Solo Administradores</Text>
            <Text>
              Esta funcionalidad permite gestionar los esquemas dinámicos de las colecciones de Firestore.
              Use con precaución ya que los cambios pueden afectar la estructura de datos existente.
            </Text>
          </Box>
        </Alert>
        
        <FirestoreSchemaManager />
      </VStack>
    </TabPanel>
  );
};

export default FirestoreSchemaTab;
