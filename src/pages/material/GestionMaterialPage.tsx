import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  Flex,
  useDisclosure,  Modal,
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
  Link
} from '@chakra-ui/react';
import { 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  ChevronDownIcon, 
  WarningIcon, 
  SearchIcon 
} from '@chakra-ui/icons';
import { FiBox, FiPrinter, FiDownload, FiUpload } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { listarMateriales, eliminarMaterial } from '../../services/materialService';
import { materialService } from '../../services/MaterialServiceRefactored';
import MaterialForm from '../../components/material/MaterialForm';
import MaterialExportManager from '../../components/admin/MaterialExportManager';
import MaterialImportManager from '../../components/admin/MaterialImportManager';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import messages from '../../constants/messages';
import { useOptimizedClickHandler, useOptimizedInputHandler } from '../../utils/eventOptimizer';
import { deferCallback } from '../../utils/performanceUtils';
import { setupSchedulerOptimizer } from '../../utils/reactSchedulerOptimizer';

// Estados de material con colores
const ESTADOS_MATERIAL = [
  { value: 'disponible', label: 'Disponible', color: 'green' },
  { value: 'prestado', label: 'Prestado', color: 'orange' },
  { value: 'mantenimiento', label: 'Mantenimiento', color: 'blue' },
  { value: 'baja', label: 'Baja', color: 'gray' },
  { value: 'perdido', label: 'Perdido', color: 'red' }
];

const GestionMaterialPage: React.FC = () => {
  console.log('🔧 GestionMaterialPage - Component rendering iniciado');
  
  // Estados
  const [materiales, setMateriales] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  
  // Contextos y hooks
  const { currentUser, userProfile } = useAuth();
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
  
  // Setup scheduler optimizer
  useEffect(() => {
    const cleanup = setupSchedulerOptimizer();
    return cleanup;
  }, []);
    // Función optimizada para cargar la lista de materiales
  const cargarMateriales = useCallback(async () => {
    console.log('🔧 GestionMaterialPage - Iniciando carga de materiales');
    return deferCallback(async () => {
      try {
        setIsLoading(true);
        console.log('🔧 GestionMaterialPage - Estado de carga: true');
        
        const filters: { tipo?: string; estado?: string } = {};
        
        if (filtroTipo) filters.tipo = filtroTipo;
        if (filtroEstado) filters.estado = filtroEstado;
        
        console.log('🔧 GestionMaterialPage - Aplicando filtros:', filters);
        
        const materialesData = await listarMateriales(filters);
        console.log('🔧 GestionMaterialPage - Materiales cargados:', materialesData.length);
        
        setMateriales(materialesData);
      } catch (error) {
        console.error('❌ GestionMaterialPage - Error al cargar materiales:', error);
      } finally {
        setIsLoading(false);
        console.log('🔧 GestionMaterialPage - Estado de carga: false');
      }
    });
  }, [filtroTipo, filtroEstado]);
    // Cargar materiales al montar el componente o cambiar filtros
  useEffect(() => {
    console.log('🔧 GestionMaterialPage - useEffect ejecutado, cargando materiales...');
    cargarMateriales();
  }, [cargarMateriales]);
  
  // Filtrar materiales por búsqueda con memoización
  const materialesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return materiales;
    return materiales.filter(material => 
      material.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [materiales, busqueda]);
  
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
        onDeleteClose();
        await cargarMateriales(); // Recargar lista
      } catch (error) {
        console.error('Error al eliminar material:', error);
      }
    });
  });
  // Función para manejar importación exitosa
  const handleImportSuccess = useCallback(async (materialsToImport: Omit<any, 'id'>[]) => {
    try {
      // Importar materiales usando el servicio refactorizado
      const importPromises = materialsToImport.map(material => 
        materialService.crearMaterial(material)
      );
      
      await Promise.all(importPromises);
      
      // Recargar la lista de materiales
      await cargarMateriales();
      
      // Cerrar modal de importación
      onImportClose();
    } catch (error) {
      console.error('Error al importar materiales:', error);
      throw error; // Re-lanzar para que el componente de importación pueda manejarlo
    }
  }, [cargarMateriales, onImportClose]);
    // Comprobar si el usuario es admin (para mostrar opción de eliminar)
  const isAdmin = useMemo(() => userProfile?.rol === 'admin', [userProfile?.rol]);

  console.log('🔧 GestionMaterialPage - Renderizando componente:', {
    materialesCount: materiales.length,
    isLoading,
    isAdmin,
    userProfile: userProfile?.rol
  });

  return (
    <DashboardLayout title="Gestión de Material">
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
          <HStack> {/* Envolver Heading en HStack para añadir icono */}
            <FiBox size="24px" /> {/* Añadir icono */}
            <Heading size="md">Inventario de Material</Heading>
          </HStack>          <HStack 
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
            
            <Button
              as={RouterLink}
              to="/material/print-qr"
              leftIcon={<FiPrinter />}
              colorScheme="brand"
              variant="outline"
              width={{ base: "100%", sm: "auto" }}
            >
              Imprimir QRs
            </Button>
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
          <InputGroup flex={{ base: "1 1 100%", md: "1 1 50%" }} > {/* Ajustado el flex basis */}
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
            flex={{ base: "1 1 100%", md: "1 1 50%" }} // Ajustado el flex basis
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
                <Th>Última revisión</Th>
                <Th>Próxima revisión</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                <Tr>
                  <Td colSpan={6} textAlign="center">Cargando...</Td>
                </Tr>
              ) : materialesFiltrados.length === 0 ? (
                <Tr>
                  <Td colSpan={6} textAlign="center">No se encontraron materiales</Td>
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
                    <Td>
                      {material.fechaUltimaRevision instanceof Date 
                        ? material.fechaUltimaRevision.toLocaleDateString() 
                        : new Date(material.fechaUltimaRevision).toLocaleDateString()}
                    </Td>
                    <Td>
                      {/* Resaltar si la próxima revisión está cerca (30 días) */}
                      <Flex align="center">
                        {new Date(material.proximaRevision) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                          <WarningIcon color="orange.500" mr={2} />
                        )}
                        {material.proximaRevision instanceof Date 
                          ? material.proximaRevision.toLocaleDateString() 
                          : new Date(material.proximaRevision).toLocaleDateString()}
                      </Flex>
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton 
                          as={Button} 
                          rightIcon={<ChevronDownIcon />} 
                          size="sm" 
                          variant="outline"
                        >
                          Acciones
                        </MenuButton>
                        <MenuList>
                          <MenuItem 
                            icon={<EditIcon />}
                            onClick={() => handleEdit(material)}
                          >
                            Editar
                          </MenuItem>
                          {isAdmin && ( 
                            <MenuItem 
                              icon={<DeleteIcon />}
                              onClick={() => handleDelete(material)}
                              color="red.500"
                            >
                              Eliminar
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
          
          {/* Vista de tarjetas para móviles */}
          <Box display={{ base: "block", md: "none" }}>
            {isLoading ? (
              <Flex justify="center" p={4}>
                <Spinner />
              </Flex>
            ) : materialesFiltrados.length === 0 ? (
              <Box textAlign="center" p={4}>
                No se encontraron materiales
              </Box>
            ) : (
              materialesFiltrados.map(material => (
                <Card key={material.id} mb={3} variant="outline">
                  <CardBody>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Heading size="sm" fontWeight="medium">{material.nombre}</Heading>
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
                            onClick={() => handleEdit(material)}
                          >
                            Editar
                          </MenuItem>
                          {isAdmin && ( 
                            <MenuItem 
                              icon={<DeleteIcon />}
                              onClick={() => handleDelete(material)}
                              color="red.500"
                            >
                              Eliminar
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    </Flex>
                    
                    <Flex gap={2} mt={2} flexWrap="wrap">
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
                        {material.estado}
                      </Badge>
                    </Flex>
                    
                    <Text mt={2}>Cantidad: {material.cantidad}</Text>
                    {material.fechaCompra && (
                      <Text fontSize="sm" color="gray.600">
                        Comprado: {new Date(material.fechaCompra.toDate()).toLocaleDateString()}
                      </Text>
                    )}
                  </CardBody>
                </Card>
              ))
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Modal de creación/edición */}
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
              onSuccess={() => {
                onFormClose();
                cargarMateriales(); // Recargar la lista
              }}
              onCancel={onFormClose}
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
              ¿Está seguro de que desea eliminar el material "{selectedMaterial?.nombre}"? Esta acción no se puede deshacer.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onDeleteClose}>
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={confirmarEliminacion}>
              Eliminar
            </Button>
          </ModalFooter>        </ModalContent>
      </Modal>

      {/* Componentes de importación/exportación para administradores */}
      {isAdmin && (
        <>
          <MaterialExportManager 
            materials={materiales}
            isOpen={isExportOpen}
            onClose={onExportClose}
          />
          
          <MaterialImportManager 
            materials={materiales}
            isOpen={isImportOpen}
            onClose={onImportClose}
            onImportSuccess={handleImportSuccess}
          />
        </>
      )}
    </DashboardLayout>
  );
};

export default GestionMaterialPage;