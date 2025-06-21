import React, { useState } from 'react';
import {
  VStack,
  Box,
  Text,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Select
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';

interface UserPermission {
  id: string;
  userId: string;
  userName: string;
  email: string;
  canBorrowMaterials: boolean;
  canRequestSpecialItems: boolean;
  canViewHistory: boolean;
  canSubmitFeedback: boolean;
  maxSimultaneousLoans: number;
  isBlocked: boolean;
  blockReason?: string;
}

interface UserPermissionsTabProps {
  onVariableChange: (key: string, value: any) => void;
}

/**
 * Componente para gestionar permisos de usuarios
 */
const UserPermissionsTab: React.FC<UserPermissionsTabProps> = ({ onVariableChange }) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingPermission, setEditingPermission] = useState<UserPermission | null>(null);
  const [formData, setFormData] = useState<Partial<UserPermission>>({});

  // Datos mock para permisos de usuarios (en producción vendrían del estado global)
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([
    {
      id: '1',
      userId: 'user_001',
      userName: 'María García',
      email: 'maria@example.com',
      canBorrowMaterials: true,
      canRequestSpecialItems: true,
      canViewHistory: true,
      canSubmitFeedback: true,
      maxSimultaneousLoans: 3,
      isBlocked: false
    },
    {
      id: '2',
      userId: 'user_002',
      userName: 'Juan Pérez',
      email: 'juan@example.com',
      canBorrowMaterials: false,
      canRequestSpecialItems: false,
      canViewHistory: true,
      canSubmitFeedback: true,
      maxSimultaneousLoans: 0,
      isBlocked: true,
      blockReason: 'Retraso en devolución repetitivo'
    }
  ]);

  const handleSave = () => {
    if (editingPermission) {
      setUserPermissions(prev => 
        prev.map(p => p.id === editingPermission.id ? { ...editingPermission, ...formData } : p)
      );
      toast({
        title: 'Permisos actualizados',
        description: 'Los permisos del usuario han sido actualizados correctamente.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      const newPermission: UserPermission = {
        id: Date.now().toString(),
        userId: formData.userId || '',
        userName: formData.userName || '',
        email: formData.email || '',
        canBorrowMaterials: formData.canBorrowMaterials !== false,
        canRequestSpecialItems: formData.canRequestSpecialItems || false,
        canViewHistory: formData.canViewHistory !== false,
        canSubmitFeedback: formData.canSubmitFeedback !== false,
        maxSimultaneousLoans: formData.maxSimultaneousLoans || 2,
        isBlocked: formData.isBlocked || false,
        blockReason: formData.blockReason || ''
      };
      setUserPermissions(prev => [...prev, newPermission]);
      toast({
        title: 'Usuario agregado',
        description: 'El nuevo usuario ha sido agregado con sus permisos.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
    
    // Notificar al componente padre sobre los cambios
    onVariableChange('userPermissions', userPermissions);
    
    setEditingPermission(null);
    setFormData({});
    onClose();
  };

  const handleDelete = (id: string) => {
    setUserPermissions(prev => prev.filter(p => p.id !== id));
    toast({
      title: 'Usuario eliminado',
      description: 'El usuario ha sido eliminado del sistema.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    
    // Notificar al componente padre sobre los cambios
    onVariableChange('userPermissions', userPermissions.filter(p => p.id !== id));
  };

  const openEditModal = (permission: UserPermission) => {
    setEditingPermission(permission);
    setFormData(permission);
    onOpen();
  };

  const openAddModal = () => {
    setEditingPermission(null);
    setFormData({
      userId: '',
      userName: '',
      email: '',
      canBorrowMaterials: true,
      canRequestSpecialItems: false,
      canViewHistory: true,
      canSubmitFeedback: true,
      maxSimultaneousLoans: 2,
      isBlocked: false,
      blockReason: ''
    });
    onOpen();
  };

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <VStack spacing={4} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Text fontSize="lg" fontWeight="semibold" color="blue.600">
            👤 Usuarios del Sistema
          </Text>
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="blue" 
            size="sm"
            onClick={openAddModal}
          >
            Agregar Usuario
          </Button>
        </Box>

        <Text fontSize="sm" color="gray.600">
          Gestiona los permisos y restricciones de los usuarios finales del sistema.
        </Text>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
          {userPermissions.map((user) => (
            <Card key={user.id} variant="outline" borderColor="blue.200">
              <CardBody>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
                  <Box>
                    <Text fontWeight="bold" color="blue.700">{user.userName}</Text>
                    <Text fontSize="sm" color="gray.600">{user.email}</Text>
                    <Badge colorScheme={user.isBlocked ? 'red' : 'green'}>
                      {user.isBlocked ? 'Bloqueado' : 'Activo'}
                    </Badge>
                    {user.isBlocked && user.blockReason && (
                      <Text fontSize="xs" color="red.500" mt={1}>
                        Motivo: {user.blockReason}
                      </Text>
                    )}
                  </Box>
                  <Box>
                    <IconButton
                      aria-label="Editar"
                      icon={<EditIcon />}
                      size="sm"
                      mr={2}
                      colorScheme="blue"
                      variant="ghost"
                      onClick={() => openEditModal(user)}
                    />
                    <IconButton
                      aria-label="Eliminar"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDelete(user.id)}
                    />
                  </Box>
                </Box>
                
                <VStack align="start" spacing={1} fontSize="sm">
                  <Text>📚 Prestar materiales: {user.canBorrowMaterials ? '✅' : '❌'}</Text>
                  <Text>🎯 Solicitar especiales: {user.canRequestSpecialItems ? '✅' : '❌'}</Text>
                  <Text>📜 Ver historial: {user.canViewHistory ? '✅' : '❌'}</Text>
                  <Text>💬 Enviar feedback: {user.canSubmitFeedback ? '✅' : '❌'}</Text>
                  <Text>🔢 Préstamos simultáneos: {user.maxSimultaneousLoans}</Text>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        {userPermissions.length === 0 && (
          <Card variant="outline">
            <CardBody textAlign="center" py={8}>
              <Text color="gray.500" mb={4}>No hay usuarios registrados en el sistema</Text>
              <Button colorScheme="blue" onClick={openAddModal}>
                Agregar primer usuario
              </Button>
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* Modal para editar/agregar usuario */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingPermission ? 'Editar Usuario' : 'Agregar Usuario'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl>
                  <FormLabel>ID de Usuario</FormLabel>
                  <Input
                    value={formData.userId || ''}
                    onChange={(e) => updateFormData('userId', e.target.value)}
                    placeholder="Ej: user_001"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Nombre Completo</FormLabel>
                  <Input
                    value={formData.userName || ''}
                    onChange={(e) => updateFormData('userName', e.target.value)}
                    placeholder="Ej: María García"
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="usuario@example.com"
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="borrow-materials" mb="0" fontSize="sm">
                    Prestar materiales
                  </FormLabel>
                  <Switch
                    id="borrow-materials"
                    isChecked={formData.canBorrowMaterials !== false}
                    onChange={(e) => updateFormData('canBorrowMaterials', e.target.checked)}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="request-special" mb="0" fontSize="sm">
                    Solicitar especiales
                  </FormLabel>
                  <Switch
                    id="request-special"
                    isChecked={formData.canRequestSpecialItems || false}
                    onChange={(e) => updateFormData('canRequestSpecialItems', e.target.checked)}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="view-history" mb="0" fontSize="sm">
                    Ver historial
                  </FormLabel>
                  <Switch
                    id="view-history"
                    isChecked={formData.canViewHistory !== false}
                    onChange={(e) => updateFormData('canViewHistory', e.target.checked)}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="submit-feedback" mb="0" fontSize="sm">
                    Enviar feedback
                  </FormLabel>
                  <Switch
                    id="submit-feedback"
                    isChecked={formData.canSubmitFeedback !== false}
                    onChange={(e) => updateFormData('canSubmitFeedback', e.target.checked)}
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl>
                  <FormLabel>Préstamos simultáneos máximos</FormLabel>
                  <Select
                    value={formData.maxSimultaneousLoans || 2}
                    onChange={(e) => updateFormData('maxSimultaneousLoans', parseInt(e.target.value))}
                  >
                    <option value={0}>0 (Sin préstamos)</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                  </Select>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="is-blocked" mb="0" fontSize="sm">
                    Usuario bloqueado
                  </FormLabel>
                  <Switch
                    id="is-blocked"
                    isChecked={formData.isBlocked || false}
                    onChange={(e) => updateFormData('isBlocked', e.target.checked)}
                  />
                </FormControl>
              </SimpleGrid>

              {formData.isBlocked && (
                <FormControl>
                  <FormLabel>Motivo del bloqueo</FormLabel>
                  <Input
                    value={formData.blockReason || ''}
                    onChange={(e) => updateFormData('blockReason', e.target.value)}
                    placeholder="Ingresa el motivo del bloqueo..."
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={handleSave}>
              {editingPermission ? 'Actualizar' : 'Agregar'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UserPermissionsTab;
