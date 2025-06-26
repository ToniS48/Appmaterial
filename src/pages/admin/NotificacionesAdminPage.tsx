import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import GestionNotificaciones from '../../components/notificaciones/GestionNotificaciones';

const NotificacionesAdminPage: React.FC = () => {
  return (
    <DashboardLayout title="Gestión de Notificaciones">
      <GestionNotificaciones />
    </DashboardLayout>
  );
};

export default NotificacionesAdminPage;
