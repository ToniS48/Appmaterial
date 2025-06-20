import React, { useState, useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Material } from '../../types/material';
import {
  Box, 
  Text, 
  VStack, 
  HStack, 
  SimpleGrid, 
  Card, 
  CardBody, 
  Badge, 
  Input, 
  Select, 
  Spinner, 
  Alert, 
  AlertIcon,
  Flex,
  Heading,
  IconButton,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { FiSearch, FiEye, FiFilter } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { listarMateriales } from '../../services/materialService';
import { PrestamoRepository } from '../../repositories/PrestamoRepository';
import messages from '../../constants/messages';

// Estados de material con colores para el inventario
const ESTADOS_MATERIAL = [
  { value: 'disponible', label: 'Disponible', color: 'green' },
  { value: 'prestado', label: 'Prestado', color: 'orange' },
  { value: 'mantenimiento', label: 'Mantenimiento', color: 'blue' },
  { value: 'baja', label: 'Baja', color: 'gray' },
  { value: 'perdido', label: 'Perdido', color: 'red' }
];

// Tipos de material
const TIPOS_MATERIAL = [
  { value: '', label: 'Todos los tipos' },
  { value: 'cuerda', label: 'Cuerdas' },
  { value: 'anclaje', label: 'Anclajes' },
  { value: 'varios', label: 'Varios' }
];

interface MaterialInventoryViewProps {
  viewMode?: 'grid' | 'table' | 'tabs';
}

const MaterialInventoryView: React.FC<MaterialInventoryViewProps> = ({ 
  viewMode = 'tabs' 
}) => {
  // Estados para filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [vistaActiva, setVistaActiva] = useState<'grid' | 'table'>('grid');
  
  // Estados para carga de datos
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [cantidadesPrestadas, setCantidadesPrestadas] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Contextos
  const { userProfile } = useAuth();

  // Cargar materiales al montar el componente
  useEffect(() => {
    const cargarMateriales = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Crear instancia del repository dentro del useEffect
        const prestamoRepository = new PrestamoRepository();
        
        // Cargar materiales
        const materialesData = await listarMateriales();
        setMateriales(materialesData);
        
        // Cargar cantidades prestadas para cada material
        const cantidadesPrestadas: Record<string, number> = {};
        await Promise.all(
          materialesData.map(async (material) => {
            if (material.id) {
              try {
                const cantidad = await prestamoRepository.getCantidadPrestada(material.id);
                cantidadesPrestadas[material.id] = cantidad;
                
                // Log de depuración para identificar problemas
                if (isNaN(cantidad) || cantidad < 0) {
                  console.warn(`⚠️ Cantidad prestada inválida para material ${material.nombre} (${material.id}): ${cantidad}`);
                }
                if (material.tipo === 'cuerda' && cantidad > 1) {
                  console.warn(`⚠️ Cuerda con cantidad prestada > 1: ${material.nombre} = ${cantidad}`);
                }
              } catch (error) {
                console.error(`Error obteniendo cantidad prestada para material ${material.id}:`, error);
                cantidadesPrestadas[material.id] = 0;
              }
            } else {
              console.warn(`⚠️ Material sin ID encontrado:`, material);
            }
          })
        );
        
        setCantidadesPrestadas(cantidadesPrestadas);
      } catch (err) {
        console.error('Error al cargar materiales:', err);
        setError('Error al cargar los materiales');
      } finally {
        setIsLoading(false);
      }
    };

    cargarMateriales();
  }, []);
  // Filtrado de materiales
  const materialesFiltrados = useMemo(() => {
    if (!materiales) return [];
    
    return materiales.filter((material: Material) => {
      // Filtro por búsqueda (nombre o código)
      const cumpleBusqueda = !busqueda.trim() || 
        material.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        material.codigo?.toLowerCase().includes(busqueda.toLowerCase());
      
      // Filtro por tipo 
      const cumpleTipo = !filtroTipo || material.tipo === filtroTipo;
      
      // Filtro por estado
      const cumpleEstado = !filtroEstado || material.estado === filtroEstado;
      
      return cumpleBusqueda && cumpleTipo && cumpleEstado;
    });
  }, [materiales, busqueda, filtroTipo, filtroEstado]);
  // Separar materiales por tipo para las tabs
  const materialesPorTipo = useMemo(() => {
    const cuerdas = materialesFiltrados.filter((m: Material) => m.tipo === 'cuerda');
    const anclajes = materialesFiltrados.filter((m: Material) => m.tipo === 'anclaje');
    const varios = materialesFiltrados.filter((m: Material) => m.tipo === 'varios');
    
    return { cuerdas, anclajes, varios };
  }, [materialesFiltrados]);

  // Función para renderizar una tarjeta de material
  const renderMaterialCard = (material: Material) => (
    <Card 
      key={material.id} 
      variant="outline" 
      _hover={{ 
        shadow: 'md',
        transform: 'translateY(-2px)'
      }}
      transition="all 0.2s"
    >
      <CardBody>
        <VStack align="start" spacing={3}>
          <Flex justify="space-between" width="100%" align="start">
            <VStack align="start" spacing={1} flex="1">
              <Heading size="sm" fontWeight="semibold">
                {material.nombre}
              </Heading>
              {material.codigo && (
                <Text fontSize="xs" color="gray.600" fontFamily="mono">
                  {material.codigo}
                </Text>              )}
            </VStack>
            <IconButton
              as={RouterLink}
              to={`/material/detalle/${material.id}`}
              aria-label="Ver detalle"
              icon={<FiEye />}
              size="sm"
              variant="ghost"
              colorScheme="brand"
            />
          </Flex>          <Flex gap={2} flexWrap="wrap">
            <Badge colorScheme={
              material.tipo === 'cuerda' ? 'blue' :
              material.tipo === 'anclaje' ? 'orange' : 
              'purple'
            }>
              {material.tipo === 'cuerda' ? 'Cuerda' :
               material.tipo === 'anclaje' ? 'Anclaje' :
               'Varios'}
            </Badge>
            
            {/* Badge de estado para cuerdas */}
            {material.tipo === 'cuerda' && (
              <Badge colorScheme={
                material.estado === 'disponible' ? 'green' :
                material.estado === 'prestado' ? 'orange' :
                material.estado === 'mantenimiento' ? 'blue' :
                material.estado === 'baja' ? 'gray' :
                material.estado === 'perdido' ? 'red' :
                material.estado === 'revision' ? 'yellow' :
                material.estado === 'retirado' ? 'gray' :
                'gray'
              }>
                {material.estado === 'disponible' ? 'Disponible' :
                 material.estado === 'prestado' ? 'En uso' :
                 material.estado === 'mantenimiento' ? 'Mantenimiento' :
                 material.estado === 'baja' ? 'De baja' :
                 material.estado === 'perdido' ? 'Perdido' :
                 material.estado === 'revision' ? 'En revisión' :
                 material.estado === 'retirado' ? 'Retirado' :
                 material.estado}
              </Badge>
            )}
              {(() => {
              const cantidadPrestada = cantidadesPrestadas[material.id || ''] || 0;
                // Badge de "En uso" eliminado por solicitud del usuario
              return null;
            })()}
          </Flex>

          {/* Información específica por tipo */}
          {material.tipo === 'cuerda' && (
            <VStack align="start" spacing={1} width="100%">
              {material.longitud && (
                <Text fontSize="sm">
                  <Text as="span" fontWeight="medium">Longitud:</Text> {material.longitud}m
                </Text>
              )}
              {material.diametro && (
                <Text fontSize="sm">
                  <Text as="span" fontWeight="medium">Diámetro:</Text> {material.diametro}mm
                </Text>
              )}
            </VStack>
          )}

          {(material.tipo === 'anclaje' || material.tipo === 'varios') && material.cantidadDisponible !== undefined && (
            <Text fontSize="sm">
              <Text as="span" fontWeight="medium">Disponible:</Text>{' '}
              <Text 
                as="span" 
                color={material.cantidadDisponible === 0 ? "red.600" : 
                      material.cantidadDisponible < 5 ? "orange.600" : "green.600"}
                fontWeight="semibold"
              >
                {material.cantidadDisponible} unidades
              </Text>
            </Text>
          )}

          {material.observaciones && (
            <Text fontSize="xs" color="gray.600" noOfLines={2}>
              {material.observaciones}
            </Text>
          )}
        </VStack>
      </CardBody>
    </Card>
  );

  // Función para renderizar una fila de tabla
  const renderTableRow = (material: Material) => (
    <Tr key={material.id}>
      <Td>
        <VStack align="start" spacing={1}>
          <Text fontWeight="medium">{material.nombre}</Text>
          {material.codigo && (
            <Text fontSize="xs" color="gray.600" fontFamily="mono">
              {material.codigo}
            </Text>
          )}
        </VStack>
      </Td>      <Td>
        <Badge colorScheme={
          material.tipo === 'cuerda' ? 'blue' :
          material.tipo === 'anclaje' ? 'orange' : 
          'purple'
        }>
          {material.tipo === 'cuerda' ? 'Cuerda' :
           material.tipo === 'anclaje' ? 'Anclaje' :
           'Varios'}
        </Badge>
        
        {/* Badge de estado para cuerdas en tabla */}
        {material.tipo === 'cuerda' && (
          <Badge 
            ml={2}
            colorScheme={
              material.estado === 'disponible' ? 'green' :
              material.estado === 'prestado' ? 'orange' :
              material.estado === 'mantenimiento' ? 'blue' :
              material.estado === 'baja' ? 'gray' :
              material.estado === 'perdido' ? 'red' :
              material.estado === 'revision' ? 'yellow' :
              material.estado === 'retirado' ? 'gray' :
              'gray'
            }
          >
            {material.estado === 'disponible' ? 'Disponible' :
             material.estado === 'prestado' ? 'En uso' :
             material.estado === 'mantenimiento' ? 'Mantenimiento' :
             material.estado === 'baja' ? 'De baja' :
             material.estado === 'perdido' ? 'Perdido' :
             material.estado === 'revision' ? 'En revisión' :
             material.estado === 'retirado' ? 'Retirado' :
             material.estado}
          </Badge>
        )}
      </Td>
      <Td>
        {material.tipo === 'cuerda' ? (
          `${material.longitud || '-'}m / ${material.diametro || '-'}mm`
        ) : material.cantidadDisponible !== undefined ? (
          <Text color={material.cantidadDisponible === 0 ? "red.600" : 
                      material.cantidadDisponible < 5 ? "orange.600" : "green.600"}>
            {material.cantidadDisponible} unidades
          </Text>
        ) : '-'}
      </Td>      <Td>
        <IconButton
          as={RouterLink}
          to={`/material/detalle/${material.id}`}
          aria-label="Ver detalle"
          icon={<FiEye />}
          size="sm"
          variant="ghost"
          colorScheme="brand"
        />
      </Td>
    </Tr>
  );

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <VStack spacing={3}>
          <Spinner size="lg" color="brand.500" />
          <Text>Cargando inventario...</Text>
        </VStack>
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <Text>Error al cargar el inventario: {error || 'Error desconocido'}</Text>
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Encabezado */}
      <Box>
        <Heading size="lg" mb={2}>Inventario de Material</Heading>
        <Text color="gray.600">
          Consulta todo el material disponible en el club
        </Text>
      </Box>

      {/* Controles de filtrado */}
      <Card bg="gray.50">
        <CardBody>
          <VStack spacing={4}>
            <Flex 
              direction={{ base: "column", md: "row" }} 
              gap={4} 
              width="100%"
              align={{ base: "stretch", md: "center" }}
            >
              <HStack flex="1">
                <FiSearch />
                <Input
                  placeholder="Buscar por nombre o código..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  bg="white"
                />
              </HStack>
              
              <HStack spacing={3}>
                <Select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  bg="white"
                  minW="120px"
                >
                  {TIPOS_MATERIAL.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </Select>

                <Select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  bg="white"
                  minW="120px"
                >
                  <option value="">Todos los estados</option>
                  {ESTADOS_MATERIAL.map(estado => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </Select>
              </HStack>
            </Flex>

            <HStack justify="space-between" width="100%">
              <Text fontSize="sm" color="gray.600">
                {materialesFiltrados.length} material{materialesFiltrados.length !== 1 ? 'es' : ''} encontrado{materialesFiltrados.length !== 1 ? 's' : ''}
              </Text>
              
              <HStack spacing={2}>
                <IconButton
                  aria-label="Vista en tarjetas"
                  icon={<FiFilter />}
                  size="sm"
                  variant={vistaActiva === 'grid' ? 'solid' : 'outline'}
                  colorScheme="brand"
                  onClick={() => setVistaActiva('grid')}
                />
                <IconButton
                  aria-label="Vista en tabla"
                  icon={<FiEye />}
                  size="sm"
                  variant={vistaActiva === 'table' ? 'solid' : 'outline'}
                  colorScheme="brand"
                  onClick={() => setVistaActiva('table')}
                />
              </HStack>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Contenido principal */}
      {viewMode === 'tabs' ? (
        <Tabs variant="enclosed" colorScheme="brand">
          <TabList>
            <Tab>Todos ({materialesFiltrados.length})</Tab>
            <Tab>Cuerdas ({materialesPorTipo.cuerdas.length})</Tab>
            <Tab>Anclajes ({materialesPorTipo.anclajes.length})</Tab>
            <Tab>Varios ({materialesPorTipo.varios.length})</Tab>
          </TabList>

          <TabPanels>            <TabPanel px={0}>              {vistaActiva === 'grid' ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
                  {materialesFiltrados.map(renderMaterialCard)}
                </SimpleGrid>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Material</Th>
                        <Th>Tipo</Th>
                        <Th>Especificaciones</Th>
                        <Th width="50px">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {materialesFiltrados.map(renderTableRow)}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </TabPanel>            <TabPanel px={0}>
              {vistaActiva === 'grid' ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
                  {materialesPorTipo.cuerdas.map(renderMaterialCard)}
                </SimpleGrid>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>                      <Tr>
                        <Th>Material</Th>
                        <Th>Tipo</Th>
                        <Th>Especificaciones</Th>
                        <Th width="50px">Acciones</Th>
                      </Tr>
                    </Thead>                    <Tbody>
                      {materialesPorTipo.cuerdas.map(renderTableRow)}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </TabPanel>

            <TabPanel px={0}>
              {vistaActiva === 'grid' ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
                  {materialesPorTipo.anclajes.map(renderMaterialCard)}
                </SimpleGrid>                ) : (
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Material</Th>
                        <Th>Tipo</Th>
                        <Th>Especificaciones</Th>
                        <Th width="50px">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {materialesPorTipo.anclajes.map(renderTableRow)}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </TabPanel>

            <TabPanel px={0}>
              {vistaActiva === 'grid' ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
                  {materialesPorTipo.varios.map(renderMaterialCard)}
                </SimpleGrid>              ) : (                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Material</Th>
                        <Th>Tipo</Th>
                        <Th>Especificaciones</Th>
                        <Th width="50px">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {materialesPorTipo.varios.map(renderTableRow)}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      ) : (
        // Vista sin tabs (legacy)
        vistaActiva === 'grid' ? (          <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
            {materialesFiltrados.map(renderMaterialCard)}
          </SimpleGrid>        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Material</Th>
                  <Th>Tipo</Th>
                  <Th>Especificaciones</Th>
                  <Th width="50px">Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {materialesFiltrados.map(renderTableRow)}
              </Tbody>
            </Table>
          </Box>
        )
      )}

      {materialesFiltrados.length === 0 && (
        <Card>
          <CardBody>
            <VStack spacing={3} py={8}>
              <Text fontSize="lg" color="gray.600">
                No se encontraron materiales
              </Text>
              <Text fontSize="sm" color="gray.500">
                Prueba a ajustar los filtros de búsqueda
              </Text>
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default MaterialInventoryView;
