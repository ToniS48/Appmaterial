import React from 'react';
import GenericDashboard from '../../components/dashboard/GenericDashboard';
import { vocalDashboardCards, socioAccessCards } from '../../config/dashboardConfig';

const VocalDashboard: React.FC = () => {
  return (
    <GenericDashboard 
      userRole="vocal" 
      cards={vocalDashboardCards}
      socioCards={socioAccessCards}
    />
  );
};

export default VocalDashboard;
