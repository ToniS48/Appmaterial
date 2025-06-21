/**
 * AdminEstadisticasActividadesPage - Página de estadísticas de actividades para administradores
 * 
 * Página dedicada que muestra el componente completo de estadísticas de actividades
 * con todas las funcionalidades y análisis detallados.
 * 
 * @author Sistema de Gestión de Actividades
 * @version 1.0 - Implementación inicial
 */
import React, { useState } from 'react';
import {
  Box,
  Heading,
  HStack,
  Button,
  useColorModeValue
} from '@chakra-ui/react';
import { FiArrowLeft, FiBarChart2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { EstadisticasAnualesActividades } from '../../components/actividades/estadisticas';

const AdminEstadisticasActividadesPage: React.FC = () => {
  const navigate = useNavigate();
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  
  // Colores para el modo claro/oscuro
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  const handleVolverDashboard = () => {
    navigate('/admin/dashboard');
  };

  const handleCambioAño = (año: number) => {
    setAñoSeleccionado(año);
  };

  return (
    <DashboardLayout title="Estadísticas de Actividades - Admin">
      <Box bg={bgColor} minH="100vh" p={6}>
        {/* Header con navegación */}
        <Box mb={6}>
          <HStack justify="space-between" align="center" mb={4}>
            <HStack>
              <FiBarChart2 size={24} color="purple" />
              <Heading size="lg" color="purple.500">
                Estadísticas de Actividades - Administración
              </Heading>
            </HStack>
            <Button
              leftIcon={<FiArrowLeft />}
              onClick={handleVolverDashboard}
              variant="outline"
              colorScheme="gray"
            >
              Volver al Dashboard
            </Button>
          </HStack>
        </Box>

        {/* Componente principal de estadísticas */}
        <EstadisticasAnualesActividades
          añoSeleccionado={añoSeleccionado}
          onCambioAño={handleCambioAño}
        />
      </Box>
    </DashboardLayout>
  );
};

export default AdminEstadisticasActividadesPage;
