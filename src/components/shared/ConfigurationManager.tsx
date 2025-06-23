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
  Button,
  Flex,
  Skeleton,
  VStack
} from '@chakra-ui/react';
import { ConfigSettings } from '../../types/configuration';
import { useConfigurationData } from '../../hooks/configuration/useConfigurationData';
import { useConfigurationHandlers } from '../../hooks/configuration/useConfigurationHandlers';
import {
  VariablesTab,
  MaterialTab,
  ApisTab,
  PermissionsTab,
  SystemViewerTab,
  TabConfig,
  BackupsTab
} from '../configuration/tabs';

interface ConfigurationManagerProps {
  userRole: 'admin' | 'vocal';
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
  // Estado para la pestaña activa
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Cargar datos iniciales y exponer reload
  const { settings: initialSettings, reload } = useConfigurationData(userRole);
  
  // Hooks personalizados para manejo de estado y handlers
  const { 
    settings, 
    isLoading, 
    handleVariableChange, 
    handleSettingsChange, 
    handleSubmit 
  } = useConfigurationHandlers(initialSettings);  // Configuración de pestañas disponibles según el rol
  const tabs: TabConfig[] = [
    { id: 'system-viewer', label: 'General', roles: ['admin'] as ('admin' | 'vocal')[] },
    { id: 'variables', label: 'Variables', roles: ['admin', 'vocal'] as ('admin' | 'vocal')[] },
    { id: 'material', label: 'Material', roles: ['admin', 'vocal'] as ('admin' | 'vocal')[] },
    { id: 'apis', label: 'APIs', roles: ['admin', 'vocal'] as ('admin' | 'vocal')[] },
    { id: 'backups', label: 'Backups', roles: ['admin'] as ('admin' | 'vocal')[] },
    { id: 'permissions', label: 'Permisos', roles: ['admin'] as ('admin' | 'vocal')[] },
  ].filter(tab => tab.roles.includes(userRole));

  // Determinar si la pestaña actual necesita guardado global
  const currentTab = tabs[activeTabIndex];
  const needsGlobalSave = currentTab && !['permissions'].includes(currentTab.id);

  // Handler para guardado global
  const handleGlobalSave = async () => {
    try {
      await handleSubmit();
      // Refrescar configuración tras guardar
      await reload();
    } catch (error) {
      console.error('Error al guardar configuración:', error);
    }
  };

  if (isLoading) {
    return (
      <Box p={5}>
        <Card mb={5} variant="outline">
          <CardBody>
            <HStack mb={4}>
              <Skeleton height="28px" width="260px" />
              <Skeleton height="24px" width="90px" />
            </HStack>
            <Skeleton height="20px" width="100%" />
          </CardBody>
        </Card>
        <VStack spacing={4} align="stretch">
          <Skeleton height="48px" width="100%" />
          <Skeleton height="400px" width="100%" />
        </VStack>
      </Box>
    );
  }

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
      <Tabs colorScheme="brand" isLazy index={activeTabIndex} onChange={setActiveTabIndex}>
        <TabList mb={4}>
          {tabs.map(tab => (
            <Tab key={tab.id}>{tab.label}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {/* Variables del Sistema */}
          {tabs.find(t => t.id === 'variables') && (
            <VariablesTab userRole={userRole} />
          )}
          {/* Material */}
          {tabs.find(t => t.id === 'material') && (
            <MaterialTab userRole={userRole} />
          )}
          {/* APIs */}
          {tabs.find(t => t.id === 'apis') && (
            <ApisTab userRole={userRole} />
          )}
          {/* Backups (solo admin) */}
          {tabs.find(t => t.id === 'backups') && (
            <BackupsTab userRole={userRole} />
          )}
          {/* Permisos (solo admin) */}
          {tabs.find(t => t.id === 'permissions') && (
            <PermissionsTab userRole={userRole} />
          )}
          {/* Visor Sistema (solo admin) */}
          {tabs.find(t => t.id === 'system-viewer') && (
            <SystemViewerTab
              settings={settings}
              userRole={userRole}
              onConfigReload={reload}
            />
          )}
        </TabPanels>
        {/* Botón de guardado global para pestañas que lo necesiten */}
        {/* Eliminado: Guardado global legacy, cada sección/tab ahora guarda de forma independiente en Firestore */}
      </Tabs>
    </Box>
  );
};

export default ConfigurationManager;
