import React, { useState, useEffect, useMemo } from 'react';
import {
  SimpleGrid,
  Heading,
  VStack,
  Button,
  HStack,
  Badge,
  Text,
  useToast,
  Spinner,
  Center,
  Box
} from '@chakra-ui/react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import StatsCard from '../components/dashboard/StatsCard';
import { renderAccessCard } from '../utils/dashboardUtils';
import {
  FiPackage, FiCalendar, FiBell, FiEye
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import messages from '../constants/messages';
import { safeLog } from '../utils/performanceUtils';
import AdminDashboard from './admin/AdminDashboard'; 
import VocalDashboard from './vocal/VocalDashboard'; 

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { userProfile } = useAuth();
  
  const roles = useMemo(() => {
    return {
      isAdmin: userProfile?.rol === 'admin',
      isVocal: userProfile?.rol === 'vocal', 
      isSocio: userProfile?.rol === 'socio',
      isInvitado: userProfile?.rol === 'invitado'
    };
  }, [userProfile?.rol]);
  
  const { isAdmin, isVocal, isSocio, isInvitado } = roles;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    try {
      if (!userProfile) {
        setError("No se pudo cargar el perfil de usuario");
      }
    } catch (err) {
      safeLog("Error al cargar el Dashboard:", err);
      setError("Error al cargar el dashboard");
    }
  }, [userProfile]);

  useEffect(() => {
    safeLog('Dashboard montado para rol:', userProfile?.rol);
    return () => {
      safeLog('Dashboard desmontado');
    };
  }, [userProfile?.rol]);

  const getDashboardTitle = useMemo(() => {
    if (isAdmin) return messages.dashboard.titulo.admin;
    if (isVocal) return messages.dashboard.titulo.vocal;
    if (isSocio) return messages.dashboard.titulo.socio;
    return messages.dashboard.titulo.invitado;
  }, [isAdmin, isVocal, isSocio]);
  
  const getWelcomeMessage = useMemo(() => {
    const message = isSocio ? messages.dashboard.bienvenida.socio :
                    messages.dashboard.bienvenida.invitado;
    
    return message.replace('{nombre}', userProfile?.nombre || '');
  }, [isSocio, isInvitado, userProfile?.nombre]);


  if (isLoading) {
    return (
      <DashboardLayout title={getDashboardTitle}>
        <Center h="60vh">
          <Spinner size="xl" color="brand.500" />
        </Center>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout title="Error">
        <Box p={5} bg="red.50" color="red.600" borderRadius="md">
          <Heading size="md" mb={2}>Error</Heading>
          <Text>{error}</Text>
        </Box>
      </DashboardLayout>
    );
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isVocal) {
    return <VocalDashboard />;
  }

  return (
    <DashboardLayout title={getDashboardTitle}>
      <Box p={5}>
        <Heading size="lg" mb={2}>{getWelcomeMessage}</Heading>
        <Text mb={8}>Accede rápidamente a las funciones principales del sistema.</Text>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={5}>
          {renderAccessCard(
            "Actividades", 
            FiCalendar, 
            "/activities", 
            "Gestiona todas las actividades del club", 
            "purple"
          )}
          
          {renderAccessCard(
            "Mis Actividades", 
            FiCalendar, 
            "/mis-actividades", 
            "Administra tus actividades como responsable o participante", 
            "blue"
          )}
          
          {renderAccessCard(
            "Calendario", 
            FiCalendar, 
            "/activities/calendario", 
            "Vista mensual de todas las actividades programadas", 
            "blue"
          )}
          
          {isSocio && renderAccessCard(
            "Inventario", 
            FiEye, 
            "/material/inventario", 
            "Consulta el inventario de material disponible", 
            "teal"
          )}
          
          {!isInvitado && renderAccessCard(
            "Mis Préstamos", 
            FiPackage, 
            "/mis-prestamos", 
            "Controla tus préstamos de material activos", 
            "green"
          )}
          
          {renderAccessCard(
            "Notificaciones", 
            FiBell, 
            "/notificaciones", 
            "Centro de notificaciones y alertas", 
            "red"
          )}
        </SimpleGrid>
      </Box>
    </DashboardLayout>
  );
};

export default Dashboard;