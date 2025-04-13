import React from 'react';
import {
  Box, Grid, Heading, Text, Card, CardBody, SimpleGrid,
  Flex, Icon, useDisclosure, useToast, Badge
} from '@chakra-ui/react';
import { 
  FiUsers, FiPackage, FiCalendar, FiBox, FiBell, FiSettings, 
  FiClipboard
} from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import messages from '../constants/messages';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.rol === 'admin';
  const isVocal = userProfile?.rol === 'vocal';
  const isSocio = userProfile?.rol === 'socio';
  const isInvitado = userProfile?.rol === 'invitado';

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
    return (
      <Card 
        as={RouterLink} 
        to={to} 
        _hover={{ 
          transform: 'translateY(-5px)', 
          boxShadow: 'lg',
          borderColor: `${colorScheme}.500`
        }}
        transition="all 0.3s ease"
        borderWidth="1px"
        overflow="hidden"
        borderRadius="lg"
        height="100%"
      >
        <CardBody>
          <Flex direction="column" height="100%">
            <Flex align="center" mb={2}>
              <Icon as={icon} boxSize={6} mr={2} color={`${colorScheme}.500`} />
              <Heading size="md">{title}</Heading>
            </Flex>
            <Text flex="1" color="gray.600" fontSize="sm">{description}</Text>
          </Flex>
        </CardBody>
      </Card>
    );
  };

  return (
    <DashboardLayout title={getDashboardTitle()}>
      <Box maxW="1400px" mx="auto" px={{ base: 3, md: 5 }}>
        {/* Encabezado y bienvenida */}
        <Box mb={10}>
          <Flex 
            direction={{ base: "column", sm: "row" }} 
            width="100%"
            justify="flex-start" 
            align={{ base: "flex-start", sm: "center" }}
            mb={4}
          >
            <Box flex="1" maxW={{ lg: "65%" }}>
              <Heading as="h1" size="lg">
                {getDashboardTitle()}
              </Heading>
            </Box>
          </Flex>
          <Text>{getWelcomeMessage()}</Text>
        </Box>

        {/* Grid de accesos - sin título */}
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={5} mb={8}>
          {/* Actividades - para todos */}
          {renderAccessCard(
            "Actividades", 
            FiCalendar, 
            "/activities", 
            "Gestiona y visualiza todas las actividades del club", 
            "purple"
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
            "Ajustes generales de la aplicación", 
            "gray"
          )}
          
          {/* Perfil - para todos */}
          {renderAccessCard(
            "Mi Perfil", 
            FiUsers, 
            "/profile", 
            "Gestiona tu información personal", 
            "cyan"
          )}
        </SimpleGrid>
      </Box>
    </DashboardLayout>
  );
};

export default Dashboard;