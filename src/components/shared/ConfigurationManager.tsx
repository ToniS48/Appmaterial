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
import {
  VariablesTab,
  MaterialTab,
  ApisTab,
  PermissionsTab,
  SystemViewerTab as SystemTab,
  TabConfig,
  BackupsTab,
  FirestoreSchemaTab
} from '../configuration/tabs';

interface ConfigurationManagerProps {
  userRole: 'admin' | 'vocal';
  title?: string;
}

/**
 * Componente simplificado para gestión de configuración del sistema
 * Utiliza arquitectura modular con componentes optimizados
 */
const ConfigurationManager: React.FC<ConfigurationManagerProps> = ({
  userRole,
  title = 'Configuración del Sistema'
}) => {
  // Estado para la pestaña activa
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Configuración de pestañas disponibles según el rol
  const tabs: TabConfig[] = [
    { id: 'system-viewer', label: 'General', roles: ['admin'] as ('admin' | 'vocal')[] },
    { id: 'variables', label: 'Variables', roles: ['admin', 'vocal'] as ('admin' | 'vocal')[] },
    { id: 'material', label: 'Material', roles: ['admin', 'vocal'] as ('admin' | 'vocal')[] },
    { id: 'apis', label: 'APIs', roles: ['admin', 'vocal'] as ('admin' | 'vocal')[] },
    { id: 'firestore-schemas', label: 'Firestore', roles: ['admin'] as ('admin' | 'vocal')[] },
    { id: 'backups', label: 'Backups', roles: ['admin'] as ('admin' | 'vocal')[] },
    { id: 'permissions', label: 'Permisos', roles: ['admin'] as ('admin' | 'vocal')[] },
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
      <Tabs colorScheme="brand" isLazy index={activeTabIndex} onChange={setActiveTabIndex}>
        <TabList mb={4}>
          {tabs.map(tab => (
            <Tab key={tab.id}>{tab.label}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {/* General (antes Visor Sistema) */}
          {tabs.find(t => t.id === 'system-viewer') && (
            <SystemTab userRole={userRole} />
          )}
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
          {/* Esquemas Firestore (solo admin) */}
          {tabs.find(t => t.id === 'firestore-schemas') && (
            <FirestoreSchemaTab userRole={userRole} />
          )}
          {/* Backups (solo admin) */}
          {tabs.find(t => t.id === 'backups') && (
            <BackupsTab userRole={userRole} />
          )}
          {/* Permisos (solo admin) */}
          {tabs.find(t => t.id === 'permissions') && (
            <PermissionsTab userRole={userRole} />
          )}
        </TabPanels>
        {/* Botón de guardado global para pestañas que lo necesiten */}
        {/* Eliminado: Guardado global legacy, cada sección/tab ahora guarda de forma independiente en Firestore */}
      </Tabs>
    </Box>
  );
};

export default ConfigurationManager;
