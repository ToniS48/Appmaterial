import React, { ReactNode } from 'react';
import { Flex, Box } from '@chakra-ui/react';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <Flex 
      minH="100vh" 
      align="center" 
      justify="center"
      py={12}
      px={4}
      bg="gray.50"
      transition="all 0.3s ease"
      _dark={{ 
        bg: "gray.900" 
      }}
    >
      <Box 
        width={{ 
          base: "100%", 
          sm: "450px",  
          md: "700px", 
          lg: "900px", 
          xl: "1000px" 
        }}
        mx="auto"
      >
        {children}
      </Box>
    </Flex>
  );
};
