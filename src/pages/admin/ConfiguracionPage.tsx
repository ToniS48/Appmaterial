import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfigurationManager from '../../components/shared/ConfigurationManager';

const ConfiguracionPage: React.FC = () => {
  return (
    <DashboardLayout title="Configuración del Sistema">
      <ConfigurationManager 
        userRole="admin" 
        title="Configuración del Sistema"
      />
    </DashboardLayout>
  );
};

export default ConfiguracionPage;
