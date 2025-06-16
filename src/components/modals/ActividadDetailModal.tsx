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
  HStack,
  Box
} from '@chakra-ui/react';

interface ActividadDetailModalProps {
  actividad: Actividad;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal para mostrar detalles de una actividad
 * con opciones condicionales según el rol del usuario
 */
const ActividadDetailModal: React.FC<ActividadDetailModalProps> = ({
  actividad,
  isOpen,
  onClose
}) => {
  const { userProfile } = useAuth();

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
            </HStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ActividadDetailModal;