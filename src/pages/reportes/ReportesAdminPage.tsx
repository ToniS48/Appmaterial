import React from 'react';
import {
  Box, Heading, Text, Divider
} from '@chakra-ui/react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import GestionReportes from '../../components/admin/GestionReportes';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Página de administración de reportes y sugerencias
 */
const ReportesAdminPage: React.FC = () => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.rol === 'admin';

  return (
    <DashboardLayout title="Reportes y Sugerencias">
      <Box maxW="1200px" mx="auto" p={4}>
        <Heading size="lg" mb={2}>Gestión de Reportes</Heading>
        <Text mb={4} color="gray.600">
          Administra los reportes de errores y sugerencias enviados por los usuarios
        </Text>
        <Divider mb={6} />
        
        {isAdmin ? (
          <GestionReportes />
        ) : (
          <Text>No tienes permisos para acceder a esta sección</Text>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default ReportesAdminPage;