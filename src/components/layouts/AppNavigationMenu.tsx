import React, { useEffect, useMemo } from 'react';
import { 
  VStack, 
  Box, 
  Text, 
  Link, 
  Divider, 
  Icon, 
  Tooltip 
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { RolUsuario } from '../../types/usuario';
import { getRutaPorRol } from '../../utils/navigation';
import { safeLog, useMemoizedObject } from '../../utils/performanceUtils';

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
  FiAlertTriangle
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
  
  // Configurar los elementos de navegación unificados (memoizados)
  const navItems: NavItem[] = useMemo(() => [
    // Dashboard - para todos los roles con acceso
    { 
      label: 'Dashboard', 
      to: dashboardPath,
      icon: FiUser,
      roles: ['admin', 'vocal', 'socio', 'invitado'] 
    },
    
    // Gestión de usuarios - específico por rol
    { 
      label: 'Usuarios', 
      to: '/admin/usuarios',
      icon: FiUsers,
      roles: ['admin'] 
    },
    { 
      label: 'Gestión de Usuarios', 
      to: '/vocal/usuarios',
      icon: FiUsers,
      roles: ['vocal'] 
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
    
    // Material - solo para admin y vocal
    { 
      label: 'Material', 
      to: '/material', 
      icon: FiBox,
      roles: ['admin', 'vocal'] 
    },
    
    // Mis préstamos - para todos menos invitado
    { 
      label: 'Mis Préstamos', 
      to: '/mis-prestamos', 
      icon: FiPackage,
      roles: ['socio', 'vocal', 'admin'] 
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
    
    // Notificaciones - para todos
    { 
      label: 'Notificaciones', 
      to: '/notificaciones', 
      icon: FiBell,
      roles: ['admin', 'vocal', 'socio', 'invitado'] 
    },
    
    // Perfil - para todos
    { 
      label: 'Mi Perfil', 
      to: '/profile', 
      icon: FiUser,
      roles: ['admin', 'vocal', 'socio', 'invitado'] 
    },
    
    // Configuración - solo para admin
    { 
      label: 'Configuración', 
      to: '/admin/settings', 
      icon: FiSettings,
      roles: ['admin'] 
    },
  ], [dashboardPath]);
  
  // Filtrar solo los elementos que corresponden al rol actual (memoizado)
  const filteredItems = useMemo(() => 
    navItems.filter(item => item.roles.includes(userRole)),
    [navItems, userRole]
  );
  
  // Log optimizado de la ruta actual
  useEffect(() => {
    safeLog('Ruta actual:', location.pathname);
  }, [location.pathname]);

  // Estilos base compartidos para los elementos de navegación
  const baseItemStyle = useMemoizedObject(() => ({
    py: 3,
    px: 4,
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center"
  }), []);

  return (
    <VStack spacing={0} align="stretch">
      <Box p={4}>
        <Text fontSize="lg" fontWeight="bold">ESPEMO</Text>
      </Box>
      <Divider />
      <VStack spacing={0} align="stretch" mt={4}>
        {filteredItems.map((item) => {
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
        {userRole === 'admin' && (
          <>
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
    </VStack>
  );
};

export default AppNavigationMenu;