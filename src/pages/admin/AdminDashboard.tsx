import React from 'react';
import { SimpleGrid, Heading, VStack } from '@chakra-ui/react';
import { FaUsers, FaCog, FaChartBar } from 'react-icons/fa';
import { MdInventory2 } from 'react-icons/md';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import StatsCard from '../../components/dashboard/StatsCard';
import { renderAccessCard } from '../../utils/dashboardUtils';
import { useAuth } from '../../contexts/AuthContext';
import messages from '../../constants/messages';

const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <DashboardLayout title={messages.dashboard.titulo.admin}>
      <VStack spacing={8} p={5}>
        <Heading size="lg" textAlign="center">
          {messages.dashboard.bienvenida.admin.replace('{nombre}', userProfile?.nombre || '')}
        </Heading>        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={10} width="100%">          {renderAccessCard(
            "Gestión Préstamos",
            MdInventory2,
            "/admin/prestamos",
            "Administración de préstamos de material",
            "teal"
          )}          {renderAccessCard(
            "Usuarios",
            FaUsers,
            "/admin/usuarios",
            "Gestión completa de usuarios",
            "linkedin"
          )}          {renderAccessCard(
            "Configuración",
            FaCog,
            "/admin/settings",
            "Configuración general del sistema",
            "gray"
          )}          {renderAccessCard(
            "Reportes",
            FaChartBar,
            "/admin/reportes",
            "Visualización de reportes y estadísticas",
            "yellow"
          )}
          {/* Aquí se podrían añadir más tarjetas específicas para admin */}
        </SimpleGrid>        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} width="100%">
          <StatsCard 
            title="Total Usuarios" 
            stats={[{ value: "120", color: "blue.500", label: "Usuarios registrados" }]} 
            colorScheme="blue" 
          />
          <StatsCard 
            title="Préstamos Activos" 
            stats={[{ value: "45", color: "green.500", label: "Préstamos en curso" }]} 
            colorScheme="green" 
          />
          <StatsCard 
            title="Material Disponible" 
            stats={[{ value: "89%", color: "orange.500", label: "Disponibilidad de material" }]} 
            colorScheme="orange" 
          />
          <StatsCard 
            title="Actividades Mes" 
            stats={[{ value: "23", color: "purple.500", label: "Actividades este mes" }]} 
            colorScheme="purple" 
          />
        </SimpleGrid>
      </VStack>
    </DashboardLayout>
  );
};

export default AdminDashboard;
