import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Heading, Text, Card, CardBody, SimpleGrid,
  Flex, Icon, useDisclosure, useToast, Badge, Spinner, Center
} from '@chakra-ui/react';
import { 
  FiUsers, FiPackage, FiCalendar, FiBox, FiBell, FiSettings, 
  FiClipboard, FiAlertTriangle
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import messages from '../constants/messages';

const Dashboard: React.FC = () => {
  // Añadir estados de error y carga
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.rol === 'admin';
  const isVocal = userProfile?.rol === 'vocal';
  const isSocio = userProfile?.rol === 'socio';
  const isInvitado = userProfile?.rol === 'invitado';

  useEffect(() => {
    // Simular un tiempo de inicialización para detectar cualquier problema
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Añadir manejo de errores con try-catch
  useEffect(() => {
    try {
      // Verificar que el perfil de usuario esté disponible
      if (!userProfile) {
        setError("No se pudo cargar el perfil de usuario");
      }
    } catch (err) {
      console.error("Error al cargar el Dashboard:", err);
      setError("Error al cargar el dashboard");
    }
  }, [userProfile]);

  // Agregar código de debugging al principio del componente
  useEffect(() => {
    console.log('Dashboard montado para rol:', userProfile?.rol);
    return () => {
      console.log('Dashboard desmontado');
    };
  }, [userProfile?.rol]);

  // Timer para forzar finalización de carga
  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      console.log('Dashboard: Forzando finalización de carga');
      setIsLoading(false);
    }, 3000); // Timeout más largo como último recurso
    
    // Detectar montaje real
    const mountedTimer = setTimeout(() => {
      console.log('Dashboard completamente montado');
    }, 500);
    
    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(mountedTimer);
    };
  }, []);
  
  // Obtener título y mensaje de bienvenida según el rol
  const getDashboardTitle = () => {
    if (isAdmin) return messages.dashboard.titulo.admin;
    if (isVocal) return messages.dashboard.titulo.vocal;
    if (isSocio) return messages.dashboard.titulo.socio;
    return messages.dashboard.titulo.invitado;
  };
  
  const getWelcomeMessage = () => {
    const message = isAdmin ? messages.dashboard.bienvenida.admin :
                    isVocal ? messages.dashboard.bienvenida.vocal :
                    isSocio ? messages.dashboard.bienvenida.socio :
                    messages.dashboard.bienvenida.invitado;
    
    return message.replace('{nombre}', userProfile?.nombre || '');
  };

  // Funciones para renderizar tarjetas de acceso rápido
  const renderAccessCard = (title: string, icon: React.ElementType, to: string, description: string, colorScheme: string = "brand") => {
    // Imprime la ruta para depuración
    console.log(`Renderizando tarjeta con ruta: ${to}`);
    
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
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          transition="all 0.2s"
          height="100%"
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
      console.error(`Error al renderizar tarjeta ${title}:`, err);
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
      <DashboardLayout title={getDashboardTitle()}>
        <Center h="60vh">
          <Spinner size="xl" color="brand.500" />
        </Center>
      </DashboardLayout>
    );
  }
  
  // Mostrar mensaje de error si hay alguno
  if (error) {
    return (
      <DashboardLayout title={getDashboardTitle()}>
        <Box p={5} bg="red.50" color="red.600" borderRadius="md">
          <Heading size="md" mb={2}>Error</Heading>
          <Text>{error}</Text>
        </Box>
      </DashboardLayout>
    );
  }

  // Renderizado normal del dashboard
  return (
    <DashboardLayout title={getDashboardTitle()}>
      <Box p={5}>
        {/* Encabezado de bienvenida */}
        <Heading size="lg" mb={2}>{getWelcomeMessage()}</Heading>
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