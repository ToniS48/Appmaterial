import React, { useState } from 'react';
import {
  Box,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Badge,
  Divider,
  Icon,
  useDisclosure
} from '@chakra-ui/react';
import { FiInfo, FiGitCommit, FiCalendar, FiCode, FiTag } from 'react-icons/fi';
import { useVersionInfo } from '../../hooks/useVersionInfo';

interface VersionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VersionInfoModal: React.FC<VersionInfoModalProps> = ({ isOpen, onClose }) => {
  const versionInfo = useVersionInfo();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={FiInfo} />
            <Text>Información de Versión</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">            <Box>
              <HStack justify="space-between" mb={2}>
                <HStack>
                  <Icon as={FiTag} color="blue.500" />
                  <Text fontWeight="semibold">Versión:</Text>
                </HStack>
                <Badge colorScheme="blue" fontSize="sm">
                  v{versionInfo.displayVersion}
                </Badge>
              </HStack>
            </Box>

            <Box>
              <HStack justify="space-between" mb={2}>
                <HStack>
                  <Icon as={FiTag} color="gray.500" />
                  <Text fontWeight="semibold" fontSize="sm">Base:</Text>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  v{versionInfo.version}
                </Text>
              </HStack>
            </Box>

            <Divider />

            <Box>
              <HStack justify="space-between" mb={2}>
                <HStack>
                  <Icon as={FiGitCommit} color="green.500" />
                  <Text fontWeight="semibold">Commit:</Text>
                </HStack>
                <Text fontFamily="mono" fontSize="sm" color="gray.600">
                  {versionInfo.shortHash}
                </Text>
              </HStack>
            </Box>

            <Box>
              <HStack justify="space-between" mb={2}>
                <HStack>
                  <Icon as={FiCode} color="purple.500" />
                  <Text fontWeight="semibold">Build:</Text>
                </HStack>
                <Badge colorScheme="purple" fontSize="sm">
                  #{versionInfo.buildNumber}
                </Badge>
              </HStack>
            </Box>

            <Box>
              <HStack justify="space-between" mb={2}>
                <HStack>
                  <Icon as={FiCode} color="orange.500" />
                  <Text fontWeight="semibold">Rama:</Text>
                </HStack>
                <Badge colorScheme="orange" fontSize="sm" variant="outline">
                  {versionInfo.branchName}
                </Badge>
              </HStack>
            </Box>

            <Divider />

            <Box>
              <VStack spacing={2} align="stretch">
                <HStack>
                  <Icon as={FiCalendar} color="gray.500" />
                  <Text fontWeight="semibold">Fecha de Commit:</Text>
                </HStack>
                <Text fontSize="sm" color="gray.600" ml={6}>
                  {versionInfo.commitDate}
                </Text>
              </VStack>
            </Box>

            <Box>
              <VStack spacing={2} align="stretch">
                <HStack>
                  <Icon as={FiCalendar} color="gray.500" />
                  <Text fontWeight="semibold">Fecha de Build:</Text>
                </HStack>
                <Text fontSize="sm" color="gray.600" ml={6}>
                  {formatDate(versionInfo.buildDate)}
                </Text>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

interface AdvancedVersionDisplayProps {
  position?: 'absolute' | 'relative' | 'fixed';
  bottom?: string;
  right?: string;
  fontSize?: string;
  color?: string;
  showModal?: boolean;
  format?: 'short' | 'version-only' | 'with-build';
}

const AdvancedVersionDisplay: React.FC<AdvancedVersionDisplayProps> = ({
  position = 'absolute',
  bottom = '10px',
  right = '10px',
  fontSize = 'xs',
  color = 'gray.500',
  showModal = true,
  format = 'version-only'
}) => {
  const versionInfo = useVersionInfo();
  const { isOpen, onOpen, onClose } = useDisclosure();
    const getDisplayText = () => {
    switch (format) {
      case 'short':
        return `v${versionInfo.displayVersion} (${versionInfo.shortHash})`;
      case 'with-build':
        return `v${versionInfo.displayVersion}.${versionInfo.buildNumber}`;
      case 'version-only':
      default:
        return `v${versionInfo.displayVersion}`;
    }
  };

  const versionText = getDisplayText();

  return (
    <>
      <Box
        position={position}
        bottom={bottom}
        right={right}
        zIndex={1000}
        cursor={showModal ? 'pointer' : 'default'}
        onClick={showModal ? onOpen : undefined}
        _hover={showModal ? { opacity: 1 } : {}}
        transition="opacity 0.2s"
      >
        <Text
          fontSize={fontSize}
          color={color}
          fontFamily="mono"
          opacity={0.7}
          _hover={{ opacity: 1 }}
          userSelect="none"
        >
          {versionText}
        </Text>
      </Box>

      {showModal && (
        <VersionInfoModal isOpen={isOpen} onClose={onClose} />
      )}
    </>
  );
};

export default AdvancedVersionDisplay;
export { VersionInfoModal };
