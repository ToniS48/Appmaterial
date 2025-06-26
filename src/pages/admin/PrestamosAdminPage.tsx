import React from 'react';
import PrestamosDashboard from '../../components/prestamos/PrestamosDashboard';

const PrestamosAdminPage: React.FC = () => {
  return <PrestamosDashboard rol="admin" titulo="Gestión de Préstamos" />;
};

export default PrestamosAdminPage;
