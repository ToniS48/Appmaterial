import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Checkbox,
  Stack,
  HStack,
  Text,
  Badge,
  SimpleGrid,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Flex,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  CheckboxGroup
} from '@chakra-ui/react';
import { FiSend, FiTrash2, FiEye, FiUser, FiUsers, FiFilter } from 'react-icons/fi';
import { listarUsuarios } from '../../services/usuarioService';
import { 
  obtenerNotificacionesUsuario, 
  enviarNotificacionMasiva, 
  marcarNotificacionComoLeida, 
  eliminarNotificacion 
} from '../../services/notificacionService';
import { Notificacion, TipoNotificacion } from '../../types/notificacion';
import { Usuario } from '../../types/usuario';
import { useAuth } from '../../contexts/AuthContext';
import messages from '../../constants/messages';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const GestionNotificaciones: React.FC = () => {
  // Estado general
  const [activeTab, setActiveTab] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroUsuario, setFiltroUsuario] = useState<string>('');
  const { userProfile } = useAuth();
  const toast = useToast();
  
  // Modal controls
  const {
    isOpen: isFilterOpen,
    onOpen: onFilterOpen,
    onClose: onFilterClose
  } = useDisclosure();
  
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose
  } = useDisclosure();
  
  // Estado para nueva notificación
  const [destinatarios, setDestinatarios] = useState<string[]>([]);
  const [todosLosUsuarios, setTodosLosUsuarios] = useState(false);
  const [tipoNotificacion, setTipoNotificacion] = useState<TipoNotificacion>('sistema');
  const [mensaje, setMensaje] = useState('');
  const [enlace, setEnlace] = useState('');
  
  // Grupo de destinatarios
  const [rolSeleccionado, setRolSeleccionado] = useState<string>('');
  
  // Modales
      const [notificacionSeleccionada, setNotificacionSeleccionada] = useState<Notificacion | null>(null);
  
  // Hooks
  // useToast hook ya está declarado arriba
      
  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        // Cargar todos los usuarios
        const usuariosData = await listarUsuarios();
        setUsuarios(usuariosData);
        
        // Cargar notificaciones recientes
        await cargarNotificaciones();
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos iniciales',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [toast]);
  
  // Cargar notificaciones con filtros
  const cargarNotificaciones = async () => {
    if (!userProfile?.uid) return;
    
    setCargando(true);
    try {
      // Como administrador, podríamos implementar una función para ver notificaciones de todos
      // Por ahora, mostraremos solo las del usuario actual
      const notificacionesData = await obtenerNotificacionesUsuario(userProfile.uid, true, 100);
      setNotificaciones(notificacionesData);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las notificaciones',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCargando(false);
    }
  };
  
  // Filtrar notificaciones
  const notificacionesFiltradas = notificaciones.filter(n => {
    if (filtroTipo && n.tipo !== filtroTipo) return false;
    if (filtroUsuario && n.usuarioId !== filtroUsuario) return false;
    return true;
  });
  
  // Manejar envío de notificación
  const enviarNotificacion = async () => {
    if (mensaje.trim() === '') {
      toast({
        title: 'Error',
        description: 'Debes escribir un mensaje',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    if (destinatarios.length === 0 && !todosLosUsuarios) {
      toast({
        title: 'Error',
        description: 'Selecciona al menos un destinatario',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setCargando(true);
    try {
      let usuariosSeleccionados: string[];
      
      if (todosLosUsuarios) {
        usuariosSeleccionados = usuarios.map(u => u.uid);
      } else {
        usuariosSeleccionados = destinatarios;
      }
      
      await enviarNotificacionMasiva(
        usuariosSeleccionados,
        tipoNotificacion,
        mensaje,
        undefined, // entidadId
        undefined, // entidadTipo  
        enlace || undefined // enlace
      );
      
      toast({
        title: 'Éxito',
        description: `Notificación enviada a ${usuariosSeleccionados.length} destinatarios`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Limpiar formulario
      setMensaje('');
      setEnlace('');
      setDestinatarios([]);
      setTodosLosUsuarios(false);
      setTipoNotificacion('sistema');
      
      // Recargar notificaciones para ver la nueva
      await cargarNotificaciones();
      
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la notificación',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCargando(false);
    }
  };
  
  // Marcar notificación como leída
  const marcarLeida = async (id: string) => {
    try {
      await marcarNotificacionComoLeida(id);
      
      // Actualizar lista local
      setNotificaciones(prev => 
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      );
      
      toast({
        title: 'Éxito',
        description: 'Notificación marcada como leída',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error al marcar como leída:', error);
      toast({
        title: 'Error',
        description: 'No se pudo marcar la notificación como leída',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Eliminar notificación
  const eliminarNotif = async (id: string) => {
    try {
      await eliminarNotificacion(id);
      
      // Actualizar lista local
      setNotificaciones(prev => prev.filter(n => n.id !== id));
      
      toast({
        title: 'Éxito',
        description: 'Notificación eliminada',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la notificación',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Ver detalle de notificación
  const verDetalleNotificacion = (notificacion: Notificacion) => {
    setNotificacionSeleccionada(notificacion);
    onViewOpen();
  };
  
  // Formatear fecha
  const formatearFecha = (fecha: Date | any) => {
    if (!fecha) return '';
    
    const fechaObj = fecha instanceof Date ? fecha : fecha.toDate();
    
    return format(fechaObj, 'dd MMM yyyy, HH:mm', { locale: es });
  };
  
  // Seleccionar usuarios por rol
  const seleccionarPorRol = () => {
    if (!rolSeleccionado) return;
    
    const usuariosFiltrados = usuarios
      .filter(u => u.rol === rolSeleccionado)
      .map(u => u.uid);
    
    setDestinatarios(usuariosFiltrados);
    
    toast({
      title: 'Selección aplicada',
      description: `Se han seleccionado ${usuariosFiltrados.length} usuarios con rol ${rolSeleccionado}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Obtener color según tipo de notificación
  const getColorTipo = (tipo: TipoNotificacion): string => {
    switch (tipo) {
      case 'material': return 'brand';
      case 'actividad': return 'blue';
      case 'prestamo': return 'green';
      case 'devolucion': return 'teal';
      case 'incidencia': return 'orange';
      case 'recordatorio': return 'purple';
      case 'sistema': return 'gray';
      default: return 'gray';
    }
  };

  // Renderizar nombre de usuario
  const renderNombreUsuario = (usuarioId: string) => {
    const usuario = usuarios.find(u => u.uid === usuarioId);
    return usuario ? `${usuario.nombre} ${usuario.apellidos}` : 'Usuario desconocido';
  };

  return (
    <Box p={4}>
      <Heading mb={6}>Gestión de Notificaciones</Heading>
      
      <Tabs 
        variant="enclosed" 
        colorScheme="brand" 
        onChange={index => setActiveTab(index)}
        mb={6}
      >
        <TabList>
          <Tab>Enviar notificaciones</Tab>
          <Tab>Historial de notificaciones</Tab>
        </TabList>
        
        <TabPanels>
          {/* Panel de envío de notificaciones */}
          <TabPanel>
            <Box 
              borderWidth="1px" 
              borderRadius="lg" 
              p={6} 
              bg="white"
              boxShadow="sm"
            >
              <Heading size="md" mb={4}>Nueva Notificación</Heading>
              
              <FormControl mb={4}>
                <FormLabel>Tipo de notificación</FormLabel>
                <Select 
                  value={tipoNotificacion} 
                  onChange={(e) => setTipoNotificacion(e.target.value as TipoNotificacion)}
                >
                  <option value="sistema">Sistema</option>
                  <option value="material">Material</option>
                  <option value="actividad">Actividad</option>
                  <option value="prestamo">Préstamo</option>
                  <option value="devolucion">Devolución</option>
                  <option value="incidencia">Incidencia</option>
                  <option value="recordatorio">Recordatorio</option>
                </Select>
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel>Mensaje</FormLabel>
                <Textarea 
                  value={mensaje} 
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Escribe el mensaje de la notificación"
                  rows={3}
                />
              </FormControl>
              
              <FormControl mb={4}>
                <FormLabel>Enlace (opcional)</FormLabel>
                <Input 
                  value={enlace} 
                  onChange={(e) => setEnlace(e.target.value)}
                  placeholder="Ej: /activities, /material, etc."
                />
              </FormControl>
              
              <Divider my={5} />
              
              <Heading size="md" mb={4}>Destinatarios</Heading>
              
              <HStack mb={4}>
                <Select 
                  placeholder="Seleccionar por rol"
                  value={rolSeleccionado}
                  onChange={(e) => setRolSeleccionado(e.target.value)}
                >
                  <option value="admin">Administradores</option>
                  <option value="vocal">Vocales</option>
                  <option value="socio">Socios</option>
                  <option value="invitado">Invitados</option>
                </Select>
                
                <Button 
                  leftIcon={<FiUsers />} 
                  colorScheme="blue"
                  onClick={seleccionarPorRol}
                  isDisabled={!rolSeleccionado}
                >
                  Seleccionar
                </Button>
              </HStack>
              
              <FormControl mb={5}>
                <Checkbox 
                  isChecked={todosLosUsuarios}
                  onChange={(e) => setTodosLosUsuarios(e.target.checked)}
                  colorScheme="brand"
                >
                  Enviar a todos los usuarios ({usuarios.length})
                </Checkbox>
              </FormControl>
              
              {!todosLosUsuarios && (
                <Box 
                  borderWidth="1px" 
                  borderRadius="md" 
                  height="200px" 
                  overflowY="auto" 
                  p={4} 
                  mb={4}
                >
                  <CheckboxGroup 
                    value={destinatarios} 
                    onChange={(values) => setDestinatarios(values as string[])}
                  >
                    <Stack spacing={2}>
                      {usuarios.map(usuario => (
                        <Checkbox 
                          key={usuario.uid} 
                          value={usuario.uid}
                          colorScheme="brand"
                        >
                          {usuario.nombre} {usuario.apellidos} ({usuario.email})
                        </Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                </Box>
              )}
              
              <HStack justifyContent="flex-end" spacing={4}>
                <Button 
                  colorScheme="brand" 
                  leftIcon={<FiSend />}
                  onClick={enviarNotificacion}
                  isLoading={cargando}
                  isDisabled={(destinatarios.length === 0 && !todosLosUsuarios) || mensaje.trim() === ''}
                >
                  Enviar notificación
                </Button>
              </HStack>
            </Box>
          </TabPanel>
          
          {/* Panel de historial */}
          <TabPanel>
            <Box 
              borderWidth="1px" 
              borderRadius="lg" 
              p={6} 
              bg="white"
              boxShadow="sm"
            >
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Historial de notificaciones</Heading>
                <HStack spacing={2}>
                  <Button 
                    leftIcon={<FiFilter />} 
                    size="sm" 
                    onClick={onFilterOpen}
                    colorScheme="blue" 
                    variant="outline"
                  >
                    Filtrar
                  </Button>
                  
                  <Button 
                    size="sm" 
                    onClick={cargarNotificaciones}
                    colorScheme="brand"
                  >
                    Actualizar
                  </Button>
                </HStack>
              </Flex>
              
              {cargando ? (
                <Flex justify="center" align="center" my={10}>
                  <Spinner size="xl" color="brand.500" />
                </Flex>
              ) : notificacionesFiltradas.length === 0 ? (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  No hay notificaciones que mostrar
                </Alert>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th bg="brand.50" color="brand.700">Tipo</Th>
                        <Th bg="brand.50" color="brand.700">Mensaje</Th>
                        <Th bg="brand.50" color="brand.700">Usuario</Th>
                        <Th bg="brand.50" color="brand.700">Fecha</Th>
                        <Th bg="brand.50" color="brand.700">Estado</Th>
                        <Th bg="brand.50" color="brand.700">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {notificacionesFiltradas.map(notif => (
                        <Tr key={notif.id} opacity={notif.leida ? 0.7 : 1}>
                          <Td>
                            <Badge colorScheme={getColorTipo(notif.tipo as TipoNotificacion)}>
                              {notif.tipo}
                            </Badge>
                          </Td>
                          <Td maxW="300px" isTruncated>{notif.mensaje}</Td>
                          <Td>{renderNombreUsuario(notif.usuarioId)}</Td>
                          <Td>{formatearFecha(notif.fecha)}</Td>
                          <Td>
                            {notif.leida ? (
                              <Badge colorScheme="green">Leída</Badge>
                            ) : (
                              <Badge colorScheme="red">No leída</Badge>
                            )}
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="Ver detalle"
                                icon={<FiEye />}
                                size="sm"
                                colorScheme="blue"
                                onClick={() => verDetalleNotificacion(notif)}
                              />
                              
                              {!notif.leida && (
                                <IconButton
                                  aria-label="Marcar como leída"
                                  icon={<FiUser />}
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() => marcarLeida(notif.id)}
                                />
                              )}
                              
                              <IconButton
                                aria-label="Eliminar"
                                icon={<FiTrash2 />}
                                size="sm"
                                colorScheme="red"
                                onClick={() => eliminarNotif(notif.id)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Modal de filtros */}
      <Modal isOpen={isFilterOpen} onClose={onFilterClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Filtrar notificaciones</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mb={4}>
              <FormLabel>Tipo de notificación</FormLabel>
              <Select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                placeholder="Todos los tipos"
              >
                <option value="sistema">Sistema</option>
                <option value="material">Material</option>
                <option value="actividad">Actividad</option>
                <option value="prestamo">Préstamo</option>
                <option value="devolucion">Devolución</option>
                <option value="incidencia">Incidencia</option>
                <option value="recordatorio">Recordatorio</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Usuario</FormLabel>
              <Select
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
                placeholder="Todos los usuarios"
              >
                {usuarios.map(usuario => (
                  <option key={usuario.uid} value={usuario.uid}>
                    {usuario.nombre} {usuario.apellidos}
                  </option>
                ))}
              </Select>
            </FormControl>
          </ModalBody>
          
          <ModalFooter>
            <Button 
              colorScheme="brand" 
              mr={3} 
              onClick={() => {
                onFilterClose();
                cargarNotificaciones();
              }}
            >
              Aplicar filtros
            </Button>
            <Button onClick={() => {
              setFiltroTipo('');
              setFiltroUsuario('');
            }}>
              Limpiar filtros
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal de vista detallada */}
      <Modal isOpen={isViewOpen} onClose={onViewClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalle de notificación</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {notificacionSeleccionada && (
              <SimpleGrid columns={1} spacing={4}>
                <Box>
                  <Text fontWeight="bold">Tipo:</Text>
                  <Badge colorScheme={getColorTipo(notificacionSeleccionada.tipo as TipoNotificacion)}>
                    {notificacionSeleccionada.tipo}
                  </Badge>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Mensaje:</Text>
                  <Text>{notificacionSeleccionada.mensaje}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Usuario:</Text>
                  <Text>{renderNombreUsuario(notificacionSeleccionada.usuarioId)}</Text>
                </Box>
                
                <Box>
                  <Text fontWeight="bold">Fecha:</Text>
                  <Text>{formatearFecha(notificacionSeleccionada.fecha)}</Text>
                </Box>
                
                {notificacionSeleccionada.enlace && (
                  <Box>
                    <Text fontWeight="bold">Enlace:</Text>
                    <Text color="blue.500">{notificacionSeleccionada.enlace}</Text>
                  </Box>
                )}
                
                <Box>
                  <Text fontWeight="bold">Estado:</Text>
                  {notificacionSeleccionada.leida ? (
                    <Badge colorScheme="green">Leída</Badge>
                  ) : (
                    <Badge colorScheme="red">No leída</Badge>
                  )}
                </Box>
              </SimpleGrid>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button onClick={onViewClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default GestionNotificaciones;