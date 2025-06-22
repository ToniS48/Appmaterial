import React from 'react';
import { Box } from '@chakra-ui/react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import MaterialInventoryView from '../../components/material/MaterialInventoryView';

const MaterialInventoryPage: React.FC = () => {
  return (
    <DashboardLayout title="Inventario de Material">
      
      <Box 
        p={{ base: 3, md: 5 }} 
        shadow="md" 
        borderWidth="1px" 
        borderRadius="md" 
        bg="white"
        maxW="1400px"
        mx="auto"
      >
        <MaterialInventoryView viewMode="tabs" />
      </Box>
    </DashboardLayout>
  );
};

export default MaterialInventoryPage;
