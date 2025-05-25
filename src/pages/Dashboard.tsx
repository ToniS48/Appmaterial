import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Grid, Heading, Text, Card, CardBody, SimpleGrid,
  Flex, Icon, useDisclosure, useToast, Badge, Spinner, Center
} from '@chakra-ui/react';
import { 
  FiUsers, FiPackage, FiCalendar, FiBox, FiBell, FiSettings, 
  FiClipboard, FiAlertTriangle, FiEye
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import messages from '../constants/messages';
import { safeLog, deferCallback, useMemoizedObject } from '../utils/performanceUtils';

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { userProfile } = useAuth();
  
  // Usar useMemo para evitar cálculos repetidos en cada render
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
    // Usar setTimeout para mejorar la experiencia de usuario
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

  // Usar safeLog para reducir el impacto de los logs
  useEffect(() => {
    safeLog('Dashboard montado para rol:', userProfile?.rol);
    return () => {
      safeLog('Dashboard desmontado');
    };
  }, [userProfile?.rol]);

  // Timer optimizado
  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      safeLog('Dashboard: Forzando finalización de carga');
      setIsLoading(false);
    }, 3000);
    
    return () => {
      clearTimeout(loadingTimer);
    };
  }, []);
  
  // Memoizar estas funciones para evitar recalcularlas en cada render
  const getDashboardTitle = useMemo(() => {
    if (isAdmin) return messages.dashboard.titulo.admin;
    if (isVocal) return messages.dashboard.titulo.vocal;
    if (isSocio) return messages.dashboard.titulo.socio;
    return messages.dashboard.titulo.invitado;
  }, [isAdmin, isVocal, isSocio]);
  
  const getWelcomeMessage = useMemo(() => {
    const message = isAdmin ? messages.dashboard.bienvenida.admin :
                    isVocal ? messages.dashboard.bienvenida.vocal :
                    isSocio ? messages.dashboard.bienvenida.socio :
                    messages.dashboard.bienvenida.invitado;
    
    return message.replace('{nombre}', userProfile?.nombre || '');
  }, [isAdmin, isVocal, isSocio, isInvitado, userProfile?.nombre]);

  // Usar un objeto memo para las propiedades comunes de las tarjetas
  const cardBaseProps = useMemoizedObject(() => ({
    borderWidth: "1px",
    borderRadius: "lg",
    overflow: "hidden",
    transition: "all 0.2s",
    height: "100%",
  }), []);

  // Función optimizada para renderizar tarjetas
  const renderAccessCard = (title: string, icon: React.ElementType, to: string, description: string, colorScheme: string = "brand") => {
    // Evitar logs innecesarios
    try {
      return (
        <Card 
          as={RouterLink} 
          to={to} 
          _hover={{ 
            transform: 'translateY(-5px)', 
            boxShadow: 'lg',
            borderColor: `${colorScheme}.500`
          }}
          {...cardBaseProps}
        >
          <CardBody>
            <Flex direction="column" align="flex-start" h="100%">
              <Box 
                p={2}
                borderRadius="md"
                bg={`${colorScheme}.100`}
                color={`${colorScheme}.700`}
                mb={3}
              >
                <Icon as={icon} boxSize={6} />
              </Box>
              <Heading size="md" mb={2}>
                {title}
              </Heading>
              <Text color="gray.600" fontSize="sm">
                {description}
              </Text>
            </Flex>
          </CardBody>
        </Card>
      );
    } catch (err) {
      safeLog(`Error al renderizar tarjeta ${title}:`, err);
      return (
        <Card borderWidth="1px" borderRadius="lg" borderColor="red.300" height="100%">
          <CardBody>
            <Text color="red.500">Error al cargar {title}</Text>
          </CardBody>
        </Card>
      );
    }
  };

  // Mostrar spinner durante la carga
  if (isLoading) {
    return (
      <DashboardLayout title={getDashboardTitle}>
        <Center h="60vh">
          <Spinner size="xl" color="brand.500" />
        </Center>
      </DashboardLayout>
    );
  }
  
  // Mostrar mensaje de error si hay alguno
  if (error) {
    return (
      <DashboardLayout title={getDashboardTitle}>
        <Box p={5} bg="red.50" color="red.600" borderRadius="md">
          <Heading size="md" mb={2}>Error</Heading>
          <Text>{error}</Text>
        </Box>
      </DashboardLayout>
    );
  }

  // Renderizado normal del dashboard usando deferCallback para operaciones pesadas
  return (
    <DashboardLayout title={getDashboardTitle}>
      <Box p={5}>
        {/* Encabezado de bienvenida */}
        <Heading size="lg" mb={2}>{getWelcomeMessage}</Heading>
        <Text mb={8}>Accede rápidamente a las funciones principales del sistema.</Text>
        
        {/* Grid de tarjetas de acceso rápido */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={5}>
          {/* Actividades - para todos */}
          {renderAccessCard(
            "Actividades", 
            FiCalendar, 
            "/activities", 
            "Gestiona todas las actividades del club", 
            "purple"
          )}
          
          {/* Mis Actividades - para todos */}
          {renderAccessCard(
            "Mis Actividades", 
            FiCalendar, 
            "/mis-actividades", 
            "Administra tus actividades como responsable o participante", 
            "blue"
          )}
          
          {/* Calendario - para todos */}
          {renderAccessCard(
            "Calendario", 
            FiCalendar, 
            "/activities/calendario", 
            "Vista mensual de todas las actividades programadas", 
            "blue"
          )}
            {/* Material - solo admin y vocal */}
          {(isAdmin || isVocal) && renderAccessCard(
            "Material", 
            FiBox, 
            "/material", 
            "Gestión del inventario completo de material", 
            "orange"
          )}
          
          {/* Inventario - solo para socios */}
          {isSocio && renderAccessCard(
            "Inventario", 
            FiEye, 
            "/material/inventario", 
            "Consulta el inventario de material disponible", 
            "teal"
          )}
          
          {/* Mis Préstamos - para todos excepto invitados */}
          {!isInvitado && renderAccessCard(
            "Mis Préstamos", 
            FiPackage, 
            "/mis-prestamos", 
            "Controla tus préstamos de material activos", 
            "green"
          )}
          
          {/* Gestión de Préstamos - solo admin y vocal */}
          {isAdmin && renderAccessCard(
            "Gestión Préstamos", 
            FiClipboard, 
            "/admin/prestamos", 
            "Administración de préstamos de material", 
            "teal"
          )}
          
          {isVocal && renderAccessCard(
            "Gestión Préstamos", 
            FiClipboard, 
            "/vocal/prestamos", 
            "Administración de préstamos de material", 
            "teal"
          )}
          
          {/* Usuarios - solo admin y vocal */}
          {isAdmin && renderAccessCard(
            "Usuarios", 
            FiUsers, 
            "/admin/usuarios", 
            "Gestión completa de usuarios", 
            "linkedin"
          )}
          
          {isVocal && renderAccessCard(
            "Usuarios", 
            FiUsers, 
            "/vocal/usuarios", 
            "Gestión de socios e invitados", 
            "linkedin"
          )}
          
          {/* Notificaciones - para todos */}
          {renderAccessCard(
            "Notificaciones", 
            FiBell, 
            "/notificaciones", 
            "Centro de notificaciones y alertas", 
            "red"
          )}
          
          {/* Configuración - solo admin */}
          {isAdmin && renderAccessCard(
            "Configuración", 
            FiSettings, 
            "/admin/settings", 
            "Configuración general del sistema", 
            "gray"
          )}
          
          {/* Reportes - solo admin */}
          {isAdmin && renderAccessCard(
            "Reportes", 
            FiAlertTriangle, 
            "/admin/reportes", 
            "Visualización de reportes y estadísticas", 
            "yellow"
          )}
        </SimpleGrid>
      </Box>
    </DashboardLayout>
  );
};

export default Dashboard;