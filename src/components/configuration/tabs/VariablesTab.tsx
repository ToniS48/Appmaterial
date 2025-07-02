import React from 'react';
import {
  VStack,
  Alert,
  AlertIcon,
  Text,
  TabPanel,
  Spinner,
  SimpleGrid,
  Box
} from '@chakra-ui/react';
import { useVariablesConfig } from '../../../hooks/configuration/useUnifiedConfig';
import NotificationSection from '../sections/Variables/NotificationSection';
import LoanManagementSection from '../sections/Variables/LoanManagementSection';
import ActivityManagementSection from '../sections/Variables/ActivityManagementSection';
import ReputationSystemSection from '../sections/Variables/ReputationSystemSection';
import ReportsSection from '../sections/Variables/ReportsSection';
import WeatherSettingsSection from '../sections/Variables/WeatherSettingsSection';

interface VariablesTabProps {
  userRole: 'admin' | 'vocal';
}

/**
 * Tab de variables - usa el hook unificado y componentes simplificados
 */
const VariablesTab: React.FC<VariablesTabProps> = ({ userRole }) => {
  const { data: variables, loading, error, save } = useVariablesConfig();

  // Wrapper para compatibilidad con componentes que esperan Promise<void>
  const saveWrapper = async (newData: any) => {
    await save(newData);
  };

  if (loading) {
    return (
      <TabPanel>
        <VStack spacing={4} align="center" py={8}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.600">Cargando variables del sistema...</Text>
        </VStack>
      </TabPanel>
    );
  }

  if (error) {
    return (
      <TabPanel>
        <Alert status="error">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Error al cargar variables</Text>
            <Text fontSize="sm">{error}</Text>
          </Box>
        </Alert>
      </TabPanel>
    );
  }

  return (
    <TabPanel>
      <VStack spacing={6} align="stretch">
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Variables del Sistema</Text>
            <Text fontSize="sm">
              Configura los parámetros operacionales que controlan el comportamiento de la aplicación.
            </Text>
          </Box>
        </Alert>

        {/* Configuración Meteorológica Unificada */}
        <WeatherSettingsSection userRole={userRole} />

        {/* Otras secciones en grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <LoanManagementSection 
            config={variables} 
            setConfig={(newData) => save(newData)} 
            save={saveWrapper} 
            userRole={userRole} 
          />
          
          <ActivityManagementSection 
            config={variables} 
            setConfig={(newData) => save(newData)} 
            save={saveWrapper}
          />
          
          <ReputationSystemSection 
            config={variables} 
            setConfig={(newData) => save(newData)} 
            save={saveWrapper}
          />
          
          <ReportsSection 
            config={variables} 
            setConfig={(newData) => save(newData)} 
            save={saveWrapper}
          />
          
          <NotificationSection 
            config={variables} 
            setConfig={(newData) => save(newData)} 
            save={saveWrapper}
          />
        </SimpleGrid>
      </VStack>
    </TabPanel>
  );
};

export default VariablesTab;
