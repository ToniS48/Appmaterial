/**
 * Tests básicos para MaterialHistorialService
 */
import { MaterialHistorialService } from './MaterialHistorialService';

// Mock simple del repository
jest.mock('../../repositories/MaterialHistorialRepository', () => ({
  materialHistorialRepository: {
    create: jest.fn(),
    findByFilters: jest.fn(),
    update: jest.fn(),
  }
}));

describe('MaterialHistorialService', () => {
  let service: MaterialHistorialService;

  beforeEach(() => {
    service = new MaterialHistorialService();
  });

  it('should create service instance', () => {
    expect(service).toBeInstanceOf(MaterialHistorialService);
  });

  it('should have required methods', () => {
    expect(typeof service.registrarEvento).toBe('function');
    expect(typeof service.obtenerEstadisticasAnuales).toBe('function');
    expect(typeof service.generarReporteAnual).toBe('function');
  });
});
