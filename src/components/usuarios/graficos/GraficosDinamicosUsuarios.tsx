/**
 * Componente principal para gráficos dinámicos de usuarios
 * Integra configuración, análisis y visualización
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Grid,
  GridItem,
  Button,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Tooltip,
  Card,
  CardBody,
  Text,
  Badge,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { 
  FiPlus, 
  FiSave, 
  FiTrash2, 
  FiCopy, 
  FiDownload,
  FiRefreshCw,
  FiBarChart2
} from 'react-icons/fi';
import { Usuario } from '../../../types/usuario';
import { 
  ConfiguracionGrafico, 
  ResultadoAnalisis, 
  CONFIGURACIONES_PREDEFINIDAS
} from './tipos';
import { analisisUsuariosService } from './analisisService';
import ConfiguradorGraficos from './ConfiguradorGraficos';
import VisualizadorGraficos from './VisualizadorGraficos';

interface GraficosDinamicosUsuariosProps {
  usuarios: Usuario[];
  onUsuariosChange?: () => void;
}

const GraficosDinamicosUsuarios: React.FC<GraficosDinamicosUsuariosProps> = ({
  usuarios,
  onUsuariosChange
}) => {
  const toast = useToast();
  
  // Estados para múltiples gráficos
  const [graficos, setGraficos] = useState<ConfiguracionGrafico[]>([]);
  const [resultados, setResultados] = useState<Map<string, ResultadoAnalisis>>(new Map());
  const [graficoActivo, setGraficoActivo] = useState<string>('');
  const [cargando, setCargando] = useState<Map<string, boolean>>(new Map());
  const [errores, setErrores] = useState<Map<string, string>>(new Map());
  
  // Inicializar con algunas configuraciones predefinidas
  useEffect(() => {
    if (graficos.length === 0) {
      const configuracionesIniciales = CONFIGURACIONES_PREDEFINIDAS.slice(0, 3);
      setGraficos(configuracionesIniciales);
      if (configuracionesIniciales.length > 0) {
        setGraficoActivo(configuracionesIniciales[0].id);
      }
    }
  }, [graficos.length]);

  // Generar análisis para un gráfico específico
  const generarAnalisis = useCallback(async (configuracion: ConfiguracionGrafico) => {
    setCargando(prev => new Map(prev.set(configuracion.id, true)));
    setErrores(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(configuracion.id);
      return newErrors;
    });

    try {
      const resultado = await analisisUsuariosService.analizarUsuarios(usuarios, configuracion);
      setResultados(prev => new Map(prev.set(configuracion.id, resultado)));
      
      toast({
        title: 'Análisis completado',
        description: `Gráfico "${configuracion.titulo}" actualizado exitosamente`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error generando análisis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setErrores(prev => new Map(prev.set(configuracion.id, errorMessage)));
      
      toast({
        title: 'Error en el análisis',
        description: `No se pudo generar el gráfico: ${errorMessage}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCargando(prev => new Map(prev.set(configuracion.id, false)));
    }
  }, [usuarios, toast]);

  // Actualizar configuración de un gráfico
  const actualizarConfiguracion = useCallback((nuevaConfiguracion: ConfiguracionGrafico) => {
    setGraficos(prev => prev.map(grafico => 
      grafico.id === nuevaConfiguracion.id ? nuevaConfiguracion : grafico
    ));
    
    // Regenerar análisis automáticamente
    generarAnalisis(nuevaConfiguracion);
  }, [generarAnalisis]);

  // Añadir nuevo gráfico
  const añadirGrafico = () => {
    const nuevoId = `grafico-${Date.now()}`;
    const nuevaConfiguracion: ConfiguracionGrafico = {
      ...CONFIGURACIONES_PREDEFINIDAS[0],
      id: nuevoId,
      titulo: `Nuevo Gráfico ${graficos.length + 1}`
    };
    
    setGraficos(prev => [...prev, nuevaConfiguracion]);
    setGraficoActivo(nuevoId);
    generarAnalisis(nuevaConfiguracion);
  };

  // Eliminar gráfico
  const eliminarGrafico = (id: string) => {
    setGraficos(prev => prev.filter(g => g.id !== id));
    setResultados(prev => {
      const newResults = new Map(prev);
      newResults.delete(id);
      return newResults;
    });
    setCargando(prev => {
      const newLoading = new Map(prev);
      newLoading.delete(id);
      return newLoading;
    });
    setErrores(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(id);
      return newErrors;
    });
    
    // Si eliminamos el gráfico activo, cambiar a otro
    if (graficoActivo === id && graficos.length > 1) {
      const otroGrafico = graficos.find(g => g.id !== id);
      if (otroGrafico) {
        setGraficoActivo(otroGrafico.id);
      }
    }
  };

  // Duplicar gráfico
  const duplicarGrafico = (configuracion: ConfiguracionGrafico) => {
    const nuevoId = `${configuracion.id}-copia-${Date.now()}`;
    const nuevaConfiguracion: ConfiguracionGrafico = {
      ...configuracion,
      id: nuevoId,
      titulo: `${configuracion.titulo} (Copia)`
    };
    
    setGraficos(prev => [...prev, nuevaConfiguracion]);
    setGraficoActivo(nuevoId);
    generarAnalisis(nuevaConfiguracion);
  };

  // Actualizar todos los gráficos
  const actualizarTodos = () => {
    graficos.forEach(configuracion => {
      generarAnalisis(configuracion);
    });
  };

  // Exportar configuraciones
  const exportarConfiguraciones = () => {
    const data = JSON.stringify(graficos, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `configuraciones-graficos-usuarios-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Configuraciones exportadas',
      description: 'Las configuraciones se han descargado exitosamente',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const configuracionActiva = graficos.find(g => g.id === graficoActivo);
  const resultadoActivo = resultados.get(graficoActivo);
  const cargandoActivo = cargando.get(graficoActivo) || false;
  const errorActivo = errores.get(graficoActivo);

  if (usuarios.length === 0) {
    return (
      <Alert status="info">
        <AlertIcon />
        <Box>
          <AlertTitle>Sin datos de usuarios</AlertTitle>
          <AlertDescription>
            No hay usuarios disponibles para generar gráficos. Asegúrate de que hay usuarios registrados en el sistema.
          </AlertDescription>
        </Box>
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Barra de herramientas */}
      <HStack justify="space-between" wrap="wrap" spacing={4}>
        <HStack spacing={2}>
          <Text fontSize="lg" fontWeight="medium">
            Gráficos Dinámicos
          </Text>
          <Badge colorScheme="blue" variant="outline">
            {usuarios.length} usuarios
          </Badge>
        </HStack>
        
        <Wrap spacing={2}>
          <WrapItem>
            <Button
              leftIcon={<FiPlus />}
              size="sm"
              colorScheme="blue"
              onClick={añadirGrafico}
            >
              Nuevo Gráfico
            </Button>
          </WrapItem>
          <WrapItem>
            <Button
              leftIcon={<FiRefreshCw />}
              size="sm"
              variant="outline"
              onClick={actualizarTodos}
              isLoading={Array.from(cargando.values()).some(Boolean)}
            >
              Actualizar Todos
            </Button>
          </WrapItem>
          <WrapItem>
            <Button
              leftIcon={<FiDownload />}
              size="sm"
              variant="outline"
              onClick={exportarConfiguraciones}
            >
              Exportar
            </Button>
          </WrapItem>
        </Wrap>
      </HStack>

      {/* Pestañas de gráficos */}
      {graficos.length > 0 && (
        <Tabs
          index={graficos.findIndex(g => g.id === graficoActivo)}
          onChange={(index) => setGraficoActivo(graficos[index]?.id || '')}
          variant="enclosed"
          colorScheme="blue"
        >
          <TabList>
            {graficos.map((grafico, index) => (
              <Tab key={grafico.id} position="relative">
                <HStack spacing={2}>
                  <FiBarChart2 size={14} />
                  <Text fontSize="sm">{grafico.titulo}</Text>
                  {cargando.get(grafico.id) && (
                    <Badge colorScheme="blue" variant="solid" size="sm">
                      ...
                    </Badge>
                  )}
                  {errores.get(grafico.id) && (
                    <Badge colorScheme="red" variant="solid" size="sm">
                      !
                    </Badge>
                  )}
                </HStack>
              </Tab>
            ))}
          </TabList>

          <TabPanels>
            {graficos.map((grafico) => (
              <TabPanel key={grafico.id} px={0}>
                {grafico.id === graficoActivo && (
                  <>
                    {/* Barra de acciones del gráfico activo */}
                    <HStack justify="flex-end" mb={4} spacing={2}>
                      <Tooltip label="Duplicar gráfico">
                        <IconButton
                          aria-label="Duplicar"
                          icon={<FiCopy />}
                          size="sm"
                          variant="outline"
                          onClick={() => duplicarGrafico(grafico)}
                        />
                      </Tooltip>
                      <Tooltip label="Eliminar gráfico">
                        <IconButton
                          aria-label="Eliminar"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="outline"
                          colorScheme="red"
                          onClick={() => eliminarGrafico(grafico.id)}
                          isDisabled={graficos.length <= 1}
                        />
                      </Tooltip>
                    </HStack>

                    {/* Layout principal */}
                    <Grid templateColumns={{ base: '1fr', lg: '300px 1fr' }} gap={6}>
                      {/* Panel de configuración */}
                      <GridItem>
                        <ConfiguradorGraficos
                          configuracionActual={grafico}
                          onConfiguracionChange={actualizarConfiguracion}
                          onActualizar={() => generarAnalisis(grafico)}
                          cargando={cargandoActivo}
                        />
                      </GridItem>

                      {/* Panel de visualización */}
                      <GridItem>
                        <VisualizadorGraficos
                          resultado={resultadoActivo || null}
                          cargando={cargandoActivo}
                          error={errorActivo}
                          altura="500px"
                        />
                      </GridItem>
                    </Grid>
                  </>
                )}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      )}

      {/* Estado inicial */}
      {graficos.length === 0 && (
        <Card>
          <CardBody textAlign="center" py={10}>
            <VStack spacing={4}>
              <FiBarChart2 size={48} color="gray" />
              <Text fontSize="lg" color="gray.600">
                No hay gráficos configurados
              </Text>
              <Text fontSize="sm" color="gray.500">
                Crea tu primer gráfico para analizar los datos de usuarios
              </Text>
              <Button
                leftIcon={<FiPlus />}
                colorScheme="blue"
                onClick={añadirGrafico}
              >
                Crear Primer Gráfico
              </Button>
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default GraficosDinamicosUsuarios;
