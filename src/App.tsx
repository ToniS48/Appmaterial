import React, { useEffect } from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter as Router } from 'react-router-dom';
import theme from './styles/theme';
import { AuthProvider } from './contexts/AuthContext';
import { NotificacionProvider } from './contexts/NotificacionContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AppRoutes from './routes/AppRoutes';
import { iniciarTareasProgramadas } from './services/programacionService';

function App() {
  useEffect(() => {
    // Iniciar tareas programadas cuando la app se monte
    iniciarTareasProgramadas();
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <NotificacionProvider>
              <AppRoutes />
            </NotificacionProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </ChakraProvider>
  );
}

export default App;
