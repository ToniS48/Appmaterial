import React, { useEffect, useMemo } from 'react';
import { 
  VStack, 
  Box, 
  Text, 
  Link, 
  Divider, 
  Icon, 
  Tooltip,
  Image,
  HStack
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { getRutaPorRol } from '../../utils/navigation';
import { logger } from '../../utils/performanceUtils';
import { RolUsuario } from '../../types/usuario';
import logoEspemo from '../../assets/images/logoEspemo.png';

// Importamos iconos desde Chakra UI y React-Icons
import { 
  ViewIcon,
  AtSignIcon,
  CalendarIcon,
  SettingsIcon,
  StarIcon
} from '@chakra-ui/icons';
import { 
  FiPackage, 
  FiUser, 
  FiCalendar, 
  FiUsers, 
  FiBox, 
  FiSettings, 
  FiBell,
  FiAlertTriangle,
  FiEye,
  FiGrid,
  FiHome,
  FiMessageCircle,
  FiTrendingUp
} from 'react-icons/fi';

interface SidebarProps {
  userRole: RolUsuario;
  onItemClick?: () => void;
}

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  roles: RolUsuario[];
}

const AppNavigationMenu: React.FC<SidebarProps> = ({ userRole, onItemClick }) => {
  const location = useLocation();
  
  // Obtener la ruta del dashboard según el rol (memoizada)
  const dashboardPath = useMemo(() => getRutaPorRol(userRole), [userRole]);
  // Configurar los elementos de navegación por secciones
  const appsComunes: NavItem[] = useMemo(() => [
    // Inicio - para todos los roles
    { 
      label: 'Inicio', 
      to: dashboardPath,
      icon: FiHome,
      roles: ['admin', 'vocal', 'socio', 'invitado'] 
    },
    // Actividades - para todos los roles
    { 
      label: 'Actividades', 
      to: '/activities', 
      icon: FiCalendar,
      roles: ['admin', 'vocal', 'socio', 'invitado'] 
    },
    // Calendario - para todos los roles
    { 
      label: 'Calendario', 
      to: '/activities/calendario', 
      icon: CalendarIcon,
      roles: ['admin', 'vocal', 'socio', 'invitado'] 
    },
    // Inventario - solo para socios
    { 
      label: 'Inventario', 
      to: '/material/inventario', 
      icon: FiEye,
      roles: ['socio'] 
    },
    // Mis préstamos - para todos menos invitado
    { 
      label: 'Mis Préstamos', 
      to: '/mis-prestamos', 
      icon: FiPackage,
      roles: ['socio', 'vocal', 'admin'] 
    },    // Notificaciones - para todos
    { 
      label: 'Notificaciones', 
      to: '/notificaciones', 
      icon: FiBell,
      roles: ['admin', 'vocal', 'socio', 'invitado'] 
    },
    // Mensajería - para todos
    { 
      label: 'Mensajería', 
      to: '/mensajeria', 
      icon: FiMessageCircle,
      roles: ['admin', 'vocal', 'socio', 'invitado'] 
    },
    // Perfil - para todos
    { 
      label: 'Mi Perfil', 
      to: '/profile', 
      icon: FiUser,
      roles: ['admin', 'vocal', 'socio', 'invitado'] 
    },
  ], [dashboardPath]);

  const panelControl: NavItem[] = useMemo(() => [    // Gestión de usuarios - específico por rol    // Gestión de usuarios - incluye seguimiento integrado
    { 
      label: 'Gestión de Usuarios', 
      to: '/admin/usuarios/gestion',
      icon: FiUsers,
      roles: ['admin'] 
    },    // Gestión de usuarios - incluye seguimiento integrado
    { 
      label: 'Gestión de Usuarios', 
      to: '/vocal/usuarios/gestion',
      icon: FiUsers,
      roles: ['vocal']    },// Material - solo para admin y vocal
    { 
      label: 'Material', 
      to: '/material/dashboard', 
      icon: FiBox,
      roles: ['admin', 'vocal'] 
    },
    // Administración de préstamos - solo para admin y vocal
    { 
      label: 'Gestión Préstamos', 
      to: '/admin/prestamos',
      icon: FiPackage,
      roles: ['admin'] 
    },
    { 
      label: 'Gestión Préstamos', 
      to: '/vocal/prestamos',
      icon: FiPackage,
      roles: ['vocal'] 
    },
    // Configuración - solo para admin
    { 
      label: 'Configuración', 
      to: '/admin/settings', 
      icon: FiSettings,
      roles: ['admin'] 
    },
  ], []);
  // Filtrar elementos según el rol actual
  const filteredAppsComunes = useMemo(() => {
    const filtered = appsComunes.filter(item => item.roles.includes(userRole));
    console.log('AppNavigationMenu - Filtrado apps comunes:', {
      userRole,
      totalItems: appsComunes.length,
      filteredItems: filtered.length,
      filtered: filtered.map(item => ({ label: item.label, to: item.to }))
    });
    return filtered;
  }, [appsComunes, userRole]);

  const filteredPanelControl = useMemo(() => {
    const filtered = panelControl.filter(item => item.roles.includes(userRole));
    console.log('AppNavigationMenu - Filtrado panel control:', {
      userRole,
      totalItems: panelControl.length,
      filteredItems: filtered.length,
      filtered: filtered.map(item => ({ label: item.label, to: item.to })),
      materialItem: panelControl.find(item => item.label === 'Material')
    });
    return filtered;
  }, [panelControl, userRole]);
    // Log optimizado de la ruta actual
  useEffect(() => {
    logger.debug('Ruta actual:', location.pathname);
  }, [location.pathname]);  return (
    <VStack spacing={0} align="stretch">
      <Box p={4}>
        <HStack spacing={4} align="center">
          <Image 
            src={logoEspemo} 
            alt="ESPEMO Logo"
            height={{ base: "50px", md: "60px" }}
            width={{ base: "50px", md: "60px" }}
            objectFit="contain"
          />
          <Text 
            fontSize={{ base: "xl", md: "2xl" }} 
            fontWeight="bold"
          >
            S.E. ESPEMO
          </Text>
        </HStack>
      </Box>
      <Divider />      {/* Sección Apps Comunes */}
      {filteredAppsComunes.length > 0 && (
        <>
          <VStack spacing={0} align="stretch">
            {filteredAppsComunes.map((item) => {
              const isActive = location.pathname === item.to || 
                              (item.to !== dashboardPath && location.pathname.startsWith(item.to));
              
              return (
                <Link 
                  as={RouterLink} 
                  to={item.to} 
                  key={item.to}
                  onClick={onItemClick}
                  _hover={{ textDecoration: 'none' }}
                >
                  <Tooltip label={item.label} placement="right" hasArrow>
                    <Box 
                      py={3}
                      px={4}
                      bg={isActive ? 'brand.50' : 'transparent'}
                      color={isActive ? 'brand.600' : 'inherit'}
                      borderLeftWidth={isActive ? '4px' : '0px'}
                      borderLeftColor="brand.500"
                      _hover={{ 
                        bg: isActive ? 'brand.50' : 'gray.100',
                      }}
                      transition="all 0.2s"
                      display="flex"
                      alignItems="center"
                    >
                      <Icon as={item.icon} boxSize={5} mr={3} />
                      <Text fontWeight={isActive ? 'medium' : 'normal'}>
                        {item.label}
                      </Text>
                    </Box>
                  </Tooltip>
                </Link>
              );
            })}
          </VStack>
        </>
      )}

      {/* Divider entre secciones si ambas tienen elementos */}
      {filteredAppsComunes.length > 0 && filteredPanelControl.length > 0 && (
        <Divider my={4} />
      )}      {/* Sección Panel de Control */}
      {filteredPanelControl.length > 0 && (
        <>
          <VStack spacing={0} align="stretch">
            {filteredPanelControl.map((item) => {
              const isActive = location.pathname === item.to || 
                              (item.to !== dashboardPath && location.pathname.startsWith(item.to));
              
              return (
                <Link 
                  as={RouterLink} 
                  to={item.to} 
                  key={item.to}
                  onClick={onItemClick}
                  _hover={{ textDecoration: 'none' }}
                >
                  <Tooltip label={item.label} placement="right" hasArrow>
                    <Box 
                      py={3}
                      px={4}
                      bg={isActive ? 'brand.50' : 'transparent'}
                      color={isActive ? 'brand.600' : 'inherit'}
                      borderLeftWidth={isActive ? '4px' : '0px'}
                      borderLeftColor="brand.500"
                      _hover={{ 
                        bg: isActive ? 'brand.50' : 'gray.100',
                      }}
                      transition="all 0.2s"
                      display="flex"
                      alignItems="center"
                    >
                      <Icon as={item.icon} boxSize={5} mr={3} />
                      <Text fontWeight={isActive ? 'medium' : 'normal'}>
                        {item.label}
                      </Text>
                    </Box>
                  </Tooltip>
                </Link>
              );
            })}
          </VStack>
        </>
      )}

      {/* Reportes de errores solo para admin */}
      {userRole === 'admin' && (
        <>
          <Divider my={4} />
          <Link 
            as={RouterLink} 
            to="/admin/reportes" 
            onClick={onItemClick}
            _hover={{ textDecoration: 'none' }}
          >
            <Tooltip label="Reportes de errores" placement="right" hasArrow>
              <Box 
                py={3}
                px={4}
                bg="transparent"
                color="inherit"
                _hover={{ 
                  bg: 'gray.100',
                }}
                transition="all 0.2s"
                display="flex"
                alignItems="center"
              >
                <Icon as={FiAlertTriangle} boxSize={5} mr={3} />
                <Text fontWeight="normal">
                  Reportes de errores
                </Text>
              </Box>
            </Tooltip>
          </Link>
        </>
      )}
    </VStack>
  );
};

export default AppNavigationMenu;