/**
 * Componente para configurar gráficos dinámicos de usuarios
 */
import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  Switch,
  FormControl,
  FormLabel,
  Button,
  Collapse,
  IconButton,
  Badge,
  Wrap,
  WrapItem,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Card,
  CardBody,
  CardHeader,
  Heading,
  useColorModeValue
} from '@chakra-ui/react';
import { FiSettings, FiChevronDown, FiChevronUp, FiRefreshCw } from 'react-icons/fi';
import { 
  ConfiguracionGrafico, 
  TipoGrafico, 
  MetricaUsuario, 
  PeriodoTiempo,
  FiltroUsuario,
  CONFIGURACIONES_PREDEFINIDAS,
  PALETAS_COLORES
} from './tipos';
import { analisisUsuariosService } from './analisisService';

interface ConfiguradorGraficosProps {
  configuracionActual: ConfiguracionGrafico;
  onConfiguracionChange: (configuracion: ConfiguracionGrafico) => void;
  onActualizar: () => void;
  cargando?: boolean;
}

const ConfiguradorGraficos: React.FC<ConfiguradorGraficosProps> = ({
  configuracionActual,
  onConfiguracionChange,
  onActualizar,
  cargando = false
}) => {
  const [mostrarAvanzadas, setMostrarAvanzadas] = useState(false);
  
  const bgCard = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const metricas = analisisUsuariosService.getMetricasDisponibles();

  const handleMetricaChange = (metrica: MetricaUsuario) => {
    const nuevaConfiguracion = { ...configuracionActual, metrica };
    
    // Ajustar tipo de gráfico automáticamente según la métrica
    const metricaInfo = metricas.find(m => m.id === metrica);
    if (metricaInfo && !metricaInfo.tiposCompatibles.includes(configuracionActual.tipo)) {
      nuevaConfiguracion.tipo = metricaInfo.tiposCompatibles[0] as TipoGrafico;
    }
    
    onConfiguracionChange(nuevaConfiguracion);
  };

  const handleFiltroChange = (campo: keyof FiltroUsuario, valor: any) => {
    const nuevosFiltros = { ...configuracionActual.filtros, [campo]: valor };
    onConfiguracionChange({
      ...configuracionActual,
      filtros: nuevosFiltros
    });
  };

  const handleOpcionChange = (opcion: string, valor: any) => {
    const nuevasOpciones = { ...configuracionActual.opciones, [opcion]: valor };
    onConfiguracionChange({
      ...configuracionActual,
      opciones: nuevasOpciones
    });
  };

  const cargarConfiguracionPredefinida = (configuracion: ConfiguracionGrafico) => {
    onConfiguracionChange(configuracion);
  };

  const obtenerTiposCompatibles = (): TipoGrafico[] => {
    const metricaInfo = metricas.find(m => m.id === configuracionActual.metrica);
    return metricaInfo?.tiposCompatibles as TipoGrafico[] || ['bar', 'line', 'pie'];
  };

  return (
    <Card bg={bgCard} borderColor={borderColor} borderWidth="1px">
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <Heading size="sm">Configuración del Gráfico</Heading>
          <HStack>
            <IconButton
              aria-label="Actualizar"
              icon={<FiRefreshCw />}
              size="sm"
              variant="outline"
              onClick={onActualizar}
              isLoading={cargando}
            />
            <IconButton
              aria-label={mostrarAvanzadas ? "Ocultar opciones avanzadas" : "Mostrar opciones avanzadas"}
              icon={mostrarAvanzadas ? <FiChevronUp /> : <FiChevronDown />}
              size="sm"
              variant="ghost"
              onClick={() => setMostrarAvanzadas(!mostrarAvanzadas)}
            />
          </HStack>
        </HStack>
      </CardHeader>
      
      <CardBody pt={0}>
        <VStack spacing={4} align="stretch">
          {/* Configuraciones Predefinidas */}
          <Box>
            <FormLabel fontSize="sm" mb={2}>Plantillas Rápidas</FormLabel>
            <Wrap spacing={2}>
              {CONFIGURACIONES_PREDEFINIDAS.map((config) => (
                <WrapItem key={config.id}>
                  <Button
                    size="xs"
                    variant={configuracionActual.id === config.id ? "solid" : "outline"}
                    colorScheme="blue"
                    onClick={() => cargarConfiguracionPredefinida(config)}
                  >
                    {config.titulo}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
          </Box>

          <Divider />

          {/* Configuración Básica */}
          <VStack spacing={3} align="stretch">
            <HStack spacing={4}>
              <FormControl flex={2}>
                <FormLabel fontSize="sm">Métrica</FormLabel>
                <Select 
                  value={configuracionActual.metrica} 
                  onChange={(e) => handleMetricaChange(e.target.value as MetricaUsuario)}
                  size="sm"
                >
                  {metricas.map((metrica) => (
                    <option key={metrica.id} value={metrica.id}>
                      {metrica.nombre}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl flex={1}>
                <FormLabel fontSize="sm">Tipo de Gráfico</FormLabel>
                <Select 
                  value={configuracionActual.tipo} 
                  onChange={(e) => onConfiguracionChange({
                    ...configuracionActual,
                    tipo: e.target.value as TipoGrafico
                  })}
                  size="sm"
                >
                  {obtenerTiposCompatibles().map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo === 'bar' ? 'Barras' :
                       tipo === 'line' ? 'Líneas' :
                       tipo === 'pie' ? 'Circular' :
                       tipo === 'doughnut' ? 'Dona' :
                       tipo === 'area' ? 'Área' :
                       tipo === 'histogram' ? 'Histograma' : tipo}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </HStack>

            {/* Título personalizable */}
            <FormControl>
              <FormLabel fontSize="sm">Título del Gráfico</FormLabel>
              <Input
                value={configuracionActual.titulo}
                onChange={(e) => onConfiguracionChange({
                  ...configuracionActual,
                  titulo: e.target.value
                })}
                size="sm"
                placeholder="Título del gráfico"
              />
            </FormControl>

            {/* Período temporal si aplica */}
            {(['registrosPorMes', 'actividadTemporal', 'tendenciaAprobaciones'].includes(configuracionActual.metrica)) && (
              <FormControl>
                <FormLabel fontSize="sm">Período</FormLabel>
                <Select 
                  value={configuracionActual.periodo || 'mes'} 
                  onChange={(e) => onConfiguracionChange({
                    ...configuracionActual,
                    periodo: e.target.value as PeriodoTiempo
                  })}
                  size="sm"
                >
                  <option value="mes">Mensual</option>
                  <option value="trimestre">Trimestral</option>
                  <option value="año">Anual</option>
                </Select>
              </FormControl>
            )}
          </VStack>

          {/* Opciones Avanzadas */}
          <Collapse in={mostrarAvanzadas}>
            <VStack spacing={4} align="stretch">
              <Divider />
              <Text fontSize="sm" fontWeight="medium" color="gray.600">
                Opciones Avanzadas
              </Text>

              {/* Filtros de Usuario */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Filtros</Text>
                <VStack spacing={3} align="stretch">
                  {/* Filtro por roles */}
                  <FormControl>
                    <FormLabel fontSize="xs">Roles (separados por coma)</FormLabel>
                    <Input
                      value={configuracionActual.filtros?.roles?.join(', ') || ''}
                      onChange={(e) => handleFiltroChange('roles', 
                        e.target.value.split(',').map(r => r.trim()).filter(r => r)
                      )}
                      size="sm"
                      placeholder="admin, vocal, socio, invitado"
                    />
                  </FormControl>

                  {/* Filtro solo activos */}
                  <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb={0}>Solo usuarios activos</FormLabel>
                    <Switch
                      isChecked={configuracionActual.filtros?.soloActivos || false}
                      onChange={(e) => handleFiltroChange('soloActivos', e.target.checked)}
                      size="sm"
                    />
                  </FormControl>

                  {/* Incluir eliminados */}
                  <FormControl display="flex" alignItems="center">
                    <FormLabel fontSize="xs" mb={0}>Incluir usuarios eliminados</FormLabel>
                    <Switch
                      isChecked={configuracionActual.filtros?.incluyeEliminados || false}
                      onChange={(e) => handleFiltroChange('incluyeEliminados', e.target.checked)}
                      size="sm"
                    />
                  </FormControl>
                </VStack>
              </Box>

              {/* Opciones de Visualización */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>Visualización</Text>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel fontSize="xs" mb={0}>Mostrar leyenda</FormLabel>
                      <Switch
                        isChecked={configuracionActual.opciones?.mostrarLeyenda !== false}
                        onChange={(e) => handleOpcionChange('mostrarLeyenda', e.target.checked)}
                        size="sm"
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel fontSize="xs" mb={0}>Animaciones</FormLabel>
                      <Switch
                        isChecked={configuracionActual.opciones?.animaciones !== false}
                        onChange={(e) => handleOpcionChange('animaciones', e.target.checked)}
                        size="sm"
                      />
                    </FormControl>
                  </HStack>

                  <HStack justify="space-between">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel fontSize="xs" mb={0}>Mostrar valores</FormLabel>
                      <Switch
                        isChecked={configuracionActual.opciones?.mostrarValores || false}
                        onChange={(e) => handleOpcionChange('mostrarValores', e.target.checked)}
                        size="sm"
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel fontSize="xs" mb={0}>Responsive</FormLabel>
                      <Switch
                        isChecked={configuracionActual.opciones?.responsive !== false}
                        onChange={(e) => handleOpcionChange('responsive', e.target.checked)}
                        size="sm"
                      />
                    </FormControl>
                  </HStack>

                  {/* Ratio de aspecto */}
                  <FormControl>
                    <FormLabel fontSize="xs">Ratio de aspecto</FormLabel>
                    <NumberInput
                      value={configuracionActual.opciones?.aspectRatio || 2}
                      onChange={(_, value) => handleOpcionChange('aspectRatio', value)}
                      size="sm"
                      min={0.5}
                      max={4}
                      step={0.1}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>

                  {/* Selector de paleta de colores */}
                  <FormControl>
                    <FormLabel fontSize="xs">Paleta de colores</FormLabel>
                    <Select
                      value="multicolor"
                      onChange={(e) => {
                        const paleta = PALETAS_COLORES[e.target.value as keyof typeof PALETAS_COLORES];
                        handleOpcionChange('colores', paleta);
                      }}
                      size="sm"
                    >
                      <option value="multicolor">Multicolor</option>
                      <option value="azules">Azules</option>
                      <option value="verdes">Verdes</option>
                      <option value="rojos">Rojos</option>
                      <option value="morados">Morados</option>
                      <option value="naranjas">Naranjas</option>
                    </Select>
                  </FormControl>
                </VStack>
              </Box>
            </VStack>
          </Collapse>

          {/* Información de la métrica seleccionada */}
          <Box bg="blue.50" p={3} borderRadius="md" fontSize="sm">
            <Text fontWeight="medium" color="blue.800" mb={1}>
              {metricas.find(m => m.id === configuracionActual.metrica)?.nombre}
            </Text>
            <Text color="blue.600" fontSize="xs">
              {metricas.find(m => m.id === configuracionActual.metrica)?.descripcion}
            </Text>
            <HStack mt={2} spacing={1}>
              <Text fontSize="xs" color="blue.600">Tipos compatibles:</Text>
              {obtenerTiposCompatibles().map((tipo) => (
                <Badge key={tipo} size="sm" colorScheme="blue" variant="outline">
                  {tipo}
                </Badge>
              ))}
            </HStack>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default ConfiguradorGraficos;
