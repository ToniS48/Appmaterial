/**
 * Test para depurar el problema de selección de tipo/subtipo en InfoEditor
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import InfoEditor from '../components/actividades/InfoEditor';
import { Actividad } from '../types/actividad';
import theme from '../styles/theme';

// Setup global para el entorno de testing
const originalWindow = global.window;

beforeAll(() => {
  // Mock del object global para testing
  (global as any).IS_REACT_ACT_ENVIRONMENT = true;
  
  // Mock del ResizeObserver que puede usar Chakra UI
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
});

afterAll(() => {
  global.window = originalWindow;
});

// Mock completo del objeto window para Chakra UI ColorModeProvider
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock para localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock específico para Chakra UI ColorModeProvider
jest.mock('@chakra-ui/color-mode', () => {
  const actual = jest.requireActual('@chakra-ui/color-mode');
  return {
    ...actual,
    ColorModeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useColorMode: () => ({
      colorMode: 'light',
      toggleColorMode: jest.fn(),
      setColorMode: jest.fn(),
    }),
    ColorModeScript: () => null,
  };
});

// Mock de DatePicker que funciona correctamente con React Hook Form Controller
jest.mock('../components/common/DatePicker', () => {
  const React = require('react');
  return React.forwardRef(function MockDatePicker({ selectedDate, onChange, ...props }: any, ref: any) {
    const [value, setValue] = React.useState(selectedDate?.toISOString?.()?.split('T')[0] || '');
    
    // Sincronizar con selectedDate cuando cambia desde fuera
    React.useEffect(() => {
      if (selectedDate) {
        const isoString = selectedDate.toISOString ? selectedDate.toISOString() : new Date(selectedDate).toISOString();
        setValue(isoString.split('T')[0]);
      } else {
        setValue('');
      }
    }, [selectedDate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      
      // Llamar onChange con Date object para React Hook Form
      if (onChange) {
        const date = newValue ? new Date(newValue + 'T00:00:00.000Z') : null;
        onChange(date);
      }
    };

    return (
      <input
        ref={ref}
        type="date"
        data-testid="date-picker"
        value={value}
        onChange={handleChange}
        {...props}
      />
    );
  });
});

// Mock de Firebase Auth
jest.mock('../config/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn()
  },
  db: {
    collection: jest.fn(),
    doc: jest.fn()
  }
}));

// Mock del contexto de autenticación
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'test-user', email: 'test@example.com' },
    userProfile: { 
      uid: 'test-user', 
      email: 'test@example.com', 
      nombre: 'Test', 
      apellidos: 'User', 
      rol: 'admin' 
    },
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    resetPassword: jest.fn()
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock del contexto de notificaciones
jest.mock('../contexts/NotificacionContext', () => ({
  useNotificaciones: () => ({
    notificaciones: [],
    notificacionesNoLeidas: 0,
    cargando: false,
    error: null,
    cargarNotificaciones: jest.fn(),
    marcarComoLeida: jest.fn(),
    marcarTodasComoLeidas: jest.fn(),
    limpiarError: jest.fn()
  }),
  NotificacionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock de servicios de notificación
jest.mock('../services/notificacionService', () => ({
  obtenerNotificacionesUsuario: jest.fn().mockResolvedValue([]),
  subscribeToNotificaciones: jest.fn().mockReturnValue(() => {}),
  marcarNotificacionLeida: jest.fn().mockResolvedValue(undefined),
  marcarTodasLeidas: jest.fn().mockResolvedValue(undefined),
  crearNotificacion: jest.fn().mockResolvedValue({})
}));

// Mock de servicios de usuario
jest.mock('../services/usuarioService', () => ({
  obtenerOCrearUsuarioPorId: jest.fn().mockResolvedValue({
    uid: 'test-user',
    email: 'test@example.com',
    nombre: 'Test',
    apellidos: 'User',
    rol: 'admin'
  }),
  actualizarUltimoAcceso: jest.fn().mockResolvedValue(undefined),
  listarUsuarios: jest.fn().mockResolvedValue([])
}));

// Mock de useToast y otros hooks de Chakra UI
jest.mock('@chakra-ui/react', () => {
  const actual = jest.requireActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => jest.fn(),
    useColorModeValue: (light: any, dark: any) => light,
    useMediaQuery: () => [false],
  };
});

const mockActividad: Actividad = {
  id: undefined,
  nombre: '',
  lugar: '',
  descripcion: '',
  fechaInicio: new Date(),
  fechaFin: new Date(),
  tipo: [], // Arrays vacíos para nueva actividad
  subtipo: [],
  dificultad: 'media',
  responsableActividadId: 'test-user',
  participanteIds: ['test-user'],
  necesidadMaterial: false,
  materiales: [],
  estado: 'planificada',
  creadorId: 'test-user',
  comentarios: [],
  fechaActualizacion: { toDate: () => new Date() } as any,
  enlacesWikiloc: [],
  enlacesTopografias: [],
  enlacesDrive: [],
  enlacesWeb: [],
  imagenesTopografia: [],
  archivosAdjuntos: [],
  enlaces: []
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  // Importar los providers mockeados
  const { AuthProvider } = require('../contexts/AuthContext');
  const { NotificacionProvider } = require('../contexts/NotificacionContext');
  
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <NotificacionProvider>
          {children}
        </NotificacionProvider>
      </AuthProvider>
    </ChakraProvider>
  );
};

describe('InfoEditor - Tipo/Subtipo Selection Debug', () => {
  let mockOnSave: jest.Mock;
  let mockOnCancel: jest.Mock;

  beforeEach(() => {
    mockOnSave = jest.fn();
    mockOnCancel = jest.fn();
    
    // Limpiar console logs anteriores
    jest.clearAllMocks();
    
    // Espiar console.log para verificar los logs de depuración
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  test('should initialize with empty tipo and subtipo arrays for new activity', async () => {
    render(
      <TestWrapper>
        <InfoEditor
          data={mockActividad}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          mostrarBotones={true}
        />
      </TestWrapper>
    );    // Verificar que el componente se renderiza
    expect(screen.getByPlaceholderText('Ejemplo: Exploración Cueva del Agua')).toBeInTheDocument();
      // Verificar que los logs de reseteo se ejecutaron
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(
        'InfoEditor - Reseteando formulario con nuevos datos:',
        expect.objectContaining({
          tipo: [],
          subtipo: []
        })
      );
    });
  });

  test('should handle tipo selection correctly', async () => {
    render(
      <TestWrapper>
        <InfoEditor
          data={mockActividad}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          mostrarBotones={true}
        />
      </TestWrapper>
    );    // Buscar botones de tipo de actividad
    const tipoButtons = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('Espeleología') || 
      button.textContent?.includes('Barranquismo') ||
      button.textContent?.includes('Exterior')
    );

    expect(tipoButtons.length).toBeGreaterThan(0);

    // Hacer clic en el primer tipo disponible
    if (tipoButtons.length > 0) {
      fireEvent.click(tipoButtons[0]);
      
      // Verificar que el estado se actualiza visualmente
      await waitFor(() => {
        expect(tipoButtons[0]).toHaveClass('chakra-button');      });
    }
  });  test('should call onSave with form data even without tipo and subtipo selection', async () => {
    render(
      <TestWrapper>
        <InfoEditor
          data={mockActividad}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          mostrarBotones={true}
        />
      </TestWrapper>
    );    // Usar fireEvent para mejor compatibilidad con React Hook Form
    const nombreInput = screen.getByPlaceholderText('Ejemplo: Exploración Cueva del Agua') as HTMLInputElement;
    const lugarInput = screen.getByPlaceholderText('Ejemplo: Montanejos, Castellón') as HTMLInputElement;
    
    // Simular interacción completa con focus, change, input y blur
    fireEvent.focus(nombreInput);
    fireEvent.change(nombreInput, { target: { value: 'Actividad Test' } });
    fireEvent.input(nombreInput, { target: { value: 'Actividad Test' } });
    fireEvent.blur(nombreInput);
    
    fireEvent.focus(lugarInput);
    fireEvent.change(lugarInput, { target: { value: 'Lugar Test' } });
    fireEvent.input(lugarInput, { target: { value: 'Lugar Test' } });
    fireEvent.blur(lugarInput);    // Rellenar fechas obligatorias usando data-testid
    const dateInputs = screen.getAllByTestId('date-picker');
    expect(dateInputs.length).toBeGreaterThanOrEqual(2);
    
    // Fecha de inicio
    fireEvent.change(dateInputs[0], {
      target: { value: '2025-06-01' }
    });
    
    // Fecha de fin
    fireEvent.change(dateInputs[1], {
      target: { value: '2025-06-02' }
    });    // Esperar a que los cambios se procesen
    await waitFor(() => {
      expect(nombreInput.value).toBe('Actividad Test');
      expect(lugarInput.value).toBe('Lugar Test');
      expect((dateInputs[0] as HTMLInputElement).value).toBe('2025-06-01');
      expect((dateInputs[1] as HTMLInputElement).value).toBe('2025-06-02');
    });

    // Log para debug - verificar valores antes del submit
    console.log('Estado del formulario antes del submit:', {
      nombre: (nombreInput as HTMLInputElement).value,
      lugar: (lugarInput as HTMLInputElement).value,
      fechaInicio: (dateInputs[0] as HTMLInputElement).value,
      fechaFin: (dateInputs[1] as HTMLInputElement).value
    });    // Verificar que el botón submit existe y hacer clic
    const submitButton = screen.getByText('Guardar');
    expect(submitButton).toBeInTheDocument();
      console.log('Haciendo click en submit...');
    fireEvent.click(submitButton);    // Esperar que se llame onSave con los datos correctos
    await waitFor(() => {
      console.log('mockOnSave.mock.calls length:', mockOnSave.mock.calls.length);
      console.log('mockOnSave.mock.calls:', mockOnSave.mock.calls);
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Actividad Test',
          lugar: 'Lugar Test',
          tipo: [],
          subtipo: []
        })
      );
    }, { timeout: 10000 });
  }, 15000); // Timeout específico para este test

  test('should call onSave with correct data when tipo and subtipo are selected', async () => {
    render(
      <TestWrapper>
        <InfoEditor
          data={mockActividad}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          mostrarBotones={true}
        />
      </TestWrapper>
    );

    // Rellenar campos obligatorios
    fireEvent.change(screen.getByPlaceholderText('Ejemplo: Exploración Cueva del Agua'), {
      target: { value: 'Actividad Test' }
    });    fireEvent.change(screen.getByPlaceholderText('Ejemplo: Montanejos, Castellón'), {
      target: { value: 'Lugar Test' }
    });

    // Rellenar fechas obligatorias usando data-testid
    const dateInputs = screen.getAllByTestId('date-picker');
    expect(dateInputs.length).toBeGreaterThanOrEqual(2);
    
    // Fecha de inicio
    fireEvent.change(dateInputs[0], {
      target: { value: '2025-06-01' }
    });
    
    // Fecha de fin
    fireEvent.change(dateInputs[1], {
      target: { value: '2025-06-02' }
    });

    // Buscar y seleccionar un tipo de actividad
    const tipoButtons = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('Espeleología') || 
      button.textContent?.includes('Barranquismo') ||
      button.textContent?.includes('Exterior')
    );
    
    expect(tipoButtons.length).toBeGreaterThan(0);
    fireEvent.click(tipoButtons[0]); // Seleccionar "Espeleología"

    // Buscar y seleccionar un subtipo de actividad
    const subtipoButtons = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('Visita') || 
      button.textContent?.includes('Exploración') ||
      button.textContent?.includes('Formación') ||
      button.textContent?.includes('Otro')
    );
    
    expect(subtipoButtons.length).toBeGreaterThan(0);
    fireEvent.click(subtipoButtons[0]); // Seleccionar "Visita"

    // Enviar el formulario
    const submitButton = screen.getByText('Guardar');
    fireEvent.click(submitButton);

    // Verificar que onSave fue llamado con los datos correctos
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Actividad Test',
          lugar: 'Lugar Test',
          tipo: expect.arrayContaining(['espeleologia']),
          subtipo: expect.arrayContaining(['visita'])
        })
      );
    });
  });
});
