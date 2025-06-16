import React from 'react';
import { Box, Container, Flex, Link, Text, VStack, Image, Center } from '@chakra-ui/react';
import logoEspemo from '../../assets/images/logoEspemo.png';
import VersionDisplay from '../version/VersionDisplay';

interface AuthPageLayoutProps {
  children: React.ReactNode;
  title: string;
  bottomLinkText: string;
  bottomLinkHref: string;
  bottomLinkLabel: string;
  termsText?: string;
}

const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({
  children,
  title,
  bottomLinkText,
  bottomLinkHref,
  bottomLinkLabel,
  termsText
}) => {  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50" position="relative">
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
              {title}
            </Text>
            
            {children}
            
            <Flex justifyContent="center" mt={4} pb={2}>
              <Text mr={2}>{bottomLinkText}</Text>
              <Link href={bottomLinkHref} color="brand.500">
                {bottomLinkLabel}
              </Link>
            </Flex>
          </Box>
          
          {termsText && (
            <Text fontSize="sm" color="gray.500" className="text-center mb-4">
              {termsText}
            </Text>          )}
        </VStack>
      </Container>
      
      {/* Componente de versión en la esquina inferior derecha */}
      <VersionDisplay 
        position="fixed"
        bottom="16px"
        right="16px"
        fontSize="xs"
        color="gray.400"
        showTooltip={true}
        format="version-only"
      />
    </Flex>
  );
};

export default AuthPageLayout;
