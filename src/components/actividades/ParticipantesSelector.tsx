import React, { useState, useEffect } from 'react';
import { Usuario } from '../../types/usuario';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Box,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  Text,
  Flex,
  Heading,
  Tag,
  TagLabel,
  TagCloseButton,
  IconButton,
  VStack
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';

interface ParticipantesSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  usuarios: Usuario[];
  selectedParticipants: string[];
  onSave: (selectedIds: string[]) => void;
}

const ParticipantesSelector: React.FC<ParticipantesSelectorProps> = ({
  isOpen,
  onClose,
  usuarios,
  selectedParticipants,
  onSave
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelected, setLocalSelected] = useState<string[]>(selectedParticipants || []);
  
  // Resetear la selección local cuando cambian los props
  useEffect(() => {
    setLocalSelected(selectedParticipants || []);
  }, [selectedParticipants, isOpen]);
  
  // Filtrar usuarios según búsqueda
  const filteredUsers = usuarios.filter(usuario => {
    const fullName = `${usuario.nombre} ${usuario.apellidos}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           usuario.email.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Agregar o quitar participante
  const toggleParticipant = (uid: string) => {
    if (localSelected.includes(uid)) {
      setLocalSelected(localSelected.filter(id => id !== uid));
    } else {
      setLocalSelected([...localSelected, uid]);
    }
  };
  
  // Guardar cambios
  const handleSave = () => {
    onSave(localSelected);
    onClose();
  };
  
  // Usuarios disponibles (no seleccionados)
  const availableUsers = filteredUsers.filter(u => !localSelected.includes(u.uid));
  
  // Usuarios seleccionados (con datos completos)
  const selectedUsers = usuarios.filter(u => localSelected.includes(u.uid))
    .sort((a, b) => `${a.nombre} ${a.apellidos}`.localeCompare(`${b.nombre} ${b.apellidos}`));
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>Seleccionar Participantes</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <InputGroup mb={4}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input 
              placeholder="Buscar por nombre o email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>

          {/* Usuarios disponibles */}
          <Box mb={4}>
            <Heading size="sm" mb={2}>
              Usuarios disponibles ({availableUsers.length})
            </Heading>
            <Box 
              maxH="300px" 
              overflowY="auto" 
              borderWidth="1px" 
              borderRadius="md"
            >
              {availableUsers.length > 0 ? (
                <VStack spacing={0} align="stretch">
                  {availableUsers.map(usuario => (
                    <Flex 
                      key={usuario.uid} 
                      p={2} 
                      justifyContent="space-between"
                      alignItems="center"
                      borderBottomWidth="1px"
                      _hover={{ bg: "gray.50" }}
                    >
                      <Box>
                        <Text fontWeight="medium">
                          {usuario.nombre} {usuario.apellidos}
                        </Text>
                        <Text fontSize="sm" color="gray.600">{usuario.email}</Text>
                      </Box>
                      <Button 
                        size="sm" 
                        colorScheme="brand" 
                        variant="outline"
                        onClick={() => toggleParticipant(usuario.uid)}
                      >
                        Agregar
                      </Button>
                    </Flex>
                  ))}
                </VStack>
              ) : (
                <Text p={4} color="gray.500" textAlign="center">
                  No hay usuarios disponibles con ese criterio de búsqueda
                </Text>
              )}
            </Box>
          </Box>

          <Divider my={4} />

          {/* Participantes seleccionados */}
          <Box>
            <Heading size="sm" mb={2}>
              Participantes seleccionados ({selectedUsers.length})
            </Heading>
            <Box 
              maxH="200px" 
              overflowY="auto" 
              borderWidth="1px" 
              borderRadius="md"
            >
              {selectedUsers.length > 0 ? (
                <VStack spacing={0} align="stretch">
                  {selectedUsers.map(usuario => (
                    <Flex 
                      key={usuario.uid} 
                      p={2} 
                      justifyContent="space-between"
                      alignItems="center"
                      borderBottomWidth="1px"
                    >
                      <Box>
                        <Text fontWeight="medium">
                          {usuario.nombre} {usuario.apellidos}
                        </Text>
                        <Text fontSize="sm" color="gray.600">{usuario.email}</Text>
                      </Box>
                      <IconButton
                        aria-label="Eliminar participante"
                        icon={<CloseIcon />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => toggleParticipant(usuario.uid)}
                      />
                    </Flex>
                  ))}
                </VStack>
              ) : (
                <Text p={4} color="gray.500" textAlign="center">
                  No hay participantes seleccionados
                </Text>
              )}
            </Box>
          </Box>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            colorScheme="brand" 
            onClick={handleSave}
          >
            Guardar ({localSelected.length} participantes)
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ParticipantesSelector;