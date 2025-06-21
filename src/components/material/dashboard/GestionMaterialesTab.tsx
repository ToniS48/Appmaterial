import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useToast,
  Alert,
  AlertIcon,
  Progress,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  Code
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiPackage,
  FiTool,
  FiSend
} from 'react-icons/fi';
import { listarMateriales, eliminarMaterial } from '../../../services/materialService';
import { Material } from '../../../types/material';
import { Timestamp } from 'firebase/firestore';
import MaterialForm from '../MaterialForm';

// Helper function para convertir fechas
const convertirADate = (fecha: Date | Timestamp | string | undefined): Date | null => {
  if (!fecha) return null;
  if (fecha instanceof Date) return fecha;
  if (fecha instanceof Timestamp) return fecha.toDate();
  if (typeof fecha === 'string') return new Date(fecha);
  return null;
};

interface GestionMaterialesTabProps {
  onMaterialesChange?: (materiales: Material[]) => void;
}

const GestionMaterialesTab: React.FC<GestionMaterialesTabProps> = ({
  onMaterialesChange
}) => {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [materialesFiltrados, setMaterialesFiltrados] = useState<Material[]>([]);
  const [cargando, setCargando] = useState(false);
  const [termino, setTermino] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [materialSeleccionado, setMaterialSeleccionado] = useState<Material | null>(null);
  
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  
  const toast = useToast();

  // Cargar materiales
  const cargarMateriales = async (mostrarToast = true) => {
    setCargando(true);
    try {
      const data = await listarMateriales();
      setMateriales(data);
      setMaterialesFiltrados(data);
      onMaterialesChange?.(data);
      
      if (mostrarToast) {
        toast({
          title: "Materiales cargados",
          description: `Se cargaron ${data.length} materiales`,
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error cargando materiales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los materiales",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCargando(false);
    }
  };

  // Filtrar materiales
  useEffect(() => {
    let filtrados = materiales;

    // Filtro por término de búsqueda
    if (termino) {
      filtrados = filtrados.filter(material =>
        material.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        material.id.toLowerCase().includes(termino.toLowerCase()) ||
        (material.codigo && material.codigo.toLowerCase().includes(termino.toLowerCase()))
      );
    }

    // Filtro por estado
    if (filtroEstado) {
      filtrados = filtrados.filter(material => material.estado === filtroEstado);
    }

    // Filtro por tipo
    if (filtroTipo) {
      filtrados = filtrados.filter(material => material.tipo === filtroTipo);
    }

    setMaterialesFiltrados(filtrados);
  }, [materiales, termino, filtroEstado, filtroTipo]);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarMateriales(false);
  }, []);

  const handleCrearMaterial = () => {
    setMaterialSeleccionado(null);
    onFormOpen();
  };

  const handleEditarMaterial = (material: Material) => {
    setMaterialSeleccionado(material);
    onFormOpen();
  };

  const handleEliminarMaterial = (material: Material) => {
    setMaterialSeleccionado(material);
    onDeleteOpen();
  };

  const handleVerDetalle = (material: Material) => {
    setMaterialSeleccionado(material);
    onDetailOpen();
  };

  const confirmarEliminar = async () => {
    if (!materialSeleccionado) return;

    try {
      await eliminarMaterial(materialSeleccionado.id);
      toast({
        title: "Material eliminado",
        description: "El material se eliminó correctamente",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      onDeleteClose();
      cargarMateriales(false);
    } catch (error) {
      console.error('Error eliminando material:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el material",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleMaterialGuardado = () => {
    onFormClose();
    cargarMateriales(false);
  };

  const formatearEstado = (estado: string) => {
    const estados: { [key: string]: string } = {
      'disponible': 'Disponible',
      'prestado': 'Prestado',
      'mantenimiento': 'Mantenimiento',
      'baja': 'Baja',
      'perdido': 'Perdido',
      'revision': 'Revisión',
      'retirado': 'Retirado'
    };
    return estados[estado] || estado;
  };

  const formatearTipo = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      'cuerda': 'Cuerda',
      'anclaje': 'Anclaje',
      'varios': 'Varios'
    };
    return tipos[tipo] || tipo;
  };

  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'disponible': return 'green';
      case 'prestado': return 'blue';
      case 'mantenimiento': return 'yellow';
      case 'baja': return 'red';
      case 'perdido': return 'red';
      case 'revision': return 'orange';
      case 'retirado': return 'gray';
      default: return 'gray';
    }
  };

  // Estadísticas rápidas
  const estadisticas = {
    total: materiales.length,
    disponibles: materiales.filter(m => m.estado === 'disponible').length,
    prestados: materiales.filter(m => m.estado === 'prestado').length,
    mantenimiento: materiales.filter(m => m.estado === 'mantenimiento').length
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          📦 Gestión Completa de Materiales
        </Text>
        <Text fontSize="sm" color="gray.600">
          Administra todo el inventario de material deportivo
        </Text>
      </Box>

      {/* Estadísticas rápidas */}
      <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={4}>
        <Stat>
          <StatLabel>Total</StatLabel>
          <StatNumber>{estadisticas.total}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Disponibles</StatLabel>
          <StatNumber color="green.500">{estadisticas.disponibles}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Prestados</StatLabel>
          <StatNumber color="blue.500">{estadisticas.prestados}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Mantenimiento</StatLabel>
          <StatNumber color="orange.500">{estadisticas.mantenimiento}</StatNumber>
        </Stat>
      </Grid>

      {/* Controles */}
      <Card>
        <CardBody>
          <Grid templateColumns={{ base: "1fr", md: "2fr 1fr 1fr 1fr" }} gap={4} alignItems="end">
            <Box>
              <Text fontSize="sm" mb={2}>Buscar materiales</Text>              <Input
                placeholder="Buscar por nombre, ID o código..."
                value={termino}
                onChange={(e) => setTermino(e.target.value)}
              />
            </Box>
            
            <Box>
              <Text fontSize="sm" mb={2}>Estado</Text>
              <Select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                placeholder="Todos los estados"
              >
                <option value="disponible">Disponible</option>
                <option value="prestado">Prestado</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="baja">Baja</option>
                <option value="perdido">Perdido</option>
                <option value="revision">Revisión</option>
                <option value="retirado">Retirado</option>
              </Select>
            </Box>
            
            <Box>
              <Text fontSize="sm" mb={2}>Tipo</Text>
              <Select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                placeholder="Todos los tipos"
              >
                <option value="cuerda">Cuerda</option>
                <option value="anclaje">Anclaje</option>
                <option value="varios">Varios</option>
              </Select>
            </Box>
            
            <HStack>
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                onClick={handleCrearMaterial}
              >
                Nuevo Material
              </Button>
              <Tooltip label="Actualizar lista">
                <IconButton
                  aria-label="Actualizar"
                  icon={<FiRefreshCw />}
                  onClick={() => cargarMateriales()}
                  isLoading={cargando}
                />
              </Tooltip>
            </HStack>
          </Grid>
        </CardBody>
      </Card>

      {/* Lista de materiales */}
      <Card>
        <CardBody>
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="bold">
              Materiales ({materialesFiltrados.length})
            </Text>
            {termino || filtroEstado || filtroTipo ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setTermino('');
                  setFiltroEstado('');
                  setFiltroTipo('');
                }}
              >
                Limpiar filtros
              </Button>
            ) : null}
          </HStack>

          {cargando ? (
            <VStack spacing={4}>
              <Progress size="xs" isIndeterminate width="100%" />
              <Text>Cargando materiales...</Text>
            </VStack>
          ) : materialesFiltrados.length === 0 ? (
            <Alert status="info">
              <AlertIcon />
              <Text>
                {materiales.length === 0 
                  ? 'No hay materiales registrados' 
                  : 'No se encontraron materiales con los filtros aplicados'
                }
              </Text>
            </Alert>
          ) : (
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Material</Th>
                    <Th>Tipo</Th>
                    <Th>Estado</Th>
                    <Th>Código</Th>
                    <Th>Fecha Adquisición</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {materialesFiltrados.map((material) => (
                    <Tr key={material.id}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{material.nombre}</Text>
                          <Code fontSize="xs">{material.id}</Code>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue">
                          {formatearTipo(material.tipo)}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getColorEstado(material.estado)}>
                          {formatearEstado(material.estado)}
                        </Badge>
                      </Td>
                      <Td>
                        {material.codigo || <Text color="gray.400">Sin código</Text>}
                      </Td>                      <Td>
                        {material.fechaAdquisicion ? (
                          <Text fontSize="sm">
                            {convertirADate(material.fechaAdquisicion)?.toLocaleDateString() || 'Fecha inválida'}
                          </Text>
                        ) : (
                          <Text color="gray.400" fontSize="sm">Sin fecha</Text>
                        )}
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <Tooltip label="Ver detalles">
                            <IconButton
                              aria-label="Ver"
                              icon={<FiEye />}
                              size="xs"
                              variant="outline"
                              onClick={() => handleVerDetalle(material)}
                            />
                          </Tooltip>
                          <Tooltip label="Editar">
                            <IconButton
                              aria-label="Editar"
                              icon={<FiEdit />}
                              size="xs"
                              colorScheme="blue"
                              variant="outline"
                              onClick={() => handleEditarMaterial(material)}
                            />
                          </Tooltip>
                          <Tooltip label="Eliminar">
                            <IconButton
                              aria-label="Eliminar"
                              icon={<FiTrash2 />}
                              size="xs"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => handleEliminarMaterial(material)}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Modal de formulario */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {materialSeleccionado ? 'Editar Material' : 'Nuevo Material'}
          </ModalHeader>
          <ModalCloseButton />          <ModalBody>
            <MaterialForm
              material={materialSeleccionado}
              onSuccess={handleMaterialGuardado}
              onCancel={onFormClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar Eliminación</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              ¿Estás seguro de que deseas eliminar el material{' '}
              <strong>{materialSeleccionado?.nombre}</strong>?
            </Text>
            <Text fontSize="sm" color="gray.600" mt={2}>
              Esta acción no se puede deshacer.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={confirmarEliminar}>
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de detalles */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalles del Material</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {materialSeleccionado && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" fontSize="lg">
                    {materialSeleccionado.nombre}
                  </Text>
                  <Code>{materialSeleccionado.id}</Code>
                </Box>
                
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Tipo</Text>
                    <Badge colorScheme="blue">
                      {formatearTipo(materialSeleccionado.tipo)}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Estado</Text>
                    <Badge colorScheme={getColorEstado(materialSeleccionado.estado)}>
                      {formatearEstado(materialSeleccionado.estado)}
                    </Badge>
                  </Box>
                </Grid>

                {materialSeleccionado.observaciones && (
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>Observaciones</Text>
                    <Text>{materialSeleccionado.observaciones}</Text>
                  </Box>
                )}

                {materialSeleccionado.precio && (
                  <Box>
                    <Text fontSize="sm" color="gray.600">Precio</Text>
                    <Text fontWeight="bold">${materialSeleccionado.precio}</Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onDetailClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default GestionMaterialesTab;
