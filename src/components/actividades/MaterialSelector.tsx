
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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


// OPTIMIZACIONES DE RENDIMIENTO
// ==============================

// Función para diferir callbacks pesados
const deferCallback = (callback: () => void, priority: 'high' | 'normal' | 'low' = 'normal') => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    const timeout = priority === 'high' ? 100 : priority === 'normal' ? 300 : 1000;
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    const delay = priority === 'high' ? 16 : priority === 'normal' ? 100 : 300;
    setTimeout(callback, delay);
  }
};

// Hook para throttling de búsquedas
const useThrottledSearch = (value: string, delay: number = 300) => {
  const [throttledValue, setThrottledValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setThrottledValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
};

// Hook para optimizar operaciones de adición/eliminación
const useOptimizedFieldOperations = (append: any, remove: any) => {
  const [isOperating, setIsOperating] = useState(false);

  const optimizedAppend = useCallback((material: any) => {
    if (isOperating) return;
    
    setIsOperating(true);
    deferCallback(() => {
      try {
        append(material);
      } finally {
        setIsOperating(false);
      }
    }, 'high');
  }, [append, isOperating]);

  const optimizedRemove = useCallback((index: number) => {
    if (isOperating) return;
    
    setIsOperating(true);
    deferCallback(() => {
      try {
        remove(index);
      } finally {
        setIsOperating(false);
      }
    }, 'high');
  }, [remove, isOperating]);

  return { optimizedAppend, optimizedRemove, isOperating };
};

interface MaterialSelectorProps {

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

  const [materiales, setMateriales] = useState<MaterialItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<string | null>(null);
    // Nuevos estados para el selector visual

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  
  // Aplicar throttling a la búsqueda para mejorar rendimiento
  const throttledSearchTerm = useThrottledSearch(searchTerm, 300);
  
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
  }, [toast]);

  // Convertir fields para tipado seguro
  const typedFields = fields as MaterialField[];

  // Función para calcular la disponibilidad real
  const calcularDisponibilidadReal = (material: MaterialItem): number => {
    // Obtener cuántas unidades ya están seleccionadas en la sesión actual
    const seleccionadasActualmente = typedFields
      .filter(field => field.materialId === material.id)
      .reduce((total, field) => total + (typeof field.cantidad === 'number' ? field.cantidad : parseInt(field.cantidad as any, 10) || 0), 0);
    
    // Asegurar que cantidadDisponible sea un número
    const cantidadDisp = typeof material.cantidadDisponible === 'number' ? 
      material.cantidadDisponible : 
      parseInt(material.cantidadDisponible as any, 10) || 0;
    
    // Usar precisión entera para evitar problemas de decimales
    return Math.max(0, cantidadDisp - seleccionadasActualmente);
  };

  // Filtrar materiales ya seleccionados de forma segura
  const materialesDisponibles = materiales.filter(material => {
    // Solo filtrar si el ID está presente
    if (!material.id) return false;
    
    // NO filtrar materiales seleccionados para materiales múltiples (anclajes/varios)
    // Solo filtrar si es un material individual como una cuerda
    if (material.tipo === 'anclaje' || material.tipo === 'varios') {
      return true; // Siempre mostrar materiales con múltiples unidades
    }
    
    // Para materiales individuales como cuerdas, verificar que no estén ya seleccionados
    return !typedFields.some(field => field.materialId === material.id);
  });
  // Memoiza los resultados del filtrado para evitar cálculos repetitivos
  const materialesFiltrados = React.useMemo(() => {
    return materialesDisponibles.filter(material => {
      // Calcular disponibilidad real
      const disponibilidadReal = calcularDisponibilidadReal(material);
      
      // Filtrar por término de búsqueda throttled
      const matchesSearch = throttledSearchTerm.trim() === '' ||
                          material.nombre.toLowerCase().includes(throttledSearchTerm.toLowerCase()) ||
                          (material.codigo && material.codigo.toLowerCase().includes(throttledSearchTerm.toLowerCase()));
      
      // Filtrar por tipo
      const matchesTipo = filtroTipo === 'todos' || material.tipo === filtroTipo;
      
      // Solo incluir si tiene disponibilidad real y coincide con los filtros
      return disponibilidadReal > 0 && matchesSearch && matchesTipo;
    });
  }, [materialesDisponibles, typedFields, throttledSearchTerm, filtroTipo, calcularDisponibilidadReal]);
  
  // También memoiza las listas por tipo
  const materialesCuerda = React.useMemo(() => 
    materialesFiltrados.filter(m => m.tipo === 'cuerda'),
    [materialesFiltrados]
  );
  
  const materialesAnclaje = React.useMemo(() => 
    materialesFiltrados.filter(m => m.tipo === 'anclaje'),
    [materialesFiltrados]
  );
  
  const materialesVarios = React.useMemo(() => 
    materialesFiltrados.filter(m => m.tipo === 'varios'),
    [materialesFiltrados]
  );

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
    

    // Diferir la validación y operación para evitar bloqueos
    deferCallback(() => {
      try {
        // Calcular disponibilidad real
        const disponibilidadReal = calcularDisponibilidadReal(material);
        
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
        
        // Agregar el material a la lista
        append({
          id: Date.now().toString(), // Generar un ID único
          materialId: material.id,
          nombre: material.nombre,
          cantidad: qty
        });
        
        // Resetear selección
        setSelectedMaterial('');
        setCantidad(1);
        
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
    }, 'high');
  }, [materiales, toast, append, setSelectedMaterial, setCantidad, calcularDisponibilidadReal]);

  // Throttle del handler para evitar múltiples ejecuciones rápidas
  const handleAddMaterial = useMemo(() => {
    let lastCall = 0;
    const throttleDelay = 300; // 300ms de throttle

    return (selectedId: string, qty: number = 1) => {
      const now = Date.now();
      if (now - lastCall >= throttleDelay) {
        lastCall = now;
        handleAddMaterialBase(selectedId, qty);
      }
    };
  }, [handleAddMaterialBase]);

  // Componente de tarjeta de material
  const MaterialCard = React.memo(({ material }: { material: MaterialItem }) => {
    const disponibilidadReal = calcularDisponibilidadReal(material);
    // Usar React.useRef para trackear la disponibilidad anterior y detectar cambios
    const prevDisponibilidadRef = React.useRef(disponibilidadReal);
    
    // Inicializar con cantidad 1, siempre que haya al menos 1 disponible
    const [qty, setQty] = useState(disponibilidadReal > 0 ? 1 : 0);
    
    // Ajustar automáticamente la cantidad cuando cambia la disponibilidad
    useEffect(() => {
      // Solo actuar si la disponibilidad ha cambiado desde el último render
      if (prevDisponibilidadRef.current !== disponibilidadReal) {
        console.log(`Disponibilidad de ${material.nombre} cambió: ${prevDisponibilidadRef.current} -> ${disponibilidadReal}`);
        
        if (disponibilidadReal === 0) {
          // Si no hay disponibles, forzar a 0
          setQty(0);
        } else if (qty > disponibilidadReal) {
          // Si hay menos disponibles que la cantidad seleccionada, ajustar
          setQty(disponibilidadReal);
        } else if (qty === 0 && disponibilidadReal > 0) {
          // Si había 0 seleccionado pero ahora hay disponibles, seleccionar 1
          setQty(1);
        }
        
        // Actualizar la referencia para el próximo render
        prevDisponibilidadRef.current = disponibilidadReal;
      }
    }, [disponibilidadReal, qty, material.nombre]);
    
    return (
      <Card 
        variant="outline" 
        size="sm" 
        borderWidth="1px" 
        borderRadius="md" 
        _hover={{ borderColor: "brand.300", shadow: "sm" }}
        bg={disponibilidadReal === 0 ? "gray.50" : cardBg || "white"}
        borderColor={borderColor}
      >
        <CardBody p={3}>
          <Flex direction="column" justify="space-between" height="100%">
            <Box mb={2}>
              <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{material.nombre}</Text>
              {material.codigo && (
                <Text fontSize="xs" color="gray.500">Código: {material.codigo}</Text>
              )}
            </Box>
            
            <Flex justify="space-between" align="center" mt={2}>
              <Badge 
                colorScheme={
                  material.tipo === 'cuerda' ? 'blue' : 
                  material.tipo === 'anclaje' ? 'orange' : 'purple'
                }
                fontSize="xs"
              >
                {material.tipo === 'cuerda' ? 'Cuerda' : 
                 material.tipo === 'anclaje' ? 'Anclaje' : 'Varios'}
              </Badge>
              <Text 
                fontSize="xs" 
                fontWeight="medium"
                color={disponibilidadReal === 0 ? "red.600" : 
                      disponibilidadReal < 5 ? "orange.600" : "green.600"}
              >
                {disponibilidadReal} {messages.material.selector.disponible}{disponibilidadReal !== 1 ? 's' : ''}
              </Text>
            </Flex>
            
            <Divider my={2} />
            
            <Flex justify="space-between" align="center" mt={2}>
              <Flex align="center">
                <IconButton 
                  aria-label="Decrementar" 
                  icon={<FiMinus />} 
                  size="xs"
                  variant="outline"
                  isDisabled={qty <= 1}
                  onClick={() => setQty(prev => Math.max(1, prev - 1))}
                />
                <Text mx={2} fontSize="sm" fontWeight="bold">{qty}</Text>
                <IconButton 
                  aria-label="Incrementar" 
                  icon={<FiPlus />} 
                  size="xs"
                  variant="outline"
                  isDisabled={qty >= disponibilidadReal}
                  onClick={() => setQty(prev => Math.min(disponibilidadReal, prev + 1))}
                />
              </Flex>              <Button 
                size="sm"
                colorScheme="brand"
                isDisabled={disponibilidadReal <= 0 || qty <= 0}
                onClick={() => handleAddMaterial(material.id, qty)}
              >
                {messages.material.selector.botonAnadir}
              </Button>
            </Flex>
          </Flex>
        </CardBody>
      </Card>
    );
  });

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