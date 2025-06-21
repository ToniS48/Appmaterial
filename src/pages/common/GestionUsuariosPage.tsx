import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import GestionUsuariosTab from '../../components/usuarios/GestionUsuariosTab';

const GestionUsuariosPage: React.FC = () => {
  return (
    <DashboardLayout title="Gestión de Usuarios">
      <GestionUsuariosTab />
    </DashboardLayout>
  );
};

export default GestionUsuariosPage;