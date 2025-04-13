import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  HStack
} from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';
import messages from '../../constants/messages';

const InactivityWarning: React.FC = () => {
  const { inactivityWarningVisible, dismissInactivityWarning, logout } = useAuth();

  return (
    <Modal isOpen={inactivityWarningVisible} onClose={dismissInactivityWarning} closeOnOverlayClick={false} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{messages.auth.session.sessionWarning}</ModalHeader>
        <ModalBody>
          <Text>
            {messages.auth.session.sessionWarningDescription}
          </Text>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={4}>
            <Button colorScheme="red" variant="outline" onClick={logout}>
              {messages.auth.session.closeSession}
            </Button>
            <Button colorScheme="brand" onClick={dismissInactivityWarning}>
              {messages.auth.session.continueSession}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InactivityWarning;