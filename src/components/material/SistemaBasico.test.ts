/**
 * Tests básicos de integración para el sistema de seguimiento
 */

export {}; // Para que sea un módulo TypeScript válido

describe('Sistema de Seguimiento de Material', () => {
  it('should have all required types exported', () => {
    // Verificar que los tipos están disponibles
    const { TipoEventoMaterial } = require('../../types/materialHistorial');
    expect(TipoEventoMaterial).toBeDefined();
    expect(TipoEventoMaterial.PERDIDO).toBe('perdido');
    expect(TipoEventoMaterial.DAÑADO).toBe('dañado');
    expect(TipoEventoMaterial.REPARADO).toBe('reparado');
  });

  it('should have MaterialHistorialService available', () => {
    const { MaterialHistorialService } = require('../../services/domain/MaterialHistorialService');
    expect(MaterialHistorialService).toBeDefined();
    
    const service = new MaterialHistorialService();
    expect(service).toBeDefined();
    expect(typeof service.registrarEvento).toBe('function');
    expect(typeof service.obtenerEstadisticasAnuales).toBe('function');
    expect(typeof service.generarReporteAnual).toBe('function');
  });

  it('should have repository exports available', () => {
    const repositories = require('../../repositories');
    expect(repositories.materialHistorialRepository).toBeDefined();
  });

  it('should have hook available', () => {
    // Solo verificar que el archivo existe y se puede importar
    const hookModule = require('../../hooks/useMaterialHistorial');
    expect(hookModule).toBeDefined();
  });
});
