import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  Text,
  useToast,
  ModalFooter,
  VStack
} from '@chakra-ui/react';
import { 
  AddIcon, 
  EditIcon, 
  ChevronDownIcon, 
  SearchIcon,
  DeleteIcon
} from '@chakra-ui/icons';
import { FiUserPlus } from 'react-icons/fi';
import { Timestamp } from 'firebase/firestore';
import { listarUsuarios, eliminarUsuario } from '../../services/usuarioService';
import UsuarioForm from './UsuarioForm';
import { Usuario, RolUsuario } from '../../types/usuario';
import { useAuth } from '../../contexts/AuthContext';
import { getEstadoActivoLegacy } from '../../utils/migracionUsuarios';

// Definimos los permisos basados en roles
const PERMISOS_POR_ROL: Record<RolUsuario, {
  puedeCrear: boolean;
  puedeEditarRoles: RolUsuario[];
  puedeEliminarRoles: RolUsuario[];
  puedeVerRoles: RolUsuario[];
}> = {
  admin: {
    puedeCrear: true,
    puedeEditarRoles: ['admin', 'vocal', 'socio', 'invitado'],
    puedeEliminarRoles: ['admin', 'vocal', 'socio', 'invitado'],
    puedeVerRoles: ['admin', 'vocal', 'socio', 'invitado']
  },
  vocal: {
    puedeCrear: false,
    puedeEditarRoles: ['socio', 'invitado'],
    puedeEliminarRoles: ['socio', 'invitado'],
    puedeVerRoles: ['admin', 'vocal', 'socio', 'invitado']
  },
  socio: {
    puedeCrear: false,
    puedeEditarRoles: [],
    puedeEliminarRoles: [],
    puedeVerRoles: []
  },
  invitado: {
    puedeCrear: false,
    puedeEditarRoles: [],
    puedeEliminarRoles: [],
    puedeVerRoles: []
  }
};

interface GestionUsuariosTabProps {
  onUsuariosChange?: (usuarios: Usuario[]) => void;
}

const GestionUsuariosTab: React.FC<GestionUsuariosTabProps> = ({ onUsuariosChange }) => {
  // Estados
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  
  // Contextos y hooks
  const { userProfile } = useAuth();
  const toast = useToast();
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  // Asegurar que siempre tengamos un rol válido
  const rolUsuario = (userProfile?.rol || 'invitado') as RolUsuario;
  const permisos = PERMISOS_POR_ROL[rolUsuario];
  const esAdmin = rolUsuario === 'admin';

  // Cargar usuarios
  const cargarUsuarios = async () => {
    try {
      setIsLoading(true);
      const listaUsuarios = await listarUsuarios();
      
      // Filtrar usuarios según permisos
      const usuariosFiltrados = listaUsuarios.filter(usuario => 
        permisos.puedeVerRoles.includes(usuario.rol as RolUsuario) ||
        usuario.uid === userProfile?.uid // Siempre puede ver su propio perfil
      );
      
      setUsuarios(usuariosFiltrados);
      onUsuariosChange?.(usuariosFiltrados);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Escuchar cambios en localStorage para refrescar la lista
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'recalculo_completado' || e.key === 'reparacion_completada') {
        console.log('🔄 Detectada señal de actualización, recargando usuarios...');
        setTimeout(() => {
          cargarUsuarios();
          // Limpiar la señal
          if (e.key) localStorage.removeItem(e.key);
        }, 1000);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // También verificar al cargar la página si hay señales pendientes
    const señalRecalculo = localStorage.getItem('recalculo_completado');
    const señalReparacion = localStorage.getItem('reparacion_completada');
    
    if (señalRecalculo || señalReparacion) {
      console.log('🔄 Detectada señal pendiente, recargando usuarios...');
      setTimeout(() => {
        cargarUsuarios();
        // Limpiar las señales
        localStorage.removeItem('recalculo_completado');
        localStorage.removeItem('reparacion_completada');
      }, 1000);
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [userProfile]);

  // Filtros
  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchesBusqueda = busqueda === '' || 
      usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.email.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchesRol = filtroRol === '' || usuario.rol === filtroRol;
    
    return matchesBusqueda && matchesRol;
  });

  // Handlers
  const handleEdit = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    onFormOpen();
  };

  const handleDelete = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    onDeleteOpen();
  };

  const verificarEstadoUsuario = (usuario: Usuario) => {
    toast({
      title: "Estado del Usuario",
      description: `${usuario.nombre} ${usuario.apellidos} - Estado: ${usuario.estadoAprobacion || 'No definido'}`,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const confirmarEliminacion = async () => {
    if (!selectedUsuario) return;
    
    try {
      await eliminarUsuario(selectedUsuario.uid);
      toast({
        title: "Usuario eliminado",
        description: `El usuario ${selectedUsuario.nombre} ${selectedUsuario.apellidos} ha sido eliminado correctamente`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      cargarUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getRolBadgeColor = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'red';
      case 'vocal':
        return 'purple';
      case 'socio':
        return 'green';
      case 'invitado':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const formatearFecha = (fecha: any) => {
    if (!fecha) return "Nunca";
    
    try {
      if (fecha.toDate) {
        return fecha.toDate().toLocaleString();
      } else if (fecha instanceof Date) {
        return fecha.toLocaleString();
      } else if (fecha.seconds) {
        return fecha.toDate().toLocaleString();
      } else {
        return "Formato inválido";
      }
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return "Error de formato";
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Controles */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
        <Text fontSize="lg" fontWeight="bold">
          Gestión de Usuarios ({usuariosFiltrados.length})
        </Text>
        
        {permisos.puedeCrear && (
          <Button 
            leftIcon={<FiUserPlus />}
            colorScheme="brand" 
            onClick={() => {
              setSelectedUsuario(null);
              onFormOpen();
            }}
            flexShrink={0}
          >
            Nuevo Usuario
          </Button>
        )}
      </Flex>
      
      <Divider />
      
      {/* Filtros */}
      <Flex gap={4} flexWrap="wrap">
        <InputGroup maxW="300px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input 
            placeholder="Buscar usuarios..." 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </InputGroup>
        
        <Box>
          <select 
            value={filtroRol} 
            onChange={(e) => setFiltroRol(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}
          >
            <option value="">Todos los roles</option>
            {esAdmin && (
              <>
                <option value="admin">Administradores</option>
                <option value="vocal">Vocales</option>
              </>
            )}
            <option value="socio">Socios</option>
            <option value="invitado">Invitados</option>
          </select>
        </Box>
      </Flex>
      
      {/* Tabla de usuarios */}
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Nombre</Th>
              <Th>Email</Th>
              <Th>Rol</Th>
              <Th>Estado</Th>
              <Th>Último acceso</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={6} textAlign="center">Cargando...</Td>
              </Tr>
            ) : usuariosFiltrados.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center">No se encontraron usuarios</Td>
              </Tr>
            ) : (
              usuariosFiltrados.map((usuario) => (
                <Tr key={usuario.uid}>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">
                        {usuario.nombre} {usuario.apellidos}
                      </Text>
                      <Badge colorScheme={getEstadoActivoLegacy(usuario) ? "green" : "red"} mb={1}>
                        {getEstadoActivoLegacy(usuario) ? "Activo" : "Inactivo"}
                      </Badge>
                    </VStack>
                  </Td>
                  <Td>{usuario.email}</Td>
                  <Td>
                    <Badge colorScheme={getRolBadgeColor(usuario.rol)}>
                      {usuario.rol}
                    </Badge>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Badge 
                        colorScheme={usuario.estadoAprobacion === 'aprobado' ? 'green' : 
                                   usuario.estadoAprobacion === 'rechazado' ? 'red' : 'yellow'}
                        size="sm"
                      >
                        {usuario.estadoAprobacion || 'pendiente'}
                      </Badge>
                      <Badge 
                        colorScheme={usuario.estadoActividad === 'activo' ? 'green' : 
                                   usuario.estadoActividad === 'suspendido' ? 'red' : 'gray'}
                        size="sm"
                      >
                        {usuario.estadoActividad || 'inactivo'}
                      </Badge>
                    </VStack>
                  </Td>
                  <Td>{formatearFecha(usuario.ultimaConexion)}</Td>
                  <Td>
                    <Menu>
                      <MenuButton as={IconButton} icon={<ChevronDownIcon />} variant="outline" size="sm" />
                      <MenuList>
                        <MenuItem 
                          icon={<EditIcon />} 
                          onClick={() => handleEdit(usuario)}
                          isDisabled={!permisos.puedeEditarRoles.includes(usuario.rol as RolUsuario)}
                        >
                          Editar
                        </MenuItem>
                        <MenuItem 
                          icon={<SearchIcon />} 
                          onClick={() => verificarEstadoUsuario(usuario)}
                        >
                          Verificar Estado
                        </MenuItem>
                        <MenuItem 
                          icon={<DeleteIcon />} 
                          onClick={() => handleDelete(usuario)}
                          isDisabled={!permisos.puedeEliminarRoles.includes(usuario.rol as RolUsuario)}
                          color="red.500"
                        >
                          Eliminar
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Modal de formulario */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <UsuarioForm 
              usuario={selectedUsuario || undefined}
              onSuccess={() => {
                onFormClose();
                cargarUsuarios();
              }}
              onCancel={onFormClose}
              isVocalMode={!esAdmin}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Modal de confirmación de eliminación */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar eliminación</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              ¿Está seguro de que desea eliminar al usuario "{selectedUsuario?.nombre} {selectedUsuario?.apellidos}"? Esta acción no se puede deshacer.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onDeleteClose}>
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={confirmarEliminacion}>
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default GestionUsuariosTab;
