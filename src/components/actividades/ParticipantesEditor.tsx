import React, { useState, useEffect, useRef, useMemo, useImperativeHandle, useCallback } from 'react';
import {
  Box, Button, Text, Grid, Flex,
  Heading, Card, CardBody, Checkbox, Input,
  useColorModeValue, FormControl, FormLabel, Select, HStack, Badge,
  Table, Thead, Tbody, Tr, Th, Td, useToast, IconButton, Menu, MenuButton, MenuList, MenuItem,
  Icon, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  useDisclosure, VStack, RadioGroup, Radio, Stack
} from '@chakra-ui/react';
import { listarUsuarios } from '../../services/usuarioService';
import { FiGrid, FiList, FiChevronLeft, FiChevronRight, FiUsers, FiPackage, FiUser, FiStar, FiMoreVertical } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { Usuario } from '../../types/usuario';

// Interfaces
interface ParticipantesEditorProps {
  data: {
    participanteIds?: string[];
    creadorId?: string;
    responsableActividadId?: string;
    responsableMaterialId?: string;
  };
  onSave: (participantes: string[]) => void;
  onResponsablesChange: (responsableId: string, responsableMaterialId: string) => void;
  onCancel?: () => void;
  mostrarBotones?: boolean;
  actividadId?: string; // Agregar esta prop para determinar si es nueva o existente
}

// Definir interfaces para props de componentes
interface UsuarioCardProps {
  usuario: Usuario;
  isSelected: boolean;
  isCreator: boolean;
  isResponsable: boolean;
  isResponsableMaterial: boolean;
  toggleUsuario: (id: string) => void;
  onOpenRoleModal: (usuario: Usuario) => void;
}

interface UsuarioRowProps {
  usuario: Usuario;
  isSelected: boolean;
  isCreator: boolean;
  isResponsable: boolean;
  isResponsableMaterial: boolean;
  toggleUsuario: (id: string) => void;
  onOpenRoleModal: (usuario: Usuario) => void;
}

// Interface para el modal de selección de rol
interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
  currentRole: string;
  onRoleChange: (uid: string, rol: string) => void;
}

// Componente modal para selección de rol
const RoleSelectionModal: React.FC<RoleModalProps> = ({ 
  isOpen, 
  onClose, 
  usuario, 
  currentRole, 
  onRoleChange 
}) => {
  const [selectedRole, setSelectedRole] = useState(currentRole);

  useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole, isOpen]);

  const handleSave = () => {
    if (usuario && selectedRole !== currentRole) {
      onRoleChange(usuario.uid, selectedRole);
    }
    onClose();
  };

  const roles = [
    {
      value: 'responsable',
      label: 'Responsable de actividad',
      icon: FiUsers,
      color: 'blue.500',
      description: 'Encargado de coordinar y supervisar la actividad'
    },
    {
      value: 'material',
      label: 'Responsable de material',
      icon: FiPackage,
      color: 'cyan.500',
      description: 'Encargado de gestionar los materiales necesarios'
    },
    {
      value: 'participante',
      label: 'Participante regular',
      icon: FiUser,
      color: 'green.500',
      description: 'Participa en la actividad sin responsabilidades especiales'
    }
  ];

  if (!usuario) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex align="center" gap={2}>
            <Icon as={FiUsers} color="brand.500" />
            <Text>Asignar rol</Text>
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Selecciona el rol para:
              </Text>
              <Text fontWeight="medium">
                {usuario.nombre} {usuario.apellidos}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {usuario.email}
              </Text>
            </Box>

            <RadioGroup value={selectedRole} onChange={setSelectedRole}>
              <Stack spacing={3}>
                {roles.map((role) => (
                  <Box
                    key={role.value}
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor={selectedRole === role.value ? role.color : "gray.200"}
                    bg={selectedRole === role.value ? `${role.color.split('.')[0]}.50` : "transparent"}
                    transition="all 0.2s"
                  >
                    <Radio value={role.value} colorScheme={role.color.split('.')[0]}>
                      <Flex align="center" gap={2} ml={2}>
                        <Icon as={role.icon} color={role.color} boxSize={4} />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium" fontSize="sm">
                            {role.label}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {role.description}
                          </Text>
                        </VStack>
                      </Flex>
                    </Radio>
                  </Box>
                ))}
              </Stack>
            </RadioGroup>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            colorScheme="brand" 
            onClick={handleSave}
            isDisabled={selectedRole === currentRole}
          >
            Guardar cambios
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Componente memoizado para tarjeta de usuario
const UsuarioCard = React.memo<UsuarioCardProps>(({ 
  usuario, 
  isSelected, 
  isCreator, 
  isResponsable, 
  isResponsableMaterial,
  toggleUsuario,
  onOpenRoleModal
}) => {
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  
  // Determinar el rol del usuario para mostrar el icono apropiado
  const getRoleIcon = () => {
    if (isCreator) return { icon: FiStar, color: "purple.500", label: "Creador" };
    if (isResponsable) return { icon: FiUsers, color: "blue.500", label: "Responsable de actividad" };
    if (isResponsableMaterial) return { icon: FiPackage, color: "cyan.500", label: "Responsable de material" };
    if (isSelected) return { icon: FiUser, color: "green.500", label: "Participante" };
    return null;
  };

  const roleIcon = getRoleIcon();
  
  return (
    <Card 
      variant="outline" 
      bg={cardBg} 
      borderColor={isSelected ? "brand.500" : borderColor}
      borderWidth={isSelected ? "2px" : "1px"}
      size="sm"
    >
      <CardBody py={2} px={3}>
        <Flex justify="space-between" align="center">
          <Checkbox 
            isChecked={isSelected} 
            onChange={() => toggleUsuario(usuario.uid)}
            size="sm"
            flex="1"
          >
            <Text fontSize="sm" noOfLines={1}>
              {usuario.nombre} {usuario.apellidos}
            </Text>
          </Checkbox>
          
          {/* Botón para abrir modal de selección de rol */}
          {isSelected && !isCreator && (
            <IconButton
              icon={<FiMoreVertical />}
              size="xs"
              variant="ghost"
              ml={1}
              aria-label="Cambiar rol"
              onClick={() => onOpenRoleModal(usuario)}
            />
          )}
        </Flex>
        
        {/* Mostrar icono de rol */}
        {roleIcon && (
          <Flex gap={1} mt={1} align="center">
            <Icon as={roleIcon.icon} color={roleIcon.color} boxSize={3} />
            <Text fontSize="xs" color="gray.600">{roleIcon.label}</Text>
          </Flex>
        )}
      </CardBody>
    </Card>
  );
});

// Componente memoizado para fila de tabla
const UsuarioRow = React.memo<UsuarioRowProps>(({ 
  usuario, 
  isSelected, 
  isCreator,
  isResponsable,
  isResponsableMaterial,
  toggleUsuario,
  onOpenRoleModal
}) => {
  // Determinar el rol del usuario para mostrar el icono apropiado
  const getRoleIcon = () => {
    if (isCreator) return { icon: FiStar, color: "purple.500", label: "Creador" };
    if (isResponsable) return { icon: FiUsers, color: "blue.500", label: "R. Actividad" };
    if (isResponsableMaterial) return { icon: FiPackage, color: "cyan.500", label: "R. Material" };
    if (isSelected) return { icon: FiUser, color: "green.500", label: "Participante" };
    return null;
  };

  const roleIcon = getRoleIcon();

  return (
    <Tr bg={isSelected ? "brand.50" : undefined}>
      <Td px={2}>
        <Checkbox 
          isChecked={isSelected}
          onChange={() => toggleUsuario(usuario.uid)}
          colorScheme="brand"
          size="sm"
        />
      </Td>
      <Td py={1} fontSize="sm">{usuario.nombre} {usuario.apellidos}</Td>
      <Td py={1} fontSize="sm">{usuario.email}</Td>
      <Td py={1}>
        <Flex align="center" justify="space-between">
          {/* Icono de rol */}
          <Flex align="center" gap={1}>
            {roleIcon && (
              <>
                <Icon as={roleIcon.icon} color={roleIcon.color} boxSize={3} />
                <Text fontSize="xs" color="gray.600">{roleIcon.label}</Text>
              </>
            )}
          </Flex>
          
          {/* Botón para abrir modal de selección de rol */}
          {isSelected && !isCreator && (
            <IconButton
              icon={<FiMoreVertical />}
              size="xs"
              variant="ghost"
              aria-label="Cambiar rol"
              onClick={() => onOpenRoleModal(usuario)}
            />
          )}
        </Flex>
      </Td>
    </Tr>
  );
});

// Componente principal con forwardRef
const ParticipantesEditor = React.forwardRef((
  { data, onSave, onResponsablesChange, onCancel, mostrarBotones = true, actividadId }: ParticipantesEditorProps, 
  ref: React.Ref<{ submitForm: () => boolean }>
) => {  const { currentUser, userProfile } = useAuth();
    
  // Debug logging al inicio del componente
  console.log("🔧 ParticipantesEditor - Montando componente");
  console.log("🔧 ParticipantesEditor - Props data:", data);
  console.log("🔧 ParticipantesEditor - actividadId:", actividadId);
    
  // Estados principales
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    // Para actividades nuevas (sin actividadId), solo incluir el creador si existe
    if (!actividadId && data.creadorId) {
      return [data.creadorId];
    }
    
    // Para actividades existentes, usar participanteIds y añadir creador si no está
    const idsUnicos = new Set(data.participanteIds || []);
    if (data.creadorId) idsUnicos.add(data.creadorId);
    return Array.from(idsUnicos);
  });
  
  // Referencias para controlar inicializaciones
  const didInitializeCreator = useRef<boolean>(false);
  const didLoadUsers = useRef<boolean>(false);
  
  // Estados para responsables
  const [responsableId, setResponsableId] = useState<string>(() => (
    data.responsableActividadId || data.creadorId || currentUser?.uid || ''
  ));
  const [responsableMaterialId, setResponsableMaterialId] = useState<string>(
    data.responsableMaterialId || ''
  );
    // Estados para UI
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(30);
  const [orden, setOrden] = useState<'nombre' | 'participante' | 'rol'>('nombre');
  const [filtroParticipacion, setFiltroParticipacion] = useState<'todos' | 'participantes' | 'no-participantes'>('todos');
  const [vistaCompacta, setVistaCompacta] = useState(false);
  
  // Estados para el modal de selección de rol
  const { isOpen: isRoleModalOpen, onOpen: onRoleModalOpen, onClose: onRoleModalClose } = useDisclosure();
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  
  // Estilos
  const cardBg = useColorModeValue("white", "gray.700");

  // Cargar usuarios una sola vez
  useEffect(() => {
    const cargarUsuarios = async () => {
      if (didLoadUsers.current) return;
      
      try {
        setLoading(true);
        didLoadUsers.current = true;
        const todosUsuarios = await listarUsuarios();
        setUsuarios(todosUsuarios);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      } finally {
        setLoading(false);
      }
    };
    
    cargarUsuarios();
  }, []);
  
  // Asignar creador automáticamente una sola vez
  useEffect(() => {
    if (!didInitializeCreator.current && !data.creadorId && currentUser?.uid) {
      didInitializeCreator.current = true;
      
      const creadorId = currentUser.uid;
      if (!selectedIds.includes(creadorId)) {
        setSelectedIds(prev => [...prev, creadorId]);
        // Usar una actualización de estado estable
        setResponsableId(creadorId);
        // Notificar fuera del ciclo de renderizado
        queueMicrotask(() => {
          onResponsablesChange(creadorId, responsableMaterialId);
        });
      }
    }
  }, [currentUser?.uid]);    // Asegurar que los IDs requeridos estén incluidos
  useEffect(() => {
    if (!didInitializeCreator.current) return;
    
    // Para actividades nuevas (sin actividadId), ser más conservador
    if (!actividadId) {
      // Solo asegurar que el creador esté incluido si está definido
      if (data.creadorId && !selectedIds.includes(data.creadorId)) {
        setSelectedIds(prev => [...prev, data.creadorId!]);
      }
      return;
    }
    
    // Para actividades existentes, incluir todos los IDs requeridos
    const idsRequeridos = [
      data.creadorId,
      responsableId,
      responsableMaterialId
    ].filter(Boolean);
    
    // Verificar si hay algo que actualizar
    const idsAActualizar = idsRequeridos.filter(id => id && !selectedIds.includes(id));
      if (idsAActualizar.length > 0) {
      setSelectedIds(prev => [...prev, ...idsAActualizar.filter(Boolean) as string[]]);
    }
  }, [data.creadorId, responsableId, responsableMaterialId, selectedIds, actividadId]);
  
  // Manejar selección/deselección de usuarios
  const toggleUsuario = useCallback((id: string) => {
    console.log("🔄 toggleUsuario called with id:", id);
    console.log("🔄 selectedIds antes:", selectedIds);
    
    // No permitir deseleccionar creador o responsables
    if (selectedIds.includes(id)) {
      if (id === data.creadorId || id === responsableId || id === responsableMaterialId) {
        console.log("⚠️ No se puede deseleccionar creador/responsable:", id);
        return;
      }
      console.log("➖ Removiendo usuario:", id);
      setSelectedIds(prev => {
        const newIds = prev.filter(prevId => prevId !== id);
        console.log("🔄 selectedIds después de remover:", newIds);
        return newIds;
      });
    } else {
      console.log("➕ Agregando usuario:", id);
      setSelectedIds(prev => {
        const newIds = [...prev, id];
        console.log("🔄 selectedIds después de agregar:", newIds);
        return newIds;
      });
    }
  }, [selectedIds, data.creadorId, responsableId, responsableMaterialId]);
  
  // Manejar cambio de responsable principal
  const handleResponsableChange = useCallback((id: string) => {
    setResponsableId(id);
    
    // Asegurar que sea participante
    if (!selectedIds.includes(id)) {
      setSelectedIds(prev => [...prev, id]);
    }
    
    onResponsablesChange(id, responsableMaterialId);
  }, [selectedIds, responsableMaterialId, onResponsablesChange]);
  
  // Manejar cambio de responsable de material
  const handleResponsableMaterialChange = useCallback((id: string) => {
    setResponsableMaterialId(id);
    
    // Asegurar que sea participante
    if (!selectedIds.includes(id)) {
      setSelectedIds(prev => [...prev, id]);
    }
    
    onResponsablesChange(responsableId, id);
  }, [selectedIds, responsableId, onResponsablesChange]);
    // Manejar cambio de rol
  const handleRoleChange = useCallback((uid: string, rol: string) => {
    if (!selectedIds.includes(uid)) {
      setSelectedIds(prev => [...prev, uid]);
    }

    switch (rol) {
      case "responsable":
        setResponsableId(uid);
        onResponsablesChange(uid, responsableMaterialId);
        break;
      case "material":
        setResponsableMaterialId(uid);
        onResponsablesChange(responsableId, uid);
        break;
      default:
        // Reajustar responsables si es necesario
        if (uid === responsableId) {
          const nuevoResponsable = data.creadorId || '';
          setResponsableId(nuevoResponsable);
          onResponsablesChange(nuevoResponsable, responsableMaterialId);
        } else if (uid === responsableMaterialId) {
          setResponsableMaterialId('');
          onResponsablesChange(responsableId, '');
        }        break;
    }
  }, [selectedIds, responsableId, responsableMaterialId, data.creadorId, onResponsablesChange]);
  
  // Función para abrir el modal de selección de rol
  const handleOpenRoleModal = useCallback((usuario: Usuario) => {
    setSelectedUsuario(usuario);
    onRoleModalOpen();
  }, [onRoleModalOpen]);
  
  // Función para obtener el rol actual de un usuario
  const getCurrentRole = useCallback((usuario: Usuario) => {
    if (usuario.uid === data.creadorId) return 'creador';
    if (usuario.uid === responsableId) return 'responsable';
    if (usuario.uid === responsableMaterialId) return 'material';    if (selectedIds.includes(usuario.uid)) return 'participante';
    return 'ninguno';
  }, [data.creadorId, responsableId, responsableMaterialId, selectedIds]);
  // Función de submit
  const submitForm = useCallback(() => {
    try {
      console.log("=== ParticipantesEditor submitForm DEBUG ===");
      console.log("selectedIds:", selectedIds);
      console.log("selectedIds.length:", selectedIds.length);
      console.log("data:", data);
      console.log("data.participanteIds:", data.participanteIds);
      console.log("data.creadorId:", data.creadorId);
      console.log("usuarios.length:", usuarios.length);
      console.log("=======================================");
      
      // Verificar que haya al menos un participante seleccionado
      if (selectedIds.length === 0) {
        console.log("❌ ParticipantesEditor submitForm - No hay participantes seleccionados");
        console.log("🔍 Posibles causas:");
        console.log("  - No se han seleccionado usuarios en la interfaz");
        console.log("  - selectedIds no se está actualizando correctamente");
        console.log("  - Hay un problema con el estado del componente");
        return false;
      }
      
      // Llamar a onSave con los IDs seleccionados
      console.log("✅ Llamando onSave con selectedIds:", selectedIds);
      onSave(selectedIds);
      console.log("✅ ParticipantesEditor submitForm - onSave llamado exitosamente");
      return true;    } catch (error) {
      console.error("❌ Error en submitForm:", error);
      console.error("Stack trace:", (error as Error)?.stack);
      return false;
    }
  }, [selectedIds, onSave, data, usuarios]);
  
  // Exponer submitForm al componente padre
  useImperativeHandle(ref, () => ({ submitForm }), [submitForm]);
    // Filtrar usuarios según búsqueda y participación
  const usuariosFiltrados = useMemo(() => {
    let filtrados = usuarios;
    
    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtrados = filtrados.filter(usuario => {
        const fullName = `${usuario.nombre} ${usuario.apellidos}`.toLowerCase();
        return fullName.includes(searchLower) || 
               (usuario.email && usuario.email.toLowerCase().includes(searchLower));
      });
    }
    
    // Filtrar por participación
    switch (filtroParticipacion) {
      case 'participantes':
        filtrados = filtrados.filter(usuario => selectedIds.includes(usuario.uid));
        break;
      case 'no-participantes':
        filtrados = filtrados.filter(usuario => !selectedIds.includes(usuario.uid));
        break;
      case 'todos':
      default:
        // No filtrar por participación
        break;
    }
    
    return filtrados;
  }, [usuarios, searchTerm, filtroParticipacion, selectedIds]);
    // Ordenar usuarios filtrados
  const usuariosOrdenados = useMemo(() => {
    return [...usuariosFiltrados].sort((a, b) => {
      if (orden === 'nombre') {
        return `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`);
      } else if (orden === 'participante') {
        // Ordenar por participación primero
        const aSelected = selectedIds.includes(a.uid);
        const bSelected = selectedIds.includes(b.uid);
        
        if (aSelected !== bSelected) {
          return aSelected ? -1 : 1;
        }
        
        // Si ambos son participantes o no, ordenar por nombre
        return `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`);
      } else if (orden === 'rol') {
        // Ordenar por importancia del rol
        const getRolPriority = (uid: string) => {
          if (uid === data.creadorId) return 1; // Creador primero
          if (uid === responsableId) return 2; // Responsable actividad segundo
          if (uid === responsableMaterialId) return 3; // Responsable material tercero
          if (selectedIds.includes(uid)) return 4; // Otros participantes
          return 5; // No participantes al final
        };
        
        const aPriority = getRolPriority(a.uid);
        const bPriority = getRolPriority(b.uid);
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Si mismo rol, ordenar por nombre
        return `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`);
      }
      
      return 0;
    });
  }, [usuariosFiltrados, orden, selectedIds, data.creadorId, responsableId, responsableMaterialId]);
  
  // Calcular paginación
  const totalPages = Math.max(1, Math.ceil(usuariosOrdenados.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const usuariosPaginados = usuariosOrdenados.slice(startIndex, startIndex + itemsPerPage);
  
  // Obtener nombre del responsable para mostrar
  const nombreResponsable = useMemo(() => {
    if (loading) return 'Cargando...';
    
    const usuarioResponsable = usuarios.find(u => u.uid === responsableId);
    if (usuarioResponsable) {
      return `${usuarioResponsable.nombre} ${usuarioResponsable.apellidos}`.trim();
    }
    
    if (currentUser) {
      return userProfile?.nombre || currentUser.email?.split('@')[0] || 'Usuario actual';
    }
    
    return 'No definido';
  }, [loading, usuarios, responsableId, currentUser, userProfile]);
  
  return (
    <Box>      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Text fontWeight="medium">
            Responsable de actividad: {nombreResponsable}
          </Text>
        </Box>
        <Flex gap={2}>
          <Badge colorScheme="brand" fontSize="sm" py={1} px={2} borderRadius="md">
            {selectedIds.length} participantes
          </Badge>
          {filtroParticipacion !== 'todos' && (
            <Badge colorScheme="gray" fontSize="sm" py={1} px={2} borderRadius="md">
              {usuariosFiltrados.length} mostrados
            </Badge>
          )}
        </Flex>
      </Flex>
        {/* Input de búsqueda */}
      <Input 
        placeholder="Buscar por nombre o email..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        mb={4}
      />
      
      {/* Acciones rápidas */}
      {filtroParticipacion === 'no-participantes' && usuariosFiltrados.length > 0 && (
        <Flex mb={4} gap={2}>
          <Button 
            size="sm" 
            colorScheme="brand" 
            variant="outline"            onClick={() => {
              // Seleccionar todos los usuarios no participantes visibles
              const nuevosIds = usuariosFiltrados.map(u => u.uid);
              setSelectedIds(prev => Array.from(new Set([...prev, ...nuevosIds])));
            }}
          >
            Seleccionar todos ({usuariosFiltrados.length})
          </Button>
        </Flex>
      )}
      
      {filtroParticipacion === 'participantes' && usuariosFiltrados.length > 0 && (
        <Flex mb={4} gap={2}>
          <Button 
            size="sm" 
            colorScheme="red" 
            variant="outline"
            onClick={() => {
              // Deseleccionar todos los participantes (excepto creador y responsables)
              const protegidos = [data.creadorId, responsableId, responsableMaterialId].filter(Boolean);
              const nuevosIds = selectedIds.filter(id => protegidos.includes(id));
              setSelectedIds(nuevosIds);
            }}
          >
            Deseleccionar todos
          </Button>
        </Flex>
      )}
        {/* Opciones de filtrado, ordenación y vista */}
      <Flex direction={{ base: "column", md: "row" }} gap={4} mb={4}>
        {/* Filtro por participación */}
        <FormControl w={{ base: "100%", md: "auto" }} minW="200px">
          <FormLabel fontSize="sm">Mostrar</FormLabel>
          <Select
            value={filtroParticipacion}
            onChange={(e) => setFiltroParticipacion(e.target.value as 'todos' | 'participantes' | 'no-participantes')}
            size="sm"
          >
            <option value="todos">Todos los usuarios</option>
            <option value="participantes">Solo participantes</option>
            <option value="no-participantes">Solo no participantes</option>
          </Select>
        </FormControl>
        
        {/* Ordenación */}
        <FormControl w={{ base: "100%", md: "auto" }} minW="150px">
          <FormLabel fontSize="sm">Ordenar por</FormLabel>
          <Select
            value={orden}
            onChange={(e) => setOrden(e.target.value as 'nombre' | 'participante' | 'rol')}
            size="sm"
          >
            <option value="nombre">Nombre</option>
            <option value="participante">Participación</option>
            <option value="rol">Rol/Importancia</option>
          </Select>
        </FormControl>
        
        {/* Botón de vista */}
        <Flex align="end">
          <Button 
            size="sm" 
            leftIcon={vistaCompacta ? <FiGrid /> : <FiList />} 
            onClick={() => setVistaCompacta(!vistaCompacta)}
          >
            {vistaCompacta ? 'Vista normal' : 'Vista compacta'}
          </Button>
        </Flex>
      </Flex>
      
      {/* Lista de usuarios */}
      {loading ? (
        <Text textAlign="center" py={4}>Cargando usuarios...</Text>
      ) : vistaCompacta ? (        <Box borderWidth="1px" borderRadius="md">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th width="30px" px={2}></Th>
                <Th>Nombre</Th>
                <Th>Email</Th>
                <Th>Rol</Th>
              </Tr>
            </Thead>
            <Tbody>              {usuariosPaginados.map(usuario => (
                <UsuarioRow
                  key={usuario.uid}
                  usuario={usuario}
                  isSelected={selectedIds.includes(usuario.uid)}
                  isCreator={usuario.uid === data.creadorId}
                  isResponsable={usuario.uid === responsableId}
                  isResponsableMaterial={usuario.uid === responsableMaterialId}
                  toggleUsuario={toggleUsuario}
                  onOpenRoleModal={handleOpenRoleModal}
                />
              ))}
            </Tbody>
          </Table>
        </Box>
      ) : (
        <Grid templateColumns={{ 
          base: "1fr", 
          sm: "repeat(2, 1fr)", 
          md: "repeat(3, 1fr)", 
          lg: "repeat(4, 1fr)", 
          xl: "repeat(5, 1fr)" 
        }} gap={2}>          {usuariosPaginados.map(usuario => (
            <UsuarioCard
              key={usuario.uid}
              usuario={usuario}
              isSelected={selectedIds.includes(usuario.uid)}
              isCreator={usuario.uid === data.creadorId}
              isResponsable={usuario.uid === responsableId}
              isResponsableMaterial={usuario.uid === responsableMaterialId}
              toggleUsuario={toggleUsuario}
              onOpenRoleModal={handleOpenRoleModal}
            />
          ))}
        </Grid>
      )}
      
      {/* Paginación */}
      {usuariosOrdenados.length > itemsPerPage && (
        <Flex justify="center" mt={4} mb={4}>
          <Button 
            isDisabled={currentPage <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            mr={2}
            aria-label="Página anterior"
          >
            <FiChevronLeft />
          </Button>
          <Text alignSelf="center" mx={2}>
            Página {currentPage} de {totalPages}
          </Text>
          <Button 
            isDisabled={currentPage >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            ml={2}
            aria-label="Página siguiente"
          >
            <FiChevronRight />
          </Button>
        </Flex>
      )}
        {/* Botones de control (cuando mostrarBotones es true) */}
      {mostrarBotones && (
        <Flex justifyContent="flex-end" mt={4}>
          {onCancel && (
            <Button mr={3} onClick={onCancel} variant="ghost">
              Cancelar
            </Button>
          )}
          <Button colorScheme="brand" onClick={submitForm}>
            Guardar participantes
          </Button>
        </Flex>
      )}

      {/* Modal de selección de rol */}
      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={onRoleModalClose}
        usuario={selectedUsuario}
        currentRole={selectedUsuario ? getCurrentRole(selectedUsuario) : ''}
        onRoleChange={handleRoleChange}
      />
    </Box>
  );
});

// Nombre para debugging
ParticipantesEditor.displayName = 'ParticipantesEditor';

// Añadir displayName a componentes memoizados
UsuarioCard.displayName = 'UsuarioCard';
UsuarioRow.displayName = 'UsuarioRow';

export default ParticipantesEditor;