import React, { useState } from 'react';
import {
  Box,
  Heading,
  Card,
  CardBody,
  Text,
  Badge,
  HStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';
import {
  ConfigSettings
} from '../../types/configuration';
import { useConfigurationData } from '../../hooks/configuration/useConfigurationData';
import { useConfigurationHandlers } from '../../hooks/configuration/useConfigurationHandlers';
import { WithPermissions, PermissionManager } from '../permissions';
import {
  VariablesTab,
  MaterialTab,
  ApisTab,
  SecurityTab,
  DropdownsTab,
  SystemViewerTab,
  TabConfig
} from '../configuration/tabs';

interface ConfigurationManagerProps {
  /** Rol del usuario (admin, vocal) */
  userRole: 'admin' | 'vocal';
  /** Título personalizado para la página */
  title?: string;
}

/**
 * Componente refactorizado para gestión de configuración del sistema
 * Utiliza arquitectura modular con componentes de pestaña y sección
 */
const ConfigurationManager: React.FC<ConfigurationManagerProps> = ({
  userRole,
  title = 'Configuración del Sistema'
}) => {  // Cargar datos iniciales
  const { settings: initialSettings } = useConfigurationData(userRole);
  
  // Hooks personalizados para manejo de estado y handlers
  const { 
    settings, 
    isLoading, 
    handleVariableChange, 
    handleSettingsChange, 
    handleSubmit 
  } = useConfigurationHandlers(initialSettings);
  
  // Estado para controlar la pestaña activa
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const toast = useToast();// Configuración de pestañas disponibles según el rol
  const tabs: TabConfig[] = [
    { id: 'variables', label: 'General', roles: ['admin', 'vocal'] as ('admin' | 'vocal')[] },
    { id: 'material', label: 'Material', roles: ['admin', 'vocal'] as ('admin' | 'vocal')[] },
    { id: 'apis', label: 'APIs', roles: ['admin', 'vocal'] as ('admin' | 'vocal')[] },
    { id: 'security', label: 'Seguridad', roles: ['admin'] as ('admin' | 'vocal')[] },
    { id: 'permissions', label: 'Permisos', roles: ['admin'] as ('admin' | 'vocal')[] },
    { id: 'system-viewer', label: 'Visor Sistema', roles: ['admin'] as ('admin' | 'vocal')[] }
  ].filter(tab => tab.roles.includes(userRole));
  // Determinar si la pestaña actual necesita el botón de guardado global
  const currentTab = tabs[activeTabIndex];
  const needsGlobalSave = currentTab && ['variables', 'material', 'apis', 'security', 'system-viewer'].includes(currentTab.id);
  
  // Función para manejar el guardado con feedback específico
  const handleGlobalSave = async () => {
    try {
      await handleSubmit();
      // El toast de éxito ya lo maneja handleSubmit
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios de configuración",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={5}>
      {/* Header de la página */}
      <Card mb={5} variant="outline">
        <CardBody>
          <HStack mb={4}>
            <Heading size="md">{title}</Heading>
            <Badge colorScheme={userRole === 'admin' ? 'purple' : 'blue'}>
              {userRole === 'admin' ? 'Solo Admin' : 'Acceso Vocal'}
            </Badge>
          </HStack>
          <Text color="gray.600">
            {userRole === 'admin' 
              ? 'Configuración completa del sistema. Estos cambios afectarán a todos los usuarios.'
              : 'Como vocal, puedes modificar las variables del sistema y configuraciones de material. Las preferencias personales (idioma, tema, notificaciones) se gestionan desde tu perfil de usuario.'
            }
          </Text>
        </CardBody>
      </Card>      {/* Navegación por pestañas */}
      <Tabs colorScheme="brand" isLazy index={activeTabIndex} onChange={setActiveTabIndex}>
        <TabList mb={4}>
          {tabs.map(tab => (
            <Tab key={tab.id}>{tab.label}</Tab>
          ))}
        </TabList>
          <TabPanels>
          {/* Variables del Sistema */}
          {tabs.find(t => t.id === 'variables') && (
            <WithPermissions 
              section="variables" 
              requiredLevel="read" 
              userRole={userRole}
            >              <VariablesTab
                settings={settings}
                userRole={userRole}
                onVariableChange={handleVariableChange}
              />
            </WithPermissions>
          )}

          {/* Material */}
          {tabs.find(t => t.id === 'material') && (
            <WithPermissions 
              section="material" 
              requiredLevel="read" 
              userRole={userRole}
            >
              <MaterialTab
                settings={settings}
                userRole={userRole}
                onVariableChange={handleVariableChange}
              />
            </WithPermissions>
          )}

          {/* APIs */}
          {tabs.find(t => t.id === 'apis') && (
            <WithPermissions 
              section="apis" 
              requiredLevel="read" 
              userRole={userRole}
            >
              <ApisTab
                settings={settings}
                userRole={userRole}
                onSettingsChange={handleSettingsChange}
                onApiChange={(apiName, value) => {
                  handleSettingsChange({
                    apis: {
                      ...settings.apis,
                      [apiName]: value
                    }
                  });
                }}
                onVariableChange={handleVariableChange}
              />
            </WithPermissions>
          )}          {/* Seguridad (solo admin) */}
          {tabs.find(t => t.id === 'security') && (
            <WithPermissions 
              section="security" 
              requiredLevel="read" 
              userRole={userRole}
              fallbackMessage="Solo los administradores pueden acceder a la configuración de seguridad."
            >
              <SecurityTab
                settings={settings}
                userRole={userRole}
                onVariableChange={handleVariableChange}
              />
            </WithPermissions>
          )}          {/* Gestión de Permisos (solo admin) */}
          {tabs.find(t => t.id === 'permissions') && (
            <TabPanel>
              <PermissionManager userRole={userRole} />
            </TabPanel>
          )}

          {/* Visor Sistema (solo admin) */}
          {tabs.find(t => t.id === 'system-viewer') && (
            <WithPermissions 
              section="systemViewer" 
              requiredLevel="read" 
              userRole={userRole}
              fallbackMessage="Solo los administradores pueden acceder al visor del sistema."
            >
              <SystemViewerTab
                settings={settings}
                userRole={userRole}
              />
            </WithPermissions>          )}
        </TabPanels>
        
        {/* Botón de guardado global para pestañas que lo necesiten */}
        {needsGlobalSave && (
          <Box mt={6} p={4} bg="gray.50" borderRadius="md" borderWidth="1px">
            <HStack justify="space-between" align="center">
              <Box>
                <Text fontWeight="bold" fontSize="sm" color="gray.700">
                  💾 Configuración de {currentTab?.label}
                </Text>
                <Text fontSize="xs" color="gray.600">
                  Los cambios se guardan en la configuración global del sistema
                </Text>
              </Box>
              <Button
                colorScheme="blue"
                onClick={handleGlobalSave}
                isLoading={isLoading}
                loadingText="Guardando..."
                size="md"
              >
                💾 Guardar cambios
              </Button>
            </HStack>
          </Box>
        )}
      </Tabs>
    </Box>
  );
};

export default ConfigurationManager;
