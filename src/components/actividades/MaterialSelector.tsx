import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Text,
  FormErrorMessage,
  useToast,
  Spinner,
  SimpleGrid,
  Flex,
  Badge,
  Card,
  CardBody,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Divider
} from '@chakra-ui/react';
import { DeleteIcon, SearchIcon } from '@chakra-ui/icons';
import { FiPackage, FiMinus, FiPlus } from 'react-icons/fi';
import { Control, useFieldArray, FieldErrors } from 'react-hook-form';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import messages from '../../constants/messages';  // Añadir esta importación

interface MaterialSelectorProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  existingMaterials?: MaterialField[];
}

// Definir interfaz para los materiales
interface MaterialItem {
  id: string;
  nombre: string;
  tipo: string;
  estado: string;
  cantidadDisponible: number;
  codigo?: string;
  descripcion?: string;
}

// Definir tipo para los campos de materiales
interface MaterialField {
  id: string;
  materialId: string;
  nombre: string;
  cantidad: number;
}

const MaterialSelector: React.FC<MaterialSelectorProps> = ({ control, errors, existingMaterials = [] }) => {
  // Estados para el componente
  const [materiales, setMateriales] = useState<MaterialItem[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Nuevos estados para el selector visual
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  
  const toast = useToast();
  
  // Usar useFieldArray para manejar el array de materiales
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'materiales'
  });
  
  // Inicializar con materiales existentes si se proporcionan
  useEffect(() => {
    if (existingMaterials && existingMaterials.length > 0) {
      // Verificar si ya están cargados en fields para evitar duplicados
      const existingIds = fields.map((field: any) => field.materialId);
      const newMaterials = existingMaterials.filter(mat => !existingIds.includes(mat.materialId));
      
      if (newMaterials.length > 0) {
        // Usar un setTimeout para asegurar que este código se ejecute después de que React haya actualizado el DOM
        setTimeout(() => {
          newMaterials.forEach(material => {
            append(material);
          });
        }, 0);
      }
    }
  }, [existingMaterials]); 
  
  // Cargar materiales disponibles en tiempo real
  useEffect(() => {
    let unsubscribe: () => void;
    
    const setupMaterialesListener = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Crear una consulta que filtre por materiales disponibles
        const materialesQuery = query(
          collection(db, 'material_deportivo'),
          where('estado', '==', 'disponible')
        );
        
        // Configurar el listener en tiempo real
        unsubscribe = onSnapshot(
          materialesQuery,
          (snapshot) => {
            // Cuando lleguen datos nuevos, actualizar el estado
            const materialesTransformados = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                nombre: data.nombre || 'Sin nombre',
                tipo: data.tipo || 'varios',
                estado: data.estado || 'disponible',
                // Convertir explícitamente a número
                cantidadDisponible: parseInt(data.cantidadDisponible, 10) || 1,
                codigo: data.codigo || '',
                descripcion: data.descripcion || ''
              } as MaterialItem;
            });
            
            setMateriales(materialesTransformados);
            setIsLoading(false);
          },
          (error) => {
            console.error('Error en el listener de materiales:', error);
            setError(`Error al monitorear materiales: ${error.message || 'Error desconocido'}`);
            setIsLoading(false);
            
            toast({
              title: 'Error',
              description: messages.material.selector.errorCargarMateriales,
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        );
      } catch (error: any) {
        console.error('Error al configurar listener de materiales:', error);
        setError(`Error al configurar monitoreo: ${error.message || 'Error desconocido'}`);
        setIsLoading(false);
      }
    };
    
    setupMaterialesListener();
    
    // Función de limpieza para desuscribirse del listener cuando el componente se desmonte
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
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
      
      // Filtrar por término de búsqueda
      const matchesSearch = material.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (material.codigo && material.codigo.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtrar por tipo
      const matchesTipo = filtroTipo === 'todos' || material.tipo === filtroTipo;
      
      // Solo incluir si tiene disponibilidad real y coincide con los filtros
      return disponibilidadReal > 0 && matchesSearch && matchesTipo;
    });
  }, [materialesDisponibles, typedFields, searchTerm, filtroTipo]);
  
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

  // Manejar la adición de un material a la lista con validación adicional
  const handleAddMaterial = (selectedId: string, qty: number = 1) => {
    if (!selectedId) {
      toast({
        title: 'Error',
        description: messages.material.selector.seleccioneMaterial,
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    const material = materiales.find(m => m.id === selectedId);
    
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
    
    try {
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
  };

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
        bg={disponibilidadReal === 0 ? "gray.50" : "white"}
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
              </Flex>
              <Button 
                size="sm"
                colorScheme="brand"
                isDisabled={disponibilidadReal <= 0 || qty <= 0}
              >
                {messages.material.selector.botonAnadir}
              </Button>
            </Flex>
          </Flex>
        </CardBody>
      </Card>
    );
  });

  return (
    <Box>
      <Heading size="sm" mb={4}>Material necesario</Heading>
      
      {isLoading ? (
        <Box textAlign="center" py={4}>
          <Spinner size="md" />
          <Text mt={2}>{messages.material.selector.cargando}</Text>
        </Box>
      ) : error ? (
        <Box p={3} bg="red.50" color="red.700" borderRadius="md">
          <Text>{error}</Text>
          <Button size="sm" mt={2} onClick={() => window.location.reload()}>
            {messages.actions.retry || "Reintentar"}
          </Button>
        </Box>
      ) : (
        <>
          {/* Sección de búsqueda y filtrado */}
          <Box mb={4}>
            <Flex direction={{ base: "column", md: "row" }} gap={3} mb={4}>
              {/* Buscador */}
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input 
                  placeholder={messages.material.selector.buscarPlaceholder} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
              {/* Filtro por tipo */}
              <Flex gap={2}>
                <Button 
                  size="md"
                  variant={filtroTipo === 'todos' ? "solid" : "outline"}
                  colorScheme={filtroTipo === 'todos' ? "brand" : "gray"}
                  onClick={() => setFiltroTipo('todos')}
                  leftIcon={<FiPackage />}
                >
                  {messages.material.selector.filtroTodos}
                </Button>
                <Button 
                  size="md"
                  variant={filtroTipo === 'cuerda' ? "solid" : "outline"}
                  colorScheme={filtroTipo === 'cuerda' ? "blue" : "gray"}
                  onClick={() => setFiltroTipo('cuerda')}
                >
                  {messages.material.selector.filtroCuerdas}
                </Button>
                <Button 
                  size="md"
                  variant={filtroTipo === 'anclaje' ? "solid" : "outline"}
                  colorScheme={filtroTipo === 'anclaje' ? "orange" : "gray"}
                  onClick={() => setFiltroTipo('anclaje')}
                >
                  {messages.material.selector.filtroAnclajes}
                </Button>
                <Button 
                  size="md"
                  variant={filtroTipo === 'varios' ? "solid" : "outline"}
                  colorScheme={filtroTipo === 'varios' ? "purple" : "gray"}
                  onClick={() => setFiltroTipo('varios')}
                >
                  {messages.material.selector.filtroVarios}
                </Button>
              </Flex>
            </Flex>
            
            {/* Vista del catálogo de materiales */}
            <Tabs variant="enclosed" colorScheme="brand" isLazy>
              <TabList>
                <Tab>{messages.material.selector.tabTodos} ({materialesFiltrados.length})</Tab>
                <Tab>{messages.material.selector.tabCuerdas} ({materialesCuerda.length})</Tab>
                <Tab>{messages.material.selector.tabAnclajes} ({materialesAnclaje.length})</Tab>
                <Tab>{messages.material.selector.tabVarios} ({materialesVarios.length})</Tab>
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
                        <MaterialCard key={material.id} material={material} />
                      ))}
                    </SimpleGrid>
                  )}
                </TabPanel>
                
                <TabPanel>
                  {materialesCuerda.length === 0 ? (
                    <Box p={4} textAlign="center" bg="gray.50" borderRadius="md">
                      <Text>{messages.material.selector.sinCuerdas}</Text>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3} mt={2}>
                      {materialesCuerda.map(material => (
                        <MaterialCard key={material.id} material={material} />
                      ))}
                    </SimpleGrid>
                  )}
                </TabPanel>
                
                <TabPanel>
                  {materialesAnclaje.length === 0 ? (
                    <Box p={4} textAlign="center" bg="gray.50" borderRadius="md">
                      <Text>{messages.material.selector.sinAnclajes}</Text>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3} mt={2}>
                      {materialesAnclaje.map(material => (
                        <MaterialCard key={material.id} material={material} />
                      ))}
                    </SimpleGrid>
                  )}
                </TabPanel>
                
                <TabPanel>
                  {materialesVarios.length === 0 ? (
                    <Box p={4} textAlign="center" bg="gray.50" borderRadius="md">
                      <Text>{messages.material.selector.sinVarios}</Text>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3} mt={2}>
                      {materialesVarios.map(material => (
                        <MaterialCard key={material.id} material={material} />
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
                    <Tr key={field.id || index}>
                      <Td>{field.nombre || "Sin nombre"}</Td>
                      <Td isNumeric>{field.cantidad}</Td>
                      <Td>
                        <IconButton
                          aria-label="Eliminar material"
                          icon={<DeleteIcon />}
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => remove(index)}
                        />
                      </Td>
                    </Tr>
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
      
      {errors.materiales && (
        <FormErrorMessage>
          {typeof errors.materiales.message === 'string' 
            ? errors.materiales.message 
            : 'Error en la selección de materiales'}
        </FormErrorMessage>
      )}
    </Box>
  );
};

export default MaterialSelector;