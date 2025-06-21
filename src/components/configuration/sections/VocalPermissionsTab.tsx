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
  Switch
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';

interface VocalPermission {
  id: string;
  name: string;
  canManageMaterials: boolean;
  canViewReports: boolean;
  canManageLoans: boolean;
  canModifyConfiguration: boolean;
  canAccessAnalytics: boolean;
  isActive: boolean;
}

interface VocalPermissionsTabProps {
  onVariableChange: (key: string, value: any) => void;
}

/**
 * Componente para gestionar permisos de vocales
 */
const VocalPermissionsTab: React.FC<VocalPermissionsTabProps> = ({ onVariableChange }) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingPermission, setEditingPermission] = useState<VocalPermission | null>(null);
  const [formData, setFormData] = useState<Partial<VocalPermission>>({});

  // Datos mock para permisos de vocales (en producción vendrían del estado global)
  const [vocalPermissions, setVocalPermissions] = useState<VocalPermission[]>([
    {
      id: '1',
      name: 'Vocal Principal',
      canManageMaterials: true,
      canViewReports: true,
      canManageLoans: true,
      canModifyConfiguration: false,
      canAccessAnalytics: true,
      isActive: true
    },
    {
      id: '2',
      name: 'Vocal Secundario',
      canManageMaterials: true,
      canViewReports: false,
      canManageLoans: true,
      canModifyConfiguration: false,
      canAccessAnalytics: false,
      isActive: true
    }
  ]);

  const handleSave = () => {
    if (editingPermission) {
      setVocalPermissions(prev => 
        prev.map(p => p.id === editingPermission.id ? { ...editingPermission, ...formData } : p)
      );
      toast({
        title: 'Permisos actualizados',
        description: 'Los permisos del vocal han sido actualizados correctamente.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      const newPermission: VocalPermission = {
        id: Date.now().toString(),
        name: formData.name || '',
        canManageMaterials: formData.canManageMaterials || false,
        canViewReports: formData.canViewReports || false,
        canManageLoans: formData.canManageLoans || false,
        canModifyConfiguration: formData.canModifyConfiguration || false,
        canAccessAnalytics: formData.canAccessAnalytics || false,
        isActive: formData.isActive !== false
      };
      setVocalPermissions(prev => [...prev, newPermission]);
      toast({
        title: 'Vocal agregado',
        description: 'El nuevo vocal ha sido agregado con sus permisos.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
    
    // Notificar al componente padre sobre los cambios
    onVariableChange('vocalPermissions', vocalPermissions);
    
    setEditingPermission(null);
    setFormData({});
    onClose();
  };

  const handleDelete = (id: string) => {
    setVocalPermissions(prev => prev.filter(p => p.id !== id));
    toast({
      title: 'Vocal eliminado',
      description: 'El vocal ha sido eliminado del sistema.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    
    // Notificar al componente padre sobre los cambios
    onVariableChange('vocalPermissions', vocalPermissions.filter(p => p.id !== id));
  };

  const openEditModal = (permission: VocalPermission) => {
    setEditingPermission(permission);
    setFormData(permission);
    onOpen();
  };

  const openAddModal = () => {
    setEditingPermission(null);
    setFormData({
      name: '',
      canManageMaterials: false,
      canViewReports: false,
      canManageLoans: false,
      canModifyConfiguration: false,
      canAccessAnalytics: false,
      isActive: true
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
          <Text fontSize="lg" fontWeight="semibold" color="purple.600">
            👥 Vocales del Sistema
          </Text>
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="purple" 
            size="sm"
            onClick={openAddModal}
          >
            Agregar Vocal
          </Button>
        </Box>

        <Text fontSize="sm" color="gray.600">
          Gestiona los permisos y accesos de los vocales del sistema de materiales.
        </Text>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
          {vocalPermissions.map((vocal) => (
            <Card key={vocal.id} variant="outline" borderColor="purple.200">
              <CardBody>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
                  <Box>
                    <Text fontWeight="bold" color="purple.700">{vocal.name}</Text>
                    <Badge colorScheme={vocal.isActive ? 'green' : 'red'}>
                      {vocal.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </Box>
                  <Box>
                    <IconButton
                      aria-label="Editar"
                      icon={<EditIcon />}
                      size="sm"
                      mr={2}
                      colorScheme="purple"
                      variant="ghost"
                      onClick={() => openEditModal(vocal)}
                    />
                    <IconButton
                      aria-label="Eliminar"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDelete(vocal.id)}
                    />
                  </Box>
                </Box>
                
                <VStack align="start" spacing={1} fontSize="sm">
                  <Text>📦 Gestionar materiales: {vocal.canManageMaterials ? '✅' : '❌'}</Text>
                  <Text>📊 Ver reportes: {vocal.canViewReports ? '✅' : '❌'}</Text>
                  <Text>🔄 Gestionar préstamos: {vocal.canManageLoans ? '✅' : '❌'}</Text>
                  <Text>⚙️ Modificar configuración: {vocal.canModifyConfiguration ? '✅' : '❌'}</Text>
                  <Text>📈 Acceder a analytics: {vocal.canAccessAnalytics ? '✅' : '❌'}</Text>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        {vocalPermissions.length === 0 && (
          <Card variant="outline">
            <CardBody textAlign="center" py={8}>
              <Text color="gray.500" mb={4}>No hay vocales registrados en el sistema</Text>
              <Button colorScheme="purple" onClick={openAddModal}>
                Agregar primer vocal
              </Button>
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* Modal para editar/agregar vocal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingPermission ? 'Editar Vocal' : 'Agregar Vocal'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Nombre del Vocal</FormLabel>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="Ej: Vocal Principal"
                />
              </FormControl>
              
              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="manage-materials" mb="0" fontSize="sm">
                    Gestionar materiales
                  </FormLabel>
                  <Switch
                    id="manage-materials"
                    isChecked={formData.canManageMaterials || false}
                    onChange={(e) => updateFormData('canManageMaterials', e.target.checked)}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="view-reports" mb="0" fontSize="sm">
                    Ver reportes
                  </FormLabel>
                  <Switch
                    id="view-reports"
                    isChecked={formData.canViewReports || false}
                    onChange={(e) => updateFormData('canViewReports', e.target.checked)}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="manage-loans" mb="0" fontSize="sm">
                    Gestionar préstamos
                  </FormLabel>
                  <Switch
                    id="manage-loans"
                    isChecked={formData.canManageLoans || false}
                    onChange={(e) => updateFormData('canManageLoans', e.target.checked)}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="modify-config" mb="0" fontSize="sm">
                    Modificar configuración
                  </FormLabel>
                  <Switch
                    id="modify-config"
                    isChecked={formData.canModifyConfiguration || false}
                    onChange={(e) => updateFormData('canModifyConfiguration', e.target.checked)}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="access-analytics" mb="0" fontSize="sm">
                    Acceder a analytics
                  </FormLabel>
                  <Switch
                    id="access-analytics"
                    isChecked={formData.canAccessAnalytics || false}
                    onChange={(e) => updateFormData('canAccessAnalytics', e.target.checked)}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="is-active" mb="0" fontSize="sm">
                    Activo
                  </FormLabel>
                  <Switch
                    id="is-active"
                    isChecked={formData.isActive !== false}
                    onChange={(e) => updateFormData('isActive', e.target.checked)}
                  />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="purple" onClick={handleSave}>
              {editingPermission ? 'Actualizar' : 'Agregar'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default VocalPermissionsTab;
