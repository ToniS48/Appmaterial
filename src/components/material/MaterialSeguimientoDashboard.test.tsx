/**
 * Tests para el Dashboard de Seguimiento de Material
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

// Mock adicional específico para framer-motion si es necesario
beforeEach(() => {
  // Asegurar que matchMedia existe con addListener
  try {
    const testQuery = window.matchMedia('(test)');
    if (!testQuery.addListener || typeof testQuery.addListener !== 'function') {
      throw new Error('addListener not available');
    }
  } catch {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  }
});

// Mock adicional para DOMRect y getBoundingClientRect
global.DOMRect = {
  fromRect: () => ({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
  }),
} as any;

// Mock de getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    overflow: 'visible',
    overflowX: 'visible',
    overflowY: 'visible',
    getPropertyValue: (prop: string) => '',
  }),
});

// Mock de ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock completo del router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/test' }),
}));

// Mock del servicio con datos inline
jest.mock('../../services/domain/MaterialHistorialService', () => ({
  materialHistorialService: {
    obtenerEstadisticasAnuales: jest.fn().mockResolvedValue({
      año: 2025,
      eventosRegistrados: 10,
      materialesPerdidos: 2,
      materialesDañados: 1,
      materialReparado: 1,
      costoPerdidas: 500,
      eventosPorMes: Array(12).fill(1),
      incidenciasPorMes: Array(12).fill(0),
      eventosPorTipo: {
        perdida: { total: 2, costo: 200 },
        daño: { total: 1, costo: 100 }
      },
      estadisticasPorTipo: {
        perdida: { total: 2, costo: 200 },
        daño: { total: 1, costo: 100 }
      },
      materialesProblematicos: []
    }),
    obtenerHistorial: jest.fn().mockResolvedValue([
      {
        id: '1',
        materialId: 'mat1',
        nombreMaterial: 'Material Test',
        tipoEvento: 'perdida',
        fechaEvento: new Date(),
        descripcion: 'Test evento'
      }
    ]),
    obtenerMaterialesProblematicos: jest.fn().mockResolvedValue([]),
    compararAños: jest.fn().mockResolvedValue({
      añoBase: 2025,
      añoComparacion: 2024,
      estadisticasBase: {
        eventosRegistrados: 10,
        materialesPerdidos: 2,
        costoPerdidas: 500
      },
      estadisticasComparacion: {
        eventosRegistrados: 8,
        materialesPerdidos: 1,
        costoPerdidas: 300
      },
      diferencias: {
        eventosRegistrados: 2,
        materialesPerdidos: 1,
        costoPerdidas: 200
      },
      porcentajes: {
        eventosRegistrados: 25,
        materialesPerdidos: 100,
        costoPerdidas: 66.67
      }
    }),
    generarReporteAnual: jest.fn().mockResolvedValue('Reporte de prueba')
  }
}));

// Importar el componente después de los mocks
import MaterialSeguimientoDashboard from './MaterialSeguimientoDashboard';

const renderWithChakra = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  );
};

describe('MaterialSeguimientoDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render basic structure', async () => {
    const { container } = renderWithChakra(<MaterialSeguimientoDashboard />);
    expect(container.firstChild).toBeTruthy();
    
    // Esperar a que termine de cargar
    await waitFor(() => {
      expect(screen.queryByText('Cargando datos...')).not.toBeInTheDocument();
    });
  });

  it('should display dashboard heading after loading', async () => {
    renderWithChakra(<MaterialSeguimientoDashboard />);
    
    // Esperar a que los datos se carguen
    await waitFor(() => {
      expect(screen.getByText('📊 Seguimiento de Material por Años')).toBeInTheDocument();
    });
  });

  it('should render year selector after loading', async () => {
    renderWithChakra(<MaterialSeguimientoDashboard />);
    
    await waitFor(() => {
      const yearSelector = screen.getByRole('combobox');
      expect(yearSelector).toBeInTheDocument();
    });
  });
  it('should render update button after loading', async () => {
    renderWithChakra(<MaterialSeguimientoDashboard />);
    
    await waitFor(() => {
      const updateButton = screen.getByLabelText('Actualizar');
      expect(updateButton).toBeInTheDocument();
    });
  });

  it('should render generate report button after loading', async () => {
    renderWithChakra(<MaterialSeguimientoDashboard />);
    
    await waitFor(() => {
      const reportButton = screen.getByText('Generar Reporte');
      expect(reportButton).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    renderWithChakra(<MaterialSeguimientoDashboard />);
    expect(screen.getByText('Cargando datos...')).toBeInTheDocument();
  });
});
