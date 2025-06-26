import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Heading, Text, Button, Container, Code, VStack } from '@chakra-ui/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxW="container.md" py={10}>
          <VStack spacing={6} align="stretch">
            <Box bg="red.50" p={5} borderRadius="md" borderWidth={1} borderColor="red.200">
              <Heading as="h1" size="lg" color="red.600" mb={4}>
                Ha ocurrido un error en la aplicación
              </Heading>
              <Text mb={4}>
                Por favor, intenta recargar la página. Si el problema persiste, contacta al soporte técnico.
              </Text>
              <Button 
                colorScheme="red" 
                onClick={() => window.location.reload()}
                mb={4}
              >
                Recargar página
              </Button>
              
              {process.env.NODE_ENV !== 'production' && (
                <Box mt={6}>
                  <Heading as="h4" size="md" mb={2}>Detalles del error (solo desarrollo):</Heading>
                  <Code p={3} borderRadius="md" variant="subtle" display="block" whiteSpace="pre-wrap">
                    {this.state.error?.toString()}
                    {this.state.errorInfo?.componentStack}
                  </Code>
                </Box>
              )}
            </Box>
          </VStack>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
