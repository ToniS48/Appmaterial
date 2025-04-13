import React, { useEffect } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router } from 'react-router-dom'; // Añade este import
import theme from './styles/theme'; // Mantener esta importación
import { AuthProvider } from './contexts/AuthContext';
import { NotificacionProvider } from './contexts/NotificacionContext';
import AppRoutes from './routes/AppRoutes';
import { iniciarTareasProgramadas } from './services/programacionService';

function App() {
  useEffect(() => {
    // Iniciar tareas programadas cuando la app se monte
    iniciarTareasProgramadas();
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <Router> {/* Añade el Router aquí */}
        <AuthProvider>
          <NotificacionProvider>
            <AppRoutes />
          </NotificacionProvider>
        </AuthProvider>
      </Router>
    </ChakraProvider>
  );
}

export default App;
