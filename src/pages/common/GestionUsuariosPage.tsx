import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
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
  ModalFooter
} from '@chakra-ui/react';
import { 
  AddIcon, 
  EditIcon, 
  ChevronDownIcon, 
  SearchIcon,
  DeleteIcon
} from '@chakra-ui/icons';
import { Timestamp } from 'firebase/firestore';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { listarUsuarios, eliminarUsuario } from '../../services/usuarioService';
import UsuarioForm from '../../components/usuarios/UsuarioForm';
import { Usuario, RolUsuario } from '../../types/usuario';
import { useAuth } from '../../contexts/AuthContext';

// Definimos los permisos basados en roles
const PERMISOS_POR_ROL: Record<RolUsuario, {
  puedeCrear: boolean;
  puedeEditarRoles: RolUsuario[];  // Roles que puede editar este rol
  puedeEliminarRoles: RolUsuario[]; // Roles que puede eliminar este rol
  puedeVerRoles: RolUsuario[];      // Roles que puede ver este rol
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

const GestionUsuariosPage: React.FC = () => {
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
  
  // Cargar la lista de usuarios
  const cargarUsuarios = async () => {
    try {
      setIsLoading(true);
      const usuariosData = await listarUsuarios();
      setUsuarios(usuariosData);
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
  
  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);
  
  // Filtrar usuarios por búsqueda, rol y permisos
  const usuariosFiltrados = usuarios.filter(usuario => {
    // Filtro de búsqueda
    const matchBusqueda = 
      usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
      usuario.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.email.toLowerCase().includes(busqueda.toLowerCase());
    
    // Filtro de rol seleccionado por el usuario
    const matchRol = filtroRol ? usuario.rol === filtroRol : true;
    
    // Filtro de permisos (sólo mostrar roles que puede ver)
    const tienePermiso = permisos.puedeVerRoles.includes(usuario.rol);
    
    return matchBusqueda && matchRol && tienePermiso;
  });
  
  // Función para abrir modal de edición
  const handleEdit = (usuario: Usuario) => {
    // Verificar permisos
    if (!permisos.puedeEditarRoles.includes(usuario.rol)) {
      toast({
        title: "Acceso denegado",
        description: `No tienes permisos para editar usuarios con rol de ${usuario.rol}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setSelectedUsuario(usuario);
    onFormOpen();
  };
  
  // Función para abrir modal de eliminación
  const handleDelete = (usuario: Usuario) => {
    // Verificar permisos
    if (!permisos.puedeEliminarRoles.includes(usuario.rol)) {
      toast({
        title: "Acceso denegado",
        description: `No tienes permisos para eliminar usuarios con rol de ${usuario.rol}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setSelectedUsuario(usuario);
    onDeleteOpen();
  };
  
  // Función para confirmar eliminación
  const confirmarEliminacion = async () => {
    if (!selectedUsuario) return;
    
    try {
      await eliminarUsuario(selectedUsuario.uid);
      onDeleteClose();
      cargarUsuarios(); // Recargar lista
      
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el usuario",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Obtener color de badge según rol
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

  const formatearFecha = (fecha: any): string => {
    if (!fecha) return "Nunca";
    
    try {
      if (fecha instanceof Timestamp) {
        return fecha.toDate().toLocaleString();
      } else if (fecha instanceof Date) {
        return fecha.toLocaleString();
      } else if (fecha.toDate && typeof fecha.toDate === 'function') {
        return fecha.toDate().toLocaleString();
      } else {
        return "Formato inválido";
      }
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Error de formato";
    }
  };

  return (
    <DashboardLayout title="Gestión de Usuarios">
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white">
        <Flex justify="space-between" align="center" mb={5} flexWrap="wrap" gap={2}>
          <Heading size="md">Usuarios</Heading>
          
          {/* Descripción condicional según rol */}
          {!esAdmin && (
            <Text fontSize="sm" color="gray.600" flex="1">
              Como vocal puedes editar perfiles de socios e invitados, pero no puedes gestionar administradores o vocales
            </Text>
          )}
          
          {/* Botón de nuevo usuario (solo para admin) */}
          {permisos.puedeCrear && (
            <Button 
              leftIcon={<AddIcon />} 
              colorScheme="brand" 
              onClick={() => {
                setSelectedUsuario(null); // Limpiar selección para crear nuevo
                onFormOpen();
              }}
              flexShrink={0}
            >
              Nuevo Usuario
            </Button>
          )}
        </Flex>
        
        <Divider mb={5} />
        
        {/* Filtros */}
        <Flex mb={5} gap={4} flexWrap="wrap">
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
              className="form-control"
            >
              <option value="">Todos los roles</option>
              {/* Mostrar opciones de filtro según el rol */}
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
                <Th>Último Acceso</Th>
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
                usuariosFiltrados.map(usuario => (
                  <Tr key={usuario.uid}>
                    <Td>
                      {usuario.nombre} {usuario.apellidos}
                    </Td>
                    <Td>{usuario.email}</Td>
                    <Td>
                      <Badge colorScheme={getRolBadgeColor(usuario.rol)}>
                        {usuario.rol}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={usuario.activo ? "green" : "red"}>
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </Td>
                    <Td>
                      {formatearFecha(usuario.ultimaConexion)}
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<ChevronDownIcon />}
                          variant="outline"
                          size="sm"
                        >
                          Acciones
                        </MenuButton>
                        <MenuList>
                          <MenuItem 
                            icon={<EditIcon />}
                            onClick={() => handleEdit(usuario)}
                            isDisabled={!permisos.puedeEditarRoles.includes(usuario.rol)}
                          >
                            Editar
                          </MenuItem>
                          <MenuItem 
                            icon={<DeleteIcon />}
                            onClick={() => handleDelete(usuario)}
                            isDisabled={!permisos.puedeEliminarRoles.includes(usuario.rol)}
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
      </Box>

      {/* Modal de creación/edición */}
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
                cargarUsuarios(); // Recargar la lista
              }}
              onCancel={onFormClose}
              isVocalMode={!esAdmin} // Indicamos si estamos en modo vocal para limitar opciones
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
    </DashboardLayout>
  );
};

export default GestionUsuariosPage;