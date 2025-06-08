import React from 'react';
import PrestamosDashboard from '../../components/prestamos/PrestamosDashboard';

/**
 * Página de administración de préstamos para Administradores
 */
const PrestamosAdminPage: React.FC = () => {
  return <PrestamosDashboard rol="admin" titulo="Administración de Préstamos" />;
};

export default PrestamosAdminPage;