/**
 * GestionMaterialesSimpleTab - Versión simplificada para testing
 */
import React from 'react';
import {
  Box,
  Card,
  CardBody,
  VStack,
  Text,
  Heading,
  Button,
  HStack,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { FiPackage, FiPlus } from 'react-icons/fi';

interface GestionMaterialesSimpleTabProps {
  userProfile: any;
  cargando?: boolean;
  onCargarDatos?: () => void;
}

const GestionMaterialesSimpleTab: React.FC<GestionMaterialesSimpleTabProps> = ({
  userProfile,
  cargando = false,
  onCargarDatos
}) => {

  return (
    <VStack spacing={6} align="stretch">
      <Card>
        <CardBody>
          <VStack spacing={4}>
            <Heading size="lg" color="gray.700">
              <HStack>
                <FiPackage />
                <Text>Gestión de Materiales</Text>
              </HStack>
            </Heading>
            
            <Text color="gray.600">
              Esta es la pestaña de gestión de materiales que incluye todas las funcionalidades
              del sistema original de administración.
            </Text>
            
            <HStack spacing={4}>
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                size="lg"
              >
                Nuevo Material
              </Button>
              
              <Button
                onClick={onCargarDatos}
                isLoading={cargando}
                variant="outline"
                size="lg"
              >
                Actualizar Lista
              </Button>
            </HStack>
            
            <Box p={4} bg="gray.50" borderRadius="md" w="full">
              <Text fontWeight="bold" color="gray.700">
                📋 Funcionalidades incluidas:
              </Text>
              <VStack align="start" mt={2} spacing={1}>
                <Text>• CRUD completo de materiales</Text>
                <Text>• Filtros y búsqueda avanzada</Text>
                <Text>• Exportación e importación de datos</Text>
                <Text>• Gestión de códigos QR</Text>
                <Text>• Control de estados y cantidades</Text>
              </VStack>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default GestionMaterialesSimpleTab;
