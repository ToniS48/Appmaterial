import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error no capturado:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box textAlign="center" py={10} px={6}>
          <VStack spacing={4}>
            <Heading as="h2" size="xl">Algo salió mal</Heading>
            <Text>
              Ha ocurrido un error inesperado. Por favor, intenta recargar la aplicación.
            </Text>
            <Button
              colorScheme="brand"
              onClick={() => window.location.reload()}
            >
              Recargar aplicación
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;