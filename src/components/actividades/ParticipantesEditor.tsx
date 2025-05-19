import React, { useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import {
  Box, Button, Stack, Text, Grid, GridItem, Flex,
  Heading, Card, CardBody, Checkbox, Input, InputGroup, InputLeftElement, Divider,
  useDisclosure, useColorModeValue, FormControl, FormLabel, Select, HStack, Badge,
  Table, Thead, Tbody, Tr, Th, Td
} from '@chakra-ui/react';
import { listarUsuarios } from '../../services/usuarioService';
import { Usuario } from '../../types/usuario';
import { Actividad } from '../../types/actividad';
import { ParticipantesEditorProps } from '../../types/editor';
import { FiGrid, FiList, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const ParticipantesEditor = forwardRef<
  { submitForm: () => void },
  ParticipantesEditorProps
>(({ data, onSave, onCancel, mostrarBotones = true }, ref) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const participantes = data.participanteIds || [];
    // Asegurar que el creador esté incluido si existe
    if (data.creadorId && !participantes.includes(data.creadorId)) {
      return [...participantes, data.creadorId];
    }
    return participantes;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(30); // Aumentar de 20 a 30 elementos por página
  const [orden, setOrden] = useState<'nombre' | 'participante'>('nombre');
  const [vistaCompacta, setVistaCompacta] = useState(false);
  
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("white", "gray.700");
  
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setLoading(true);
        
        // Primero cargar todos los usuarios sin parámetros
        const usuariosData = await listarUsuarios();
        setUsuarios(usuariosData.filter(u => u.activo));
        
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsuarios();
  }, []);
  
  const toggleUsuario = (usuarioId: string) => {
    if (selectedIds.includes(usuarioId)) {
      setSelectedIds(selectedIds.filter(id => id !== usuarioId));
    } else {
      setSelectedIds([...selectedIds, usuarioId]);
    }
  };
  
  const handleSubmit = () => {
    onSave(selectedIds);
  };

  // Exponer el método submitForm usando useImperativeHandle
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      console.log("ParticipantesEditor - submitForm llamado, selectedIds:", selectedIds);
      // Asegurar que siempre haya al menos el usuario actual como participante
      const idsToSave = selectedIds.length > 0 ? 
        selectedIds : 
        (data.creadorId ? [data.creadorId] : []);
      
      onSave(idsToSave);
    }
  }));
  
  // Función de filtrado combinada
  const usuariosFiltrados = useMemo(() => {
    return usuarios
      .filter(usuario => {
        // Filtro por texto (nombre o email)
        const matchesText = searchTerm ? 
          `${usuario.nombre} ${usuario.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
          : true;
          
        return matchesText;
      })
      .sort((a, b) => {
        if (orden === 'nombre') {
          return `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`);
        } else {
          // Ordenar por participante (primero los seleccionados)
          const aEsParticipante = selectedIds.includes(a.uid);
          const bEsParticipante = selectedIds.includes(b.uid);
          
          if (aEsParticipante && !bEsParticipante) return -1;
          if (!aEsParticipante && bEsParticipante) return 1;
          
          // Si ambos son o no son participantes, ordenar por nombre
          return `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`);
        }
      });
  }, [usuarios, searchTerm, orden, selectedIds]); // Añadir selectedIds a las dependencias

  const totalPages = Math.ceil(usuariosFiltrados.length / itemsPerPage);

  // Calcular usuarios a mostrar en la página current
  const usuariosPaginados = usuariosFiltrados.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  // Función para el color del badge según rol
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
  
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text>Selecciona los participantes de esta actividad:</Text>
        <Badge colorScheme="brand" fontSize="md" py={1} px={2} borderRadius="md">
          {selectedIds.length} seleccionados
        </Badge>
      </Flex>
      
      {/* Input de búsqueda */}
      <Input 
        placeholder="Buscar por nombre o email..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        bg={inputBg}
        borderColor={borderColor}
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
      
      {/* Lista de usuarios con checkboxes */}
      <Box>
        {vistaCompacta ? (
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
                  <Tr key={usuario.uid}>
                    <Td px={2}>
                      <Checkbox 
                        isChecked={selectedIds.includes(usuario.uid)}
                        onChange={() => toggleUsuario(usuario.uid)}
                        colorScheme="brand"
                        size="sm"
                      />
                    </Td>
                    <Td py={1} fontSize="sm">{usuario.nombre} {usuario.apellidos}</Td>
                    <Td py={1} fontSize="sm">{usuario.email}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        ) : (
          // Modificar la vista de tarjetas para hacerla más compacta
          <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)", xl: "repeat(5, 1fr)" }} gap={2}>
            {usuariosPaginados.map(usuario => (
              <GridItem key={usuario.uid}>
                <Card variant="outline" bg={cardBg} borderColor={borderColor} size="sm">
                  <CardBody py={2} px={3}>
                    <Checkbox 
                      isChecked={selectedIds.includes(usuario.uid)} 
                      onChange={() => toggleUsuario(usuario.uid)}
                      size="sm"
                    >
                      <Text fontSize="sm" noOfLines={1}>
                        {usuario.nombre} {usuario.apellidos}
                      </Text>
                    </Checkbox>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </Grid>
        )}
        
        {/* Control de paginación */}
        <Flex justify="center" mt={4} mb={4}>
          <Button 
            isDisabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            mr={2}
            aria-label="Página anterior"
          >
            <FiChevronLeft />
          </Button>
          <Text alignSelf="center" mx={2}>
            Página {page} de {totalPages}
          </Text>
          <Button 
            isDisabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            ml={2}
            aria-label="Página siguiente"
          >
            <FiChevronRight />
          </Button>
        </Flex>
      </Box>
      
      {/* Renderizado condicional de los botones */}
      {mostrarBotones && (
        <Stack direction="row" spacing={4} justify="flex-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button colorScheme="brand" onClick={handleSubmit}>
            Guardar Participantes ({selectedIds.length})
          </Button>
        </Stack>
      )}
    </Box>
  );
});

// Agregar displayName para debugging
ParticipantesEditor.displayName = 'ParticipantesEditor';

export default ParticipantesEditor;