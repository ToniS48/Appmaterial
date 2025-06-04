import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import AppHeader from './AppHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  
  return (
    <Flex h="100vh" direction="column">
      {/* Header con menú de navegación */}
      <AppHeader 
        title={title} 
        onSidebarOpen={() => {}} 
      />
      
      {/* Contenido principal - ahora ocupa todo el ancho */}
      <Box 
        flex="1" 
        overflowY="auto" 
        bg="gray.50" 
        p={{ base: 3, md: 5 }}
      >
        {children}
      </Box>
    </Flex>
  );
};

export default DashboardLayout;