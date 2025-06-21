import React from 'react';
import {
  Box,
  VStack,
  Alert,
  AlertIcon,
  Text,
  TabPanel,
  Button
} from '@chakra-ui/react';
import { ConfigSettings } from '../../../types/configuration';
import {
  LoanManagementSection,
  NotificationSection,
  MaterialManagementSection,
  ActivityManagementSection,
  ReputationSystemSection,
  ReportsSection
} from '../sections';

interface VariablesTabProps {
  settings: ConfigSettings;
  userRole: 'admin' | 'vocal';
  onVariableChange: (key: string, value: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

/**
 * Pestaña de Variables del Sistema
 * Contiene secciones para gestión de préstamos, notificaciones, actividades, etc.
 */
const VariablesTab: React.FC<VariablesTabProps> = ({
  settings,
  userRole,
  onVariableChange,
  onSubmit,
  isLoading
}) => {
  return (
    <TabPanel>
      <VStack spacing={8} align="stretch">
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Gestor de Variables del Sistema</Text>
            <Text>
              Configura los parámetros que controlan el comportamiento automático del sistema. 
              Estas variables afectan las reglas de negocio y notificaciones.
            </Text>
          </Box>
        </Alert>        {/* Sección: Gestión de Préstamos y Devoluciones */}
        <LoanManagementSection 
          settings={settings} 
          userRole={userRole}
          onVariableChange={onVariableChange} 
        />

        {/* Sección: Notificaciones Automáticas */}
        <NotificationSection 
          settings={settings} 
          onVariableChange={onVariableChange} 
        />

        {/* Sección: Gestión de Material */}
        <MaterialManagementSection 
          settings={settings} 
          onVariableChange={onVariableChange} 
        />

        {/* Sección: Gestión de Actividades */}
        <ActivityManagementSection 
          settings={settings} 
          onVariableChange={onVariableChange} 
        />

        {/* Sección: Sistema de Puntuación y Reputación */}
        <ReputationSystemSection 
          settings={settings} 
          onVariableChange={onVariableChange} 
        />

        {/* Sección: Configuración de Reportes */}
        <ReportsSection 
          settings={settings} 
          onVariableChange={onVariableChange} 
        />

        <Button 
          onClick={onSubmit}
          colorScheme="brand"
          size="lg"
          isLoading={isLoading}
          loadingText="Guardando variables..."
        >
          💾 Guardar variables del sistema
        </Button>
      </VStack>
    </TabPanel>
  );
};

export default VariablesTab;
