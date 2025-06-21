/**
 * HerramientasAdminTab - Componente para herramientas administrativas
 */
import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  CardHeader,
  Alert,
  AlertIcon,
  Badge,
  Progress,
  useToast,
  Grid,
  GridItem,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea
} from '@chakra-ui/react';
import { FiSettings, FiRefreshCw, FiAlertTriangle, FiTool, FiDatabase, FiUserPlus, FiPackage } from 'react-icons/fi';
import RecalcularEstadosUsuarios from '../../admin/RecalcularEstadosUsuarios';
import DiagnosticoUsuariosInactivos from '../../admin/DiagnosticoUsuariosInactivos';
import DiagnosticoDetalladoUsuarios from '../../admin/DiagnosticoDetalladoUsuarios';
import ReparacionUsuariosDesactualizados from '../../admin/ReparacionUsuariosDesactualizados';
import RecalcularEstadosMateriales from '../../admin/RecalcularEstadosMateriales';
import DiagnosticoMaterialesInactivos from '../../admin/DiagnosticoMaterialesInactivos';
import DiagnosticoDetalladoMateriales from '../../admin/DiagnosticoDetalladoMateriales';
import ReparacionMaterialesDesactualizados from '../../admin/ReparacionMaterialesDesactualizados';

interface HerramientasAdminTabProps {
  userProfile: any;
  cargando: boolean;
  onMigrarDatos?: () => Promise<void>;
  onActualizarCache?: () => Promise<void>;
  onLimpiarDatosTemporales?: () => Promise<void>;
  onGenerarDatosIniciales?: () => Promise<void>;
}

const HerramientasAdminTab: React.FC<HerramientasAdminTabProps> = ({
  userProfile,
  cargando,
  onMigrarDatos,
  onActualizarCache,
  onLimpiarDatosTemporales,
  onGenerarDatosIniciales
}) => {
  const toast = useToast();
  const { isOpen: isLogOpen, onOpen: onLogOpen, onClose: onLogClose } = useDisclosure();
  
  const [ejecutandoHerramienta, setEjecutandoHerramienta] = useState<string | null>(null);
  const [resultadoOperacion, setResultadoOperacion] = useState('');
  const [logOperaciones, setLogOperaciones] = useState<string[]>([]);

  const agregarLog = (mensaje: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logConTimestamp = `[${timestamp}] ${mensaje}`;
    setLogOperaciones(prev => [...prev, logConTimestamp]);
  };

  const ejecutarHerramienta = async (
    nombreHerramienta: string,
    operacion: () => Promise<void>
  ) => {
    setEjecutandoHerramienta(nombreHerramienta);
    agregarLog(`Iniciando ${nombreHerramienta}...`);
    
    try {
      await operacion();
      agregarLog(`${nombreHerramienta} completada exitosamente`);
      toast({
        title: "Operación completada",
        description: `${nombreHerramienta} se ejecutó correctamente`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      agregarLog(`Error en ${nombreHerramienta}: ${error}`);
      toast({
        title: "Error en operación",
        description: `No se pudo completar ${nombreHerramienta}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setEjecutandoHerramienta(null);
    }
  };

  const handleMigrarDatos = async () => {
    if (onMigrarDatos) {
      await ejecutarHerramienta("Migración de datos", onMigrarDatos);
    }
  };

  const handleActualizarCache = async () => {
    if (onActualizarCache) {
      await ejecutarHerramienta("Actualización de caché", onActualizarCache);
    }
  };
  const handleLimpiarDatos = async () => {
    if (onLimpiarDatosTemporales) {
      await ejecutarHerramienta("Limpieza de datos temporales", onLimpiarDatosTemporales);
    }
  };

  const handleGenerarDatosIniciales = async () => {
    if (onGenerarDatosIniciales) {
      await ejecutarHerramienta("Generación de datos iniciales", onGenerarDatosIniciales);
    }
  };

  const esAdmin = userProfile?.rol === 'admin';

  if (!esAdmin) {
    return (
      <Alert status="warning">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Acceso Restringido</Text>
          <Text>Solo los administradores pueden acceder a estas herramientas.</Text>
        </Box>
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          Herramientas de Administración
        </Text>
        <Text fontSize="sm" color="gray.600">
          Herramientas avanzadas para la gestión y mantenimiento del sistema
        </Text>
      </Box>

      <Alert status="info">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Información Importante</Text>
          <Text fontSize="sm">
            Estas herramientas realizan operaciones sensibles en la base de datos. 
            Úsalas con precaución y preferiblemente durante horarios de bajo tráfico.
          </Text>
        </Box>
      </Alert>

      {ejecutandoHerramienta && (
        <Alert status="info">
          <AlertIcon />
          <Box flex="1">
            <Text>Ejecutando: {ejecutandoHerramienta}</Text>
            <Progress size="sm" isIndeterminate mt={2} />
          </Box>
        </Alert>
      )}      <Accordion allowMultiple>
        {/* Herramientas de Diagnóstico - Usuarios */}
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              <HStack>
                <FiAlertTriangle />
                <Text fontWeight="medium">Herramientas de Diagnóstico - Usuarios</Text>
                <Badge colorScheme="blue">4 herramientas</Badge>
              </HStack>
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
              <Card>
                <CardHeader>
                  <Text fontWeight="bold">Recalcular Estados de Usuarios</Text>
                </CardHeader>
                <CardBody>
                  <RecalcularEstadosUsuarios />
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Text fontWeight="bold">Diagnóstico de Usuarios Inactivos</Text>
                </CardHeader>
                <CardBody>
                  <DiagnosticoUsuariosInactivos />
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Text fontWeight="bold">Diagnóstico Detallado de Usuarios</Text>
                </CardHeader>
                <CardBody>
                  <DiagnosticoDetalladoUsuarios />
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Text fontWeight="bold">Reparación de Usuarios Desactualizados</Text>
                </CardHeader>
                <CardBody>
                  <ReparacionUsuariosDesactualizados />
                </CardBody>
              </Card>
            </Grid>
          </AccordionPanel>
        </AccordionItem>

        {/* Herramientas de Diagnóstico - Materiales */}
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">
              <HStack>
                <FiPackage />
                <Text fontWeight="medium">Herramientas de Diagnóstico - Materiales</Text>
                <Badge colorScheme="green">4 herramientas</Badge>
              </HStack>
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
              <Card>
                <CardHeader>
                  <Text fontWeight="bold">Recalcular Estados de Materiales</Text>
                </CardHeader>
                <CardBody>
                  <RecalcularEstadosMateriales />
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Text fontWeight="bold">Diagnóstico de Materiales Inactivos</Text>
                </CardHeader>
                <CardBody>
                  <DiagnosticoMaterialesInactivos />
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Text fontWeight="bold">Diagnóstico Detallado de Materiales</Text>
                </CardHeader>
                <CardBody>
                  <DiagnosticoDetalladoMateriales />
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Text fontWeight="bold">Reparación de Materiales Desactualizados</Text>
                </CardHeader>
                <CardBody>
                  <ReparacionMaterialesDesactualizados />
                </CardBody>
              </Card>
            </Grid>
          </AccordionPanel>
        </AccordionItem>

        {/* Herramientas de Mantenimiento */}
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left">              <HStack>
                <FiTool />
                <Text fontWeight="medium">Herramientas de Mantenimiento</Text>
                <Badge colorScheme="green">4 herramientas</Badge>
              </HStack>
            </Box>
            <AccordionIcon />
          </AccordionButton>          <AccordionPanel pb={4}>
            <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
              {onGenerarDatosIniciales && (
                <Card>
                  <CardHeader>
                    <HStack>
                      <FiUserPlus />
                      <Text fontWeight="bold">Generar Datos Iniciales</Text>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" color="gray.600">
                        Genera datos iniciales para usuarios y estadísticas históricas
                      </Text>
                      <Button
                        colorScheme="green"
                        size="sm"
                        onClick={handleGenerarDatosIniciales}
                        isLoading={ejecutandoHerramienta === "Generación de datos iniciales"}
                        isDisabled={!!ejecutandoHerramienta}
                      >
                        Generar Datos
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              )}

              {onMigrarDatos && (
                <Card>
                  <CardHeader>
                    <HStack>
                      <FiDatabase />
                      <Text fontWeight="bold">Migración de Datos</Text>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" color="gray.600">
                        Migra datos de usuarios a la nueva estructura de base de datos
                      </Text>
                      <Button
                        colorScheme="orange"
                        size="sm"
                        onClick={handleMigrarDatos}
                        isLoading={ejecutandoHerramienta === "Migración de datos"}
                        isDisabled={!!ejecutandoHerramienta}
                      >
                        Ejecutar Migración
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              )}

              {onActualizarCache && (
                <Card>
                  <CardHeader>
                    <HStack>
                      <FiRefreshCw />
                      <Text fontWeight="bold">Actualizar Caché</Text>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" color="gray.600">
                        Actualiza y limpia la caché del sistema
                      </Text>
                      <Button
                        colorScheme="blue"
                        size="sm"
                        onClick={handleActualizarCache}
                        isLoading={ejecutandoHerramienta === "Actualización de caché"}
                        isDisabled={!!ejecutandoHerramienta}
                      >
                        Actualizar Caché
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              )}

              {onLimpiarDatosTemporales && (
                <Card>
                  <CardHeader>
                    <HStack>
                      <FiSettings />
                      <Text fontWeight="bold">Limpiar Datos Temporales</Text>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" color="gray.600">
                        Elimina archivos temporales y datos obsoletos
                      </Text>
                      <Button
                        colorScheme="red"
                        variant="outline"
                        size="sm"
                        onClick={handleLimpiarDatos}
                        isLoading={ejecutandoHerramienta === "Limpieza de datos temporales"}
                        isDisabled={!!ejecutandoHerramienta}
                      >
                        Limpiar Datos
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </Grid>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {/* Log de Operaciones */}
      {logOperaciones.length > 0 && (
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Text fontWeight="bold">Registro de Operaciones</Text>
              <Button size="sm" variant="outline" onClick={onLogOpen}>
                Ver Completo
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={1} align="stretch">
              {logOperaciones.slice(-3).map((log, index) => (
                <Text key={index} fontSize="sm" fontFamily="monospace">
                  {log}
                </Text>
              ))}
              {logOperaciones.length > 3 && (
                <Text fontSize="xs" color="gray.500">
                  ... y {logOperaciones.length - 3} entradas más
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Modal para ver log completo */}
      <Modal isOpen={isLogOpen} onClose={onLogClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Registro Completo de Operaciones</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={logOperaciones.join('\n')}
              readOnly
              minHeight="300px"
              fontFamily="monospace"
              fontSize="sm"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onLogClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default HerramientasAdminTab;
