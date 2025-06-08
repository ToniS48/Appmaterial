import React from 'react';
import GenericDashboard from '../../components/dashboard/GenericDashboard';
import { vocalDashboardCards } from '../../config/dashboardConfig';

const VocalDashboard: React.FC = () => {
  return (
    <GenericDashboard 
      userRole="vocal" 
      cards={vocalDashboardCards} 
    />
  );
};

export default VocalDashboard;
