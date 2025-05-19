import React, { useEffect, Suspense } from 'react';
import { ChakraProvider, ColorModeScript, Box, Center, Spinner, Text } from '@chakra-ui/react';
import { BrowserRouter as Router } from 'react-router-dom';
import theme from './styles/theme';
import { AuthProvider } from './contexts/AuthContext';
import { NotificacionProvider } from './contexts/NotificacionContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRoutes from './routes';
import { iniciarTareasProgramadas } from './services/programacionService';
import ErrorBoundary from './components/common/ErrorBoundary';


// Importar DebugHelper de forma lazy
const DebugHelper = React.lazy(() => import('./components/debug/DebugHelper'));

// Componente de carga inicial
const LoadingFallback = () => (
  <Center h="100vh" w="100vw">
    <Box textAlign="center">
      <Spinner size="xl" color="brand.500" mb={4} />
      <Text>Iniciando aplicación...</Text>
    </Box>
  </Center>
);

function App() {
  useEffect(() => {
    // Iniciar tareas programadas cuando la app se monte
    iniciarTareasProgramadas();
    
    // Verificar estado inicial de autenticación
    const checkInitialAuth = () => {
      // Buscar token con cualquier patrón relacionado con firebase:authUser:
      const tokenKey = Object.keys(localStorage).find(key => 
        key.startsWith('firebase:authUser:')
      );
      
      if (tokenKey) {
        try {
          const authData = JSON.parse(localStorage.getItem(tokenKey) || '{}');
          console.log('Token encontrado:', tokenKey);  // Esto revelará la estructura exacta
          console.log('Token para usuario:', authData.email || 'usuario desconocido');
          return true;
        } catch (e) {
          console.error('Error al leer token:', e);
          return false;
        }
      } else {
        console.log('No se encontró token de autenticación');
        return false;
      }
    };
    
    // Verificar inmediatamente
    checkInitialAuth();
    
    // Verificar periódicamente
    const authCheckInterval = setInterval(() => {
      const hasToken = checkInitialAuth();
      console.log(`Estado de autenticación (${new Date().toLocaleTimeString()}):`, 
        hasToken ? 'Token presente' : 'Sin token');
    }, 60000); // Verificar cada minuto
    
    return () => {
      clearInterval(authCheckInterval);      
    };
  }, []);

  return (
    <ErrorBoundary>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <Suspense fallback={<LoadingFallback />}>
          <Router>
            <ThemeProvider>
              <AuthProvider>
                <NotificacionProvider>
                  <AppRoutes />
                  {process.env.NODE_ENV !== 'production' && (
                    <Suspense fallback={null}>
                      <DebugHelper />
                    </Suspense>
                  )}
                </NotificacionProvider>
              </AuthProvider>
            </ThemeProvider>
          </Router>
        </Suspense>
      </ChakraProvider>
    </ErrorBoundary>
  );
}

export default App;
