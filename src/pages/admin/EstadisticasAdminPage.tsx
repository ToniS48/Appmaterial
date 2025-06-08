import React from 'react';
import GenericEstadisticas from '../../components/common/GenericEstadisticas';

const EstadisticasAdminPage: React.FC = () => {
  return (
    <GenericEstadisticas 
      userRole="admin" 
      pageTitle="Estadísticas del Sistema - Administrador" 
    />
  );
};

export default EstadisticasAdminPage;
