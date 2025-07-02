/**
 * ⚠️ SERVICIO DEPRECADO - STUB TEMPORAL ⚠️
 * 
 * Este servicio ha sido reemplazado por la nueva integración en src/services/google/
 * Este archivo solo existe para compatibilidad temporal con componentes que aún lo referencian.
 * 
 * @deprecated Use services from src/services/google/ instead
 * @since 0.16.4
 */

console.warn('⚠️ googleApisService está deprecado. Use servicios desde src/services/google/');

export const googleApisService = {
  // Stubs temporales para evitar errores de compilación
  createMap: async () => {
    console.warn('createMap deprecado - Google Maps temporalmente deshabilitado');
    return null;
  },
  addMarker: () => {
    console.warn('addMarker deprecado - Google Maps temporalmente deshabilitado');
    return null;
  },
  geocodeAddress: async () => {
    console.warn('geocodeAddress deprecado - Google Maps temporalmente deshabilitado');
    return null;
  }
};

export default googleApisService;
