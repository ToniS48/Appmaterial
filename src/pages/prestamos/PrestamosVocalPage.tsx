import React from 'react';
import PrestamosDashboard from '../../components/prestamos/PrestamosDashboard';

/**
 * Página de administración de préstamos para Vocales
 */
const PrestamosVocalPage: React.FC = () => {
  return <PrestamosDashboard rol="vocal" titulo="Gestión de Préstamos" />;
};

export default PrestamosVocalPage;
