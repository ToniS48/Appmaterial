import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Flex,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  VStack,
  HStack,
  Badge,
  Stat,
  StatLabel,
  StatNumber,  StatHelpText
} from '@chakra-ui/react';
import { RefreshCw, AlertTriangle, Calendar, Package } from 'lucide-react';
import { 
  detectarActividadesConRetraso, 
  notificarActividadesConRetraso,
  finalizarActividadConRetraso,
  ActividadConRetraso 
} from '../../services/actividadRetrasoService';
import ActividadCard from './ActividadCard';
import { ActividadConRetrasoIndicador } from './ActividadConRetrasoIndicador';
import { toTimestamp } from '../../utils/dateUtils';

interface ActividadesConRetrasoTabProps {
  onActividadUpdated?: () => void;
}

const ActividadesConRetrasoTab: React.FC<ActividadesConRetrasoTabProps> = ({
  onActividadUpdated
}) => {
  const [actividadesConRetraso, setActividadesConRetraso] = useState<ActividadConRetraso[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState<ActividadConRetraso | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Cargar actividades con retraso
  const cargarActividadesConRetraso = async () => {
    try {
      setIsLoading(true);
      const actividades = await detectarActividadesConRetraso();
      setActividadesConRetraso(actividades);
    } catch (error) {
      console.error('Error al cargar actividades con retraso:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las actividades con retraso',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar notificaciones
  const enviarNotificaciones = async () => {
    if (actividadesConRetraso.length === 0) return;
    
    try {
      await notificarActividadesConRetraso(actividadesConRetraso);
      toast({
        title: 'Notificaciones enviadas',
        description: `Se enviaron notificaciones para ${actividadesConRetraso.length} actividades con retraso`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error al enviar notificaciones:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron enviar las notificaciones',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Finalizar actividad
  const finalizarActividad = async (actividadId: string) => {
    try {
      await finalizarActividadConRetraso(actividadId, 'Finalizada desde panel de retrasos');
      toast({
        title: 'Actividad finalizada',
        description: 'La actividad ha sido marcada como finalizada',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Recargar datos
      await cargarActividadesConRetraso();
      onActividadUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error al finalizar actividad:', error);
      toast({
        title: 'Error',
        description: 'No se pudo finalizar la actividad',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    cargarActividadesConRetraso();
  }, []);

  // Estadísticas rápidas
  const estadisticas = {
    total: actividadesConRetraso.length,
    conPrestamos: actividadesConRetraso.filter(a => a.prestamosActivos > 0).length,
    retrasoPromedio: actividadesConRetraso.length > 0 
      ? Math.round(actividadesConRetraso.reduce((sum, a) => sum + a.diasRetraso, 0) / actividadesConRetraso.length)
      : 0
  };

  return (
    <Box>
      {/* Header con estadísticas y acciones */}
      <Flex 
        direction={{ base: "column", md: "row" }} 
        justify="space-between" 
        align={{ base: "start", md: "center" }}
        mb={6}
        gap={4}
      >
        <HStack spacing={4}>
          <Stat size="sm">
            <StatLabel>Actividades con Retraso</StatLabel>
            <StatNumber color="orange.500">{estadisticas.total}</StatNumber>
            <StatHelpText>
              {estadisticas.conPrestamos} con material pendiente
            </StatHelpText>
          </Stat>
          
          {estadisticas.total > 0 && (
            <Stat size="sm">
              <StatLabel>Retraso Promedio</StatLabel>
              <StatNumber>{estadisticas.retrasoPromedio} días</StatNumber>
            </Stat>
          )}
        </HStack>
        
        <HStack spacing={2}>
          <Button
            leftIcon={<RefreshCw />}
            size="sm"
            variant="outline"
            onClick={cargarActividadesConRetraso}
            isLoading={isLoading}
          >
            Actualizar
          </Button>
          
          {actividadesConRetraso.length > 0 && (
            <Button
              leftIcon={<AlertTriangle />}
              size="sm"
              colorScheme="orange"
              onClick={enviarNotificaciones}
            >
              Enviar Notificaciones
            </Button>
          )}
        </HStack>
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      ) : actividadesConRetraso.length === 0 ? (
        <Card>
          <CardBody textAlign="center">
            <Text fontSize="lg" color="green.600" mb={2}>
              ✅ ¡Excelente! No hay actividades con retraso
            </Text>
            <Text color="gray.600">
              Todas las actividades están correctamente finalizadas o en su tiempo programado.
            </Text>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Alerta informativa */}
          <Alert status="warning" mb={4} borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>
                {actividadesConRetraso.length} actividad{actividadesConRetraso.length !== 1 ? 'es' : ''} con retraso detectada{actividadesConRetraso.length !== 1 ? 's' : ''}
              </AlertTitle>
              <AlertDescription>
                Estas actividades están marcadas como "en curso" pero por fecha ya deberían estar finalizadas.
                {estadisticas.conPrestamos > 0 && (
                  ` ${estadisticas.conPrestamos} tienen material pendiente de devolución.`
                )}
              </AlertDescription>
            </Box>
          </Alert>

          {/* Lista de actividades */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {actividadesConRetraso.map(({ actividad, diasRetraso, prestamosActivos, responsables }) => (
              <Card 
                key={actividad.id}
                borderLeft="4px solid"
                borderColor="orange.400"
                position="relative"
              >
                <CardBody>
                  {/* Indicador de retraso detallado */}
                  <ActividadConRetrasoIndicador 
                    actividad={actividad} 
                    showDetails={true}
                  />
                  
                  {/* Card de actividad normal */}
                  <ActividadCard 
                    actividad={actividad}
                    variant="simple"
                    mostrarBotones={false}
                    mostrarDescripcion={false}
                  />
                  
                  {/* Información adicional */}
                  <VStack align="stretch" spacing={2} mt={3}>
                    {prestamosActivos > 0 && (
                      <HStack>
                        <Package size={16} />
                        <Text fontSize="sm" color="orange.600">
                          {prestamosActivos} préstamo{prestamosActivos !== 1 ? 's' : ''} activo{prestamosActivos !== 1 ? 's' : ''}
                        </Text>
                      </HStack>
                    )}
                    
                    {responsables.actividad && (
                      <Text fontSize="xs" color="gray.600">
                        Responsable: {responsables.actividad.nombre}
                      </Text>
                    )}
                    
                    {responsables.material && responsables.material.id !== responsables.actividad?.id && (
                      <Text fontSize="xs" color="gray.600">
                        R. Material: {responsables.material.nombre}
                      </Text>
                    )}
                  </VStack>
                  
                  {/* Botones de acción */}
                  <HStack mt={4} spacing={2}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedActividad({ actividad, diasRetraso, prestamosActivos, responsables });
                        onOpen();
                      }}
                    >
                      Ver Detalles
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => finalizarActividad(actividad.id!)}
                    >
                      Finalizar
                    </Button>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </>
      )}

      {/* Modal de detalles */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Actividad con Retraso: {selectedActividad?.actividad.nombre}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedActividad && (
              <VStack align="stretch" spacing={4}>
                <ActividadConRetrasoIndicador 
                  actividad={selectedActividad.actividad} 
                  showDetails={true}
                />
                
                <Box>
                  <Text fontWeight="medium" mb={2}>Información de la Actividad:</Text>
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    <strong>Lugar:</strong> {selectedActividad.actividad.lugar || 'No especificado'}
                  </Text>
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    <strong>Fecha de Finalización:</strong> {(() => {
                      try {
                        const timestamp = toTimestamp(selectedActividad.actividad.fechaFin);
                        return timestamp ? timestamp.toDate().toLocaleDateString() : 'Fecha no disponible';
                      } catch {
                        return 'Fecha no disponible';
                      }
                    })()}
                  </Text>
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    <strong>Estado Actual:</strong> {selectedActividad.actividad.estado}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    <strong>Días de Retraso:</strong> {selectedActividad.diasRetraso} días
                  </Text>
                </Box>
                
                {selectedActividad.prestamosActivos > 0 && (
                  <Alert status="warning">
                    <AlertIcon />
                    <AlertDescription>
                      Esta actividad tiene {selectedActividad.prestamosActivos} préstamo(s) de material activo(s) 
                      que podrían estar pendientes de devolución.
                    </AlertDescription>
                  </Alert>
                )}
                
                <Box>
                  <Text fontWeight="medium" mb={2}>Responsables:</Text>
                  {selectedActividad.responsables.actividad && (
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      <strong>Actividad:</strong> {selectedActividad.responsables.actividad.nombre}
                    </Text>
                  )}
                  {selectedActividad.responsables.material && (
                    <Text fontSize="sm" color="gray.600">
                      <strong>Material:</strong> {selectedActividad.responsables.material.nombre}
                    </Text>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cerrar
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={() => selectedActividad && finalizarActividad(selectedActividad.actividad.id!)}
            >
              Finalizar Actividad
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ActividadesConRetrasoTab;
