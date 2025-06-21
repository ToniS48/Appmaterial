import React, { useState } from 'react';
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
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Code,
  Card,
  CardBody
} from '@chakra-ui/react';
import { listarMateriales } from '../../services/materialService';
import { Material } from '../../types/material';
import { Timestamp } from 'firebase/firestore';

interface MaterialInactivo {
  material: Material;
  diasSinUso: number;
  ultimaActividad?: Date | null;
  razonInactividad: string;
}

// Helper function para convertir fechas
const convertirADate = (fecha: Date | Timestamp | string | undefined): Date | null => {
  if (!fecha) return null;
  if (fecha instanceof Date) return fecha;
  if (fecha instanceof Timestamp) return fecha.toDate();
  if (typeof fecha === 'string') return new Date(fecha);
  return null;
};

const DiagnosticoMaterialesInactivos: React.FC = () => {
  const [diagnostico, setDiagnostico] = useState<{
    materialesInactivos: MaterialInactivo[];
    estadisticas: {
      total: number;
      inactivos: number;
      sinUsoMas30Dias: number;
      sinUsoMas90Dias: number;
      sinUsoMas180Dias: number;
      retirados: number;
    };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const ejecutarDiagnostico = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Iniciando diagnóstico de materiales inactivos...');
      
      const materiales = await listarMateriales();
      console.log(`📊 Total de materiales: ${materiales.length}`);
      
      const ahora = new Date();
      const materialesInactivos: MaterialInactivo[] = [];
      
      const estadisticas = {
        total: materiales.length,
        inactivos: 0,
        sinUsoMas30Dias: 0,
        sinUsoMas90Dias: 0,
        sinUsoMas180Dias: 0,
        retirados: 0
      };

      for (const material of materiales) {
        let esInactivo = false;
        let diasSinUso = 0;
        let ultimaActividad: Date | undefined;
        let razonInactividad = '';        // Verificar si está retirado o en baja
        if (material.estado === 'retirado' || material.estado === 'baja') {
          estadisticas.retirados++;
          esInactivo = true;
          razonInactividad = 'Material retirado del servicio o dado de baja';        } else {
          // Calcular días desde última actividad
          if (material.fechaUltimaRevision) {
            const fechaConvertida = convertirADate(material.fechaUltimaRevision);
            if (fechaConvertida) {
              ultimaActividad = fechaConvertida;
              diasSinUso = Math.floor((ahora.getTime() - ultimaActividad.getTime()) / (1000 * 60 * 60 * 24));
            }
          } else if (material.fechaAdquisicion) {
            const fechaConvertida = convertirADate(material.fechaAdquisicion);
            if (fechaConvertida) {
              ultimaActividad = fechaConvertida;
              diasSinUso = Math.floor((ahora.getTime() - ultimaActividad.getTime()) / (1000 * 60 * 60 * 24));
            }
            razonInactividad = 'Nunca ha sido revisado';
          } else {
            diasSinUso = 999; // Valor alto para materiales sin fechas
            razonInactividad = 'Sin fechas de referencia';
          }

          // Clasificar por días de inactividad
          if (diasSinUso >= 180) {
            estadisticas.sinUsoMas180Dias++;
            esInactivo = true;
            if (!razonInactividad) razonInactividad = 'Sin revisión por más de 6 meses';
          } else if (diasSinUso >= 90) {
            estadisticas.sinUsoMas90Dias++;
            esInactivo = true;
            if (!razonInactividad) razonInactividad = 'Sin revisión por más de 3 meses';
          } else if (diasSinUso >= 30) {
            estadisticas.sinUsoMas30Dias++;
            esInactivo = true;
            if (!razonInactividad) razonInactividad = 'Sin revisión por más de 30 días';
          }

          // Verificar estado del material
          if (material.estado === 'perdido' || material.estado === 'mantenimiento') {
            esInactivo = true;
            razonInactividad = razonInactividad ? 
              `${razonInactividad} + ${material.estado === 'perdido' ? 'Material perdido' : 'En mantenimiento'}` : 
              material.estado === 'perdido' ? 'Material perdido' : 'Material en mantenimiento';
          }
        }

        if (esInactivo) {
          materialesInactivos.push({
            material,
            diasSinUso,
            ultimaActividad,
            razonInactividad
          });
          estadisticas.inactivos++;
        }
      }

      // Ordenar por días sin uso (descendente)
      materialesInactivos.sort((a, b) => b.diasSinUso - a.diasSinUso);

      setDiagnostico({
        materialesInactivos,
        estadisticas
      });

      console.log('✅ Diagnóstico de materiales inactivos completado:', estadisticas);

      toast({
        title: "Diagnóstico completado",
        description: `Se encontraron ${estadisticas.inactivos} materiales inactivos de ${materiales.length} totales.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('❌ Error en diagnóstico de materiales inactivos:', error);
      toast({
        title: "Error en diagnóstico",
        description: "No se pudo completar el diagnóstico de materiales inactivos",
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

  const getBadgeColorInactividad = (dias: number) => {
    if (dias >= 180) return 'red';
    if (dias >= 90) return 'orange';
    if (dias >= 30) return 'yellow';
    return 'gray';
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Text fontSize="md" fontWeight="bold" mb={2}>
          Diagnóstico de Materiales Inactivos
        </Text>
        <Text fontSize="sm" color="gray.600">
          Identifica materiales que no han sido utilizados recientemente
        </Text>
      </Box>

      <Alert status="info" fontSize="sm">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Criterios de Inactividad:</Text>
          <Text>
            • Sin uso por más de 30 días<br/>
            • Material en mal estado o retirado<br/>
            • Material nunca utilizado
          </Text>
        </Box>
      </Alert>

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
              <Text fontWeight="bold" mb={3}>Estadísticas de Inactividad</Text>
              <StatGroup>
                <Stat>
                  <StatLabel>Total Materiales</StatLabel>
                  <StatNumber>{diagnostico.estadisticas.total}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Inactivos</StatLabel>
                  <StatNumber color="red.500">
                    {diagnostico.estadisticas.inactivos}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>+30 días</StatLabel>
                  <StatNumber color="yellow.500">
                    {diagnostico.estadisticas.sinUsoMas30Dias}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>+90 días</StatLabel>
                  <StatNumber color="orange.500">
                    {diagnostico.estadisticas.sinUsoMas90Dias}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>+180 días</StatLabel>
                  <StatNumber color="red.500">
                    {diagnostico.estadisticas.sinUsoMas180Dias}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Retirados</StatLabel>
                  <StatNumber color="gray.500">
                    {diagnostico.estadisticas.retirados}
                  </StatNumber>
                </Stat>
              </StatGroup>
            </CardBody>
          </Card>

          {/* Lista de materiales inactivos */}
          {diagnostico.materialesInactivos.length > 0 ? (
            <Card>
              <CardBody>
                <Text fontWeight="bold" mb={3}>
                  Materiales Inactivos ({diagnostico.materialesInactivos.length})
                </Text>
                <Box overflowX="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>ID</Th>
                        <Th>Nombre</Th>
                        <Th>Tipo</Th>
                        <Th>Estado</Th>
                        <Th>Días sin uso</Th>
                        <Th>Última actividad</Th>
                        <Th>Razón</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {diagnostico.materialesInactivos.map(({ material, diasSinUso, ultimaActividad, razonInactividad }) => (
                        <Tr key={material.id}>
                          <Td>
                            <Code fontSize="xs">{material.id}</Code>
                          </Td>
                          <Td>{material.nombre}</Td>
                          <Td>
                            <Badge colorScheme="blue">
                              {formatearTipo(material.tipo)}
                            </Badge>
                          </Td>
                          <Td>                            <Badge 
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
                            <Badge colorScheme={getBadgeColorInactividad(diasSinUso)}>
                              {diasSinUso} días
                            </Badge>
                          </Td>
                          <Td>
                            {ultimaActividad ? (
                              <Text fontSize="xs">
                                {ultimaActividad.toLocaleDateString()}
                              </Text>
                            ) : (
                              <Text fontSize="xs" color="gray.500">N/A</Text>
                            )}
                          </Td>
                          <Td>
                            <Text fontSize="xs">{razonInactividad}</Text>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>
          ) : (
            <Alert status="success">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">¡Excelente!</Text>
                <Text>No se encontraron materiales inactivos.</Text>
              </Box>
            </Alert>
          )}
        </VStack>
      )}
    </VStack>
  );
};

export default DiagnosticoMaterialesInactivos;
