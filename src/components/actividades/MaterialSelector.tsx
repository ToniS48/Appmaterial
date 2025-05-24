import React, { useState, useEffect, useCallback } from 'react';
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
import { Control, useFieldArray } from 'react-hook-form';
import messages from '../../constants/messages';

// Importaciones específicas para el nuevo refactor
import { useMaterialQuery } from '../../utils/useMaterialQuery';
import { normalizarMaterial } from '../../utils/materialUtils';
import MaterialCard from '../material/MaterialCard';
import MaterialRow from '../material/MaterialRow';
import { MaterialItem, MaterialField } from '../material/types';
import { debounce } from '../../utils/performanceUtils';
import { useOptimizedClickHandler, useOptimizedMessageHandler } from '../../utils/eventOptimizer';

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
}) => {
  // Estados para el componente
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  
  const toast = useToast();
  
  // Usar useFieldArray para manejar el array de materiales
  const { fields, append, remove } = useFieldArray({
    control,
    name
  });
  
  // Convertir fields para tipado seguro
  const typedFields = fields as MaterialField[];
  
  // Usar el hook personalizado para consultas de materiales
  const {
    materialesFiltrados,
    materialesPorTipo,
    isLoading,
    error: errorState,
    calcularDisponibilidad,
    recargarMateriales
  } = useMaterialQuery(typedFields, searchTerm, filtroTipo);
    // Función base para manejar cambios en la búsqueda
  const handleSearchChangeBase = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);
  
  // Versión optimizada con debounce para evitar violaciones
  const handleSearchChange = useCallback(
    debounce(handleSearchChangeBase, 300),
    []
  );
  
  // Función base para filtros de tipo
  const handleTipoFilterBase = useCallback((tipo: string) => {
    setFiltroTipo(tipo);
  }, []);
  
  // Versión optimizada de los filtros de tipo
  const handleTipoFilter = useOptimizedClickHandler(handleTipoFilterBase);
  
  // Inicializar con materiales existentes si se proporcionan
  useEffect(() => {
    if (!materialesActuales?.length) return;
    
    // Evitar bloquear el hilo principal con un procesamiento por lotes
    let isMounted = true;
    
    // Función para procesar lotes de operaciones
    const processMaterialesEnLotes = async () => {
      if (!isMounted) return;
      
      try {
        // Primero eliminar todos los materiales existentes
        if (fields.length > 0) {
          // Eliminar en un ciclo separado para evitar problemas de índices
          // Eliminar desde el final para no afectar índices previos
          for (let i = fields.length - 1; i >= 0; i--) {
            if (!isMounted) return;
            await new Promise(resolve => setTimeout(resolve, 0)); // Yield al event loop
            remove(i);
          }
        }
        
        if (!isMounted) return;
        
        // Normalizar materiales
        const materialesValidados = materialesActuales
          .filter(m => m && m.materialId)
          .map(material => normalizarMaterial(material));
        
        // Si hay muchos, procesar en lotes
        if (materialesValidados.length > 0) {
          const batchSize = 5;
          
          for (let i = 0; i < materialesValidados.length; i += batchSize) {
            if (!isMounted) return;
            
            const batch = materialesValidados.slice(i, i + batchSize);
            await new Promise(resolve => {
              requestAnimationFrame(() => {
                append(batch);
                resolve(null);
              });
            });
          }
        }
      } catch (error) {
        console.error("Error al inicializar materiales:", error);
      }
    };
    
    // Iniciar proceso asíncrono
    processMaterialesEnLotes();
    
    // Limpieza
    return () => {
      isMounted = false;
    };
  }, [materialesActuales, append, remove, fields.length]);
  // Manejar la adición de un material a la lista con validación adicional
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
    
    // Buscar el material en la caché global de materiales del hook
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
    
    // Calcular disponibilidad real
    const disponibilidadReal = calcularDisponibilidad(material);
    
    // Validar cantidad con la disponibilidad real
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
      // Agregar el material a la lista con un ID estable
      append({
        id: `material-${material.id}`,
        materialId: material.id,
        nombre: material.nombre,
        cantidad: qty
      });
      
      // Mostrar mensaje de éxito
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

  // Versión optimizada con nuestro hook personalizado
  const handleAddMaterial = useOptimizedClickHandler(handleAddMaterialBase);

  // Base para eliminar materiales
  const handleRemoveMaterialBase = useCallback((index: number) => {
    remove(index);
  }, [remove]);
  
  // Versión optimizada para eliminar materiales
  const handleRemoveMaterial = useOptimizedClickHandler(handleRemoveMaterialBase);

  return (
    <Box>
      <Heading size="sm" mb={4}>Material necesario</Heading>
      
      {isLoading ? (
        <Box textAlign="center" py={4}>
          <Spinner size="md" />
          <Text mt={2}>{messages.material.selector.cargando}</Text>
        </Box>
      ) : errorState ? (
        <Box p={3} bg="red.50" color="red.700" borderRadius="md">
          <Text>{errorState}</Text>
          <Button size="sm" mt={2} onClick={() => recargarMateriales()}>
            {messages.actions.retry || "Reintentar"}
          </Button>
        </Box>
      ) : (
        <>
          {/* Sección de búsqueda y filtrado */}
          <Box mb={4}>
            <Flex direction={{ base: "column", md: "row" }} gap={3} mb={4}>
              {/* Buscador con debounce */}
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input 
                  placeholder={messages.material.selector.buscarPlaceholder} 
                  defaultValue={searchTerm}
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
            
            {/* Vista del catálogo de materiales con Tabs Lazy */}
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