import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Alert,
  AlertIcon,
  Spinner,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue
} from '@chakra-ui/react';
import { FiBarChart2, FiPackage, FiBell, FiCalendar, FiTool, FiFolder } from 'react-icons/fi';
import { useSystemConfig } from '../../../../services/SystemConfigService';

/**
 * Componente de ejemplo que muestra cómo utilizar las variables del sistema
 */
const SystemVariablesViewer: React.FC = () => {
  const {
    variables,
    loading,
    getVariable,
    isWithinGracePeriod,
    calculateReturnDeadline,
    shouldApplyPenalty,
    canCreateActivity,
    canModifyActivity,
    isStockBelowMinimum
  } = useSystemConfig();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (loading) {
    return (
      <VStack spacing={4} p={4}>
        <Spinner size="lg" />
        <Text>Cargando variables del sistema...</Text>
      </VStack>
    );
  }

  // Ejemplos de uso de las variables
  const exampleActivityDate = new Date();
  exampleActivityDate.setDate(exampleActivityDate.getDate() + 5);

  const exampleEndDate = new Date();
  exampleEndDate.setDate(exampleEndDate.getDate() - 2);

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        <Card bg={cardBg} borderColor={borderColor}>
          <CardHeader>
            <Heading size="md" display="flex" alignItems="center">
              <FiBarChart2 style={{ marginRight: 8 }} />
              Variables del Sistema - Vista de Desarrollador
            </Heading>
            <Text fontSize="sm" color="gray.600">
              Ejemplo de cómo acceder y utilizar las variables del sistema en componentes
            </Text>
          </CardHeader>
        </Card>

        {/* Variables de Préstamos */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Heading size="sm" mb={4} color="blue.600" display="flex" alignItems="center">
              <FiPackage style={{ marginRight: 8 }} />
              Variables de Préstamos y Devoluciones
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              <Stat>
                <StatLabel>Días de gracia</StatLabel>
                <StatNumber>{getVariable('diasGraciaDevolucion')}</StatNumber>
                <StatHelpText>días después de actividad</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Máximo retraso</StatLabel>
                <StatNumber>{getVariable('diasMaximoRetraso')}</StatNumber>
                <StatHelpText>antes de penalización</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Bloqueo por retraso</StatLabel>
                <StatNumber>{getVariable('diasBloqueoPorRetraso')}</StatNumber>
                <StatHelpText>días de bloqueo</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Tiempo entre préstamos</StatLabel>
                <StatNumber>{getVariable('tiempoMinimoEntrePrestamos')}</StatNumber>
                <StatHelpText>días mínimos</StatHelpText>
              </Stat>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Variables de Notificaciones */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Heading size="sm" mb={4} color="green.600" display="flex" alignItems="center">
              <FiBell style={{ marginRight: 8 }} />
              Variables de Notificaciones
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Stat>
                <StatLabel>Recordatorio pre-actividad</StatLabel>
                <StatNumber>{getVariable('recordatorioPreActividad')}</StatNumber>
                <StatHelpText>días antes</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Recordatorio devolución</StatLabel>
                <StatNumber>{getVariable('recordatorioDevolucion')}</StatNumber>
                <StatHelpText>días antes vencimiento</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Notificación retraso</StatLabel>
                <StatNumber>{getVariable('notificacionRetrasoDevolucion')}</StatNumber>
                <StatHelpText>días después vencimiento</StatHelpText>
              </Stat>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Variables de Actividades */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Heading size="sm" mb={4} color="purple.600" display="flex" alignItems="center">
              <FiCalendar style={{ marginRight: 8 }} />
              Variables de Actividades
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Stat>
                <StatLabel>Antelación mínima</StatLabel>
                <StatNumber>{getVariable('diasMinimoAntelacionCreacion')}</StatNumber>
                <StatHelpText>días para crear</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Límite modificación</StatLabel>
                <StatNumber>{getVariable('diasMaximoModificacion')}</StatNumber>
                <StatHelpText>días antes actividad</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Participantes por defecto</StatLabel>
                <StatNumber>{getVariable('limiteParticipantesPorDefecto')}</StatNumber>
                <StatHelpText>límite inicial</StatHelpText>
              </Stat>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Ejemplos de uso práctico */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Heading size="sm" mb={4} color="orange.600" display="flex" alignItems="center">
              <FiTool style={{ marginRight: 8 }} />
              Ejemplos de Uso Práctico
            </Heading>
            
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Verificaciones automáticas con las variables:</Text>
                </Box>
              </Alert>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box p={4} borderWidth={1} borderRadius="md">
                  <Text fontWeight="bold" mb={2}>¿Está en período de gracia?</Text>
                  <HStack>
                    <Text>Actividad terminó hace 2 días:</Text>
                    <Badge colorScheme={isWithinGracePeriod(exampleEndDate) ? 'green' : 'red'}>
                      {isWithinGracePeriod(exampleEndDate) ? 'SÍ' : 'NO'}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Fecha límite: {calculateReturnDeadline(exampleEndDate).toLocaleDateString()}
                  </Text>
                </Box>

                <Box p={4} borderWidth={1} borderRadius="md">
                  <Text fontWeight="bold" mb={2}>¿Se puede crear actividad?</Text>
                  <HStack>
                    <Text>Para dentro de 5 días:</Text>
                    <Badge colorScheme={canCreateActivity(exampleActivityDate) ? 'green' : 'red'}>
                      {canCreateActivity(exampleActivityDate) ? 'SÍ' : 'NO'}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Mínimo requerido: {getVariable('diasMinimoAntelacionCreacion')} días
                  </Text>
                </Box>

                <Box p={4} borderWidth={1} borderRadius="md">
                  <Text fontWeight="bold" mb={2}>¿Se puede modificar actividad?</Text>
                  <HStack>
                    <Text>Actividad en 5 días:</Text>
                    <Badge colorScheme={canModifyActivity(exampleActivityDate) ? 'green' : 'red'}>
                      {canModifyActivity(exampleActivityDate) ? 'SÍ' : 'NO'}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Límite: {getVariable('diasMaximoModificacion')} días antes
                  </Text>
                </Box>

                <Box p={4} borderWidth={1} borderRadius="md">
                  <Text fontWeight="bold" mb={2}>¿Aplicar penalización?</Text>
                  <HStack>
                    <Text>20 días de retraso:</Text>
                    <Badge colorScheme={shouldApplyPenalty(20) ? 'red' : 'green'}>
                      {shouldApplyPenalty(20) ? 'SÍ' : 'NO'}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Máximo permitido: {getVariable('diasMaximoRetraso')} días
                  </Text>
                </Box>

                <Box p={4} borderWidth={1} borderRadius="md">
                  <Text fontWeight="bold" mb={2}>¿Stock bajo mínimo?</Text>
                  <HStack>
                    <Text>15 de 100 unidades (15%):</Text>
                    <Badge colorScheme={isStockBelowMinimum(15, 100) ? 'red' : 'green'}>
                      {isStockBelowMinimum(15, 100) ? 'SÍ' : 'NO'}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Mínimo configurado: {getVariable('porcentajeStockMinimo')}%
                  </Text>
                </Box>
              </SimpleGrid>

              <Alert status="success">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Código de ejemplo:</Text>
                  <Text fontSize="sm" fontFamily="monospace" mt={2}>
                    {`const { getVariable, isWithinGracePeriod } = useSystemConfig();`}
                    <br />
                    {`const graceDays = getVariable('diasGraciaDevolucion');`}
                    <br />
                    {`const canReturn = isWithinGracePeriod(activityEndDate);`}
                  </Text>
                </Box>
              </Alert>
            </VStack>
          </CardBody>
        </Card>

        {/* Variables completas */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Heading size="sm" mb={4} color="gray.600" display="flex" alignItems="center">
              <FiFolder style={{ marginRight: 8 }} />
              Todas las Variables (JSON)
            </Heading>
            <Box p={4} bg="gray.50" borderRadius="md" fontFamily="monospace" fontSize="sm">
              <pre>{JSON.stringify(variables, null, 2)}</pre>
            </Box>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default SystemVariablesViewer;
