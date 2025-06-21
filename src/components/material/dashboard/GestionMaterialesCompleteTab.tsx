/**
 * GestionMaterialesCompleteTab - Pestaña completa de gestión de materiales
 * 
 * Integra la funcionalidad completa del GestionMaterialPage como pestaña
 * del dashboard, manteniendo todas las características originales:
 * - CRUD completo de materiales
 * - Filtros y búsqueda
 * - Exportación e importación
 * - Códigos QR
 * - Gestión de estados
 * 
 * @author Sistema de Gestión de Materiales
 * @version 1.0 - Implementación inicial basada en GestionMaterialPage
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
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
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  Spinner,
  Card,
  CardBody,
  useToast,
  VStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  ChevronDownIcon, 
  WarningIcon, 
  SearchIcon 
} from '@chakra-ui/icons';
import { FiBox, FiPrinter, FiDownload, FiUpload, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { listarMateriales, eliminarMaterial } from '../../../services/materialService';
import { materialService } from '../../../services/MaterialServiceRefactored';
import { PrestamoRepository } from '../../../repositories/PrestamoRepository';
import MaterialForm from '../MaterialForm';
import MaterialExportManager from '../../admin/MaterialExportManager';
import MaterialImportManager from '../../admin/MaterialImportManager';
import QRActionsMenu from '../QRActionsMenu';
import messages from '../../../constants/messages';
import { useOptimizedClickHandler, useOptimizedInputHandler } from '../../../utils/eventOptimizer';
import { deferCallback } from '../../../utils/performanceUtils';

// Estados de material con colores
const ESTADOS_MATERIAL = [
  { value: 'disponible', label: 'Disponible', color: 'green' },
  { value: 'prestado', label: 'Prestado', color: 'orange' },
  { value: 'mantenimiento', label: 'Mantenimiento', color: 'blue' },
  { value: 'baja', label: 'Baja', color: 'gray' },
  { value: 'perdido', label: 'Perdido', color: 'red' }
];

interface GestionMaterialesCompleteTabProps {
  userProfile: any;
  cargando?: boolean;
  onCargarDatos?: () => void;
}

const GestionMaterialesCompleteTab: React.FC<GestionMaterialesCompleteTabProps> = ({
  userProfile,
  cargando: cargandoExterno = false,
  onCargarDatos
}) => {
  const toast = useToast();
  const { userProfile: currentUser } = useAuth();
  
  // Estados
  const [materiales, setMateriales] = useState<any[]>([]);
  const [cantidadesPrestadas, setCantidadesPrestadas] = useState<{ [key: string]: number }>({});
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [materialToDelete, setMaterialToDelete] = useState<any>(null);
  
  // Modales
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
  
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Función optimizada para cargar la lista de materiales
  const cargarMateriales = useCallback(async () => {
    console.log('🔧 GestionMaterialesCompleteTab - Iniciando carga de materiales');
    return deferCallback(async () => {
      try {
        setIsLoading(true);
        
        const prestamoRepository = new PrestamoRepository();
        
        // Cargar TODOS los materiales sin filtros backend para filtrar localmente
        const materialesData = await listarMateriales();
        console.log('🔧 GestionMaterialesCompleteTab - Materiales cargados:', materialesData.length);
        
        setMateriales(materialesData);

        // Cargar cantidades prestadas para todos los materiales
        const cantidadesMap: { [key: string]: number } = {};
          for (const material of materialesData) {
          try {
            const cantidadPrestada = await prestamoRepository.getCantidadPrestada(material.id);
            cantidadesMap[material.id] = cantidadPrestada || 0;
          } catch (error) {
            console.error(`Error al obtener cantidad prestada para material ${material.id}:`, error);
            cantidadesMap[material.id] = 0;
          }
        }
        
        setCantidadesPrestadas(cantidadesMap);
        
        if (onCargarDatos) {
          onCargarDatos();
        }
        
      } catch (error) {
        console.error('Error al cargar materiales:', error);
        toast({
          title: 'Error al cargar materiales',
          description: 'No se pudieron cargar los materiales.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    });
  }, [onCargarDatos, toast]);

  // Cargar materiales al montar el componente
  useEffect(() => {
    cargarMateriales();
  }, [cargarMateriales]);

  // Filtrar materiales basado en los filtros aplicados
  const materialesFiltrados = useMemo(() => {
    let resultado = materiales;

    // Filtro por tipo
    if (filtroTipo) {
      resultado = resultado.filter(material => material.tipo === filtroTipo);
    }

    // Filtro por estado
    if (filtroEstado) {
      resultado = resultado.filter(material => material.estado === filtroEstado);
    }

    // Filtro por búsqueda (nombre o código)
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      resultado = resultado.filter(material => 
        material.nombre.toLowerCase().includes(busquedaLower) ||
        (material.codigo && material.codigo.toLowerCase().includes(busquedaLower))
      );
    }

    return resultado;
  }, [materiales, filtroTipo, filtroEstado, busqueda]);
  // Handlers optimizados
  const handleBusquedaChange = useOptimizedInputHandler((value: string) => {
    setBusqueda(value);
  });

  const handleEdit = useOptimizedClickHandler((material: any) => {
    setSelectedMaterial(material);
    onOpen();
  });

  const handleDelete = useOptimizedClickHandler((material: any) => {
    setMaterialToDelete(material);
    onDeleteOpen();
  });

  const confirmDelete = async () => {
    if (!materialToDelete) return;

    try {
      await eliminarMaterial(materialToDelete.id);
      toast({
        title: 'Material eliminado',
        description: `El material "${materialToDelete.nombre}" ha sido eliminado exitosamente.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      await cargarMateriales();
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
      onDeleteClose();
      setMaterialToDelete(null);
    }
  };

  const handleFormSuccess = async () => {
    onClose();
    setSelectedMaterial(null);
    await cargarMateriales();
  };

  // Obtener información del estado
  const getEstadoInfo = (estado: string) => {
    return ESTADOS_MATERIAL.find(e => e.value === estado) || { label: estado, color: 'gray' };
  };

  // Renderizar la tabla de materiales
  const renderTable = () => (
    <Card bg={bgColor} border="1px" borderColor={borderColor}>
      <CardBody>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Nombre</Th>
              <Th>Tipo</Th>
              <Th>Estado</Th>
              <Th>Cantidad</Th>
              <Th>Disponible</Th>
              <Th>Prestada</Th>
              <Th>Código</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {materialesFiltrados.map((material) => (
              <Tr key={material.id}>
                <Td>
                  <Text fontWeight="medium">{material.nombre}</Text>
                </Td>
                <Td>
                  <Badge colorScheme="blue" variant="subtle">
                    {material.tipo}
                  </Badge>
                </Td>
                <Td>
                  <Badge colorScheme={getEstadoInfo(material.estado).color}>
                    {getEstadoInfo(material.estado).label}
                  </Badge>
                </Td>
                <Td>{material.cantidad || 1}</Td>
                <Td>{material.cantidadDisponible !== undefined ? material.cantidadDisponible : (material.cantidad || 1)}</Td>
                <Td>{cantidadesPrestadas[material.id] || 0}</Td>
                <Td>
                  <Text fontSize="sm" color="gray.600">
                    {material.codigo || '-'}
                  </Text>
                </Td>
                <Td>
                  <HStack spacing={1}>
                    <IconButton
                      aria-label="Editar material"
                      icon={<EditIcon />}
                      size="sm"
                      colorScheme="blue"
                      variant="ghost"
                      onClick={() => handleEdit(material)}
                    />
                    <IconButton
                      aria-label="Eliminar material"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDelete(material)}
                    />                    <QRActionsMenu />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );

  return (
    <Box>
      {/* Header con título y acciones principales */}
      <Card mb={6} bg={bgColor} border="1px" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4}>
            {/* Título y botones principales */}
            <Flex justify="space-between" align="center" w="full" wrap="wrap" gap={4}>
              <Heading size="lg" color="purple.600">
                <HStack>
                  <FiSettings />
                  <Text>Gestión de Materiales</Text>
                </HStack>
              </Heading>
              
              <HStack spacing={2} wrap="wrap">
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="purple"
                  onClick={() => {
                    setSelectedMaterial(null);
                    onOpen();
                  }}
                  size="md"
                >
                  Nuevo Material
                </Button>
                
                <Menu>
                  <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="md" variant="outline">
                    Herramientas
                  </MenuButton>
                  <MenuList>
                    <MenuItem icon={<FiDownload />} onClick={onExportOpen}>
                      Exportar Datos
                    </MenuItem>
                    <MenuItem icon={<FiUpload />} onClick={onImportOpen}>
                      Importar Datos
                    </MenuItem>
                    <MenuItem icon={<FiPrinter />}>
                      Imprimir Lista
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </Flex>

            {/* Filtros y búsqueda */}
            <Flex direction={{ base: 'column', md: 'row' }} gap={4} w="full" align="end">
              <Box flex="1">
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Buscar por nombre o código..."
                    value={busqueda}
                    onChange={(e) => handleBusquedaChange(e.target.value)}
                  />
                </InputGroup>
              </Box>
              
              <Select 
                value={filtroTipo} 
                onChange={(e) => setFiltroTipo(e.target.value)}
                placeholder="Todos los tipos"
                maxW="200px"
              >
                <option value="cuerda">Cuerdas</option>
                <option value="anclaje">Anclajes</option>
                <option value="varios">Varios</option>
              </Select>
              
              <Select 
                value={filtroEstado} 
                onChange={(e) => setFiltroEstado(e.target.value)}
                placeholder="Todos los estados"
                maxW="200px"
              >
                {ESTADOS_MATERIAL.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </Select>
              
              <Button
                onClick={cargarMateriales}
                isLoading={isLoading || cargandoExterno}
                loadingText="Cargando..."
                variant="outline"
              >
                Actualizar
              </Button>
            </Flex>

            {/* Estadísticas rápidas */}
            <HStack spacing={6} w="full" justify="center">
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {materialesFiltrados.length}
                </Text>
                <Text fontSize="sm" color="gray.600">Total</Text>
              </VStack>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {materialesFiltrados.filter(m => m.estado === 'disponible').length}
                </Text>
                <Text fontSize="sm" color="gray.600">Disponibles</Text>
              </VStack>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {materialesFiltrados.filter(m => m.estado === 'prestado').length}
                </Text>
                <Text fontSize="sm" color="gray.600">Prestados</Text>
              </VStack>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="red.500">
                  {materialesFiltrados.filter(m => m.estado === 'mantenimiento').length}
                </Text>
                <Text fontSize="sm" color="gray.600">Mantenimiento</Text>
              </VStack>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Tabla de materiales */}
      {isLoading || cargandoExterno ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="purple.500" />
          <Text mt={4} color="gray.600">Cargando materiales...</Text>
        </Box>
      ) : materialesFiltrados.length === 0 ? (
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody textAlign="center" py={10}>
            <FiBox size="3rem" color="gray.400" />
            <Text mt={4} color="gray.600">
              {materiales.length === 0 
                ? "No hay materiales registrados"
                : "No se encontraron materiales con los filtros aplicados"
              }
            </Text>
          </CardBody>
        </Card>
      ) : (
        renderTable()
      )}

      {/* Modal para crear/editar material */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedMaterial ? 'Editar Material' : 'Nuevo Material'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <MaterialForm
              material={selectedMaterial}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                onClose();
                setSelectedMaterial(null);
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Eliminar Material
            </AlertDialogHeader>

            <AlertDialogBody>
              ¿Estás seguro de que deseas eliminar el material "{materialToDelete?.nombre}"?
              Esta acción no se puede deshacer.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Modal para exportar datos */}
      <Modal isOpen={isExportOpen} onClose={onExportClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Exportar Materiales</ModalHeader>
          <ModalCloseButton />          <ModalBody>
            <MaterialExportManager 
              materials={materialesFiltrados}
              isOpen={isExportOpen}
              onClose={onExportClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal para importar datos */}
      <Modal isOpen={isImportOpen} onClose={onImportClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Importar Materiales</ModalHeader>
          <ModalCloseButton />          <ModalBody>
            <MaterialImportManager 
              materials={materiales}
              isOpen={isImportOpen}
              onClose={onImportClose}
              onImportSuccess={async (newMaterials) => {
                onImportClose();
                await cargarMateriales();
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default GestionMaterialesCompleteTab;
