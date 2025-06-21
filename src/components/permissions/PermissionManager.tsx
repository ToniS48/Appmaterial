import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Text,
  Select,
  Button,
  useToast,
  Alert,
  AlertIcon,
  SimpleGrid,
  Badge,
  Divider,
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ConfigurationPermissions, PermissionLevel } from '../../types/permissions';
import { DEFAULT_PERMISSIONS, CUSTOMIZABLE_VOCAL_PERMISSIONS } from '../../config/permissions';
import UserPermissionsTab from '../configuration/sections/UserPermissionsTab';

interface PermissionManagerProps {
  userRole: 'admin' | 'vocal';
}

const PERMISSION_LABELS: Record<PermissionLevel, { label: string; color: string }> = {
  none: { label: 'Sin Acceso', color: 'red' },
  read: { label: 'Solo Lectura', color: 'orange' },
  edit: { label: 'Edición', color: 'green' },
  full: { label: 'Acceso Completo', color: 'purple' }
};

/**
 * Componente para gestionar permisos de vocales (solo para administradores)
 */
const PermissionManager: React.FC<PermissionManagerProps> = ({ userRole }) => {
  const toast = useToast();
  const [vocalPermissions, setVocalPermissions] = useState<ConfigurationPermissions>(
    DEFAULT_PERMISSIONS.vocal
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (userRole !== 'admin') return;

    const loadVocalPermissions = async () => {
      try {
        const docRef = doc(db, "configuracion", "permisos");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.vocal) {
            setVocalPermissions(data.vocal);
          }
        }
      } catch (error) {
        console.error("Error al cargar permisos:", error);
      }
    };

    loadVocalPermissions();
  }, [userRole]);
  const updatePermission = (section: string, subsection: string | null, level: PermissionLevel) => {
    setVocalPermissions(prev => {
      const updated = { ...prev };
      
      if (subsection) {
        const sectionPerms = updated[section as keyof ConfigurationPermissions];
        if (typeof sectionPerms === 'object' && sectionPerms !== null) {
          updated[section as keyof ConfigurationPermissions] = {
            ...sectionPerms,
            [subsection]: level
          } as any;
        }
      } else {
        updated[section as keyof ConfigurationPermissions] = level as any;
      }
      
      return updated;
    });
    setHasChanges(true);
  };

  const savePermissions = async () => {
    try {
      setIsLoading(true);
      const docRef = doc(db, "configuracion", "permisos");
      await updateDoc(docRef, {
        vocal: vocalPermissions,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'admin'
      });

      toast({
        title: "Permisos actualizados",
        description: "Los permisos de los vocales se han actualizado correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Error al guardar permisos:", error);
      toast({
        title: "Error",
        description: "Error al guardar los permisos",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetToDefaults = () => {
    setVocalPermissions(DEFAULT_PERMISSIONS.vocal);
    setHasChanges(true);
  };

  if (userRole !== 'admin') {
    return (
      <Alert status="error">
        <AlertIcon />
        <Text>Solo los administradores pueden gestionar permisos.</Text>
      </Alert>
    );
  }

  const renderPermissionSelect = (
    section: string, 
    subsection: string | null, 
    currentLevel: PermissionLevel,
    label: string
  ) => (
    <FormControl key={`${section}-${subsection}`}>
      <FormLabel fontSize="sm">{label}</FormLabel>
      <HStack>
        <Select
          size="sm"
          value={currentLevel}
          onChange={(e) => updatePermission(section, subsection, e.target.value as PermissionLevel)}
        >
          {Object.entries(PERMISSION_LABELS).map(([level, config]) => (
            <option key={level} value={level}>
              {config.label}
            </option>
          ))}
        </Select>
        <Badge colorScheme={PERMISSION_LABELS[currentLevel].color} size="sm">
          {PERMISSION_LABELS[currentLevel].label}
        </Badge>
      </HStack>
    </FormControl>
  );
  return (
    <Box>
      <Tabs variant="enclosed" colorScheme="purple">
        <TabList>
          <Tab>👥 Permisos de Vocales</Tab>
          <Tab>👤 Permisos de Usuarios</Tab>
        </TabList>

        <TabPanels>
          {/* Pestaña de Permisos de Vocales */}
          <TabPanel>
            <VocalPermissionsContent 
              vocalPermissions={vocalPermissions}
              renderPermissionSelect={renderPermissionSelect}
              isLoading={isLoading}
              hasChanges={hasChanges}
              onSave={savePermissions}
              onReset={resetToDefaults}
            />
          </TabPanel>

          {/* Pestaña de Permisos de Usuarios */}
          <TabPanel>
            <UserPermissionsTab onVariableChange={() => {}} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

// Componente separado para el contenido de permisos de vocales
interface VocalPermissionsContentProps {
  vocalPermissions: ConfigurationPermissions;
  renderPermissionSelect: (section: string, subsection: string | null, currentLevel: PermissionLevel, label: string) => JSX.Element;
  isLoading: boolean;
  hasChanges: boolean;
  onSave: () => void;
  onReset: () => void;
}

const VocalPermissionsContent: React.FC<VocalPermissionsContentProps> = ({
  vocalPermissions,
  renderPermissionSelect,
  isLoading,
  hasChanges,
  onSave,
  onReset
}) => {
  return (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="md">🔐 Gestión de Permisos de Vocales</Heading>
          <Badge colorScheme="purple">Solo Admin</Badge>
        </HStack>
      </CardHeader>
      
      <CardBody>
        <VStack spacing={6} align="stretch">
          <Alert status="info">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Configuración de Permisos</Text>
              <Text fontSize="sm">
                Define qué secciones pueden acceder y modificar los usuarios con rol de vocal.
                Los cambios afectarán a todos los vocales del sistema.
              </Text>
            </Box>
          </Alert>

          {/* Variables del Sistema */}
          <Card variant="outline">
            <CardBody>
              <Heading size="sm" mb={4}>📊 Variables del Sistema</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {renderPermissionSelect(
                  'variables', 'loanManagement', 
                  vocalPermissions.variables.loanManagement,
                  'Gestión de Préstamos'
                )}
                {renderPermissionSelect(
                  'variables', 'notifications', 
                  vocalPermissions.variables.notifications,
                  'Notificaciones'
                )}
                {renderPermissionSelect(
                  'variables', 'materialManagement', 
                  vocalPermissions.variables.materialManagement,
                  'Gestión de Material'
                )}
                {renderPermissionSelect(
                  'variables', 'activityManagement', 
                  vocalPermissions.variables.activityManagement,
                  'Gestión de Actividades'
                )}
                {renderPermissionSelect(
                  'variables', 'reputationSystem', 
                  vocalPermissions.variables.reputationSystem,
                  'Sistema de Reputación'
                )}
                {renderPermissionSelect(
                  'variables', 'reports', 
                  vocalPermissions.variables.reports,
                  'Reportes'
                )}
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* APIs y Servicios */}
          <Card variant="outline">
            <CardBody>
              <Heading size="sm" mb={4}>🔌 APIs y Servicios</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {renderPermissionSelect(
                  'apis', 'googleDrive', 
                  vocalPermissions.apis.googleDrive,
                  'Google Drive'
                )}
                {renderPermissionSelect(
                  'apis', 'weatherServices', 
                  vocalPermissions.apis.weatherServices,
                  'Servicios Meteorológicos'
                )}
                {renderPermissionSelect(
                  'apis', 'notificationServices', 
                  vocalPermissions.apis.notificationServices,
                  'Servicios de Notificación'
                )}
                {renderPermissionSelect(
                  'apis', 'backupAnalytics', 
                  vocalPermissions.apis.backupAnalytics,
                  'Backup y Analytics'
                )}
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Material */}
          <Card variant="outline">
            <CardBody>
              <Heading size="sm" mb={4}>📦 Configuración de Material</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {renderPermissionSelect(
                  'material', 'stockConfiguration', 
                  vocalPermissions.material.stockConfiguration,
                  'Configuración de Stock'
                )}
                {renderPermissionSelect(
                  'material', 'maintenanceSettings', 
                  vocalPermissions.material.maintenanceSettings,
                  'Configuración de Mantenimiento'
                )}
              </SimpleGrid>
            </CardBody>
          </Card>          <Divider />

          {/* Botones de acción */}
          <HStack justify="space-between">
            <Button 
              variant="outline" 
              onClick={onReset}
              isDisabled={isLoading}
            >
              🔄 Restaurar por Defecto
            </Button>
            
            <Button
              colorScheme="blue"
              onClick={onSave}
              isLoading={isLoading}
              loadingText="Guardando..."
              isDisabled={!hasChanges}
            >
              💾 Guardar Cambios            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default PermissionManager;
