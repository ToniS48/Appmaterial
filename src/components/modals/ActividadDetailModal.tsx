import React from 'react';
import { Actividad } from '../../types/actividad';
import { useAuth } from '../../contexts/AuthContext';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  HStack,
  Box
} from '@chakra-ui/react';
import { FiPackage } from 'react-icons/fi';

interface ActividadDetailModalProps {
  actividad: Actividad;
  isOpen: boolean;
  onClose: () => void;
  onGestionarMaterial?: () => void;
}

/**
 * Modal para mostrar detalles de una actividad
 * con opciones condicionales según el rol del usuario
 */
const ActividadDetailModal: React.FC<ActividadDetailModalProps> = ({
  actividad,
  isOpen,
  onClose,
  onGestionarMaterial
}) => {
  const { userProfile } = useAuth();
  
  // Comprobar si el usuario es responsable o creador
  const esCreador = userProfile?.uid === actividad.creadorId;
  const esResponsableActividad = userProfile?.uid === actividad.responsableActividadId;
  const esResponsableMaterial = userProfile?.uid === actividad.responsableMaterialId;
  const esResponsable = esCreador || esResponsableActividad || esResponsableMaterial;
  
  // Comprobar si el usuario es participante en la actividad
  const esParticipante = userProfile?.uid && actividad.participanteIds?.includes(userProfile.uid);
  const actividadActiva = actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {`Detalle ${actividad.nombre}`}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Box>
            {/* Aquí iría el contenido de los detalles de la actividad */}
            
            {/* Botones de acción */}
            <HStack spacing={4} mt={4}>
              {/* Otros botones... */}
              
              {/* Botón para gestionar material: solo mostrar si es participante o responsable */}
              {actividadActiva && onGestionarMaterial && (esResponsable || esParticipante) && (
                <Button
                  leftIcon={<FiPackage />}
                  colorScheme="purple"
                  onClick={onGestionarMaterial}
                >
                  Gestionar material
                </Button>
              )}
            </HStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ActividadDetailModal;