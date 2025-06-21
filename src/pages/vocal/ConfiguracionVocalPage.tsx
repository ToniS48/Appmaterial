import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfigurationManager from '../../components/shared/ConfigurationManager';

const ConfiguracionVocalPage: React.FC = () => {
  return (
    <DashboardLayout title="Configuración del Sistema">
      <ConfigurationManager 
        userRole="vocal" 
        title="Configuración del Sistema"
      />
    </DashboardLayout>
  );
};

export default ConfiguracionVocalPage;
