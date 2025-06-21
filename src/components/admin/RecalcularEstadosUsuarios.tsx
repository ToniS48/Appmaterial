import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast
} from '@chakra-ui/react';
import { usuarioHistorialService } from '../../services/domain/UsuarioHistorialService';

interface CambioEstado {
  uid: string;
  nombre: string;
  estadoAnterior: string;
  estadoNuevo: string;
}

interface ResultadoRecalculo {
  usuariosActualizados: number;
  cambios: CambioEstado[];
}

export const RecalcularEstadosUsuarios: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoRecalculo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleRecalcular = async () => {
    try {
      setLoading(true);
      setError(null);
      setResultado(null);

      toast({
        title: "Iniciando recálculo",
        description: "Esto puede tomar unos minutos...",
        status: "info",
        duration: 3000,
        isClosable: true,
      });

      const resultado = await usuarioHistorialService.recalcularEstadosActividad();      setResultado(resultado);      // Notificar al diagnóstico que se completó el recálculo
      localStorage.setItem('recalculo_estados_completado', new Date().toISOString());
      // Señal específica para gestión de usuarios
      localStorage.setItem('recalculo_completado', new Date().toISOString());
      
      toast({
        title: "Recálculo completado",
        description: `${resultado.usuariosActualizados} usuarios actualizados. Los componentes se actualizarán automáticamente.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

    } catch (error: any) {
      const errorMsg = error.message || 'Error desconocido';
      setError(errorMsg);
      
      toast({
        title: "Error en el recálculo",
        description: errorMsg,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'green';
      case 'inactivo':
        return 'gray';
      case 'suspendido':
        return 'red';
      default:
        return 'blue';
    }
  };

  return (
    <Card>
      <CardHeader>
        <Heading size="md">🔄 Recalcular Estados de Actividad de Usuarios</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Descripción */}
          <Alert status="info">
            <AlertIcon />
            <Box>
              <AlertTitle>¿Qué hace esta función?</AlertTitle>
              <AlertDescription>
                Recalcula el estado de actividad de todos los usuarios basándose en su participación real en actividades 
                de los últimos 6 meses. Esto corrige estados incorrectos que puedan haberse generado por errores en la lógica anterior.
              </AlertDescription>
            </Box>
          </Alert>

          {/* Botón de acción */}
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleRecalcular}
            isLoading={loading}
            loadingText="Recalculando estados..."
            disabled={loading}
          >
            🚀 Iniciar Recálculo de Estados
          </Button>

          {/* Barra de progreso */}
          {loading && (
            <Box>
              <Text mb={2}>Procesando usuarios...</Text>
              <Progress isIndeterminate colorScheme="blue" />
            </Box>
          )}

          {/* Error */}
          {error && (
            <Alert status="error">
              <AlertIcon />
              <Box>
                <AlertTitle>Error durante el recálculo</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Resultados */}
          {resultado && (
            <VStack spacing={4} align="stretch">
              <Alert status="success">
                <AlertIcon />
                <Box>
                  <AlertTitle>¡Recálculo completado exitosamente!</AlertTitle>
                  <AlertDescription>
                    Se actualizaron {resultado.usuariosActualizados} usuarios de un total procesado.
                  </AlertDescription>
                </Box>
              </Alert>

              {/* Tabla de cambios */}
              {resultado.cambios.length > 0 && (
                <Box>
                  <Heading size="sm" mb={3}>📊 Cambios realizados:</Heading>
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Usuario</Th>
                          <Th>Estado Anterior</Th>
                          <Th>Estado Nuevo</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {resultado.cambios.map((cambio, index) => (
                          <Tr key={index}>
                            <Td>
                              <Text fontWeight="medium">{cambio.nombre}</Text>
                              <Text fontSize="xs" color="gray.500">{cambio.uid}</Text>
                            </Td>
                            <Td>
                              <Badge colorScheme={getBadgeColor(cambio.estadoAnterior)}>
                                {cambio.estadoAnterior}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={getBadgeColor(cambio.estadoNuevo)}>
                                {cambio.estadoNuevo}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </Box>
              )}

              {resultado.cambios.length === 0 && (
                <Alert status="info">
                  <AlertIcon />
                  <AlertTitle>No se requirieron cambios</AlertTitle>
                  <AlertDescription>
                    Todos los usuarios ya tenían el estado de actividad correcto.
                  </AlertDescription>
                </Alert>
              )}
            </VStack>
          )}

          {/* Información adicional */}
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <AlertTitle>Nota importante</AlertTitle>
              <AlertDescription>
                • Un usuario se considera <strong>ACTIVO</strong> si ha participado en al menos 1 actividad en los últimos 6 meses.<br/>
                • Un usuario se considera <strong>INACTIVO</strong> si no ha participado en actividades en los últimos 6 meses.<br/>
                • Los usuarios suspendidos mantienen su estado hasta ser reactivados manualmente.
              </AlertDescription>
            </Box>
          </Alert>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default RecalcularEstadosUsuarios;
