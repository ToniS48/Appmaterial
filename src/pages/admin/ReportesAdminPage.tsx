import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import GestionReportes from '../../components/admin/GestionReportes';

const ReportesAdminPage: React.FC = () => {
  return (
    <DashboardLayout title="Gestión de Reportes de Errores">
      <GestionReportes />
    </DashboardLayout>
  );
};

export default ReportesAdminPage;