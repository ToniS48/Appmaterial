import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  Alert,
  AlertIcon,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Code,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Card,
  CardBody,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { listarUsuarios } from '../../services/usuarioService';
import { getEstadoActivoLegacy } from '../../utils/migracionUsuarios';
import { Usuario } from '../../types/usuario';
import { EstadoAprobacion, EstadoActividad } from '../../types/usuarioHistorial';

interface UsuarioProblematico {
  usuario: Usuario;
  problemas: string[];
  estadoLegacy: boolean;
  deberiaEstarActivo: boolean;
}

const DiagnosticoDetalladoUsuarios: React.FC = () => {
  const [diagnostico, setDiagnostico] = useState<{
    usuarios: Usuario[];
    usuariosProblematicos: UsuarioProblematico[];
    estadisticas: {
      total: number;
      sinEstadoAprobacion: number;
      sinEstadoActividad: number;
      conActivoTrue: number;
      activosSegunNuevosEstados: number;
      problematicos: number;
    };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Auto-actualizar tras recálculo
  useEffect(() => {
    const checkRecalculo = () => {
      const señal = localStorage.getItem('recalculo_completado');
      if (señal) {
        console.log('🔄 Recálculo detectado en diagnóstico detallado, actualizando...');
        setTimeout(() => {
          ejecutarDiagnostico();
          localStorage.removeItem('recalculo_completado');
        }, 1000);
      }
    };

    checkRecalculo();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'recalculo_completado' && e.newValue) {
        checkRecalculo();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const ejecutarDiagnostico = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Iniciando diagnóstico detallado de usuarios...');
      
      const usuarios = await listarUsuarios();
      console.log(`📊 Total de usuarios: ${usuarios.length}`);
      
      const usuariosProblematicos: UsuarioProblematico[] = [];
      const estadisticas = {
        total: usuarios.length,
        sinEstadoAprobacion: 0,
        sinEstadoActividad: 0,
        conActivoTrue: 0,
        activosSegunNuevosEstados: 0,
        problematicos: 0
      };
      
      for (const usuario of usuarios) {
        const problemas: string[] = [];
        
        // Verificar campos requeridos
        if (!usuario.estadoAprobacion) {
          estadisticas.sinEstadoAprobacion++;
          problemas.push('Sin campo estadoAprobacion');
        }
        
        if (!usuario.estadoActividad) {
          estadisticas.sinEstadoActividad++;
          problemas.push('Sin campo estadoActividad');
        }
        
        // Verificar campo activo legacy
        const activoLegacy = (usuario as any).activo;
        if (activoLegacy === true) {
          estadisticas.conActivoTrue++;
        }
        
        // Calcular estados
        const estadoLegacy = getEstadoActivoLegacy(usuario);
        const deberiaEstarActivo = usuario.estadoAprobacion === EstadoAprobacion.APROBADO && 
                                  usuario.estadoActividad === EstadoActividad.ACTIVO;
        
        if (deberiaEstarActivo) {
          estadisticas.activosSegunNuevosEstados++;
        }
        
        // Detectar inconsistencias específicas
        if (activoLegacy === true && !estadoLegacy) {
          problemas.push('Tiene activo=true pero getEstadoActivoLegacy=false');
        }
        
        if (usuario.estadoAprobacion === EstadoAprobacion.APROBADO && 
            usuario.estadoActividad === EstadoActividad.ACTIVO && 
            !estadoLegacy) {
          problemas.push('Estados correctos pero getEstadoActivoLegacy=false');
        }
        
        if (usuario.estadoAprobacion === EstadoAprobacion.APROBADO && 
            !usuario.estadoActividad) {
          problemas.push('Aprobado pero sin estadoActividad definido');
        }
        
        if (usuario.estadoActividad === EstadoActividad.ACTIVO && 
            usuario.estadoAprobacion !== EstadoAprobacion.APROBADO) {
          problemas.push('Activo pero no aprobado');
        }
        
        if (problemas.length > 0) {
          estadisticas.problematicos++;
          usuariosProblematicos.push({
            usuario,
            problemas,
            estadoLegacy,
            deberiaEstarActivo
          });
        }
        
        // Log detallado para primeros usuarios
        if (usuarios.indexOf(usuario) < 5) {
          console.log(`\n📧 ${usuario.email}:`);
          console.log(`   • estadoAprobacion: ${usuario.estadoAprobacion || 'undefined'}`);
          console.log(`   • estadoActividad: ${usuario.estadoActividad || 'undefined'}`);
          console.log(`   • activo (legacy): ${activoLegacy !== undefined ? activoLegacy : 'undefined'}`);
          console.log(`   • getEstadoActivoLegacy: ${estadoLegacy}`);
          console.log(`   • deberiaEstarActivo: ${deberiaEstarActivo}`);
          console.log(`   • problemas: ${problemas.join(', ') || 'ninguno'}`);
        }
      }
      
      setDiagnostico({
        usuarios,
        usuariosProblematicos,
        estadisticas
      });
      
      console.log('📋 Estadísticas del diagnóstico:', estadisticas);
      
      toast({
        title: 'Diagnóstico detallado completado',
        description: `Se analizaron ${usuarios.length} usuarios. ${estadisticas.problematicos} con problemas detectados.`,
        status: estadisticas.problematicos > 0 ? 'warning' : 'success',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      toast({
        title: 'Error en diagnóstico',
        description: 'No se pudo completar el diagnóstico',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Box>
            <Text fontSize="lg" fontWeight="bold" mb={2}>
              🔍 Diagnóstico Detallado de Estados de Usuario
            </Text>
            <Text fontSize="sm" color="gray.600">
              Analiza discrepancias entre campos de estado en la base de datos y lo que muestra la interfaz
            </Text>
          </Box>

          <Button
            colorScheme="blue"
            onClick={ejecutarDiagnostico}
            isLoading={isLoading}
            loadingText="Analizando..."
          >
            Ejecutar Diagnóstico Detallado
          </Button>

          {diagnostico && (
            <>
              <Divider />
              
              {/* Estadísticas generales */}
              <Box>
                <Text fontSize="md" fontWeight="bold" mb={3}>📊 Estadísticas Generales</Text>
                <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                  <StatGroup>
                    <Stat>
                      <StatLabel>Total de usuarios</StatLabel>
                      <StatNumber>{diagnostico.estadisticas.total}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Con problemas</StatLabel>
                      <StatNumber color={diagnostico.estadisticas.problematicos > 0 ? "red.500" : "green.500"}>
                        {diagnostico.estadisticas.problematicos}
                      </StatNumber>
                    </Stat>
                  </StatGroup>
                  
                  <StatGroup>
                    <Stat>
                      <StatLabel>Sin estado aprobación</StatLabel>
                      <StatNumber color={diagnostico.estadisticas.sinEstadoAprobacion > 0 ? "orange.500" : "green.500"}>
                        {diagnostico.estadisticas.sinEstadoAprobacion}
                      </StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Sin estado actividad</StatLabel>
                      <StatNumber color={diagnostico.estadisticas.sinEstadoActividad > 0 ? "orange.500" : "green.500"}>
                        {diagnostico.estadisticas.sinEstadoActividad}
                      </StatNumber>
                    </Stat>
                  </StatGroup>
                  
                  <StatGroup>
                    <Stat>
                      <StatLabel>Con activo=true (legacy)</StatLabel>
                      <StatNumber>{diagnostico.estadisticas.conActivoTrue}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Activos según nuevos estados</StatLabel>
                      <StatNumber color="blue.500">
                        {diagnostico.estadisticas.activosSegunNuevosEstados}
                      </StatNumber>
                    </Stat>
                  </StatGroup>
                </Grid>
              </Box>

              {/* Usuarios problemáticos */}
              {diagnostico.usuariosProblematicos.length > 0 ? (
                <Box>
                  <Text fontSize="md" fontWeight="bold" mb={3} color="red.600">
                    ⚠️ Usuarios con Problemas ({diagnostico.usuariosProblematicos.length})
                  </Text>
                  
                  <Accordion allowMultiple>
                    {diagnostico.usuariosProblematicos.map((item, index) => (
                      <AccordionItem key={item.usuario.uid}>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            <Text fontWeight="medium">
                              {item.usuario.nombre} {item.usuario.apellidos}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {item.usuario.email}
                            </Text>
                          </Box>
                          <Badge colorScheme="red" mr={2}>
                            {item.problemas.length} problema{item.problemas.length !== 1 ? 's' : ''}
                          </Badge>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                          <VStack align="stretch" spacing={3}>
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" mb={2}>Estados actuales:</Text>
                              <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                                <Text fontSize="sm">
                                  <strong>Estado aprobación:</strong>{' '}
                                  <Code colorScheme={item.usuario.estadoAprobacion ? "green" : "red"}>
                                    {item.usuario.estadoAprobacion || 'undefined'}
                                  </Code>
                                </Text>
                                <Text fontSize="sm">
                                  <strong>Estado actividad:</strong>{' '}
                                  <Code colorScheme={item.usuario.estadoActividad ? "green" : "red"}>
                                    {item.usuario.estadoActividad || 'undefined'}
                                  </Code>
                                </Text>
                                <Text fontSize="sm">
                                  <strong>getEstadoActivoLegacy:</strong>{' '}
                                  <Code colorScheme={item.estadoLegacy ? "green" : "red"}>
                                    {item.estadoLegacy ? 'true' : 'false'}
                                  </Code>
                                </Text>
                                <Text fontSize="sm">
                                  <strong>Debería estar activo:</strong>{' '}
                                  <Code colorScheme={item.deberiaEstarActivo ? "green" : "orange"}>
                                    {item.deberiaEstarActivo ? 'true' : 'false'}
                                  </Code>
                                </Text>
                              </Grid>
                            </Box>
                            
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" mb={2}>Problemas detectados:</Text>
                              <VStack align="stretch" spacing={1}>
                                {item.problemas.map((problema, pIndex) => (
                                  <Alert key={pIndex} status="warning" size="sm">
                                    <AlertIcon />
                                    <Text fontSize="sm">{problema}</Text>
                                  </Alert>
                                ))}
                              </VStack>
                            </Box>
                          </VStack>
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Box>
              ) : (
                <Alert status="success">
                  <AlertIcon />
                  ✅ No se encontraron usuarios con problemas de estado
                </Alert>
              )}

              {/* Muestra de usuarios sin problemas */}
              <Box>
                <Text fontSize="md" fontWeight="bold" mb={3} color="green.600">
                  ✅ Muestra de usuarios correctos (primeros 5)
                </Text>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Usuario</Th>
                      <Th>Estado Aprobación</Th>
                      <Th>Estado Actividad</Th>
                      <Th>Estado Legacy</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {diagnostico.usuarios
                      .filter(usuario => !diagnostico.usuariosProblematicos.some(p => p.usuario.uid === usuario.uid))
                      .slice(0, 5)
                      .map(usuario => {
                        const estadoLegacy = getEstadoActivoLegacy(usuario);
                        return (
                          <Tr key={usuario.uid}>
                            <Td>
                              <Text fontSize="sm" fontWeight="medium">
                                {usuario.nombre} {usuario.apellidos}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                {usuario.email}
                              </Text>
                            </Td>
                            <Td>
                              <Badge colorScheme={usuario.estadoAprobacion === EstadoAprobacion.APROBADO ? "green" : "orange"} size="sm">
                                {usuario.estadoAprobacion || 'undefined'}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={usuario.estadoActividad === EstadoActividad.ACTIVO ? "green" : "gray"} size="sm">
                                {usuario.estadoActividad || 'undefined'}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={estadoLegacy ? "green" : "red"} size="sm">
                                {estadoLegacy ? "Activo" : "Inactivo"}
                              </Badge>
                            </Td>
                          </Tr>
                        );
                      })}
                  </Tbody>
                </Table>
              </Box>
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default DiagnosticoDetalladoUsuarios;
