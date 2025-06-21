import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useToast,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import { FiSearch, FiAlertTriangle, FiCheckCircle, FiX, FiRefreshCw } from 'react-icons/fi';
import { EstadoActividad, EstadoAprobacion } from '../../types/usuarioHistorial';
import { Usuario } from '../../types/usuario';
import { usuarioHistorialService } from '../../services/domain/UsuarioHistorialService';

interface UsuarioProblematico {
  usuario: Usuario;
  problemas: string[];
  actividadesRecientes: number;
  estadoEsperado: EstadoActividad;
  estadoActual: EstadoActividad;
}

interface ResumenDiagnostico {
  totalUsuarios: number;
  usuariosConProblemas: number;
  usuariosAprobadosPeroInactivos: number;
  usuariosConActividadPeroInactivos: number;
}

const DiagnosticoUsuariosInactivos: React.FC = () => {
  const [cargando, setCargando] = useState(false);
  const [diagnostico, setDiagnostico] = useState<{
    usuariosProblematicos: UsuarioProblematico[];
    resumen: ResumenDiagnostico;
  } | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const toast = useToast();

  // Efecto para detectar cambios en el localStorage que indiquen recálculo completado
  useEffect(() => {
    const detectarRecalculo = () => {
      const recalculoCompletado = localStorage.getItem('recalculo_estados_completado');
      if (recalculoCompletado) {
        console.log('🔄 Recálculo detectado, actualizando diagnóstico automáticamente...');
        localStorage.removeItem('recalculo_estados_completado');
        setTimeout(() => {
          ejecutarDiagnostico();
        }, 1000); // Esperar un poco para que se persistan los cambios
      }
    };

    // Verificar inmediatamente
    detectarRecalculo();

    // Verificar cada 2 segundos
    const interval = setInterval(detectarRecalculo, 2000);

    return () => clearInterval(interval);
  }, []);

  const ejecutarDiagnostico = async () => {
    setCargando(true);
    try {
      console.log('🔍 Ejecutando diagnóstico de usuarios inactivos...');
        const resultado = await usuarioHistorialService.diagnosticarUsuariosInactivos();
      setDiagnostico(resultado);
      setUltimaActualizacion(new Date());
      
      toast({
        title: 'Diagnóstico completado',
        description: `Se encontraron ${resultado.usuariosProblematicos.length} usuarios con problemas de ${resultado.resumen.totalUsuarios} total`,
        status: resultado.usuariosProblematicos.length > 0 ? 'warning' : 'success',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error: any) {
      console.error('Error al ejecutar diagnóstico:', error);
      toast({
        title: 'Error en el diagnóstico',
        description: error.message || 'Error desconocido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCargando(false);
    }
  };

  const obtenerColorEstado = (estado: EstadoActividad) => {
    switch (estado) {
      case EstadoActividad.ACTIVO:
        return 'green';
      case EstadoActividad.INACTIVO:
        return 'red';
      case EstadoActividad.SUSPENDIDO:
        return 'orange';
      default:
        return 'gray';
    }
  };

  const obtenerColorAprobacion = (estado: EstadoAprobacion) => {
    switch (estado) {
      case EstadoAprobacion.APROBADO:
        return 'green';
      case EstadoAprobacion.PENDIENTE:
        return 'yellow';
      case EstadoAprobacion.RECHAZADO:
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Card>
      <CardHeader>        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Heading size="md">Diagnóstico de Usuarios Inactivos</Heading>
            <Text fontSize="sm" color="gray.600">
              Analiza usuarios que deberían estar activos pero aparecen como inactivos
            </Text>
            {ultimaActualizacion && (
              <Text fontSize="xs" color="gray.500">
                Última actualización: {ultimaActualizacion.toLocaleTimeString()}
              </Text>
            )}
          </VStack>
          <HStack>
            <Button
              leftIcon={<FiRefreshCw />}
              colorScheme="gray"
              variant="outline"
              onClick={ejecutarDiagnostico}
              isLoading={cargando}
              size="sm"
            >
              Refrescar
            </Button>
            <Button
              leftIcon={<FiSearch />}
              colorScheme="blue"
              onClick={ejecutarDiagnostico}
              isLoading={cargando}
              loadingText="Analizando..."
            >
              Ejecutar Diagnóstico
            </Button>
          </HStack>
        </HStack>
      </CardHeader>

      <CardBody>
        <VStack spacing={4} align="stretch">          <Alert status="info">
            <AlertIcon />
            <Box>
              <AlertTitle>¿Qué hace este diagnóstico?</AlertTitle>
              <AlertDescription>
                Revisa todos los usuarios para identificar inconsistencias entre su participación 
                real en actividades y su estado mostrado en el sistema. 
                {ultimaActualizacion && (
                  <Text fontSize="sm" mt={2} color="blue.600">
                    📊 Este diagnóstico se actualiza automáticamente después de ejecutar recálculos de estados.
                  </Text>
                )}
              </AlertDescription>
            </Box>
          </Alert>

          {diagnostico && (
            <>
              <Divider />
              
              {/* Resumen estadístico */}
              <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
                <Stat>
                  <StatLabel>Total Usuarios</StatLabel>
                  <StatNumber>{diagnostico.resumen.totalUsuarios}</StatNumber>
                </Stat>
                
                <Stat>
                  <StatLabel>Con Problemas</StatLabel>
                  <StatNumber color={diagnostico.resumen.usuariosConProblemas > 0 ? 'red.500' : 'green.500'}>
                    {diagnostico.resumen.usuariosConProblemas}
                  </StatNumber>
                  <StatHelpText>
                    {diagnostico.resumen.usuariosConProblemas === 0 ? 'Todo correcto' : 'Requieren atención'}
                  </StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel>Aprobados pero Inactivos</StatLabel>
                  <StatNumber color={diagnostico.resumen.usuariosAprobadosPeroInactivos > 0 ? 'orange.500' : 'green.500'}>
                    {diagnostico.resumen.usuariosAprobadosPeroInactivos}
                  </StatNumber>
                </Stat>
                
                <Stat>
                  <StatLabel>Con Actividad pero Inactivos</StatLabel>
                  <StatNumber color={diagnostico.resumen.usuariosConActividadPeroInactivos > 0 ? 'red.500' : 'green.500'}>
                    {diagnostico.resumen.usuariosConActividadPeroInactivos}
                  </StatNumber>
                  <StatHelpText>
                    {diagnostico.resumen.usuariosConActividadPeroInactivos === 0 ? 'Ninguno' : 'Problema crítico'}
                  </StatHelpText>
                </Stat>
              </Grid>                  {diagnostico.usuariosProblematicos.length === 0 ? (
                <Alert status="success">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>¡Excelente!</AlertTitle>
                    <AlertDescription>
                      No se encontraron usuarios con problemas de estado. 
                      Todos los usuarios activos reflejan correctamente su participación en actividades.
                      {ultimaActualizacion && (
                        <Text fontSize="sm" mt={2} color="green.600">
                          ✅ Verificado por última vez: {ultimaActualizacion.toLocaleString()}
                        </Text>
                      )}
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : (
                <>                  <Alert status="warning">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Se encontraron usuarios problemáticos</AlertTitle>
                      <AlertDescription>
                        {diagnostico.usuariosProblematicos.length} usuarios tienen inconsistencias 
                        entre su participación real y su estado mostrado.
                        {ultimaActualizacion && (
                          <Text fontSize="sm" mt={2} color="orange.600">
                            ⚠️ Datos actualizados: {ultimaActualizacion.toLocaleString()}
                          </Text>
                        )}
                      </AlertDescription>
                    </Box>
                  </Alert>

                  <Accordion allowMultiple>
                    {diagnostico.usuariosProblematicos.map((item, index) => (
                      <AccordionItem key={item.usuario.uid}>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            <HStack>
                              <Text fontWeight="medium">
                                {item.usuario.nombre} {item.usuario.apellidos}
                              </Text>
                              <Badge colorScheme={obtenerColorAprobacion(item.usuario.estadoAprobacion || EstadoAprobacion.PENDIENTE)}>
                                {item.usuario.estadoAprobacion || 'Sin definir'}
                              </Badge>
                              <Badge colorScheme={obtenerColorEstado(item.estadoActual)}>
                                Estado: {item.estadoActual}
                              </Badge>
                              <Badge colorScheme="blue">
                                {item.actividadesRecientes} actividades
                              </Badge>
                            </HStack>
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                          <VStack align="start" spacing={3}>
                            <HStack wrap="wrap" spacing={2}>
                              <Text fontSize="sm" color="gray.600">Email:</Text>
                              <Text fontSize="sm">{item.usuario.email}</Text>
                            </HStack>
                            
                            <HStack wrap="wrap" spacing={4}>
                              <Box>
                                <Text fontSize="sm" color="gray.600">Estado Actual:</Text>
                                <Badge colorScheme={obtenerColorEstado(item.estadoActual)}>
                                  {item.estadoActual}
                                </Badge>
                              </Box>
                              <Box>
                                <Text fontSize="sm" color="gray.600">Estado Esperado:</Text>
                                <Badge colorScheme={obtenerColorEstado(item.estadoEsperado)}>
                                  {item.estadoEsperado}
                                </Badge>
                              </Box>
                              <Box>
                                <Text fontSize="sm" color="gray.600">Actividades (6 meses):</Text>
                                <Badge colorScheme={item.actividadesRecientes > 0 ? 'green' : 'red'}>
                                  {item.actividadesRecientes}
                                </Badge>
                              </Box>
                            </HStack>
                            
                            <Box>
                              <Text fontSize="sm" fontWeight="medium" color="red.600" mb={2}>
                                Problemas detectados:
                              </Text>
                              <List spacing={1}>
                                {item.problemas.map((problema, pIndex) => (
                                  <ListItem key={pIndex} fontSize="sm">
                                    <ListIcon as={FiAlertTriangle} color="red.500" />
                                    {problema}
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          </VStack>
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </>
              )}
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default DiagnosticoUsuariosInactivos;
