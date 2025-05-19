import React from 'react';
import { Box } from '@chakra-ui/react';
import MisPrestamosPag from '../common/MisPrestamosPag';
import DashboardLayout from '../../components/layouts/DashboardLayout';

/**
 * Página para gestionar mis préstamos - reutiliza el componente existente
 */
const MisPrestamosPage: React.FC = () => {
  return (
    <DashboardLayout title="Mis Préstamos">
      <Box>
        <MisPrestamosPag />
      </Box>
    </DashboardLayout>
  );
};

export default MisPrestamosPage;