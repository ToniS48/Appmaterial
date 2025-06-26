import React from 'react';
import { Flex, Spinner, Text, VStack } from '@chakra-ui/react';

const LoadingScreen: React.FC = () => {
  return (
    <Flex 
      width="100%" 
      height="100vh" 
      justifyContent="center" 
      alignItems="center"
      bg="gray.50"
    >
      <VStack spacing={4}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="brand.500"
          size="xl"
        />
        <Text color="brand.500" fontSize="lg" fontWeight="medium">
          Cargando...
        </Text>
      </VStack>
    </Flex>
  );
};

export default LoadingScreen;
