// @ts-nocheck - Desactiva temporalmente la verificación de tipos
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './styles/theme';

// Mock de Firebase
jest.mock('./services/firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn((auth, callback) => {
      callback(null); // Simular usuario no autenticado
      return jest.fn(); // Devolver una función de limpieza
    })
  },
  db: {},
  functions: {},
}));

// Mock del hook useAuth para evitar errores relacionados con Firebase
jest.mock('./contexts/AuthContext', () => {
  const originalModule = jest.requireActual('./contexts/AuthContext');
  return {
    ...originalModule,
    useAuth: () => ({
      currentUser: null,
      userProfile: null,
      loading: false,
      login: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      register: jest.fn(),
      inactivityWarningVisible: false,
      resetInactivityTimer: jest.fn(),
      loginBlocked: false,
      loginBlockTimeRemaining: 0
    })
  };
});

// Mock de Router para evitar errores
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }) => <>{children}</> // Simular el Router sin duplicarlo
}));

// Componente wrapper para las pruebas
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ChakraProvider>
  );
};

test('renders login page', async () => {
  render(
    <TestWrapper>
      <App />
    </TestWrapper>
  );
  
  // Verificar que se muestra el título del formulario de login
  const loginElement = await screen.findByText(messages.auth.login.title);
  expect(loginElement).toBeInTheDocument();
});

test('renders login form elements', async () => {
  render(
    <TestWrapper>
      <App />
    </TestWrapper>
  );
  
  // Verificar que se muestran los elementos principales del formulario
  const emailField = await screen.findByLabelText(messages.auth.login.emailLabel);
  const passwordField = await screen.findByLabelText(messages.auth.login.passwordLabel);
  const submitButton = await screen.findByRole('button', { name: messages.auth.login.submitButton });
  
  expect(emailField).toBeInTheDocument();
  expect(passwordField).toBeInTheDocument();
  expect(submitButton).toBeInTheDocument();
});

test('renders login page', () => {
  render(
    <TestWrapper>
      <App />
    </TestWrapper>
  );
  
  const loginTitle = screen.getByText(/Iniciar sesión/i);
  expect(loginTitle).toBeInTheDocument();
  const emailInput = screen.getByLabelText(/Email/i);
});
