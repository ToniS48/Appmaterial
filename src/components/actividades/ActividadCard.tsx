import React, { useCallback, useMemo } from 'react';
import {
  Box,
  Text,
  Heading,
  Badge,
  Flex,
  Button,
  HStack,
  Card,
  CardBody,
  Divider
} from '@chakra-ui/react';
import { 
  FiCalendar, FiEdit, FiTrash, FiPackage, FiEye, 
  FiStar, FiUser, FiUsers, FiCheckCircle, FiClock, 
  FiAlertCircle, FiXCircle, FiUserPlus 
} from 'react-icons/fi';
import IconBadge from '../common/IconBadge';
import { Actividad } from '../../types/actividad';
import { useAuth } from '../../contexts/AuthContext';
import messages from '../../constants/messages';

// OPTIMIZACIÓN DE RENDIMIENTO
const deferCallback = (callback: () => void) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout: 100 });
  } else {
    setTimeout(callback, 0);
  }
};

interface ActividadCardProps {
  actividad: Actividad;
  onVerDetalles?: () => void;
  onEditar?: () => void;
  onEliminar?: () => void;
  onGestionarMaterial?: () => void;
  onUnirse?: () => void; // Nueva prop para unirse a actividad
  mostrarBotones?: boolean;
  mostrarDescripcion?: boolean;
  variant?: 'simple' | 'complete';
}

const ActividadCard: React.FC<ActividadCardProps> = ({
  actividad,
  onVerDetalles,
  onEditar,
  onEliminar,
  onGestionarMaterial,
  onUnirse,
  mostrarBotones = true,
  mostrarDescripcion = true,
  variant = 'complete'
}) => {
  const { userProfile } = useAuth();

  // Memoizar computaciones costosas para evitar re-renders innecesarios
  const userPermissions = useMemo(() => {
    if (!userProfile?.uid) return {
      esCreador: false,
      esResponsableActividad: false,
      esResponsableMaterial: false,
      esResponsable: false,
      esParticipante: false
    };

    const esCreador = userProfile.uid === actividad.creadorId;
    const esResponsableActividad = userProfile.uid === actividad.responsableActividadId;
    const esResponsableMaterial = userProfile.uid === actividad.responsableMaterialId;
    const esResponsable = esCreador || esResponsableActividad || esResponsableMaterial;
    const esParticipante = actividad.participanteIds?.includes(userProfile.uid) || false;

    return {
      esCreador,
      esResponsableActividad,
      esResponsableMaterial,
      esResponsable,
      esParticipante
    };
  }, [userProfile?.uid, actividad.creadorId, actividad.responsableActividadId, actividad.responsableMaterialId, actividad.participanteIds]);

  // Handlers optimizados con deferCallback para evitar violaciones del scheduler
  const handleVerDetalles = useCallback(() => {
    if (onVerDetalles) {
      deferCallback(onVerDetalles);
    }
  }, [onVerDetalles]);

  const handleEditar = useCallback(() => {
    if (onEditar) {
      deferCallback(onEditar);
    }
  }, [onEditar]);

  const handleEliminar = useCallback(() => {
    if (onEliminar) {
      deferCallback(onEliminar);
    }
  }, [onEliminar]);

  const handleGestionarMaterial = useCallback(() => {
    if (onGestionarMaterial) {
      deferCallback(onGestionarMaterial);
    }
  }, [onGestionarMaterial]);

  const handleUnirse = useCallback(() => {
    if (onUnirse) {
      deferCallback(onUnirse);
    }
  }, [onUnirse]);

  // Memoizar estado de actividad para evitar re-cálculos
  const estadoDisplay = useMemo(() => {
    switch (actividad.estado) {
      case 'planificada':
        return { label: 'Planificada', color: 'yellow' };
      case 'en_curso':
        return { label: 'En curso', color: 'green' };
      case 'finalizada':
        return { label: 'Finalizada', color: 'blue' };
      case 'cancelada':
        return { label: 'Cancelada', color: 'red' };
      default:
        return { label: actividad.estado, color: 'gray' };
    }
  }, [actividad.estado]);

  // Determinar si la actividad está activa
  const actividadActiva = useMemo(() => {
    return actividad.estado !== 'finalizada' && actividad.estado !== 'cancelada';
  }, [actividad.estado]);

  // Formatear fecha de manera optimizada
  const fechaFormateada = useMemo(() => {
    if (!actividad.fechaInicio) return '';
    const fecha = actividad.fechaInicio instanceof Date ? actividad.fechaInicio : actividad.fechaInicio.toDate();
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, [actividad.fechaInicio]);

  const {
    esCreador,
    esResponsableActividad,
    esResponsableMaterial,
    esResponsable,
    esParticipante
  } = userPermissions;

  return (
    <Card 
      position="relative" 
      mb={4} 
      overflow="hidden" 
      variant={variant === 'simple' ? 'outline' : 'elevated'}
      _hover={{ boxShadow: 'md' }}
      borderLeft="4px solid"
      borderColor={
        esResponsable ? "purple.500" : 
        esParticipante ? "blue.400" : 
        "transparent"
      }
      height={variant === 'complete' ? { base: "auto", md: "220px" } : "auto"}
      display="flex"
      flexDirection="column"
    >
      <CardBody 
        p={variant === 'simple' ? 2 : 4}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        height="100%"
      >
        <Flex justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Heading size={variant === 'simple' ? 'xs' : 'sm'}>
              {actividad.nombre}
              {actividad.lugar && (
                <Text as="span" fontWeight="normal" fontSize={variant === 'simple' ? 'xs' : 'sm'} ml={1}>
                  ({actividad.lugar})
                </Text>
              )}
            </Heading>
            
            {/* Fecha justo debajo del nombre */}
            <Flex align="center" mt={1} mb={1}>
              <FiCalendar style={{ marginRight: '8px' }} size={variant === 'simple' ? 12 : 14} />
              <Text fontSize={variant === 'simple' ? 'xs' : 'sm'} color="gray.600">
                {fechaFormateada}
              </Text>
            </Flex>
            
            <Flex mt={1} gap={2} wrap="wrap">
              {esCreador && (
                <IconBadge 
                  icon={FiStar} 
                  label="Creador" 
                  color="purple" 
                  size={variant === 'simple' ? 3.5 : 4} 
                />
              )}
              {esResponsableActividad && !esCreador && (
                <IconBadge 
                  icon={FiUser} 
                  label="Responsable" 
                  color="blue" 
                  size={variant === 'simple' ? 3.5 : 4} 
                />
              )}
              {esResponsableMaterial && !esCreador && !esResponsableActividad && (
                <IconBadge 
                  icon={FiPackage} 
                  label="R. Material" 
                  color="cyan" 
                  size={variant === 'simple' ? 3.5 : 4} 
                />
              )}
              
              {/* Estado de la actividad como IconBadge */}
              <IconBadge 
                icon={
                  actividad.estado === 'planificada' ? FiClock :
                  actividad.estado === 'en_curso' ? FiCheckCircle :
                  actividad.estado === 'finalizada' ? FiCheckCircle :
                  FiXCircle
                } 

                label={estadoDisplay.label} 
                color={estadoDisplay.color as any}
                label={estado.label} 
                color={
                  actividad.estado === 'planificada' ? 'yellow' :
                  actividad.estado === 'en_curso' ? 'green' :
                  actividad.estado === 'finalizada' ? 'blue' :
                  'red'
                } 

                size={variant === 'simple' ? 3.5 : 4} 
              />
              
              {/* Dificultad si existe */}
              {actividad.dificultad && (
                <IconBadge 
                  icon={
                    actividad.dificultad === 'baja' ? FiCheckCircle :
                    actividad.dificultad === 'media' ? FiClock :
                    FiAlertCircle
                  } 
                  label={`Dificultad: ${actividad.dificultad}`} 
                  color={
                    actividad.dificultad === 'baja' ? 'green' :
                    actividad.dificultad === 'media' ? 'blue' :
                    'orange'
                  } 
                  size={variant === 'simple' ? 3.5 : 4} 
                />
              )}
            </Flex>
          </Box>
        </Flex>
        
        {variant === 'complete' && <Divider my={2} />}
        
        {!actividad.lugar && mostrarDescripcion && (
          <Text fontSize={variant === 'simple' ? 'xs' : 'sm'} mt={2}>Lugar: No especificado</Text>
        )}
        
        {mostrarDescripcion && (
          <Box 
            minHeight={variant === 'simple' ? "40px" : "50px"} 
            display="flex" 
            flexDirection="column" 
            justifyContent="flex-start"
            mt={2}
          >
            {actividad.descripcion ? (
              <Text 
                fontSize={variant === 'simple' ? 'xs' : 'sm'} 
                noOfLines={2}
                overflow="hidden"
              >
                {actividad.descripcion}
              </Text>
            ) : (
              <Text 
                fontSize={variant === 'simple' ? 'xs' : 'sm'} 
                color="gray.400"
                fontStyle="italic"
              >
                Sin descripción
              </Text>
            )}
          </Box>
        )}
        
        {mostrarBotones && (
          <Flex 
            mt={3} 
            gap={2} 
            justifyContent={{ base: "center", sm: "flex-end" }}
            flexWrap="wrap"
            rowGap={2}
          >
            {onVerDetalles && (
              <Button 
                size={variant === 'simple' ? 'xs' : 'sm'} 
                colorScheme="brand" 
                leftIcon={<FiEye />}
                onClick={handleVerDetalles}
                mb={{ base: 1, sm: 0 }}
                w={{ base: "100%", sm: "auto" }}
              >
                Ver detalles
              </Button>
            )}
            
            {/* Botón para unirse: solo mostrar si NO es responsable y NO es participante */}
            {actividadActiva && onUnirse && !esResponsable && !esParticipante && (
              <Button 
                size={variant === 'simple' ? 'xs' : 'sm'} 
                colorScheme="green" 
                leftIcon={<FiUserPlus />}
                onClick={handleUnirse}
                mb={{ base: 1, sm: 0 }}
                w={{ base: "100%", sm: "auto" }}
              >
                Unirme
              </Button>
            )}
            
            {onEditar && (
              <Button 
                size={variant === 'simple' ? 'xs' : 'sm'}
                colorScheme="blue" 
                leftIcon={<FiEdit />}
                onClick={handleEditar}
                mb={{ base: 1, sm: 0 }}
                w={{ base: "100%", sm: "auto" }}
              >
                Editar
              </Button>
            )}
            
            {/* Botón para gestionar material: solo mostrar si es participante o responsable */}
            {actividadActiva && onGestionarMaterial && (esResponsable || esParticipante) && (
              <Button 
                size={variant === 'simple' ? 'xs' : 'sm'} 
                colorScheme="purple" 
                leftIcon={<FiPackage />}
                onClick={handleGestionarMaterial}
                mb={{ base: 1, sm: 0 }}
                w={{ base: "100%", sm: "auto" }}
              >
                Gestionar material
              </Button>
            )}
            
            {onEliminar && (
              <Button 
                size={variant === 'simple' ? 'xs' : 'sm'}
                colorScheme="red" 
                leftIcon={<FiTrash />}
                onClick={handleEliminar}
                mb={{ base: 1, sm: 0 }}
                w={{ base: "100%", sm: "auto" }}
              >
                Eliminar
              </Button>
            )}
          </Flex>
        )}
      </CardBody>
    </Card>
  );
};

export default ActividadCard;
