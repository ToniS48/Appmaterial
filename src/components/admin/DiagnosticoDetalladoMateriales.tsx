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
import { listarMateriales } from '../../services/materialService';
import { Material } from '../../types/material';
import { Timestamp } from 'firebase/firestore';

interface MaterialProblematico {
  material: Material;
  problemas: string[];
}

// Helper function para convertir fechas
const convertirADate = (fecha: Date | Timestamp | string | undefined): Date | null => {
  if (!fecha) return null;
  if (fecha instanceof Date) return fecha;
  if (fecha instanceof Timestamp) return fecha.toDate();
  if (typeof fecha === 'string') return new Date(fecha);
  return null;
};

const DiagnosticoDetalladoMateriales: React.FC = () => {
  const [diagnostico, setDiagnostico] = useState<{
    materiales: Material[];
    materialesProblematicos: MaterialProblematico[];
    estadisticas: {
      total: number;
      sinNombre: number;
      sinTipo: number;
      sinEstado: number;
      conDatosIncompletos: number;
      problematicos: number;
    };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Auto-actualizar tras recálculo
  useEffect(() => {
    const checkRecalculo = () => {
      const señal = localStorage.getItem('recalculo_materiales_completado');
      if (señal) {
        console.log('🔄 Recálculo de materiales detectado en diagnóstico detallado, actualizando...');
        setTimeout(() => {
          ejecutarDiagnostico();
          localStorage.removeItem('recalculo_materiales_completado');
        }, 1000);
      }
    };

    checkRecalculo();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'recalculo_materiales_completado' && e.newValue) {
        checkRecalculo();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const ejecutarDiagnostico = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Iniciando diagnóstico detallado de materiales...');
      
      const materiales = await listarMateriales();
      console.log(`📊 Total de materiales: ${materiales.length}`);
      
      const materialesProblematicos: MaterialProblematico[] = [];
      const estadisticas = {
        total: materiales.length,
        sinNombre: 0,
        sinTipo: 0,
        sinEstado: 0,
        conDatosIncompletos: 0,
        problematicos: 0
      };

      // Analizar cada material
      for (const material of materiales) {
        const problemas: string[] = [];

        // Verificar nombre
        if (!material.nombre || material.nombre.trim() === '') {
          problemas.push('Sin nombre');
          estadisticas.sinNombre++;
        }

        // Verificar tipo
        if (!material.tipo) {
          problemas.push('Sin tipo');
          estadisticas.sinTipo++;
        }        // Verificar estado
        if (!material.estado) {
          problemas.push('Sin estado');
          estadisticas.sinEstado++;
        }

        // Verificar datos específicos por tipo
        if (material.tipo === 'cuerda') {
          if (!material.diametro || !material.longitud) {
            problemas.push('Datos de cuerda incompletos (diámetro/longitud)');
            estadisticas.conDatosIncompletos++;
          }
        } else if (material.tipo === 'anclaje') {
          if (!material.tipoAnclaje) {
            problemas.push('Datos de anclaje incompletos (tipo)');
            estadisticas.conDatosIncompletos++;
          }
        }

        // Verificar fechas
        if (!material.fechaAdquisicion) {
          problemas.push('Sin fecha de adquisición');
        }        if (material.fechaUltimaRevision && material.fechaAdquisicion) {
          const fechaRev = convertirADate(material.fechaUltimaRevision);
          const fechaAdq = convertirADate(material.fechaAdquisicion);
          if (fechaRev && fechaAdq && fechaRev < fechaAdq) {
            problemas.push('Fecha de revisión anterior a fecha de adquisición');
          }
        }

        if (problemas.length > 0) {
          materialesProblematicos.push({
            material,
            problemas
          });
          estadisticas.problematicos++;
        }
      }

      setDiagnostico({
        materiales,
        materialesProblematicos,
        estadisticas
      });

      console.log('✅ Diagnóstico de materiales completado:', estadisticas);

      toast({
        title: "Diagnóstico completado",
        description: `Se analizaron ${materiales.length} materiales. ${estadisticas.problematicos} con problemas detectados.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('❌ Error en diagnóstico de materiales:', error);
      toast({
        title: "Error en diagnóstico",
        description: "No se pudo completar el diagnóstico de materiales",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatearTipo = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      'cuerda': 'Cuerda',
      'anclaje': 'Anclaje',
      'varios': 'Varios'
    };
    return tipos[tipo] || tipo;
  };
  const formatearEstado = (estado: string) => {
    const estados: { [key: string]: string } = {
      'disponible': 'Disponible',
      'prestado': 'Prestado',
      'mantenimiento': 'Mantenimiento',
      'baja': 'Baja',
      'perdido': 'Perdido',
      'revision': 'Revisión',
      'retirado': 'Retirado'
    };
    return estados[estado] || estado;
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Text fontSize="md" fontWeight="bold" mb={2}>
          Diagnóstico Detallado de Materiales
        </Text>
        <Text fontSize="sm" color="gray.600">
          Analiza la integridad y consistencia de los datos de materiales
        </Text>
      </Box>

      <Button
        colorScheme="blue"
        onClick={ejecutarDiagnostico}
        isLoading={isLoading}
        loadingText="Analizando..."
      >
        Ejecutar Diagnóstico
      </Button>

      {diagnostico && (
        <VStack spacing={4} align="stretch">
          {/* Estadísticas generales */}
          <Card>
            <CardBody>
              <Text fontWeight="bold" mb={3}>Estadísticas Generales</Text>
              <StatGroup>
                <Stat>
                  <StatLabel>Total Materiales</StatLabel>
                  <StatNumber>{diagnostico.estadisticas.total}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Problemáticos</StatLabel>
                  <StatNumber color="red.500">
                    {diagnostico.estadisticas.problematicos}
                  </StatNumber>
                </Stat>
              </StatGroup>
            </CardBody>
          </Card>

          {/* Problemas detectados */}
          <Accordion allowMultiple>
            <AccordionItem>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Text fontWeight="medium">
                    Desglose de Problemas
                    <Badge ml={2} colorScheme="red">
                      {diagnostico.estadisticas.problematicos}
                    </Badge>
                  </Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                  <Stat>
                    <StatLabel>Sin Nombre</StatLabel>
                    <StatNumber color="red.500">{diagnostico.estadisticas.sinNombre}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Sin Tipo</StatLabel>
                    <StatNumber color="red.500">{diagnostico.estadisticas.sinTipo}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Sin Estado</StatLabel>
                    <StatNumber color="red.500">{diagnostico.estadisticas.sinEstado}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Datos Incompletos</StatLabel>
                    <StatNumber color="red.500">{diagnostico.estadisticas.conDatosIncompletos}</StatNumber>
                  </Stat>
                </Grid>
              </AccordionPanel>
            </AccordionItem>

            {diagnostico.materialesProblematicos.length > 0 && (
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Text fontWeight="medium">
                      Materiales Problemáticos
                      <Badge ml={2} colorScheme="red">
                        {diagnostico.materialesProblematicos.length}
                      </Badge>
                    </Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <Box overflowX="auto">
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>ID</Th>
                          <Th>Nombre</Th>
                          <Th>Tipo</Th>
                          <Th>Estado</Th>
                          <Th>Problemas</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {diagnostico.materialesProblematicos.map(({ material, problemas }) => (
                          <Tr key={material.id}>
                            <Td>
                              <Code fontSize="xs">{material.id}</Code>
                            </Td>
                            <Td>{material.nombre || 'Sin nombre'}</Td>
                            <Td>
                              <Badge colorScheme="blue">
                                {formatearTipo(material.tipo)}
                              </Badge>
                            </Td>
                            <Td>                              <Badge 
                                colorScheme={
                                  material.estado === 'disponible' ? 'green' :
                                  material.estado === 'prestado' ? 'blue' :
                                  material.estado === 'mantenimiento' ? 'yellow' :
                                  material.estado === 'baja' ? 'red' :
                                  material.estado === 'perdido' ? 'red' :
                                  material.estado === 'revision' ? 'orange' :
                                  material.estado === 'retirado' ? 'gray' : 'gray'
                                }
                              >
                                {formatearEstado(material.estado)}
                              </Badge>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                {problemas.map((problema, idx) => (
                                  <Badge key={idx} colorScheme="red" fontSize="xs">
                                    {problema}
                                  </Badge>
                                ))}
                              </VStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </AccordionPanel>
              </AccordionItem>
            )}
          </Accordion>

          {diagnostico.materialesProblematicos.length === 0 && (
            <Alert status="success">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">¡Excelente!</Text>
                <Text>No se detectaron problemas en los materiales analizados.</Text>
              </Box>
            </Alert>
          )}
        </VStack>
      )}
    </VStack>
  );
};

export default DiagnosticoDetalladoMateriales;
