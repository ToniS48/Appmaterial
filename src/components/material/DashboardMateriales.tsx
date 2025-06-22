/**
 * Dashboard de Gestión de Materiales - Componente Principal
 * 
 * Dashboard completo para la gestión integral de materiales deportivos.
 * Incluye estadísticas, inventario, reportes y herramientas administrativas.
 * 
 * Estructura modular:
 * - EstadisticasPrincipalesMateriales: Estadísticas del inventario
 * - GestionMaterialesTab: CRUD completo de materiales
 * - EventosMaterialesTab: Historial de actividades
 * - MaterialesProblematicosTab: Materiales que requieren atención
 * - ReportesMaterialesTab: Generación de reportes
 * - HerramientasAdminMaterialesTab: Herramientas administrativas
 * 
 * Hook personalizado:
 * - useDashboardMateriales: Centraliza toda la lógica de estado
 * 
 * @author Sistema de Gestión de Materiales
 * @version 1.0 - Implementación inicial
 */
import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Select,
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
  Progress,
  Flex,
  Card,
  CardBody
} from '@chakra-ui/react';
import {
  FiRefreshCw,
  FiBarChart,
  FiFileText,
  FiAlertTriangle,
  FiPackage,
  FiSettings,
  FiTrendingUp,
  FiClock,
  FiTool,
  FiEdit
} from 'react-icons/fi';

// Importar componentes modulares del dashboard
import {
  useDashboardMateriales,
  EstadisticasPrincipalesMateriales,
  EventosMaterialesTab,
  MaterialesProblematicosTab,
  ReportesMaterialesTab,
  HerramientasAdminMaterialesTab,
  SeguimientoAnualMaterialesTab,
  GestionMaterialesCompleteTab
} from './dashboard';
import GestionMaterialesContent from './dashboard/GestionMaterialesContent';

interface DashboardMaterialesProps {
  añoInicial?: number;
}

const DashboardMateriales: React.FC<DashboardMaterialesProps> = ({
  añoInicial
}) => {
  const { userProfile } = useAuth();
  
  // Usar el hook personalizado para la lógica del dashboard
  const {
    state,
    actions,
    añosDisponibles
  } = useDashboardMateriales(añoInicial);

  const {
    añoSeleccionado,
    estadisticas,
    eventosRecientes,
    materiales,
    materialesProblematicos,
    cargando,
    error,
    reporteTexto
  } = state;

  const {
    cargarDatos,
    generarReporte,
    setAñoSeleccionado
  } = actions;

  // Verificar si el usuario es admin
  const esAdmin = useMemo(() => {
    return userProfile?.rol === 'admin';
  }, [userProfile]);
  if (cargando && !estadisticas) {
    return (
      <DashboardLayout title="Dashboard de Materiales">
        <Box p={6}>
          <VStack spacing={4}>
            <Text>Cargando datos del inventario de materiales...</Text>
            <Progress size="xs" isIndeterminate width="100%" />
          </VStack>
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard de Materiales">
        <Box p={6}>
          <Alert status="error">
            <AlertIcon />
            <Box>
              <AlertTitle>Error al cargar datos</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Box>
          </Alert>
          <ChakraTooltip label="Reintentar carga">
            <IconButton
              aria-label="Reintentar"
              icon={<FiRefreshCw />}
              mt={4}
              colorScheme="blue"
              onClick={() => cargarDatos(false)}
            />
          </ChakraTooltip>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard de Materiales">
      <Box p={6} maxWidth="1400px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Encabezado */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>          <Heading size="lg" color="purple.600">
            Gestión de Materiales
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
                onClick={() => cargarDatos()}
                isLoading={cargando}
                colorScheme="purple"
                variant="outline"
              />
            </ChakraTooltip>
          </HStack>
        </Flex>

        {/* Pestañas principales */}
        {estadisticas && (
          <Tabs variant="enclosed" colorScheme="purple">
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
            >              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiBarChart />
                  <Box display={{ base: 'none', md: 'block' }}>Resumen</Box>
                </HStack>
              </Tab>
              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiTrendingUp />
                  <Box display={{ base: 'none', md: 'block' }}>Seguimiento Anual</Box>
                </HStack>
              </Tab>
              <Tab minW={{ base: '50px', md: 'auto' }} px={{ base: 2, md: 4 }} py={{ base: 2, md: 3 }} h="fit-content">
                <HStack spacing={{ base: 0, md: 2 }} align="center">
                  <FiPackage />
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
                  <Box display={{ base: 'none', md: 'block' }}>Problemáticos</Box>
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
              {/* Panel Resumen - Vista extendida de estadísticas */}
              <TabPanel>
                <EstadisticasPrincipalesMateriales
                  estadisticas={estadisticas}
                  cargando={cargando}
                  onCargarDatos={() => cargarDatos()}
                  añoSeleccionado={añoSeleccionado}
                  vistaExtendida={true}
                />
              </TabPanel>              {/* Panel Seguimiento Anual de Materiales */}
              <TabPanel px={{ base: 0, md: 4 }}>
                <SeguimientoAnualMaterialesTab 
                  estadisticas={estadisticas}
                  materiales={materiales}
                  cargando={cargando}
                  onCargarDatos={cargarDatos}
                  añoSeleccionado={añoSeleccionado}
                  userProfile={userProfile}
                />
              </TabPanel>              {/* Panel Gestión Completa de Materiales */}
              <TabPanel px={{ base: 0, md: 4 }}>
                <GestionMaterialesContent 
                  userProfile={userProfile}
                  onCargarDatos={cargarDatos}
                />
              </TabPanel>

              {/* Panel Eventos */}
              <TabPanel>
                <EventosMaterialesTab
                  eventos={eventosRecientes}
                  cargando={cargando}
                />
              </TabPanel>

              {/* Panel Materiales Problemáticos */}
              <TabPanel>
                <MaterialesProblematicosTab
                  materiales={materialesProblematicos}
                  cargando={cargando}
                  onVerDetalle={(material) => console.log('Ver detalle:', material)}
                  onCorregir={(material) => console.log('Corregir material:', material)}
                />
              </TabPanel>

              {/* Panel Reportes */}
              <TabPanel>
                <ReportesMaterialesTab
                  año={añoSeleccionado}
                  estadisticas={estadisticas}
                  onGenerarReporte={generarReporte}
                  cargando={cargando}
                  reporteTexto={reporteTexto}
                />
              </TabPanel>

              {/* Panel Herramientas Administrativas */}
              {esAdmin && (
                <TabPanel px={{ base: 1, md: 4 }}>
                  <HerramientasAdminMaterialesTab
                    userProfile={userProfile}
                    cargando={cargando}
                  />
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        )}

        {/* Información adicional */}
        {!cargando && estadisticas && (
          <Card>
            <CardBody>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Dashboard de Materiales - Última actualización: {new Date().toLocaleString('es-ES')}
                {estadisticas && (
                  <> | {estadisticas.totalMateriales} materiales registrados | {estadisticas.materialesDisponibles} disponibles</>
                )}
              </Text>
            </CardBody>
          </Card>        )}
      </VStack>
    </Box>
    </DashboardLayout>
  );
};

export default DashboardMateriales;
