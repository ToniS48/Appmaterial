import React, { useEffect, Suspense } from 'react';
import { ChakraProvider, ColorModeScript, Box, Center, Spinner, Text } from '@chakra-ui/react';
import { BrowserRouter as Router } from 'react-router-dom';
import theme from './styles/theme';
import { AuthProvider } from './contexts/AuthContext';
import { NotificacionProvider } from './contexts/NotificacionContext';
import { MensajeriaProvider } from './contexts/MensajeriaContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRoutes from './routes';
import { iniciarTareasProgramadas } from './services/programacionService';
import { useVerificacionAutomaticaPrestamos } from './hooks/useVerificacionAutomaticaPrestamos';
import ErrorBoundary from './components/common/ErrorBoundary';
// Importar el servicio meteorológico para inicializarlo
import { weatherService } from './services/weatherService';
import { obtenerConfiguracionMeteorologica } from './services/configuracionService';

// DebugHelper removido - problema MaterialSelector resuelto

// Componente de carga inicial
const LoadingFallback = () => (
  <Center h="100vh" w="100vw">
    <Box textAlign="center">
      <Spinner size="xl" color="brand.500" mb={4} />
      <Text>Iniciando aplicación...</Text>
    </Box>
  </Center>
);

// Componente interno para gestionar verificación automática
const VerificacionAutomaticaManager: React.FC = () => {
  useVerificacionAutomaticaPrestamos();
  return null; // No renderiza nada, solo ejecuta la lógica
};

function App() {
  useEffect(() => {
    // Iniciar tareas programadas cuando la app se monte
    iniciarTareasProgramadas();
    
    // Inicializar servicio meteorológico
    const initWeatherService = async () => {
      try {
        console.log('🌤️ Inicializando servicio meteorológico...');
        const weatherConfig = await obtenerConfiguracionMeteorologica();
        await weatherService.configure(weatherConfig);
        
        if (weatherService.isEnabled()) {
          console.log('✅ Servicio meteorológico habilitado');
          // Exponer en window para debugging
          (window as any).weatherService = weatherService;
        } else {
          console.log('⚠️ Servicio meteorológico deshabilitado - ir a Configuración → Clima para habilitarlo');
        }
      } catch (error) {
        console.error('❌ Error inicializando servicio meteorológico:', error);
      }
    };
    
    initWeatherService();
    
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
          <Router>            <ThemeProvider>
              <AuthProvider>
                <NotificacionProvider>
                  <MensajeriaProvider>
                    <VerificacionAutomaticaManager />
                    <AppRoutes />
                    {/* DebugHelper removido - problema MaterialSelector resuelto */}
                  </MensajeriaProvider>
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
