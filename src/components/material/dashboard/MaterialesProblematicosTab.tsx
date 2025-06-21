import React from 'react';
import {
  Box,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Code,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import {
  FiAlertTriangle,
  FiEye,
  FiTool,
  FiRefreshCw
} from 'react-icons/fi';
import { MaterialProblematico } from './types';

interface MaterialesProblematicosTabProps {
  materiales: MaterialProblematico[];
  cargando: boolean;
  onVerDetalle?: (material: MaterialProblematico) => void;
  onCorregir?: (material: MaterialProblematico) => void;
}

const MaterialesProblematicosTab: React.FC<MaterialesProblematicosTabProps> = ({
  materiales,
  cargando,
  onVerDetalle,
  onCorregir
}) => {
  const materialesPorPrioridad = materiales.reduce((acc, material) => {
    acc[material.prioridad] = (acc[material.prioridad] || 0) + 1;
    return acc;
  }, {} as Record<'alta' | 'media' | 'baja', number>);

  const getColorPrioridad = (prioridad: 'alta' | 'media' | 'baja') => {
    switch (prioridad) {
      case 'alta': return 'red';
      case 'media': return 'orange';
      case 'baja': return 'yellow';
      default: return 'gray';
    }
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

  const formatearTipo = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      'cuerda': 'Cuerda',
      'anclaje': 'Anclaje',
      'varios': 'Varios'
    };
    return tipos[tipo] || tipo;
  };

  if (cargando) {
    return (
      <Box p={6}>
        <VStack spacing={4}>
          <Text>Analizando materiales problemáticos...</Text>
          <Progress size="xs" isIndeterminate width="100%" />
        </VStack>
      </Box>
    );
  }

  if (materiales.length === 0) {
    return (
      <Alert status="success">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">¡Excelente!</Text>
          <Text>No se detectaron materiales con problemas en el inventario actual.</Text>
        </Box>
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          ⚠️ Materiales Problemáticos
        </Text>
        <Text fontSize="sm" color="gray.600">
          Materiales que requieren atención inmediata o revisión
        </Text>
      </Box>

      {/* Estadísticas por prioridad */}
      <Card>
        <CardBody>
          <Text fontWeight="bold" mb={4}>Resumen por Prioridad</Text>
          <StatGroup>
            <Stat>
              <StatLabel>Alta Prioridad</StatLabel>
              <StatNumber color="red.500">
                {materialesPorPrioridad.alta || 0}
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Media Prioridad</StatLabel>
              <StatNumber color="orange.500">
                {materialesPorPrioridad.media || 0}
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Baja Prioridad</StatLabel>
              <StatNumber color="yellow.500">
                {materialesPorPrioridad.baja || 0}
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Total</StatLabel>
              <StatNumber>{materiales.length}</StatNumber>
            </Stat>
          </StatGroup>
        </CardBody>
      </Card>

      {/* Lista de materiales problemáticos */}
      <Card>
        <CardBody>
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="bold">
              Lista de Materiales ({materiales.length})
            </Text>
            <Tooltip label="Actualizar lista">
              <IconButton
                aria-label="Actualizar"
                icon={<FiRefreshCw />}
                size="sm"
                variant="outline"
              />
            </Tooltip>
          </HStack>
          
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Prioridad</Th>
                  <Th>Material</Th>
                  <Th>Tipo</Th>
                  <Th>Estado</Th>
                  <Th>Problemas</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {materiales.map((materialProblematico) => (
                  <Tr key={materialProblematico.material.id}>
                    <Td>
                      <Badge colorScheme={getColorPrioridad(materialProblematico.prioridad)}>
                        {materialProblematico.prioridad.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="medium">
                          {materialProblematico.material.nombre || 'Sin nombre'}
                        </Text>
                        <Code fontSize="xs">
                          {materialProblematico.material.id}
                        </Code>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge colorScheme="blue">
                        {formatearTipo(materialProblematico.material.tipo)}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge 
                        colorScheme={
                          materialProblematico.material.estado === 'disponible' ? 'green' :
                          materialProblematico.material.estado === 'prestado' ? 'blue' :
                          materialProblematico.material.estado === 'mantenimiento' ? 'yellow' :
                          materialProblematico.material.estado === 'baja' ? 'red' :
                          materialProblematico.material.estado === 'perdido' ? 'red' :
                          materialProblematico.material.estado === 'revision' ? 'orange' :
                          materialProblematico.material.estado === 'retirado' ? 'gray' : 'gray'
                        }
                      >
                        {formatearEstado(materialProblematico.material.estado)}
                      </Badge>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        {materialProblematico.problemas.map((problema, idx) => (
                          <Badge 
                            key={idx}
                            colorScheme={getColorPrioridad(materialProblematico.prioridad)}
                            fontSize="xs"
                          >
                            {problema}
                          </Badge>
                        ))}
                      </VStack>
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <Tooltip label="Ver detalles">
                          <IconButton
                            aria-label="Ver detalles"
                            icon={<FiEye />}
                            size="xs"
                            variant="outline"
                            onClick={() => onVerDetalle?.(materialProblematico)}
                          />
                        </Tooltip>
                        <Tooltip label="Corregir">
                          <IconButton
                            aria-label="Corregir"
                            icon={<FiTool />}
                            size="xs"
                            colorScheme="orange"
                            variant="outline"
                            onClick={() => onCorregir?.(materialProblematico)}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>

      {/* Recomendaciones */}
      <Card>
        <CardBody>
          <Text fontWeight="bold" mb={4}>📋 Recomendaciones de Acción</Text>
          <VStack spacing={3} align="stretch">
            {materialesPorPrioridad.alta > 0 && (
              <Alert status="error">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Acción Inmediata Requerida</Text>
                  <Text fontSize="sm">
                    Hay {materialesPorPrioridad.alta} materiales de alta prioridad que requieren 
                    atención inmediata (perdidos, dados de baja, etc.)
                  </Text>
                </Box>
              </Alert>
            )}
            
            {materialesPorPrioridad.media > 0 && (
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Programar Mantenimiento</Text>
                  <Text fontSize="sm">
                    {materialesPorPrioridad.media} materiales requieren mantenimiento o revisión 
                    en los próximos días.
                  </Text>
                </Box>
              </Alert>
            )}
            
            {materialesPorPrioridad.baja > 0 && (
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Actualizar Información</Text>
                  <Text fontSize="sm">
                    {materialesPorPrioridad.baja} materiales tienen datos incompletos que 
                    deberían completarse cuando sea posible.
                  </Text>
                </Box>
              </Alert>
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default MaterialesProblematicosTab;
