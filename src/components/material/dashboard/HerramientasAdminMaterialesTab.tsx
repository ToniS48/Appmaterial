import React from 'react';
import {
  VStack,
  Text,
  Box,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import HerramientasAdminTab from '../../usuarios/dashboard/HerramientasAdminTab';

interface HerramientasAdminMaterialesTabProps {
  userProfile: any;
  cargando: boolean;
}

const HerramientasAdminMaterialesTab: React.FC<HerramientasAdminMaterialesTabProps> = ({
  userProfile,
  cargando
}) => {
  const esAdmin = userProfile?.rol === 'admin';

  if (!esAdmin) {
    return (
      <Alert status="warning">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Acceso Restringido</Text>
          <Text>Solo los administradores pueden acceder a estas herramientas.</Text>
        </Box>
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          🔧 Herramientas Administrativas de Materiales
        </Text>
        <Text fontSize="sm" color="gray.600">
          Herramientas especializadas para la gestión y mantenimiento del sistema de materiales
        </Text>
      </Box>

      {/* Reutilizar el componente existente que ya incluye herramientas de materiales */}
      <HerramientasAdminTab
        userProfile={userProfile}
        cargando={cargando}
      />
    </VStack>
  );
};

export default HerramientasAdminMaterialesTab;
