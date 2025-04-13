import React, { useState, useRef } from 'react';
import {
  Flex,
  IconButton,
  HStack,
  Text,
  Box,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  useColorModeValue,
  useBreakpointValue,
  Icon,
  Spacer,
  Image,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useDisclosure,
  Link,
  Tooltip
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificaciones } from '../../contexts/NotificacionContext';
import NotificacionBadge from '../notificaciones/NotificacionBadge';
import NotificacionPanel from '../notificaciones/NotificacionPanel';
import logoEspemo from '../../assets/images/logoEspemo.png';
import AppNavigationMenu from './AppNavigationMenu';
import { FiLogOut, FiMenu, FiHome, FiUser } from 'react-icons/fi';
import { getRutaPorRol } from '../../utils/navigation';

interface HeaderProps {
  onSidebarOpen: () => void;
  title?: string;
  children?: React.ReactNode;
}

const AppHeader: React.FC<HeaderProps> = ({ title, children }) => {
  const { userProfile, logout } = useAuth();
  const { notificacionesNoLeidas } = useNotificaciones();
  const navigate = useNavigate();
  const [notificacionesOpen, setNotificacionesOpen] = useState(false);
  
  // Estado y funciones para el drawer del sidebar
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLButtonElement>(null);
  
  // Colores responsivos para modo claro/oscuro
  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Ajustar visualización para tamaños de pantalla
  const displayTitle = useBreakpointValue({ base: 'block', md: 'block' });
  
  // Obtener la ruta del dashboard según el rol
  const dashboardPath = getRutaPorRol(userProfile?.rol || 'invitado');

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      w="100%"
      px={4}
      py={{ base: 2, md: 4 }}
      bg={bgColor}
      borderBottomWidth="1px"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={2}
      minH={{ base: "60px", md: "70px" }}
    >
      {/* Izquierda: Botón para sidebar móvil, logo y título */}
      <Flex align="center">
        {/* Botón de menú en móvil */}
        <IconButton
          ref={btnRef}
          display={{ base: "flex", lg: "none" }}
          onClick={onOpen}
          variant="ghost"
          aria-label="Abrir menú"
          icon={<HamburgerIcon />}
          size="md"
          mr={2}
        />
      
        {/* Logo y título - ahora redirigen al dashboard específico */}
        <Box as={RouterLink} to={dashboardPath} display="flex" alignItems="center">
          <Image 
            src={logoEspemo} 
            alt="ESPEMO Logo"
            height={{ base: "36px", md: "60px" }}
            mr={3}
            className="espemo-logo"
            display="block"
          />
          
          <Text
            display={displayTitle}
            fontSize={{ base: "md", sm: "lg" }}
            fontWeight="bold"
            color="inherit"
          >
            S.E. ESPEMO
          </Text>
        </Box>
        
        {/* Icono Home para dashboard - visible en pantallas grandes */}
        <Tooltip label="Dashboard" placement="bottom">
          <IconButton
            as={RouterLink}
            to={dashboardPath}
            variant="ghost"
            aria-label="Dashboard"
            icon={<Icon as={FiHome} boxSize={5} />}
            ml={4}
            display={{ base: "none", lg: "flex" }}
          />
        </Tooltip>
        
        {/* Navegación horizontal para pantallas grandes */}
        <HStack spacing={4} ml={6} display={{ base: "none", lg: "flex" }}>
          <Link as={RouterLink} to="/activities" _hover={{ textDecoration: 'none' }}>
            <Text fontWeight="medium" color="gray.700" _hover={{ color: 'brand.500' }}>Actividades</Text>
          </Link>
          <Link as={RouterLink} to="/activities/calendario" _hover={{ textDecoration: 'none' }}>
            <Text fontWeight="medium" color="gray.700" _hover={{ color: 'brand.500' }}>Calendario</Text>
          </Link>
          {(userProfile?.rol === 'admin' || userProfile?.rol === 'vocal') && (
            <Link as={RouterLink} to="/material" _hover={{ textDecoration: 'none' }}>
              <Text fontWeight="medium" color="gray.700" _hover={{ color: 'brand.500' }}>Material</Text>
            </Link>
          )}
          {userProfile?.rol !== 'invitado' && (
            <Link as={RouterLink} to="/mis-prestamos" _hover={{ textDecoration: 'none' }}>
              <Text fontWeight="medium" color="gray.700" _hover={{ color: 'brand.500' }}>Mis Préstamos</Text>
            </Link>
          )}
        </HStack>
        
        {/* Contenido adicional (personalizado) */}
        {children}
      </Flex>
      
      <Spacer />
      
      {/* Derecha: Notificaciones y menú de usuario */}
      <HStack spacing={{ base: 2, md: 4 }}>
        {/* Botón de notificaciones */}
        <Box>
          <Popover
            isOpen={notificacionesOpen}
            onClose={() => setNotificacionesOpen(false)}
            placement="bottom-end"
            closeOnBlur={true}
          >
            <PopoverTrigger>
              <Box>
                <NotificacionBadge 
                  onClick={() => setNotificacionesOpen(!notificacionesOpen)}
                  iconSize={{ base: "24px", md: "20px" }}
                  count={notificacionesNoLeidas}
                />
              </Box>
            </PopoverTrigger>
            <PopoverContent width="400px" maxW="90vw">
              <PopoverBody p={0}>
                <NotificacionPanel />
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </Box>
        
        {/* Perfil de usuario - mostrando avatar y opciones */}
        <Menu placement="bottom-end">
          <MenuButton>
            <Avatar 
              size="sm" 
              name={`${userProfile?.nombre} ${userProfile?.apellidos}`}
              src={userProfile?.avatarUrl} 
              cursor="pointer"
            />
          </MenuButton>
          <MenuList>
            <Box px={4} py={3} borderBottomWidth="1px" borderColor={borderColor}>
              <Text fontWeight="medium">{userProfile?.nombre || 'Usuario'}</Text>
              <Text fontSize="sm" color="gray.600">{userProfile?.email}</Text>
            </Box>
            <MenuItem as={RouterLink} to="/profile" icon={<Icon as={FiUser} />}>
              Mi Perfil
            </MenuItem>
            <MenuItem onClick={logout} icon={<Icon as={FiLogOut} />}>
              Cerrar Sesión
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
      
      {/* Drawer para el menú en móvil */}
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        finalFocusRef={btnRef}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerBody p={0} mt={8}>
            <AppNavigationMenu 
              userRole={userProfile?.rol ?? 'invitado'} 
              onItemClick={onClose} 
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
};

export default AppHeader;