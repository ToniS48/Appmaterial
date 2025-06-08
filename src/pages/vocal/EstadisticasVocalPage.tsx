import React from 'react';
import GenericEstadisticas from '../../components/common/GenericEstadisticas';

const EstadisticasVocalPage: React.FC = () => {
  return (
    <GenericEstadisticas 
      userRole="vocal" 
      pageTitle="Estadísticas del Sistema - Vocal" 
    />
  );
};

export default EstadisticasVocalPage;
