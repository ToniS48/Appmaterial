import React from 'react';
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
  TabPanels
} from '@chakra-ui/react';
import { ConfigSettings } from '../../types/configuration';
import { useConfigurationData } from '../../hooks/configuration/useConfigurationData';
import { useConfigurationHandlers } from '../../hooks/configuration/useConfigurationHandlers';
import {
  VariablesTab,
  MaterialTab,
  ApisTab,
  SecurityTab,
  PermissionsTab,
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
}) => {
  // Cargar datos iniciales
  const { settings: initialSettings } = useConfigurationData(userRole);
  
  // Hooks personalizados para manejo de estado y handlers
  const { 
    settings, 
    isLoading, 
    handleVariableChange, 
    handleSettingsChange, 
    handleSubmit 
  } = useConfigurationHandlers(initialSettings);  // Configuración de pestañas disponibles según el rol
  const tabs: TabConfig[] = [
    { id: 'variables', label: 'General', roles: ['admin', 'vocal'] as ('admin' | 'vocal')[] },
    { id: 'material', label: 'Material', roles: ['admin', 'vocal'] as ('admin' | 'vocal')[] },
    { id: 'apis', label: 'APIs', roles: ['admin', 'vocal'] as ('admin' | 'vocal')[] },
    { id: 'security', label: 'Seguridad', roles: ['admin'] as ('admin' | 'vocal')[] },
    { id: 'permissions', label: 'Permisos', roles: ['admin'] as ('admin' | 'vocal')[] },
    { id: 'dropdowns', label: 'Formularios Material', roles: ['admin'] as ('admin' | 'vocal')[] },
    { id: 'system-viewer', label: 'Visor Sistema', roles: ['admin'] as ('admin' | 'vocal')[] }
  ].filter(tab => tab.roles.includes(userRole));

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
      </Card>

      {/* Navegación por pestañas */}
      <Tabs colorScheme="brand" isLazy>
        <TabList mb={4}>
          {tabs.map(tab => (
            <Tab key={tab.id}>{tab.label}</Tab>
          ))}
        </TabList>
        
        <TabPanels>
          {/* Variables del Sistema */}
          {tabs.find(t => t.id === 'variables') && (
            <VariablesTab
              settings={settings}
              userRole={userRole}
              onVariableChange={handleVariableChange}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          )}

          {/* Material */}
          {tabs.find(t => t.id === 'material') && (
            <MaterialTab
              settings={settings}
              userRole={userRole}
              onVariableChange={handleVariableChange}
            />
          )}

          {/* APIs */}
          {tabs.find(t => t.id === 'apis') && (
            <ApisTab
              settings={settings}
              userRole={userRole}
              onSettingsChange={handleSettingsChange}
            />
          )}          {/* Seguridad (solo admin) */}
          {tabs.find(t => t.id === 'security') && (
            <SecurityTab
              settings={settings}
              userRole={userRole}
              onVariableChange={handleVariableChange}
            />
          )}

          {/* Permisos (solo admin) */}
          {tabs.find(t => t.id === 'permissions') && (
            <PermissionsTab
              settings={settings}
              userRole={userRole}
              onVariableChange={handleVariableChange}
            />
          )}

          {/* Formularios Material (solo admin) */}
          {tabs.find(t => t.id === 'dropdowns') && (
            <DropdownsTab
              settings={settings}
              userRole={userRole}
            />
          )}

          {/* Visor Sistema (solo admin) */}
          {tabs.find(t => t.id === 'system-viewer') && (
            <SystemViewerTab
              settings={settings}
              userRole={userRole}
            />
          )}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ConfigurationManager;
