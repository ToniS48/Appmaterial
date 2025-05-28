import React from 'react';
import { SimpleGrid, Heading, VStack } from '@chakra-ui/react';
import { FaUsers } from 'react-icons/fa';
import { MdInventory2 } from 'react-icons/md';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { renderAccessCard } from '../../utils/dashboardUtils';

const VocalDashboard: React.FC = () => {
  return (
    <DashboardLayout title="Dashboard Vocal">
      <VStack p={5} spacing={8}>
        <Heading size="lg" textAlign="center">
          Bienvenido al Dashboard Vocal
        </Heading>        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>          {renderAccessCard(
            'Material',
            MdInventory2,
            '/material',
            'Gestión del inventario completo de material',
            'orange'
          )}

          {renderAccessCard(
            'Gestión Préstamos',
            FaUsers,
            '/vocal/prestamos',
            'Administración de préstamos de material',
            'teal'
          )}

          {/* Aquí se pueden añadir más tarjetas específicas para vocal */}
        </SimpleGrid>
      </VStack>
    </DashboardLayout>
  );
};

export default VocalDashboard;
