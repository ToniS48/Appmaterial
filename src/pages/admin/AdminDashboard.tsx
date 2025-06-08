import React from 'react';
import GenericDashboard from '../../components/dashboard/GenericDashboard';
import { adminDashboardCards, socioAccessCards } from '../../config/dashboardConfig';

const AdminDashboard: React.FC = () => {
  return (
    <GenericDashboard 
      userRole="admin" 
      cards={adminDashboardCards}
      socioCards={socioAccessCards}
    />
  );
};

export default AdminDashboard;
