/**
 * Componente de mapa de Google Maps - Mock temporal
 * NOTA: Google Maps APIs temporalmente deshabilitadas
 */

import React from 'react';
import {
  Box,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack
} from '@chakra-ui/react';

interface GoogleMapComponentProps {
  height?: string;
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  onLocationSelect?: (coordinates: google.maps.LatLngLiteral) => void;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  height = "400px"
}) => {
  return (
    <Box height={height} width="100%">
      <Alert status="warning" height="100%">
        <VStack spacing={4} align="center" justify="center" width="100%">
          <AlertIcon boxSize="40px" />
          <VStack spacing={2} textAlign="center">
            <AlertTitle fontSize="lg">
              Google Maps temporalmente deshabilitado
            </AlertTitle>
            <AlertDescription>
              La integración con Google Maps está temporalmente deshabilitada 
              mientras se implementa la solución backend con Firebase Functions.
            </AlertDescription>
            <Text fontSize="sm" color="gray.600">
              Esta funcionalidad será restaurada una vez que se complete la 
              migración a un backend seguro para el manejo de Service Accounts.
            </Text>
          </VStack>
        </VStack>
      </Alert>
    </Box>
  );
};

export default GoogleMapComponent;
