import React from 'react';
import {
  Box,
  VStack,
  Alert,
  AlertIcon,
  Text,
  TabPanel,
  Spinner
} from '@chakra-ui/react';
import { useSectionConfig } from '../../../hooks/configuration/useSectionConfig';
import NotificationSection from '../sections/NotificationSection';
import MaterialManagementSection from '../sections/MaterialManagementSection';
import LoanManagementSection from '../sections/LoanManagementSection';
import ActivityManagementSection from '../sections/ActivityManagementSection';
import ReputationSystemSection from '../sections/ReputationSystemSection';
import ReportsSection from '../sections/ReportsSection';
import WeatherSettingsSection from '../sections/WeatherSettingsSection';

const defaultConfig = {
  variables: {
    diasGraciaDevolucion: 0,
    diasMaximoRetraso: 0,
    diasBloqueoPorRetraso: 0,
    recordatorioPreActividad: 1,
    recordatorioDevolucion: 1,
    notificacionRetrasoDevolucion: 0,
    diasAntelacionRevision: 15,
    tiempoMinimoEntrePrestamos: 0,
    porcentajeStockMinimo: 10,
    diasRevisionPeriodica: 90,
    diasMinimoAntelacionCreacion: 0,
    diasMaximoModificacion: 0,
    limiteParticipantesPorDefecto: 0,
    penalizacionRetraso: 0,
    bonificacionDevolucionTemprana: 0,
    umbraLinactividadUsuario: 0,
    diasHistorialReportes: 0,
    limiteElementosExportacion: 0
  },
  apis: {
    googleDriveUrl: '',
    googleDriveTopoFolder: '',
    googleDriveDocFolder: '',
    weatherEnabled: false,
    weatherApiKey: '',
    weatherApiUrl: '',
    aemetEnabled: false,
    aemetApiKey: '',
    aemetUseForSpain: false,
    temperatureUnit: '',
    windSpeedUnit: '',
    precipitationUnit: '',
    backupApiKey: '',
    emailServiceKey: '',
    smsServiceKey: '',
    notificationsEnabled: false,
    analyticsKey: '',
    analyticsEnabled: false
  }
};

const VariablesTab: React.FC<{ userRole: 'admin' | 'vocal' }> = ({ userRole }) => {
  const { data: general, setData: setGeneral, loading, save } = useSectionConfig('general', defaultConfig);

  if (loading) return <Spinner size="lg" />;

  // Adaptador para switches
  const handleApiSwitchChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeneral({ ...general, [key]: e.target.checked });
  };

  const handleChange = (key: string, value: any) => {
    setGeneral({ ...general, [key]: value });
  };

  return (
    <TabPanel>
      <VStack spacing={8} align="stretch">
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Gestor de Variables del Sistema</Text>
            <Text>
              Configura los parámetros que controlan el comportamiento automático del sistema. Estas variables afectan las reglas de negocio y notificaciones.
            </Text>
          </Box>
        </Alert>
        <LoanManagementSection config={general} setConfig={setGeneral} userRole={userRole} save={save} />
        <NotificationSection config={general} setConfig={setGeneral} save={save} />
        <MaterialManagementSection config={general} setConfig={setGeneral} save={save} />
        <ActivityManagementSection config={general} setConfig={setGeneral} save={save} />
        <ReputationSystemSection config={general} setConfig={setGeneral} save={save} />
        <ReportsSection config={general} setConfig={setGeneral} save={save} />
        <WeatherSettingsSection userRole={userRole} config={general} setConfig={setGeneral} save={save} />
      </VStack>
    </TabPanel>
  );
};

export default VariablesTab;
