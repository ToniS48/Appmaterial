/**
 * GestionMaterialesContent - Componente que contiene la lógica completa de gestión de materiales
 * Extrae el contenido del componente original GestionMaterialPage para reutilizarlo
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
  useToast
} from '@chakra-ui/react';
import { 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  ChevronDownIcon, 
  WarningIcon, 
  SearchIcon 
} from '@chakra-ui/icons';
import { FiBox, FiDownload, FiUpload } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { listarMateriales, eliminarMaterial, crearMaterial } from '../../../services/MaterialService';
import { PrestamoRepository } from '../../../repositories/PrestamoRepository';
import MaterialForm from '../../material/MaterialForm';
import MaterialExportManager from '../../admin/MaterialExportManager';
import MaterialImportManager from '../../admin/MaterialImportManager';
import QRActionsMenu from '../../material/QRActionsMenu';
import { useOptimizedClickHandler, useOptimizedInputHandler } from '../../../utils/eventOptimizer';
import { deferCallback } from '../../../utils/performanceUtils';
import { setupSchedulerOptimizer } from '../../../utils/reactSchedulerOptimizer';

// Estados de material con colores
const ESTADOS_MATERIAL = [
  { value: 'disponible', label: 'Disponible', color: 'green' },
  { value: 'prestado', label: 'Prestado', color: 'orange' },
  { value: 'mantenimiento', label: 'Mantenimiento', color: 'blue' },
  { value: 'baja', label: 'Baja', color: 'gray' },
  { value: 'perdido', label: 'Perdido', color: 'red' }
];

interface GestionMaterialesContentProps {
  userProfile?: any;
  onCargarDatos?: () => void;
}

const GestionMaterialesContent: React.FC<GestionMaterialesContentProps> = ({
  userProfile,
  onCargarDatos
}) => {
  console.log('🔧 GestionMaterialesContent - Component rendering iniciado');
  
  // Estados
  const [materiales, setMateriales] = useState<any[]>([]);
  const [cantidadesPrestadas, setCantidadesPrestadas] = useState<{ [key: string]: number }>({});
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  
  // Contextos y hooks
  const { currentUser } = useAuth();
  const toast = useToast();
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
  
  // Verificar si el usuario es admin
  const isAdmin = userProfile?.rol === 'admin';

  // Función optimizada para cargar la lista de materiales
  const cargarMateriales = useCallback(async () => {
    console.log('🔧 GestionMaterialesContent - Iniciando carga de materiales');
    return deferCallback(async () => {
      try {
        setIsLoading(true);
        console.log('🔧 GestionMaterialesContent - Estado de carga: true');
        
        // Crear instancia del repository dentro del callback
        const prestamoRepository = new PrestamoRepository();
        
        // Cargar TODOS los materiales sin filtros backend para filtrar localmente
        const materialesData = await listarMateriales();
        console.log('🔧 GestionMaterialesContent - Materiales cargados:', materialesData.length);
        
        setMateriales(materialesData);

        // Cargar cantidades prestadas para todos los materiales
        const cantidadesMap: { [key: string]: number } = {};
        
        for (const material of materialesData) {
          try {
            const cantidad = await prestamoRepository.getCantidadPrestada(material.id);
            cantidadesMap[material.id] = cantidad;
          } catch (error) {
            console.error(`Error al obtener cantidad prestada para ${material.nombre}:`, error);
            cantidadesMap[material.id] = 0;
          }
        }
        
        setCantidadesPrestadas(cantidadesMap);
        console.log('🔧 GestionMaterialesContent - Cantidades prestadas actualizadas:', Object.keys(cantidadesMap).length);
        
        // Notificar al padre si se proporciona callback
        if (onCargarDatos) {
          onCargarDatos();
        }
      } catch (error) {
        console.error('🔧 GestionMaterialesContent - Error al cargar materiales:', error);
        toast({
          title: "Error al cargar materiales",
          description: "No se pudieron cargar los materiales. Por favor, inténtalo de nuevo.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
        console.log('🔧 GestionMaterialesContent - Estado de carga: false');
      }
    });
  }, [onCargarDatos, toast]);

  // Cargar materiales al montar el componente
  useEffect(() => {
    cargarMateriales();
  }, [cargarMateriales]);

  // Handler para encontrar material por QR
  const handleMaterialFoundByQR = useCallback((material: any) => {
    console.log('🔧 GestionMaterialesContent - Material encontrado por QR:', material);
    if (material && material.id) {
      // Si se pasa el objeto material completo
      setSelectedMaterial(material);
      onFormOpen();
    } else if (typeof material === 'string') {
      // Si se pasa solo el ID, buscar el material
      const materialFound = materiales.find(m => m.id === material);
      if (materialFound) {
        setSelectedMaterial(materialFound);
        onFormOpen();
      }
    }
  }, [materiales, onFormOpen]);

  // Computed: Lista filtrada de materiales (filtro local)
  const materialesFiltrados = useMemo(() => {
    console.log('🔧 GestionMaterialesContent - Recalculando materiales filtrados');
    
    return materiales.filter(material => {
      // Filtro por búsqueda de texto
      const cumpleBusqueda = !busqueda || 
        material.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (material.descripcion && material.descripcion.toLowerCase().includes(busqueda.toLowerCase()));
      
      // Filtro por tipo
      const cumpleTipo = !filtroTipo || material.tipo === filtroTipo;
      
      // Filtro por estado
      const cumpleEstado = !filtroEstado || material.estado === filtroEstado;
      
      return cumpleBusqueda && cumpleTipo && cumpleEstado;
    });
  }, [materiales, busqueda, filtroTipo, filtroEstado]);
  
  // Setup scheduler optimizer
  useEffect(() => {
    const cleanup = setupSchedulerOptimizer();
    return cleanup || (() => {}); // Fallback a función vacía si es null
  }, []);
  
  // Handlers optimizados para evitar violaciones del scheduler
  const handleEdit = useOptimizedClickHandler((material: any) => {
    setSelectedMaterial(material);
    onFormOpen();
  });
  
  const handleDelete = useOptimizedClickHandler((material: any) => {
    setSelectedMaterial(material);
    onDeleteOpen();
  });
  
  const handleBusquedaChange = useOptimizedInputHandler((value: string) => {
    setBusqueda(value);
  }, { debounceDelay: 300 });
  
  // Función para confirmar eliminación optimizada
  const confirmarEliminacion = useOptimizedClickHandler(async () => {
    if (!selectedMaterial) return;
    
    return deferCallback(async () => {
      try {
        await eliminarMaterial(selectedMaterial.id);
        toast({
          title: "Material eliminado",
          description: `El material "${selectedMaterial.nombre}" ha sido eliminado exitosamente.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onDeleteClose();
        await cargarMateriales(); // Recargar lista
      } catch (error) {
        console.error('Error al eliminar material:', error);
        toast({
          title: "Error al eliminar",
          description: "No se pudo eliminar el material. Por favor, inténtalo de nuevo.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    });
  });

  // Función para manejar importación exitosa
  const handleImportSuccess = useCallback(async (materialsToImport: Omit<any, 'id'>[]) => {
    try {
      // Importar materiales usando el servicio de materiales
      const importPromises = materialsToImport.map(material => {
        // Usar el método público del servicio refactorizado
        return crearMaterial(material);
      });
      
      await Promise.all(importPromises);
      
      toast({
        title: "Importación exitosa",
        description: `Se importaron ${materialsToImport.length} materiales correctamente.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Recargar lista después de la importación
      await cargarMateriales();
      
      onImportClose();
    } catch (error) {
      console.error('Error durante la importación:', error);
      toast({
        title: "Error en importación",
        description: "Ocurrió un error durante la importación. Algunos materiales pueden no haberse importado.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw error; // Re-lanzar para que el componente de importación lo maneje
    }
  }, [cargarMateriales, onImportClose, toast]);

  return (
    <Box 
      p={{ base: 3, md: 5 }} 
      shadow="md" 
      borderWidth="1px" 
      borderRadius="md" 
      bg="white"
      maxW="1400px"
      mx="auto"
    >
      <Flex 
        justify="space-between" 
        align={{ base: "flex-start", md: "center" }}
        mb={5}
        direction={{ base: "column", md: "row" }}
        gap={3}
      >
        <HStack>
          <FiBox size="24px" />
          <Heading size="md">Inventario de Material</Heading>
        </HStack>
        
        <HStack 
          spacing={3}
          width={{ base: "100%", md: "auto" }}
          flexDirection={{ base: "column", sm: "row" }}
        >
          {/* Botones de administrador */}
          {isAdmin && (
            <>
              <Menu>
                <MenuButton 
                  as={Button} 
                  rightIcon={<ChevronDownIcon />}
                  colorScheme="blue"
                  variant="outline"
                  width={{ base: "100%", sm: "auto" }}
                >
                  Importar/Exportar
                </MenuButton>
                <MenuList>
                  <MenuItem 
                    icon={<FiUpload />} 
                    onClick={onImportOpen}
                  >
                    Importar materiales
                  </MenuItem>
                  <MenuItem 
                    icon={<FiDownload />} 
                    onClick={onExportOpen}
                  >
                    Exportar materiales
                  </MenuItem>
                </MenuList>
              </Menu>
            </>
          )}
          
          <QRActionsMenu
            onMaterialFound={handleMaterialFoundByQR}
            variant="buttons"
            size="md"
            showLabels={true}
          />
          
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="brand" 
            onClick={() => {
              setSelectedMaterial(null); // Limpiar selección para crear nuevo
              onFormOpen();
            }}
            width={{ base: "100%", sm: "auto" }}
          >
            Nuevo Material
          </Button>
        </HStack>
      </Flex>
      
      <Divider mb={5} />
      
      {/* Filtros */}
      <Flex 
        direction={{ base: "column", md: "row" }}
        mb={5}
        gap={3}
        align={{ base: "stretch", md: "center" }}
      >
        <InputGroup flex={{ base: "1 1 100%", md: "1 1 50%" }}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input 
            placeholder="Buscar material..." 
            value={busqueda}
            onChange={(e) => handleBusquedaChange(e.target.value)}
          />
        </InputGroup>
        
        <Flex 
          direction={{ base: "column", sm: "row" }} 
          gap={3} 
          width={{ base: "100%", md: "auto" }}
          flex={{ base: "1 1 100%", md: "1 1 50%" }}
        >
          <Select 
            placeholder="Todos los tipos" 
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            flex={{ base: "1 1 100%", sm: "1 1 auto" }}
          >
            <option value="cuerda">Cuerdas</option>
            <option value="anclaje">Anclajes</option>
            <option value="varios">Varios</option>
          </Select>
          
          <Select 
            placeholder="Todos los estados" 
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            flex={{ base: "1 1 100%", sm: "1 1 auto" }}
          >
            {ESTADOS_MATERIAL.map(estado => (
              <option key={estado.value} value={estado.value}>
                {estado.label}
              </option>
            ))}
          </Select>
        </Flex>
      </Flex>
      
      {/* Tabla de materiales */}
      <Box overflowX="auto">
        <Table variant="simple" display={{ base: "none", md: "table" }}>
          <Thead>
            <Tr>
              <Th>Nombre</Th>
              <Th>Tipo</Th>
              <Th>Estado</Th>
              <Th>Cantidad</Th>
              <Th>Prestados</Th>
              <Th>Última revisión</Th>
              <Th>Próxima revisión</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={8} textAlign="center">
                  <Spinner mr={2} />
                  Cargando materiales...
                </Td>
              </Tr>
            ) : materialesFiltrados.length === 0 ? (
              <Tr>
                <Td colSpan={8} textAlign="center">No se encontraron materiales</Td>
              </Tr>
            ) : (
              materialesFiltrados.map(material => (
                <Tr key={material.id}>
                  <Td fontWeight="medium">{material.nombre}</Td>
                  <Td>
                    <Badge colorScheme={
                      material.tipo === 'cuerda' ? 'blue' :
                      material.tipo === 'anclaje' ? 'orange' : 
                      'purple'
                    }>
                      {material.tipo === 'cuerda' ? 'Cuerda' :
                       material.tipo === 'anclaje' ? 'Anclaje' :
                       'Varios'}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={
                      ESTADOS_MATERIAL.find(e => e.value === material.estado)?.color || 'gray'
                    }>
                      {ESTADOS_MATERIAL.find(e => e.value === material.estado)?.label || material.estado}
                    </Badge>
                  </Td>
                  <Td>{material.cantidad || 1}</Td>
                  <Td>
                    <Text color={cantidadesPrestadas[material.id] > 0 ? "orange.500" : "green.500"}>
                      {cantidadesPrestadas[material.id] || 0}
                    </Text>
                  </Td>
                  <Td>
                    {material.fechaUltimaRevision ? 
                      new Date(material.fechaUltimaRevision.seconds * 1000).toLocaleDateString() 
                      : 'Sin revisar'}
                  </Td>
                  <Td>
                    <Text color={
                      material.fechaProximaRevision && 
                      new Date(material.fechaProximaRevision.seconds * 1000) < new Date() 
                        ? 'red.500' : 'black'
                    }>
                      {material.fechaProximaRevision ? 
                        new Date(material.fechaProximaRevision.seconds * 1000).toLocaleDateString() 
                        : 'No programada'}
                    </Text>
                    {material.fechaProximaRevision && 
                     new Date(material.fechaProximaRevision.seconds * 1000) < new Date() && (
                      <WarningIcon color="red.500" ml={2} />
                    )}
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      <IconButton
                        icon={<EditIcon />}
                        aria-label="Editar material"
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() => handleEdit(material)}
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        aria-label="Eliminar material"
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDelete(material)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>

        {/* Vista móvil - Cards */}
        <Box display={{ base: "block", md: "none" }} mt={4}>
          {isLoading ? (
            <Card>
              <CardBody textAlign="center">
                <Spinner mr={2} />
                Cargando materiales...
              </CardBody>
            </Card>
          ) : materialesFiltrados.length === 0 ? (
            <Card>
              <CardBody textAlign="center">
                <Text>No se encontraron materiales</Text>
              </CardBody>
            </Card>
          ) : (
            materialesFiltrados.map(material => (
              <Card key={material.id} mb={3}>
                <CardBody>
                  <Flex justify="space-between" align="flex-start" mb={2}>
                    <Text fontWeight="bold" fontSize="lg">{material.nombre}</Text>
                    <HStack spacing={1}>
                      <IconButton
                        icon={<EditIcon />}
                        aria-label="Editar material"
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() => handleEdit(material)}
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        aria-label="Eliminar material"
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDelete(material)}
                      />
                    </HStack>
                  </Flex>
                  
                  <HStack wrap="wrap" spacing={2} mb={2}>
                    <Badge colorScheme={
                      material.tipo === 'cuerda' ? 'blue' :
                      material.tipo === 'anclaje' ? 'orange' : 
                      'purple'
                    }>
                      {material.tipo === 'cuerda' ? 'Cuerda' :
                       material.tipo === 'anclaje' ? 'Anclaje' :
                       'Varios'}
                    </Badge>
                    <Badge colorScheme={
                      ESTADOS_MATERIAL.find(e => e.value === material.estado)?.color || 'gray'
                    }>
                      {ESTADOS_MATERIAL.find(e => e.value === material.estado)?.label || material.estado}
                    </Badge>
                  </HStack>
                  
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    <strong>Cantidad:</strong> {material.cantidad || 1} | 
                    <strong> Prestados:</strong> {cantidadesPrestadas[material.id] || 0}
                  </Text>
                  
                  <Text fontSize="sm" color="gray.600">
                    <strong>Última revisión:</strong> {
                      material.fechaUltimaRevision ? 
                        new Date(material.fechaUltimaRevision.seconds * 1000).toLocaleDateString() 
                        : 'Sin revisar'
                    }
                  </Text>
                  
                  <Text fontSize="sm" color={
                    material.fechaProximaRevision && 
                    new Date(material.fechaProximaRevision.seconds * 1000) < new Date() 
                      ? 'red.500' : 'gray.600'
                  }>
                    <strong>Próxima revisión:</strong> {
                      material.fechaProximaRevision ? 
                        new Date(material.fechaProximaRevision.seconds * 1000).toLocaleDateString() 
                        : 'No programada'
                    }
                    {material.fechaProximaRevision && 
                     new Date(material.fechaProximaRevision.seconds * 1000) < new Date() && (
                      <WarningIcon color="red.500" ml={2} />
                    )}
                  </Text>
                </CardBody>
              </Card>
            ))
          )}
        </Box>
      </Box>

      {/* Modal para formulario de material */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedMaterial ? 'Editar Material' : 'Nuevo Material'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <MaterialForm
              material={selectedMaterial}
              onSuccess={async () => {
                onFormClose();
                await cargarMateriales(); // Recargar lista
              }}
              onCancel={onFormClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal de confirmación para eliminar */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar eliminación</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              ¿Estás seguro de que deseas eliminar el material "{selectedMaterial?.nombre}"?
            </Text>
            <Text mt={2} color="red.500" fontSize="sm">
              Esta acción no se puede deshacer.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={confirmarEliminacion}>
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal para exportar materiales */}
      {isAdmin && (
        <Modal isOpen={isExportOpen} onClose={onExportClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Exportar Materiales</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <MaterialExportManager 
                materials={materiales}
                isOpen={isExportOpen}
                onClose={onExportClose} 
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Modal para importar materiales */}
      {isAdmin && (
        <Modal isOpen={isImportOpen} onClose={onImportClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Importar Materiales</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <MaterialImportManager 
                materials={materiales}
                isOpen={isImportOpen}
                onClose={onImportClose}
                onImportSuccess={handleImportSuccess}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default GestionMaterialesContent;
