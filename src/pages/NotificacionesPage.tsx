import React from 'react';
import NotificacionesContent from './common/NotificacionesPage';
import DashboardLayout from '../components/layouts/DashboardLayout';

const NotificacionesPage: React.FC = () => {
  return (
    <DashboardLayout title="Notificaciones">
      <NotificacionesContent />
    </DashboardLayout>
  );
};

export default NotificacionesPage;