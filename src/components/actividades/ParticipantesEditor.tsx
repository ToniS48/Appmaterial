import React, { useState, useEffect, useRef, useMemo, useImperativeHandle, useCallback } from 'react';
import {
  Box, Button, Stack, Text, Grid, GridItem, Flex,
  Heading, Card, CardBody, Checkbox, Input, InputGroup, InputLeftElement, Divider,
  useDisclosure, useColorModeValue, FormControl, FormLabel, Select, HStack, Badge,
  Table, Thead, Tbody, Tr, Th, Td, Radio, RadioGroup, useToast
} from '@chakra-ui/react';
import { listarUsuarios } from '../../services/usuarioService';
import { Usuario } from '../../types/usuario';
import { Actividad } from '../../types/actividad';
import { ParticipantesEditorProps } from '../../types/editor';
import { FiGrid, FiList, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

// Definir interfaces para props de componentes
interface UsuarioCardProps {
  usuario: Usuario;
  isSelected: boolean;
  isCreator: boolean;
  isResponsable: boolean;
  toggleUsuario: (id: string) => void;
}

interface UsuarioRowProps {
  usuario: Usuario;
  isSelected: boolean;
  toggleUsuario: (id: string) => void;
}

// Componente memoizado para tarjeta de usuario
const UsuarioCard = React.memo<UsuarioCardProps>(({ 
  usuario, 
  isSelected, 
  isCreator, 
  isResponsable, 
  toggleUsuario 
}) => {
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  
  return (
    <Card variant="outline" bg={cardBg} borderColor={borderColor} size="sm">
      <CardBody py={2} px={3}>
        <Checkbox 
          isChecked={isSelected} 
          onChange={() => toggleUsuario(usuario.uid)}
          size="sm"
        >
          <Text fontSize="sm" noOfLines={1}>
            {usuario.nombre} {usuario.apellidos}
          </Text>
        </Checkbox>
        {isCreator && <Badge colorScheme="purple" ml={1}>Creador</Badge>}
        {isResponsable && <Badge colorScheme="red" ml={1}>Responsable</Badge>}
      </CardBody>
    </Card>
  );
});

// Componente memoizado para fila de tabla
const UsuarioRow = React.memo<UsuarioRowProps>(({ 
  usuario, 
  isSelected, 
  toggleUsuario 
}) => {
  return (
    <Tr>
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
    </Tr>
  );
});

const ParticipantesEditor = React.forwardRef<
  { submitForm: () => void },
  ParticipantesEditorProps
>(({ data, onSave, onResponsablesChange, onCancel, mostrarBotones = true }, ref) => {
  const { currentUser, userProfile } = useAuth();
  const toast = useToast();
  
  // Estados principales
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
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
  const [orden, setOrden] = useState<'nombre' | 'participante'>('nombre');
  const [vistaCompacta, setVistaCompacta] = useState(false);
  
  // Estilos
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

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
  }, [currentUser?.uid]);
  
  // Asegurar que los IDs requeridos estén incluidos
  useEffect(() => {
    if (!didInitializeCreator.current) return;
    
    const idsRequeridos = [
      data.creadorId,
      responsableId,
      responsableMaterialId
    ].filter(Boolean);
    
    // Verificar si hay algo que actualizar
    const idsAActualizar = idsRequeridos.filter(id => id && !selectedIds.includes(id));
    
    if (idsAActualizar.length > 0) {
      setSelectedIds(prev => [...prev, ...idsAActualizar]);
    }
  }, [data.creadorId, responsableId, responsableMaterialId, selectedIds]);
  
  // Manejar selección/deselección de usuarios
  const toggleUsuario = useCallback((id: string) => {
    // No permitir deseleccionar creador o responsables
    if (selectedIds.includes(id)) {
      if (id === data.creadorId || id === responsableId || id === responsableMaterialId) {
        return;
      }
      setSelectedIds(prev => prev.filter(prevId => prevId !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
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
  const handleRolChange = useCallback((uid: string, rol: string) => {
    // Asegurar que el usuario está seleccionado
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
        }
        break;
    }
  }, [selectedIds, responsableId, responsableMaterialId, data.creadorId, onResponsablesChange]);
  
  // Función de submit
  const submitForm = useCallback(() => {
    try {
      // Simplemente obtenemos los IDs seleccionados y dejamos que la función 
      // centralizada se encargue de garantizar que todos los IDs necesarios estén incluidos
      onSave(selectedIds);
      return true;
    } catch (error) {
      console.error("Error en submitForm:", error);
      return false;
    }
  }, [selectedIds, onSave]);
  
  // Exponer submitForm al componente padre
  useImperativeHandle(ref, () => ({ submitForm }), [submitForm]);
  
  // Filtrar usuarios según búsqueda
  const usuariosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return usuarios;
    
    const searchLower = searchTerm.toLowerCase();
    return usuarios.filter(usuario => {
      const fullName = `${usuario.nombre} ${usuario.apellidos}`.toLowerCase();
      return fullName.includes(searchLower) || 
             (usuario.email && usuario.email.toLowerCase().includes(searchLower));
    });
  }, [usuarios, searchTerm]);
  
  // Ordenar usuarios filtrados
  const usuariosOrdenados = useMemo(() => {
    return [...usuariosFiltrados].sort((a, b) => {
      if (orden === 'nombre') {
        return `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`);
      } else {
        // Ordenar por participación primero
        const aSelected = selectedIds.includes(a.uid);
        const bSelected = selectedIds.includes(b.uid);
        
        if (aSelected !== bSelected) {
          return aSelected ? -1 : 1;
        }
        
        // Si ambos son participantes o no, ordenar por nombre
        return `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`);
      }
    });
  }, [usuariosFiltrados, orden, selectedIds]);
  
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
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Text fontWeight="medium">
            Responsable de actividad: {nombreResponsable}
          </Text>
        </Box>
        <Badge colorScheme="brand" fontSize="md" py={1} px={2} borderRadius="md">
          {selectedIds.length} seleccionados
        </Badge>
      </Flex>
      
      {/* Input de búsqueda */}
      <Input 
        placeholder="Buscar por nombre o email..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        mb={4}
      />
      
      {/* Opciones de ordenación y vista */}
      <Flex justify="space-between" align="center" mb={4}>
        <FormControl w="auto">
          <FormLabel fontSize="sm">Ordenar por</FormLabel>
          <Select
            value={orden}
            onChange={(e) => setOrden(e.target.value as 'nombre' | 'participante')}
            size="sm"
          >
            <option value="nombre">Nombre</option>
            <option value="participante">Participante</option>
          </Select>
        </FormControl>
        
        <Button 
          size="sm" 
          leftIcon={vistaCompacta ? <FiGrid /> : <FiList />} 
          onClick={() => setVistaCompacta(!vistaCompacta)}
        >
          {vistaCompacta ? 'Vista normal' : 'Vista compacta'}
        </Button>
      </Flex>
      
      {/* Lista de usuarios */}
      {loading ? (
        <Text textAlign="center" py={4}>Cargando usuarios...</Text>
      ) : vistaCompacta ? (
        <Box borderWidth="1px" borderRadius="md">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th width="30px" px={2}></Th>
                <Th>Nombre</Th>
                <Th>Email</Th>
              </Tr>
            </Thead>
            <Tbody>
              {usuariosPaginados.map(usuario => (
                <UsuarioRow
                  key={usuario.uid}
                  usuario={usuario}
                  isSelected={selectedIds.includes(usuario.uid)}
                  toggleUsuario={toggleUsuario}
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
        }} gap={2}>
          {usuariosPaginados.map(usuario => (
            <UsuarioCard
              key={usuario.uid}
              usuario={usuario}
              isSelected={selectedIds.includes(usuario.uid)}
              isCreator={usuario.uid === data.creadorId}
              isResponsable={usuario.uid === responsableId}
              toggleUsuario={toggleUsuario}
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
    </Box>
  );
});

// Nombre para debugging
ParticipantesEditor.displayName = 'ParticipantesEditor';

// Añadir displayName a componentes memoizados
UsuarioCard.displayName = 'UsuarioCard';
UsuarioRow.displayName = 'UsuarioRow';

export default ParticipantesEditor;