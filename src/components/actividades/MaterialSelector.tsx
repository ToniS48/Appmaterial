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
import { MaterialRepository } from '../../repositories/MaterialRepository';
import messages from '../../constants/messages';
import MaterialCard from '../material/MaterialCard';
import MaterialRow from '../material/MaterialRow';
import { useOptimizedClickHandler } from '../../utils/eventOptimizer';
import { Material, MaterialItem } from '../../types/material';

// Crear instancia del repositorio
const materialRepository = new MaterialRepository();

// Exponer repositorio globalmente para debugging (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  (window as any).materialRepository = materialRepository;
  (window as any).MaterialRepository = MaterialRepository;
  console.log('🔧 MaterialRepository expuesto globalmente para debugging');
}

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
  responsables?: {
    responsableActividadId?: string;
    responsableMaterialId?: string;
    creadorId?: string;
  };
  usuarios?: Array<{ uid: string; nombre: string; apellidos: string; }>;
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
  borderColor,
  responsables,
  usuarios = []
}) => {  // Estados locales
  const [searchTerm, setSearchTerm] = useState<string>('');
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
  }, []);  // Cargar materiales disponibles
  useEffect(() => {
    const cargarMateriales = async () => {
      try {
        console.log('🔍 MaterialSelector - Iniciando carga de materiales...');
        
        setLoadingMateriales(true);
        setErrorState(null);
        
        const materiales = await materialRepository.findMaterialesDisponibles();
        
        console.log(`📦 MaterialSelector - ${materiales?.length || 0} materiales cargados`);
        
        const materialesItems = (materiales || []).map(convertirMaterialAItem);
        
        setMaterialesDisponibles(materialesItems);
        console.log('✅ MaterialSelector - Materiales cargados exitosamente');
        
        // Exponer datos para debugging
        if (process.env.NODE_ENV === 'development') {
          (window as any).lastLoadedMateriales = materiales;
          (window as any).lastConvertedMateriales = materialesItems;
        }
        
      } catch (error) {
        console.error('❌ MaterialSelector - Error cargando materiales:', error);
        setErrorState('Error cargando materiales: ' + (error instanceof Error ? error.message : String(error)));
        
        // Exponer error para debugging
        if (process.env.NODE_ENV === 'development') {
          (window as any).lastMaterialError = error;
        }
      } finally {
        setLoadingMateriales(false);
        console.log('🏁 MaterialSelector - Proceso de carga finalizado');
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
  }, [typedFields]);  // Función para filtrar materiales por búsqueda
  const filtrarPorBusqueda = useCallback((materiales: MaterialItem[]) => {
    if (!searchTerm.trim()) return materiales;
    
    const termino = searchTerm.toLowerCase();
    return materiales.filter(material => 
      material.nombre.toLowerCase().includes(termino) ||
      material.codigo?.toLowerCase().includes(termino) ||
      material.descripcion?.toLowerCase().includes(termino)
    );
  }, [searchTerm]);

  // Usar materiales ya filtrados del hook
  const materialesFiltrados = filtrarPorBusqueda(materialesDisponibles || []);

  // Usar agrupación por tipo ya calculada del hook con filtro de búsqueda aplicado
  const materialesPorTipo = {
    cuerda: filtrarPorBusqueda(materialesDisponibles.filter(m => m.tipo === 'cuerda')),
    anclaje: filtrarPorBusqueda(materialesDisponibles.filter(m => m.tipo === 'anclaje')),
    varios: filtrarPorBusqueda(materialesDisponibles.filter(m => m.tipo === 'varios'))
  };
  // Handlers optimizados
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
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
  // Función helper para obtener nombre del usuario
  const obtenerNombreUsuario = useCallback((uid: string) => {
    const usuario = usuarios.find(u => u.uid === uid);
    return usuario ? `${usuario.nombre} ${usuario.apellidos}`.trim() : uid;
  }, [usuarios]);

  // Función helper para renderizar información de responsables
  const renderizarResponsables = useCallback(() => {
    if (!responsables) return null;

    const responsableActividad = responsables.responsableActividadId ? 
      obtenerNombreUsuario(responsables.responsableActividadId) : null;
    const responsableMaterial = responsables.responsableMaterialId ? 
      obtenerNombreUsuario(responsables.responsableMaterialId) : null;

    if (!responsableActividad && !responsableMaterial) return null;

    return (
      <Text fontSize="sm" color="gray.600" mt={1}>
        {responsableActividad && (
          <Text as="span">
            Responsable de actividad: <Text as="span" fontWeight="medium">{responsableActividad}</Text>
          </Text>
        )}
        {responsableActividad && responsableMaterial && <Text as="span"> • </Text>}
        {responsableMaterial && (
          <Text as="span">
            Responsable de material: <Text as="span" fontWeight="medium">{responsableMaterial}</Text>
          </Text>
        )}
      </Text>
    );
  }, [responsables, obtenerNombreUsuario]);

  return (
    <Box>
      <Heading size="sm" mb={2}>Material necesario</Heading>
      {renderizarResponsables()}
      <Box mb={4}></Box>
        {/* El panel de debug fue removido ya que el problema está resuelto */}
      {/* Logging disponible en consola del navegador */}
      
      {loadingMateriales ? (
        <Box textAlign="center" py={4}>
          <Spinner size="md" />
          <Text mt={2}>{messages.material.selector.cargando}</Text>
        </Box>      ) : errorState ? (
        <Box p={3} bg="red.50" color="red.700" borderRadius="md">
          <Text>{errorState}</Text>          <Button 
            size="sm" 
            mt={2} 
            onClick={async () => {
              console.log('🔄 MaterialSelector - Botón Reintentar presionado');
              setErrorState(null);
              setLoadingMateriales(true);
              // Reinicializar la carga de materiales sin recargar la página
              const cargarMateriales = async () => {
                try {
                  console.log('🔍 MaterialSelector - Reintentando carga de materiales...');
                  const materiales = await materialRepository.findMaterialesDisponibles();
                  console.log('📦 MaterialSelector - Materiales obtenidos en reintentar:', materiales);
                  const materialesItems = (materiales || []).map(convertirMaterialAItem);
                  console.log('🔄 MaterialSelector - Materiales convertidos en reintentar:', materialesItems);
                  setMaterialesDisponibles(materialesItems);
                  console.log('✅ MaterialSelector - Reintento exitoso');
                } catch (error) {
                  console.error('❌ MaterialSelector - Error recargando materiales:', error);
                  setErrorState('Error al recargar materiales');
                } finally {
                  setLoadingMateriales(false);
                  console.log('🏁 MaterialSelector - Reintento finalizado');
                }
              };
              await cargarMateriales();
            }}
          >
            {messages.actions.retry || "Reintentar"}
          </Button>
        </Box>
      ) : (
        <>          {/* Sección de búsqueda */}
          <Box mb={4}>
            <InputGroup mb={4}>
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input 
                placeholder={messages.material.selector.buscarPlaceholder} 
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </InputGroup>
            
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