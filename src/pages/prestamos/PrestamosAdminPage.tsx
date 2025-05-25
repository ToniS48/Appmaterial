import React from 'react';
import {
  Box, Heading, Text, Divider
} from '@chakra-ui/react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import PrestamosDashboard from '../../components/prestamos/PrestamosDashboard';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Página de administración de préstamos para Administradores
 */
const PrestamosAdminPage: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <DashboardLayout title="Gestión de Préstamos">
      <Box maxW="1200px" mx="auto" p={4}>
        <Heading size="lg" mb={2}>Administración de Préstamos</Heading>
        <Text mb={4} color="gray.600">
          Gestiona todos los préstamos activos e históricos
        </Text>
        <Divider mb={6} />
        
        <PrestamosDashboard rol="admin" />
      </Box>
    </DashboardLayout>
  );
};

export default PrestamosAdminPage;