import React, { useState, useEffect, useCallback } from 'react';
import { useFieldArray, Control } from 'react-hook-form';
import {
  Box,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Text,
  FormErrorMessage,
  useToast,
  Spinner,
  SimpleGrid,
  Flex,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Divider
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FiPackage } from 'react-icons/fi';
import { MaterialRepository } from '../../repositories/MaterialRepository';
import messages from '../../constants/messages';
import MaterialCard from '../material/MaterialCard';
import MaterialRow from '../material/MaterialRow';
import { useOptimizedClickHandler } from '../../utils/eventOptimizer';
import { Material, MaterialItem } from '../../types/material';

// Crear instancia del repositorio
const materialRepository = new MaterialRepository();

// Definir tipos faltantes
interface MaterialField {
  id?: string; // Agregado para compatibilidad con useFieldArray
  materialId: string;
  nombre: string;
  cantidad: number;
}

export interface MaterialSelectorProps {
  control: Control<any>;
  name: string;
  error?: any;
  materialesActuales?: MaterialField[];
  cardBg?: string;
  borderColor?: string;
}

/**
 * Componente para seleccionar materiales con UI mejorada y optimizada
 */
const MaterialSelector: React.FC<MaterialSelectorProps> = ({ 
  control, 
  name,
  error,
  materialesActuales = [],
  cardBg,
  borderColor
}) => {  // Estados locales
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [materialesDisponibles, setMaterialesDisponibles] = useState<MaterialItem[]>([]);
  const [loadingMateriales, setLoadingMateriales] = useState<boolean>(true);

  // Hook para manejar el array de materiales
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: name as "materiales"
  });

  // Toast para notificaciones
  const toast = useToast();
  // Convertir campos tipados - usar tipo correcto
  const typedFields = fields as (MaterialField & { id: string })[];
  // Función para convertir Material a MaterialItem
  const convertirMaterialAItem = useCallback((material: Material): MaterialItem => {
    return {
      id: material.id,
      nombre: material.nombre,
      tipo: material.tipo,
      estado: material.estado,
      cantidadDisponible: material.cantidadDisponible,
      codigo: material.codigo,
      descripcion: material.descripcion
    };
  }, []);

  // Cargar materiales disponibles
  useEffect(() => {
    const cargarMateriales = async () => {
      try {
        setLoadingMateriales(true);
        const materiales = await materialRepository.findMaterialesDisponibles();
        const materialesItems = (materiales || []).map(convertirMaterialAItem);
        setMaterialesDisponibles(materialesItems);
      } catch (error) {
        console.error('Error cargando materiales:', error);
        setErrorState('Error cargando materiales');
      } finally {
        setLoadingMateriales(false);
      }
    };

    cargarMateriales();
  }, [convertirMaterialAItem]);

  // Calcular disponibilidad real de un material
  const calcularDisponibilidad = useCallback((material: MaterialItem): number => {
    if (!material) return 0;
    
    const cantidadTotal = material.cantidadDisponible || 0;
    const cantidadUsada = typedFields
      .filter(field => field.materialId === material.id)
      .reduce((sum, field) => sum + (field.cantidad || 0), 0);
    
    return Math.max(0, cantidadTotal - cantidadUsada);
  }, [typedFields]);  // Usar materiales ya filtrados del hook
  const materialesFiltrados = materialesDisponibles || [];

  // Usar agrupación por tipo ya calculada del hook  
  const materialesPorTipo = {
    cuerda: materialesFiltrados.filter(m => m.tipo === 'cuerda'),
    anclaje: materialesFiltrados.filter(m => m.tipo === 'anclaje'),
    varios: materialesFiltrados.filter(m => m.tipo === 'varios')
  };

  // Handlers optimizados
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleTipoFilter = useCallback((tipo: string) => {
    setFiltroTipo(tipo);
  }, []);

  // Handler para añadir material
  const handleAddMaterialBase = useCallback((selectedId: string, qty: number = 1) => {
    if (!selectedId) {
      toast({
        title: 'Error',
        description: messages.material.selector.seleccioneMaterial,
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    const material = materialesFiltrados.find(m => m.id === selectedId);
    
    if (!material) {
      toast({
        title: 'Error',
        description: messages.material.selector.materialNoEncontrado,
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const disponibilidadReal = calcularDisponibilidad(material);
    
    if (qty <= 0) {
      toast({
        title: messages.errors.general,
        description: messages.material.selector.errorCantidad,
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    if (disponibilidadReal < qty) {
      toast({
        title: messages.errors.general,
        description: messages.material.selector.errorDisponibilidad.replace('{cantidad}', disponibilidadReal.toString()),
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    try {
      append({
        id: `material-${material.id}-${Date.now()}`,
        materialId: material.id,
        nombre: material.nombre,
        cantidad: qty
      });
      
      toast({
        title: messages.material.selector.materialAnadido,
        description: messages.material.selector.materialAnadidoDesc.replace('{nombre}', material.nombre),
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error al añadir material:', error);
      toast({
        title: messages.errors.general,
        description: messages.material.selector.errorAnadir,
        status: 'error',
        duration: 3000,
      });
    }
  }, [materialesFiltrados, toast, calcularDisponibilidad, append]);

  const handleAddMaterial = useOptimizedClickHandler(handleAddMaterialBase);

  // Handler para eliminar material
  const handleRemoveMaterialBase = useCallback((index: number) => {
    remove(index);
  }, [remove]);
  const handleRemoveMaterial = useOptimizedClickHandler(handleRemoveMaterialBase);

  return (
    <Box>
      <Heading size="sm" mb={4}>Material necesario</Heading>
      
      {loadingMateriales ? (
        <Box textAlign="center" py={4}>
          <Spinner size="md" />
          <Text mt={2}>{messages.material.selector.cargando}</Text>
        </Box>
      ) : errorState ? (
        <Box p={3} bg="red.50" color="red.700" borderRadius="md">
          <Text>{errorState}</Text>
          <Button size="sm" mt={2} onClick={() => window.location.reload()}>
            {messages.actions.retry || "Reintentar"}
          </Button>
        </Box>
      ) : (
        <>
          {/* Sección de búsqueda y filtrado */}
          <Box mb={4}>
            <Flex direction={{ base: "column", md: "row" }} gap={3} mb={4}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input 
                  placeholder={messages.material.selector.buscarPlaceholder} 
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </InputGroup>
              
              {/* Filtro por tipo */}
              <Flex gap={2}>
                <Button 
                  size="md"
                  variant={filtroTipo === 'todos' ? "solid" : "outline"}
                  colorScheme={filtroTipo === 'todos' ? "brand" : "gray"}
                  onClick={() => handleTipoFilter('todos')}
                  leftIcon={<FiPackage />}
                >
                  {messages.material.selector.filtroTodos}
                </Button>
                <Button 
                  size="md"
                  variant={filtroTipo === 'cuerda' ? "solid" : "outline"}
                  colorScheme={filtroTipo === 'cuerda' ? "blue" : "gray"}
                  onClick={() => handleTipoFilter('cuerda')}
                >
                  {messages.material.selector.filtroCuerdas}
                </Button>
                <Button 
                  size="md"
                  variant={filtroTipo === 'anclaje' ? "solid" : "outline"}
                  colorScheme={filtroTipo === 'anclaje' ? "orange" : "gray"}
                  onClick={() => handleTipoFilter('anclaje')}
                >
                  {messages.material.selector.filtroAnclajes}
                </Button>
                <Button 
                  size="md"
                  variant={filtroTipo === 'varios' ? "solid" : "outline"}
                  colorScheme={filtroTipo === 'varios' ? "purple" : "gray"}
                  onClick={() => handleTipoFilter('varios')}
                >
                  {messages.material.selector.filtroVarios}
                </Button>
              </Flex>
            </Flex>
            
            {/* Vista del catálogo de materiales con Tabs */}
            <Tabs variant="enclosed" colorScheme="brand" isLazy>
              <TabList>
                <Tab>{messages.material.selector.tabTodos} ({materialesFiltrados.length})</Tab>
                <Tab>{messages.material.selector.tabCuerdas} ({materialesPorTipo.cuerda.length})</Tab>
                <Tab>{messages.material.selector.tabAnclajes} ({materialesPorTipo.anclaje.length})</Tab>
                <Tab>{messages.material.selector.tabVarios} ({materialesPorTipo.varios.length})</Tab>
              </TabList>
              
              <TabPanels>
                <TabPanel>
                  {materialesFiltrados.length === 0 ? (
                    <Box p={4} textAlign="center" bg="gray.50" borderRadius="md">
                      <Text>{messages.material.selector.sinMateriales}</Text>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3} mt={2}>
                      {materialesFiltrados.map(material => (
                        <MaterialCard 
                          key={material.id} 
                          material={material} 
                          disponibilidadReal={calcularDisponibilidad(material)}
                          handleAddMaterial={handleAddMaterial}
                          cardBg={cardBg}
                          borderColor={borderColor}
                          messages={messages}
                        />
                      ))}
                    </SimpleGrid>
                  )}
                </TabPanel>
                
                <TabPanel>
                  {materialesPorTipo.cuerda.length === 0 ? (
                    <Box p={4} textAlign="center" bg="gray.50" borderRadius="md">
                      <Text>{messages.material.selector.sinCuerdas}</Text>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3} mt={2}>
                      {materialesPorTipo.cuerda.map(material => (
                        <MaterialCard 
                          key={material.id} 
                          material={material} 
                          disponibilidadReal={calcularDisponibilidad(material)}
                          handleAddMaterial={handleAddMaterial}
                          cardBg={cardBg}
                          borderColor={borderColor}
                          messages={messages}
                        />
                      ))}
                    </SimpleGrid>
                  )}
                </TabPanel>
                
                <TabPanel>
                  {materialesPorTipo.anclaje.length === 0 ? (
                    <Box p={4} textAlign="center" bg="gray.50" borderRadius="md">
                      <Text>{messages.material.selector.sinAnclajes}</Text>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3} mt={2}>
                      {materialesPorTipo.anclaje.map(material => (
                        <MaterialCard 
                          key={material.id} 
                          material={material} 
                          disponibilidadReal={calcularDisponibilidad(material)}
                          handleAddMaterial={handleAddMaterial}
                          cardBg={cardBg}
                          borderColor={borderColor}
                          messages={messages}
                        />
                      ))}
                    </SimpleGrid>
                  )}
                </TabPanel>
                
                <TabPanel>
                  {materialesPorTipo.varios.length === 0 ? (
                    <Box p={4} textAlign="center" bg="gray.50" borderRadius="md">
                      <Text>{messages.material.selector.sinVarios}</Text>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3} mt={2}>
                      {materialesPorTipo.varios.map(material => (
                        <MaterialCard 
                          key={material.id} 
                          material={material} 
                          disponibilidadReal={calcularDisponibilidad(material)}
                          handleAddMaterial={handleAddMaterial}
                          cardBg={cardBg}
                          borderColor={borderColor}
                          messages={messages}
                        />
                      ))}
                    </SimpleGrid>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
          
          <Divider my={4} />
          
          {/* Lista de materiales seleccionados */}
          <Box mt={4}>
            <Heading size="sm" mb={3}>{messages.material.selector.seleccionados}</Heading>
            {typedFields.length > 0 ? (
              <Table variant="simple" size="sm" border="1px solid" borderColor="gray.200" borderRadius="md">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>{messages.material.selector.columnaMaterial}</Th>
                    <Th isNumeric>{messages.material.selector.columnaCantidad}</Th>
                    <Th width="50px"></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {typedFields.map((field, index) => (
                    <MaterialRow 
                      key={field.id || index} 
                      material={field} 
                      index={index}
                      handleSelect={() => handleRemoveMaterial(index)} 
                    />
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Box p={4} bg="gray.50" borderRadius="md" textAlign="center">
                <Text color="gray.500">{messages.material.selector.sinSeleccionados}</Text>
              </Box>
            )}
          </Box>
        </>
      )}
      
      {error && (
        <FormErrorMessage>
          {typeof error.message === 'string' 
            ? error.message 
            : 'Error en la selección de materiales'}
        </FormErrorMessage>
      )}
    </Box>
  );
};

export default MaterialSelector;