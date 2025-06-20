/**
 * Página principal del seguimiento de materiales por años
 * Integra el dashboard y proporciona navegación hacia funcionalidades relacionadas
 */
import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Grid,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  FiHome, 
  FiBarChart, 
  FiSettings, 
  FiDownload,
  FiCalendar,
  FiTrendingUp,
  FiPieChart
} from 'react-icons/fi';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import MaterialSeguimientoDashboard from '../../components/material/MaterialSeguimientoDashboard';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layouts/DashboardLayout';

const MaterialSeguimientoPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Verificar permisos de acceso
  const tienePermisoAcceso = userProfile?.rol === 'admin' || userProfile?.rol === 'vocal';
  if (!tienePermisoAcceso) {
    return (
      <DashboardLayout title="Seguimiento Material">
        <Box p={6} bg={bgColor} minH="100vh">
          <VStack spacing={6} align="stretch">
            <Breadcrumb>
              <BreadcrumbItem>
                <BreadcrumbLink as={RouterLink} to="/dashboard">
                  <HStack>
                    <FiHome />
                    <Text>Inicio</Text>
                  </HStack>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink href="#">Seguimiento Material</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>

            <Alert status="warning">
              <AlertIcon />
              <Box>
                <AlertTitle>Acceso Restringido</AlertTitle>
                <AlertDescription>
                  Esta funcionalidad está disponible solo para administradores y vocales.
                  Contacta con un administrador para obtener acceso.
                </AlertDescription>
              </Box>
            </Alert>
          </VStack>
        </Box>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout title="📊 Seguimiento de Material por Años">
      <Box bg={bgColor} minH="100vh">
        <VStack spacing={6} align="stretch" p={6}>
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to="/dashboard">
              <HStack>
                <FiHome />
                <Text>Inicio</Text>
              </HStack>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to="/material">Material</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="#">Seguimiento Anual</BreadcrumbLink>
          </BreadcrumbItem>        </Breadcrumb>        {/* Información y Ayuda con indicadores de rendimiento */}
        <Alert status="info" bg={cardBg} borderLeft="4px solid" borderLeftColor="blue.400">
          <AlertIcon />
          <Box>
            <AlertTitle>¿Qué puedes hacer aquí? (Optimizado para 4G)</AlertTitle>
            <AlertDescription>
              <VStack align="start" spacing={2} mt={2}>
                <HStack>
                  <FiTrendingUp color="blue" />
                  <Text fontSize="sm">Ver tendencias y evolución del material año tras año</Text>
                </HStack>
                <HStack>
                  <FiPieChart color="green" />
                  <Text fontSize="sm">Analizar estadísticas de pérdidas, daños y mantenimiento</Text>
                </HStack>
                <HStack>
                  <FiDownload color="purple" />
                  <Text fontSize="sm">Generar reportes anuales detallados para auditorías</Text>
                </HStack>
                <HStack>
                  <FiBarChart color="orange" />
                  <Text fontSize="sm">Identificar materiales problemáticos y patrones de incidencias</Text>
                </HStack>
                <HStack>
                  <FiBarChart color="teal" />
                  <Text fontSize="sm">
                    <Badge colorScheme="teal" variant="subtle" mr={2}>NUEVO</Badge>
                    Carga inteligente de datos - solo cuando los necesites
                  </Text>
                </HStack>
              </VStack>
            </AlertDescription>
          </Box>
        </Alert>        {/* Pestañas principales con información sobre optimizaciones */}
        <Tabs variant="enclosed" bg={cardBg} borderRadius="lg" shadow="sm">
          <TabList>
            <Tab>📊 Dashboard Principal</Tab>
            <Tab>📈 Análisis Avanzado</Tab>
            <Tab>⚙️ Configuración</Tab>
          </TabList>
          <TabPanels>
            {/* Dashboard Principal Optimizado */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Dashboard Optimizado</AlertTitle>
                    <AlertDescription>
                      Este dashboard utiliza lazy loading y cache inteligente para mejorar el rendimiento 
                      en conexiones 4G. Los datos se cargan solo cuando son necesarios y se mantienen 
                      en caché para acceso rápido.
                    </AlertDescription>
                  </Box>
                </Alert>
                <MaterialSeguimientoDashboard />
              </VStack>
            </TabPanel>

            {/* Análisis Avanzado */}
            <TabPanel>
              <VStack spacing={6} align="stretch" p={6}>
                <Heading size="lg">🔍 Análisis Avanzado</Heading>
                
                <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
                  <Card>
                    <CardHeader>
                      <Heading size="md">🎯 Análisis Predictivo</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Text fontSize="sm" color="gray.600">
                          Predicción de necesidades de mantenimiento y reemplazo basada en patrones históricos.
                        </Text>
                        <Button colorScheme="blue" size="sm" disabled>
                          Próximamente
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="md">💰 ROI de Material</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Text fontSize="sm" color="gray.600">
                          Análisis de retorno de inversión y costo-beneficio de los materiales.
                        </Text>
                        <Button colorScheme="green" size="sm" disabled>
                          Próximamente
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="md">🔄 Optimización de Stock</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Text fontSize="sm" color="gray.600">
                          Recomendaciones automáticas para optimizar el inventario.
                        </Text>
                        <Button colorScheme="purple" size="sm" disabled>
                          Próximamente
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                </Grid>

                <Alert status="info">
                  <AlertIcon />
                  <AlertDescription>
                    Las funciones de análisis avanzado estarán disponibles en futuras versiones. 
                    Actualmente puedes usar el dashboard principal para obtener insights detallados.
                  </AlertDescription>
                </Alert>
              </VStack>
            </TabPanel>

            {/* Configuración */}
            <TabPanel>
              <VStack spacing={6} align="stretch" p={6}>
                <Heading size="lg">⚙️ Configuración del Sistema</Heading>
                
                <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
                  <Card>
                    <CardHeader>
                      <Heading size="md">🔔 Alertas Automáticas</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Text fontSize="sm" color="gray.600">
                          Configurar alertas por incidencias repetidas y costos elevados.
                        </Text>
                        <Button colorScheme="orange" size="sm" disabled>
                          Configurar Alertas
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="md">📧 Reportes Automáticos</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Text fontSize="sm" color="gray.600">
                          Programar envío automático de reportes anuales y mensuales.
                        </Text>
                        <Button colorScheme="blue" size="sm" disabled>
                          Configurar Reportes
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="md">🗄️ Archivado de Datos</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Text fontSize="sm" color="gray.600">
                          Configurar el archivado automático de datos antiguos.
                        </Text>
                        <Button colorScheme="gray" size="sm" disabled>
                          Configurar Archivado
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                </Grid>

                <Alert status="warning">
                  <AlertIcon />
                  <AlertDescription>
                    Las opciones de configuración avanzada estarán disponibles en la siguiente actualización. 
                    Por ahora, el sistema funciona con configuración predeterminada optimizada.
                  </AlertDescription>
                </Alert>
              </VStack>
            </TabPanel>
          </TabPanels>        </Tabs>
      </VStack>
    </Box>
    </DashboardLayout>
  );
};

export default MaterialSeguimientoPage;
