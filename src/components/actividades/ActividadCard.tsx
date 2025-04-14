import React from 'react';
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
import { FiCalendar, FiPackage, FiEye, FiEdit, FiTrash, FiUserPlus } from 'react-icons/fi';
import { Actividad } from '../../types/actividad';
import { useAuth } from '../../contexts/AuthContext';
import messages from '../../constants/messages';

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

  // Comprobar si el usuario es responsable o creador
  const esCreador = userProfile?.uid === actividad.creadorId;
  const esResponsableActividad = userProfile?.uid === actividad.responsableActividadId;
  const esResponsableMaterial = userProfile?.uid === actividad.responsableMaterialId;
  const esResponsable = esCreador || esResponsableActividad || esResponsableMaterial;
  
  // Comprobar si el usuario es participante en la actividad
  const esParticipante = userProfile?.uid && actividad.participanteIds?.includes(userProfile.uid);

  // Obtener estado con color para mostrar
  const getEstadoDisplay = (estado: string) => {
    switch (estado) {
      case 'planificada':
        return { label: 'Planificada', color: 'yellow' };
      case 'en_curso':
        return { label: 'En curso', color: 'green' };
      case 'finalizada':
        return { label: 'Finalizada', color: 'blue' };
      case 'cancelada':
        return { label: 'Cancelada', color: 'red' };
      default:
        return { label: estado, color: 'gray' };
    }
  };

  // Formatear fecha para mostrar
  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const estado = getEstadoDisplay(actividad.estado);
  const actividadActiva = actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada';

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
                {formatDate(actividad.fechaInicio)}
              </Text>
            </Flex>
            
            <Flex mt={1} gap={2} wrap="wrap">
              {esCreador && (
                <Badge colorScheme="purple" size="sm">Creador</Badge>
              )}
              {esResponsableActividad && !esCreador && (
                <Badge colorScheme="blue" size="sm">Responsable</Badge>
              )}
              {esResponsableMaterial && !esCreador && !esResponsableActividad && (
                <Badge colorScheme="cyan" size="sm">R. Material</Badge>
              )}
              <Badge colorScheme={estado.color} size="sm">{estado.label}</Badge>
              {actividad.dificultad && (
                <Badge colorScheme={
                  actividad.dificultad === 'baja' ? 'green' : 
                  actividad.dificultad === 'media' ? 'blue' : 'orange'
                } size="sm">
                  {actividad.dificultad}
                </Badge>
              )}
              
              {/* Mostrar indicador de material solo si es participante o responsable */}
              {(esParticipante || esResponsable) && actividad.materiales && actividad.materiales.length > 0 && (
                <Badge colorScheme="orange" size="sm">Material</Badge>
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
                onClick={onVerDetalles}
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
                onClick={onUnirse}
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
                onClick={onEditar}
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
                onClick={onGestionarMaterial}
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
                onClick={onEliminar}
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