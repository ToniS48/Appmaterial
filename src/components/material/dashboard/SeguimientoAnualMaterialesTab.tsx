/**
 * SeguimientoAnualMaterialesTab - Pestaña de seguimiento anual unificado
 * 
 * Combina la gestión de materiales con seguimiento anual, manteniendo
 * el nombre, dirección y card del primer componente de gestión.
 * 
 * Funcionalidades:
 * - CRUD completo de materiales
 * - Seguimiento anual por fechas
 * - Filtros avanzados por año y tipo
 * - Estadísticas anuales
 * - Historial de cambios
 * 
 * @author Sistema de Gestión de Materiales
 * @version 1.0 - Implementación inicial
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
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
  Heading,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Circle,
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
  FiSend,
  FiCalendar,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiClock,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { Material } from '../../../types/material';
import { DashboardMaterialesState } from './types';
import { listarMateriales, eliminarMaterial } from '../../../services/materialService';
import MaterialForm from '../MaterialForm';

interface SeguimientoAnualMaterialesTabProps {
  estadisticas: DashboardMaterialesState['estadisticas'];
  materiales: Material[];
  cargando: boolean;
  onCargarDatos: () => void;
  añoSeleccionado: number;
  userProfile: any;
}

// Helper function para convertir Timestamp a Date de manera segura
const convertirTimestampADate = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return null;
};

const SeguimientoAnualMaterialesTab: React.FC<SeguimientoAnualMaterialesTabProps> = ({
  estadisticas,
  materiales,
  cargando,
  onCargarDatos,
  añoSeleccionado,
  userProfile
}) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Estados locales
  const [materialesFiltrados, setMaterialesFiltrados] = useState<Material[]>([]);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroAño, setFiltroAño] = useState(añoSeleccionado);
  const [materialEditando, setMaterialEditando] = useState<Material | null>(null);
  const [vistaActual, setVistaActual] = useState<'tabla' | 'resumen' | 'estadisticas'>('resumen');
  const [cargandoLocal, setCargandoLocal] = useState(false);

  // Filtrar materiales por año y otros criterios
  useEffect(() => {
    let resultado = materiales;

    // Filtro por año (basado en fecha de adquisición)
    if (filtroAño) {
      resultado = resultado.filter(material => {
        const fechaAdq = convertirTimestampADate(material.fechaAdquisicion);
        return fechaAdq ? fechaAdq.getFullYear() === filtroAño : false;
      });
    }

    // Filtro por texto (nombre o código)
    if (filtroTexto) {
      resultado = resultado.filter(material => 
        material.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        (material.codigo && material.codigo.toLowerCase().includes(filtroTexto.toLowerCase()))
      );
    }

    // Filtro por tipo
    if (filtroTipo !== 'todos') {
      resultado = resultado.filter(material => material.tipo === filtroTipo);
    }

    // Filtro por estado
    if (filtroEstado !== 'todos') {
      resultado = resultado.filter(material => material.estado === filtroEstado);
    }

    setMaterialesFiltrados(resultado);
  }, [materiales, filtroTexto, filtroTipo, filtroEstado, filtroAño]);

  // Estadísticas del año seleccionado
  const estadisticasAño = useMemo(() => {
    const materialesAño = materiales.filter(material => {
      const fechaAdq = convertirTimestampADate(material.fechaAdquisicion);
      return fechaAdq ? fechaAdq.getFullYear() === filtroAño : false;
    });

    return {
      totalMateriales: materialesAño.length,
      disponibles: materialesAño.filter(m => m.estado === 'disponible').length,
      prestados: materialesAño.filter(m => m.estado === 'prestado').length,
      mantenimiento: materialesAño.filter(m => m.estado === 'mantenimiento').length,
      valorTotal: materialesAño.reduce((sum, m) => sum + (m.precio || 0), 0),
      cuerdas: materialesAño.filter(m => m.tipo === 'cuerda').length,
      anclajes: materialesAño.filter(m => m.tipo === 'anclaje').length,
      varios: materialesAño.filter(m => m.tipo === 'varios').length,
    };
  }, [materiales, filtroAño]);

  // Manejar eliminación
  const handleEliminar = async (material: Material) => {
    if (!window.confirm(`¿Estás seguro de eliminar el material "${material.nombre}"?`)) {
      return;
    }

    try {
      setCargandoLocal(true);
      await eliminarMaterial(material.id);
      
      toast({
        title: 'Material eliminado',
        description: `El material "${material.nombre}" ha sido eliminado exitosamente.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onCargarDatos();
    } catch (error) {
      console.error('Error al eliminar material:', error);
      toast({
        title: 'Error al eliminar',
        description: 'No se pudo eliminar el material. Inténtalo de nuevo.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCargandoLocal(false);
    }
  };

  // Manejar edición
  const handleEditar = (material: Material) => {
    setMaterialEditando(material);
    onOpen();
  };

  // Obtener color del estado
  const getEstadoColor = (estado: string) => {
    const colores = {
      'disponible': 'green',
      'prestado': 'blue',
      'mantenimiento': 'orange',
      'baja': 'red',
      'perdido': 'red',
      'revision': 'yellow',
      'retirado': 'gray'
    };
    return colores[estado as keyof typeof colores] || 'gray';
  };

  // Renderizar estadísticas del año
  const renderEstadisticasAño = () => (
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
      <Stat bg="white" p={4} borderRadius="md" shadow="sm" border="1px" borderColor="gray.200">
        <StatLabel>Total {filtroAño}</StatLabel>
        <StatNumber color="blue.500">{estadisticasAño.totalMateriales}</StatNumber>
      </Stat>
      <Stat bg="white" p={4} borderRadius="md" shadow="sm" border="1px" borderColor="gray.200">
        <StatLabel>Disponibles</StatLabel>
        <StatNumber color="green.500">{estadisticasAño.disponibles}</StatNumber>
      </Stat>
      <Stat bg="white" p={4} borderRadius="md" shadow="sm" border="1px" borderColor="gray.200">
        <StatLabel>En Uso</StatLabel>
        <StatNumber color="blue.500">{estadisticasAño.prestados}</StatNumber>
      </Stat>
      <Stat bg="white" p={4} borderRadius="md" shadow="sm" border="1px" borderColor="gray.200">
        <StatLabel>Valor Total</StatLabel>
        <StatNumber color="purple.500">€{estadisticasAño.valorTotal.toFixed(2)}</StatNumber>
      </Stat>
    </SimpleGrid>
  );

  // Renderizar filtros
  const renderFiltros = () => (
    <Card mb={6}>
      <CardBody>
        <VStack spacing={4}>
          <HStack justify="space-between" w="full" wrap="wrap" spacing={4}>
            <Heading size="md" color="gray.700">
              <HStack>
                <FiPackage />
                <Text>Seguimiento Anual de Materiales</Text>
              </HStack>
            </Heading>
            
            <HStack spacing={2}>
              <IconButton
                aria-label="Año anterior"
                icon={<FiChevronLeft />}
                onClick={() => setFiltroAño(filtroAño - 1)}
                size="sm"
                variant="outline"
              />
              <Text fontWeight="bold" minW="60px" textAlign="center">{filtroAño}</Text>
              <IconButton
                aria-label="Año siguiente"
                icon={<FiChevronRight />}
                onClick={() => setFiltroAño(filtroAño + 1)}
                size="sm"
                variant="outline"
              />
              <Divider orientation="vertical" h="24px" />
              <Button
                leftIcon={<FiPlus />}
                colorScheme="purple"
                onClick={() => {
                  setMaterialEditando(null);
                  onOpen();
                }}
                size="sm"
              >
                Nuevo Material
              </Button>
            </HStack>
          </HStack>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4} w="full">            <GridItem>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                />
              </InputGroup>
            </GridItem>
            <GridItem>
              <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="todos">Todos los tipos</option>
                <option value="cuerda">Cuerdas</option>
                <option value="anclaje">Anclajes</option>
                <option value="varios">Varios</option>
              </Select>
            </GridItem>
            <GridItem>
              <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="todos">Todos los estados</option>
                <option value="disponible">Disponible</option>
                <option value="prestado">Prestado</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="baja">Baja</option>
                <option value="perdido">Perdido</option>
                <option value="revision">Revisión</option>
                <option value="retirado">Retirado</option>
              </Select>
            </GridItem>
            <GridItem>
              <HStack>
                <Button
                  leftIcon={<FiRefreshCw />}
                  onClick={onCargarDatos}
                  isLoading={cargando}
                  size="sm"
                  variant="outline"
                >
                  Actualizar
                </Button>
              </HStack>
            </GridItem>
          </Grid>
        </VStack>
      </CardBody>
    </Card>
  );

  // Renderizar tabla de materiales
  const renderTablaMateriales = () => (
    <Card>
      <CardBody>
        {materialesFiltrados.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            No se encontraron materiales para el año {filtroAño} con los filtros aplicados.
          </Alert>
        ) : (
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Nombre</Th>
                <Th>Tipo</Th>
                <Th>Estado</Th>
                <Th>Fecha Adquisición</Th>
                <Th>Precio</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {materialesFiltrados.map((material) => {
                const fechaAdq = convertirTimestampADate(material.fechaAdquisicion);
                
                return (
                  <Tr key={material.id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">{material.nombre}</Text>
                        {material.codigo && (
                          <Code fontSize="xs" colorScheme="gray">{material.codigo}</Code>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <Badge colorScheme="blue" variant="subtle">
                        {material.tipo}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getEstadoColor(material.estado)}>
                        {material.estado}
                      </Badge>
                    </Td>
                    <Td>
                      {fechaAdq ? fechaAdq.toLocaleDateString('es-ES') : '-'}
                    </Td>
                    <Td>
                      {material.precio ? `€${material.precio.toFixed(2)}` : '-'}
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <Tooltip label="Editar">
                          <IconButton
                            aria-label="Editar"
                            icon={<FiEdit />}
                            size="sm"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => handleEditar(material)}
                          />
                        </Tooltip>
                        <Tooltip label="Eliminar">
                          <IconButton
                            aria-label="Eliminar"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleEliminar(material)}
                            isLoading={cargandoLocal}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );

  return (
    <VStack spacing={6} align="stretch">
      {renderFiltros()}
      {renderEstadisticasAño()}
      
      <Tabs variant="enclosed" index={vistaActual === 'resumen' ? 0 : 1}>
        <TabList>
          <Tab onClick={() => setVistaActual('resumen')}>
            <HStack>
              <FiActivity />
              <Text>Resumen Anual</Text>
            </HStack>
          </Tab>
          <Tab onClick={() => setVistaActual('tabla')}>
            <HStack>
              <FiPackage />
              <Text>Inventario Detallado</Text>
            </HStack>
          </Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <VStack spacing={4}>
              {renderEstadisticasAño()}
              <Text color="gray.600" textAlign="center">
                Mostrando {materialesFiltrados.length} materiales del año {filtroAño}
              </Text>
            </VStack>
          </TabPanel>
          <TabPanel>
            {renderTablaMateriales()}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal para agregar/editar material */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>          <ModalHeader>
            {materialEditando ? 'Editar Material' : 'Agregar Nuevo Material'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <MaterialForm
              material={materialEditando}
              onSuccess={() => {
                onClose();
                onCargarDatos();
                setMaterialEditando(null);
              }}
              onCancel={() => {
                onClose();
                setMaterialEditando(null);
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default SeguimientoAnualMaterialesTab;
