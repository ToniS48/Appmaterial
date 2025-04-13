import React from 'react';
import { Box, Container, Flex, Link, Text, VStack, Image, Center } from '@chakra-ui/react';
import RegisterForm from '../components/auth/RegisterForm';
import messages from '../constants/messages';
import logoEspemo from '../assets/images/logoEspemo.png';

const RegisterPage: React.FC = () => {
  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50">
      <Container maxW="lg" p={6}>
        <VStack spacing={6} align="center">                   
          <Box 
            w="full" 
            p={{ base: 4, md: 8 }} 
            borderWidth={1} 
            borderRadius="lg" 
            boxShadow="md"
            bg="white"
            className="slide-in"
          >
            <Center className="logo-container">
              <Image 
                src={logoEspemo}  
                alt="ESPEMO Logo" 
                width="150px" 
                height="auto"
                className="logo fade-in"
              />
            </Center>
            <Text 
              fontSize="2xl" 
              fontWeight="bold" 
              mb={6} 
              textAlign="center" 
              color="brand.500"
            >
              Registro de nuevo usuario
            </Text>
            
            <RegisterForm />
            
            <Flex justifyContent="center" mt={4} pb={2}>
              <Text mr={2}>¿Ya tienes cuenta?</Text>
              <Link href="/login" color="brand.500">
                Inicia sesión aquí
              </Link>
            </Flex>
          </Box>
          
          <Text fontSize="sm" color="gray.500" className="text-center mb-4">
            {messages.auth.register.terms}
          </Text>
        </VStack>
      </Container>
    </Flex>
  );
};

export default RegisterPage;