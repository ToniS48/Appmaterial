/**
 * Dashboard de Gestión de Usuarios - Componente Principal
 * 
 * Este componente ha sido completamente modularizado para mejorar la mantenibilidad.
 * Utiliza componentes modulares para cada pestaña y un hook personalizado para la lógica.
 * 
 * Estructura modular:
 * - EstadisticasPrincipales: Tarjetas de estadísticas principales
 * - EventosTab: Gestión de eventos recientes
 * - UsuariosProblematicosTab: Usuarios que requieren atención
 * - ComparacionAñosTab: Comparativa entre años
 * - ReportesTab: Generación de reportes
 * - HerramientasAdminTab: Herramientas administrativas
 * - GestionUsuariosTab: Gestión completa de usuarios
 * - GraficosDinamicosUsuarios: Visualizaciones dinámicas
 * 
 * Hook personalizado:
 * - useDashboard: Centraliza toda la lógica de estado y efectos
 * 
 * @author Sistema de Gestión de Usuarios
 * @version 2.0 - Versión Modularizada
 */
import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Select,
  Card,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
  Tooltip as ChakraTooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Progress,
  Flex
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiBarChart,
  FiFileText,
  FiAlertTriangle,
  FiEye,
  FiUserCheck,
  FiUserPlus,
  FiClock,
  FiSettings,
  FiTrendingUp
} from 'react-icons/fi';

// Importar componentes modulares
import {
  useDashboard,
  EstadisticasPrincipales,
  EventosTab,
  UsuariosProblematicosTab,
  ComparacionAñosTab,
  ReportesTab,
  HerramientasAdminTab,
  TipoReporte
} from './dashboard';
import GestionUsuariosTab from './GestionUsuariosTab';
import { GraficosDinamicosUsuarios } from './graficos';

interface DashboardUsuariosProps {
  añoInicial?: number;
}

const DashboardUsuarios: React.FC<DashboardUsuariosProps> = ({
  añoInicial
}) => {
  const { isOpen: isReporteOpen, onOpen: onReporteOpen, onClose: onReporteClose } = useDisclosure();
  const { userProfile } = useAuth();
  
  // Usar el hook personalizado para la lógica del dashboard
  const {
    state,
    actions,
    añosDisponibles,
    estadisticasComparacion,
    cargarEstadisticasComparacion,
    generarReporte,
    migrarDatos,
    actualizarCache,
    limpiarDatosTemporales
  } = useDashboard(añoInicial);

  const {
    añoSeleccionado,
    estadisticas,
    eventosRecientes,
    usuarios,
    usuariosProblematicos,
    comparacionAños,
    cargando,
    cargandoMigracion,
    error,
    reporteTexto
  } = state;

  const {
    cargarDatos,
    generarReporte: generarReporteSimple,
    generarDatosIniciales,
    debugConexion,
    limpiarLogs,
    setAñoSeleccionado  } = actions;

  // Verificar si el usuario es admin
  const esAdmin = useMemo(() => {
    return userProfile?.rol === 'admin';
  }, [userProfile]);

  // Función para manejar descarga de reportes
  const descargarReporte = () => {
    const element = document.createElement('a');
    const file = new Blob([reporteTexto], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `reporte-usuarios-${añoSeleccionado}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };if (cargando && !estadisticas) {
    return (
      <Box p={6}>
        <VStack spacing={4}>
          <Text>Cargando datos de seguimiento de usuarios...</Text>
          <Progress size="xs" isIndeterminate width="100%" />
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          <Box>
            <AlertTitle>Error al cargar datos</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>          </Box>
        </Alert>
        <Button 
          mt={4} 
          colorScheme="blue" 
          onClick={() => cargarDatos(false)}
          leftIcon={<FiRefreshCw />}
        >
          Reintentar
        </Button>
      </Box>
    );
  }
  return (
    <Box p={6} maxWidth="1400px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Encabezado */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Heading size="lg" color="blue.600">
            Gestión de Usuarios
          </Heading>
          
          <HStack spacing={3}>
            <Select 
              value={añoSeleccionado} 
              onChange={(e) => setAñoSeleccionado(Number(e.target.value))}
              width="120px"
            >
              {añosDisponibles.map((año: number) => (
                <option key={año} value={año}>{año}</option>
              ))}
            </Select>
            
            <ChakraTooltip label="Actualizar datos">
              <IconButton
                aria-label="Actualizar"
                icon={<FiRefreshCw />}
                onClick={() => cargarDatos(false)}
                isLoading={cargando}
                colorScheme="blue"
                variant="outline"
              />
            </ChakraTooltip>
          </HStack>
        </Flex>
        
        {/* Estadísticas principales usando componente modular */}
        <EstadisticasPrincipales
          estadisticas={estadisticas}
          comparacionAños={comparacionAños}
          cargando={cargando}
          onGenerarDatos={generarDatosIniciales}
          onCargarDatos={() => cargarDatos(false)}
          añoSeleccionado={añoSeleccionado}
          cargandoMigracion={cargandoMigracion}
        />

        {/* Pestañas principales usando componentes modulares */}
        {estadisticas && (
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList 
              overflowX="auto" 
              overflowY="hidden"
              flexWrap="nowrap"
              whiteSpace="nowrap"
              scrollBehavior="smooth"
              py={2}
              sx={{
                '&::-webkit-scrollbar': { height: '4px' },
                '&::-webkit-scrollbar-track': { bg: 'gray.100' },
                '&::-webkit-scrollbar-thumb': { bg: 'gray.400', borderRadius: '4px' },
                maxHeight: 'fit-content',
                alignItems: 'center',
              }}
            >
              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiBarChart />
                  <Box display={{ base: 'none', md: 'block' }}>Resumen</Box>
                </HStack>
              </Tab>
              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiUserCheck />
                  <Box display={{ base: 'none', md: 'block' }}>Gestión</Box>
                </HStack>
              </Tab>
              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiClock />
                  <Box display={{ base: 'none', md: 'block' }}>Eventos</Box>
                </HStack>
              </Tab>
              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiAlertTriangle />
                  <Box display={{ base: 'none', md: 'block' }}>Usuarios</Box>
                </HStack>
              </Tab>
              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiTrendingUp />
                  <Box display={{ base: 'none', md: 'block' }}>Gráficos</Box>
                </HStack>
              </Tab>
              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiEye />
                  <Box display={{ base: 'none', md: 'block' }}>Comparación</Box>
                </HStack>
              </Tab>
              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiFileText />
                  <Box display={{ base: 'none', md: 'block' }}>Reportes</Box>
                </HStack>
              </Tab>
              {esAdmin && (
                <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                  <HStack spacing={{ base: 0, md: 2 }} align="center">
                    <FiSettings />
                    <Box display={{ base: 'none', md: 'block' }}>Herramientas</Box>
                  </HStack>
                </Tab>
              )}
            </TabList>

            <TabPanels>
              {/* Panel Resumen - Reutilizar EstadisticasPrincipales pero con vista extendida */}
              <TabPanel>
                <EstadisticasPrincipales
                  estadisticas={estadisticas}
                  comparacionAños={comparacionAños}
                  cargando={cargando}
                  onGenerarDatos={generarDatosIniciales}
                  onCargarDatos={() => cargarDatos(false)}
                  añoSeleccionado={añoSeleccionado}
                  cargandoMigracion={cargandoMigracion}
                  vistaExtendida={true}
                />
              </TabPanel>

              {/* Panel Gestión de Usuarios */}
              <TabPanel px={{ base: 0, md: 4 }}>
                <GestionUsuariosTab 
                  onUsuariosChange={(usuarios) => {
                    console.log('🔄 Usuarios actualizados desde gestión:', usuarios.length);
                  }}
                />
              </TabPanel>

              {/* Panel Eventos */}
              <TabPanel>
                <EventosTab
                  eventos={eventosRecientes}
                  cargando={cargando}
                />
              </TabPanel>

              {/* Panel Usuarios Problemáticos */}
              <TabPanel>
                <UsuariosProblematicosTab
                  usuarios={usuariosProblematicos}
                  cargando={cargando}
                  onVerDetalle={(usuario) => console.log('Ver detalle:', usuario)}
                  onCorregir={(usuario) => console.log('Corregir usuario:', usuario)}
                />
              </TabPanel>

              {/* Panel Gráficos */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card>
                    <CardBody>
                      <Text fontSize="lg" fontWeight="bold" mb={4}>
                        📊 Gráficos Dinámicos de Usuarios
                      </Text>
                      <Text fontSize="sm" color="gray.600" mb={4}>
                        Configura y visualiza diferentes métricas de usuarios con filtros personalizables
                      </Text>
                      <GraficosDinamicosUsuarios usuarios={usuarios} />
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>

              {/* Panel Comparación */}
              <TabPanel>
                <ComparacionAñosTab
                  añoActual={añoSeleccionado}
                  estadisticasActuales={estadisticas}
                  onAñoComparacionChange={cargarEstadisticasComparacion}
                  estadisticasComparacion={estadisticasComparacion}
                  cargando={cargando}
                />
              </TabPanel>

              {/* Panel Reportes */}
              <TabPanel>
                <ReportesTab
                  año={añoSeleccionado}
                  estadisticas={estadisticas}
                  onGenerarReporte={generarReporte}
                  cargando={cargando}
                />
              </TabPanel>

              {/* Panel Herramientas Administrativas */}
              {esAdmin && (
                <TabPanel px={{ base: 1, md: 4 }}>
                  <HerramientasAdminTab
                    userProfile={userProfile}
                    cargando={cargando}
                    onMigrarDatos={migrarDatos}
                    onActualizarCache={actualizarCache}
                    onLimpiarDatosTemporales={limpiarDatosTemporales}
                  />
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        )}

        {/* Modal para mostrar reporte */}
        <Modal isOpen={isReporteOpen} onClose={onReporteClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Reporte Anual de Usuarios {añoSeleccionado}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Box
                as="pre"
                fontSize="sm"
                fontFamily="monospace"
                whiteSpace="pre-wrap"
                maxHeight="500px"
                overflowY="auto"
                bg="gray.50"
                p={4}
                borderRadius="md"
              >
                {reporteTexto}
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onReporteClose}>
                Cerrar
              </Button>
              <Button leftIcon={<FiFileText />} colorScheme="blue" onClick={descargarReporte}>
                Descargar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default DashboardUsuarios;
