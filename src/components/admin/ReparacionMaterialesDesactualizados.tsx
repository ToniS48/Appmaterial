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
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Code,
  Card,
  CardBody,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react';
import { listarMateriales, actualizarMaterial } from '../../services/materialService';
import { Material } from '../../types/material';
import { Timestamp } from 'firebase/firestore';

interface MaterialReparado {
  material: Material;
  reparacionesAplicadas: string[];
  estadoAnterior: Partial<Material>;
}

// Helper function para convertir fechas
const convertirADate = (fecha: Date | Timestamp | string | undefined): Date | null => {
  if (!fecha) return null;
  if (fecha instanceof Date) return fecha;
  if (fecha instanceof Timestamp) return fecha.toDate();
  if (typeof fecha === 'string') return new Date(fecha);
  return null;
};

const ReparacionMaterialesDesactualizados: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<{
    total: number;
    analizados: number;
    reparados: number;
    errores: number;
    materialesReparados: MaterialReparado[];
  } | null>(null);
  const toast = useToast();

  const ejecutarReparacion = async () => {
    setIsLoading(true);
    setResultado(null);
    
    try {
      console.log('🔧 Iniciando reparación de materiales desactualizados...');
      
      const materiales = await listarMateriales();
      console.log(`📊 Total de materiales a analizar: ${materiales.length}`);
      
      let analizados = 0;
      let reparados = 0;
      let errores = 0;
      const materialesReparados: MaterialReparado[] = [];
      
      for (const material of materiales) {
        try {
          const reparacionesAplicadas: string[] = [];
          const estadoAnterior: Partial<Material> = {};
          const cambios: Partial<Material> = {};
          
          // 1. Reparar nombre vacío o con espacios
          if (!material.nombre || material.nombre.trim() === '') {
            estadoAnterior.nombre = material.nombre;
            cambios.nombre = `Material ${material.tipo || 'sin-tipo'} ${material.id.slice(-6)}`;
            reparacionesAplicadas.push('Nombre generado automáticamente');
          } else if (material.nombre !== material.nombre.trim()) {
            estadoAnterior.nombre = material.nombre;
            cambios.nombre = material.nombre.trim();
            reparacionesAplicadas.push('Espacios eliminados del nombre');
          }
          
          // 2. Reparar tipo inválido
          const tiposValidos = ['cuerda', 'anclaje', 'varios'];
          if (!material.tipo || !tiposValidos.includes(material.tipo)) {
            estadoAnterior.tipo = material.tipo;
            cambios.tipo = 'varios';
            reparacionesAplicadas.push('Tipo corregido a "varios"');
          }
            // 3. Reparar estado inválido
          const estadosValidos = ['disponible', 'prestado', 'mantenimiento', 'baja', 'perdido', 'revision', 'retirado'];
          if (!material.estado || !estadosValidos.includes(material.estado)) {
            estadoAnterior.estado = material.estado;
            cambios.estado = 'disponible';
            reparacionesAplicadas.push('Estado corregido a "disponible"');
          }
            // 4. Establecer fecha de adquisición si falta
          if (!material.fechaAdquisicion) {
            estadoAnterior.fechaAdquisicion = material.fechaAdquisicion;
            cambios.fechaAdquisicion = new Date();
            reparacionesAplicadas.push('Fecha de adquisición establecida');
          }
          
          // 5. Corregir datos específicos por tipo
          if (material.tipo === 'cuerda' || cambios.tipo === 'cuerda') {
            if (!material.diametro || material.diametro <= 0) {
              estadoAnterior.diametro = material.diametro;
              cambios.diametro = 10; // Diámetro por defecto en mm
              reparacionesAplicadas.push('Diámetro de cuerda establecido por defecto');
            }
            if (!material.longitud || material.longitud <= 0) {
              estadoAnterior.longitud = material.longitud;
              cambios.longitud = 50; // Longitud por defecto en metros
              reparacionesAplicadas.push('Longitud de cuerda establecida por defecto');
            }
          }
          
          if (material.tipo === 'anclaje' || cambios.tipo === 'anclaje') {            if (!material.tipoAnclaje) {
              estadoAnterior.tipoAnclaje = material.tipoAnclaje;
              cambios.tipoAnclaje = 'químico';
              reparacionesAplicadas.push('Tipo de anclaje establecido por defecto');
            }
          }          // 6. Corregir fechas inconsistentes
          if (material.fechaUltimaRevision && material.fechaAdquisicion) {
            const fechaAdq = convertirADate(material.fechaAdquisicion);
            const fechaRev = convertirADate(material.fechaUltimaRevision);
            if (fechaAdq && fechaRev && fechaRev < fechaAdq) {
              estadoAnterior.fechaUltimaRevision = material.fechaUltimaRevision;
              cambios.fechaUltimaRevision = material.fechaAdquisicion;
              reparacionesAplicadas.push('Fecha de revisión corregida');
            }
          }
          
          // Aplicar cambios si hay reparaciones
          if (reparacionesAplicadas.length > 0) {
            await actualizarMaterial(material.id, cambios);
            
            materialesReparados.push({
              material: { ...material, ...cambios },
              reparacionesAplicadas,
              estadoAnterior
            });
            
            reparados++;
            console.log(`✅ Material ${material.id} reparado:`, reparacionesAplicadas);
          }
          
          analizados++;
          
        } catch (error) {
          console.error(`❌ Error reparando material ${material.id}:`, error);
          errores++;
        }
      }
      
      const resultadoFinal = {
        total: materiales.length,
        analizados,
        reparados,
        errores,
        materialesReparados
      };
      
      setResultado(resultadoFinal);
      
      // Señal para que otros componentes se actualicen
      localStorage.setItem('reparacion_materiales_completada', Date.now().toString());
      
      console.log('✅ Reparación de materiales completada:', resultadoFinal);
      
      toast({
        title: "Reparación completada",
        description: `${reparados} materiales reparados de ${analizados} analizados`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('❌ Error en reparación de materiales:', error);
      toast({
        title: "Error en reparación",
        description: "No se pudo completar la reparación de materiales",
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

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Text fontSize="md" fontWeight="bold" mb={2}>
          Reparación de Materiales Desactualizados
        </Text>
        <Text fontSize="sm" color="gray.600">
          Corrige automáticamente datos inconsistentes o faltantes en materiales
        </Text>
      </Box>

      <Alert status="warning" fontSize="sm">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Reparaciones que se aplicarán:</Text>
          <Text>
            • Generar nombres para materiales sin nombre<br/>
            • Corregir tipos y estados inválidos<br/>
            • Establecer fechas faltantes<br/>
            • Completar datos específicos por tipo<br/>
            • Corregir fechas inconsistentes
          </Text>
        </Box>
      </Alert>

      <Button
        colorScheme="orange"
        onClick={ejecutarReparacion}
        isLoading={isLoading}
        loadingText="Reparando..."
      >
        Ejecutar Reparación
      </Button>

      {isLoading && (
        <Box>
          <Text fontSize="sm" mb={2}>Analizando y reparando materiales...</Text>
          <Progress size="sm" isIndeterminate />
        </Box>
      )}

      {resultado && (
        <VStack spacing={4} align="stretch">
          {/* Estadísticas del resultado */}
          <Card>
            <CardBody>
              <Text fontWeight="bold" mb={3}>Resultado de la Reparación</Text>
              <StatGroup>
                <Stat>
                  <StatLabel>Total Materiales</StatLabel>
                  <StatNumber>{resultado.total}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Analizados</StatLabel>
                  <StatNumber color="blue.500">{resultado.analizados}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Reparados</StatLabel>
                  <StatNumber color="green.500">{resultado.reparados}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Errores</StatLabel>
                  <StatNumber color="red.500">{resultado.errores}</StatNumber>
                </Stat>
              </StatGroup>
              
              {resultado.reparados > 0 && (
                <Alert status="success" mt={4}>
                  <AlertIcon />
                  <Text>
                    Se repararon {resultado.reparados} materiales correctamente.
                  </Text>
                </Alert>
              )}
              
              {resultado.errores > 0 && (
                <Alert status="warning" mt={4}>
                  <AlertIcon />
                  <Text>
                    Se produjeron {resultado.errores} errores durante el proceso.
                  </Text>
                </Alert>
              )}
            </CardBody>
          </Card>

          {/* Detalles de materiales reparados */}
          {resultado.materialesReparados.length > 0 && (
            <Accordion allowMultiple>
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Text fontWeight="medium">
                      Materiales Reparados
                      <Badge ml={2} colorScheme="green">
                        {resultado.materialesReparados.length}
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
                          <Th>Reparaciones Aplicadas</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {resultado.materialesReparados.map(({ material, reparacionesAplicadas }) => (
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
                            <Td>
                              <VStack align="start" spacing={1}>
                                {reparacionesAplicadas.map((reparacion, idx) => (
                                  <Badge key={idx} colorScheme="green" fontSize="xs">
                                    {reparacion}
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
            </Accordion>
          )}

          {resultado.reparados === 0 && (
            <Alert status="info">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">No se requirieron reparaciones</Text>
                <Text>Todos los materiales están en buen estado y con datos completos.</Text>
              </Box>
            </Alert>
          )}
        </VStack>
      )}
    </VStack>
  );
};

export default ReparacionMaterialesDesactualizados;
