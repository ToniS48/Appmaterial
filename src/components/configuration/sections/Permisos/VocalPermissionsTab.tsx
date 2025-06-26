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
import { FiPlus, FiTrash2, FiEdit2, FiUsers } from 'react-icons/fi';

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

interface VocalPermissionsConfig {
  vocalPermissions: VocalPermission[];
}

interface VocalPermissionsTabProps {
  config: VocalPermissionsConfig;
  setConfig: (cfg: VocalPermissionsConfig) => void;
}

/**
 * Componente para gestionar permisos de vocales
 */
const VocalPermissionsTab: React.FC<VocalPermissionsTabProps> = ({ config, setConfig }) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingPermission, setEditingPermission] = useState<VocalPermission | null>(null);
  const [formData, setFormData] = useState<Partial<VocalPermission>>({});

  const handleSave = () => {
    if (editingPermission) {
      setConfig({
        ...config,
        vocalPermissions: config.vocalPermissions.map((p: VocalPermission) =>
          p.id === editingPermission.id ? { ...editingPermission, ...formData } : p
        )
      });
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
      setConfig({
        ...config,
        vocalPermissions: [...config.vocalPermissions, newPermission]
      });
      toast({
        title: 'Vocal agregado',
        description: 'El nuevo vocal ha sido agregado con sus permisos.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
    setEditingPermission(null);
    setFormData({});
    onClose();
  };

  const handleDelete = (id: string) => {
    setConfig({
      ...config,
      vocalPermissions: config.vocalPermissions.filter((p: VocalPermission) => p.id !== id)
    });
    toast({
      title: 'Vocal eliminado',
      description: 'El vocal ha sido eliminado del sistema.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
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
          <Text fontSize="lg" fontWeight="semibold" color="purple.600" display="flex" alignItems="center">
            <FiUsers style={{ marginRight: 8 }} />
            Vocales del Sistema
          </Text>
          <Button 
            leftIcon={<FiPlus />} 
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
          {config.vocalPermissions.map((vocal: VocalPermission) => (
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
                      icon={<FiEdit2 />} // FiEdit2 en vez de EditIcon
                      size="sm"
                      mr={2}
                      colorScheme="purple"
                      variant="ghost"
                      onClick={() => openEditModal(vocal)}
                    />
                    <IconButton
                      aria-label="Eliminar"
                      icon={<FiTrash2 />} // FiTrash2 en vez de DeleteIcon
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

        {config.vocalPermissions.length === 0 && (
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
