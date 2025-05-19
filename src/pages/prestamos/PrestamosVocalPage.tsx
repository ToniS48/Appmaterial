import React from 'react';
import {
  Box, Heading, Text, Divider
} from '@chakra-ui/react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import PrestamosDashboard from '../../components/prestamos/PrestamosDashboard';

/**
 * Página de administración de préstamos para Vocales
 */
const PrestamosVocalPage: React.FC = () => {
  return (
    <DashboardLayout title="Gestión de Préstamos">
      <Box maxW="1200px" mx="auto" p={4}>
        <Heading size="lg" mb={2}>Gestión de Préstamos</Heading>
        <Text mb={4} color="gray.600">
          Gestiona los préstamos activos y supervisa las devoluciones
        </Text>
        <Divider mb={6} />
        
        <PrestamosDashboard rol="vocal" />
      </Box>
    </DashboardLayout>
  );
};

export default PrestamosVocalPage;