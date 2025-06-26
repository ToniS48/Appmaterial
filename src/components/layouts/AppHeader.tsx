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
  useDisclosure,  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Textarea,
  FormControl,
  FormLabel,
  FormHelperText,
  useToast,
  Button
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificaciones } from '../../contexts/NotificacionContext';
import NotificacionBadge from '../notificaciones/NotificacionBadge';
import NotificacionPanel from '../notificaciones/NotificacionPanel';
import logoEspemo from '../../assets/images/logoEspemo.png';
import AppNavigationMenu from './AppNavigationMenu';
import { FiLogOut, FiUser, FiAlertTriangle } from 'react-icons/fi';
import { getRutaPorRol } from '../../utils/navigation';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { enviarNotificacionMasiva } from '../../services/notificacionService';
import { listarUsuarios } from '../../services/usuarioService';

interface HeaderProps {
  onSidebarOpen: () => void;
  title?: string;
  children?: React.ReactNode;
}

const AppHeader: React.FC<HeaderProps> = ({ title, children }) => {
  const { userProfile, logout } = useAuth();
  const { notificacionesNoLeidas } = useNotificaciones();
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

  // Nuevo estado para el modal de reporte
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const toast = useToast();
  
  // Función para manejar el reporte de errores
  const handleReporteError = () => {
    setIsReportModalOpen(true);
  };

  // Función mejorada para manejar el logout
  const handleLogout = async () => {
    try {
      await logout();
      // La redirección ya se maneja en la función logout del contexto
    } catch (error) {
      console.error('Error durante logout:', error);
      // Redirección de emergencia si hay algún problema
      window.location.href = '/login';
    }
  };
  
  // Función para enviar el reporte
  const sendReport = async () => {
    if (!reportMessage.trim()) {
      toast({
        title: "Error",
        description: "Por favor, describe el error o sugerencia",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      // Obtener todos los usuarios administradores
      const adminUsuarios = await listarUsuarios();
      const adminIds = adminUsuarios
        .filter(user => user.rol === 'admin')
        .map(user => user.uid);
      
      if (adminIds.length === 0) {
        throw new Error("No se encontraron administradores para enviar el reporte");
      }
        // Enviar notificación a todos los administradores
      await enviarNotificacionMasiva(
        adminIds,
        'sistema',
        'Reporte de error/sugerencia',
        `${reportMessage.substring(0, 100)}${reportMessage.length > 100 ? '...' : ''}`
      );
      
      // También guardar el reporte en una colección dedicada
      await addDoc(collection(db, 'reportes_errores'), {
        mensaje: reportMessage,
        usuario: {
          id: userProfile?.uid,
          nombre: `${userProfile?.nombre} ${userProfile?.apellidos || ''}`,
          email: userProfile?.email
        },
        ruta: window.location.pathname,
        fechaCreacion: Timestamp.now(),
        estado: "pendiente"
      });
      
      toast({
        title: "Reporte enviado",
        description: "Gracias por ayudarnos a mejorar el sistema",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      setReportMessage('');
      setIsReportModalOpen(false);
    } catch (error) {
      console.error("Error al enviar reporte:", error);
      toast({
        title: "Error al enviar",
        description: "No se pudo enviar tu reporte. Inténtalo más tarde.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Banner de proyecto en construcción - Ahora colocado ANTES del header */}
      <Box 
        position="relative"
        width="100%"
        bg="red.600" 
        color="white"
        py={2}
        px={4}
        zIndex={2}
        boxShadow="md"
      >
        <Flex 
          justify="space-between" 
          align="center"
          direction={{ base: "column", md: "row" }}
          gap={{ base: 2, md: 0 }}
        >
          <HStack spacing={2}>
            <Icon as={FiAlertTriangle} boxSize={5} />
            <Text fontWeight="bold">
              ¡Proyecto bajo construcción!<br />
              Pueden aparecer errores o funcionalidades incompletas.
            </Text>
          </HStack>
          <Button 
            size="sm" 
            colorScheme="whiteAlpha" 
            onClick={handleReporteError}
            rightIcon={<FiAlertTriangle />}
          >
            Reportar error o sugerencia
          </Button>
        </Flex>
      </Box>
      
      {/* Header principal ahora debajo del banner */}
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
        zIndex={1}
        minH={{ base: "60px", md: "70px" }}
      >        {/* Izquierda: Botón para sidebar móvil, logo y título */}
        <Flex align="center">          {/* Botón de menú - siempre visible en dimensiones reducidas */}
          <IconButton
            ref={btnRef}
            display={{ base: "flex", md: "flex" }}
            onClick={onOpen}
            variant="ghost"
            aria-label="Abrir menú"
            icon={<HamburgerIcon />}
            size="lg"
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
              </Box>              <MenuItem as={RouterLink} to="/profile" icon={<Icon as={FiUser} />}>
                Mi Perfil
              </MenuItem>
              <MenuItem onClick={handleLogout} icon={<Icon as={FiLogOut} />}>
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
      
      {/* Modal para reportar errores */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reportar error o sugerencia</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Describe el problema o sugerencia:</FormLabel>
              <Textarea
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                placeholder="Explica lo que ocurrió o tu sugerencia para mejorar..."
                size="md"
                rows={5}
              />
              <FormHelperText>
                Tu reporte será enviado al administrador del sistema para su revisión.
              </FormHelperText>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button 
              colorScheme="brand" 
              mr={3} 
              onClick={sendReport}
              isLoading={isSending}
              loadingText="Enviando"
            >
              Enviar reporte
            </Button>
            <Button onClick={() => setIsReportModalOpen(false)}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AppHeader;
