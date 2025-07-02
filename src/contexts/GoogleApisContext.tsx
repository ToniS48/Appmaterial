/**
 * ⚠️ CONTEXTO DEPRECADO - NO USAR ⚠️
 * 
 * Este contexto ha sido reemplazado por:
 * - useGoogleServices() hook directo desde src/services/google/
 * - NewGoogleApisContext para casos más complejos
 * 
 * La nueva integración utiliza Service Account y es más segura.
 * 
 * @deprecated Use useGoogleServices() or NewGoogleApisContext instead
 * @since 0.16.4
 */

import React, { createContext, useContext, ReactNode } from 'react';

// Interfaz simplificada para compatibilidad
interface GoogleApisContextType {
  config: any | null;
  loading: boolean;
  error: string | null;
  apisStatus: any;
  refreshConfig: () => Promise<void>;
  updateConfig: (updates: any) => Promise<void>;
  mapsService: any;
  calendarService: any;
  driveService: any;
}

const GoogleApisContext = createContext<GoogleApisContextType | undefined>(undefined);

export const GoogleApisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.warn('⚠️ GoogleApisProvider está deprecado. Use useGoogleServices() directamente.');
  
  // Valores por defecto para compatibilidad
  const value: GoogleApisContextType = {
    config: null,
    loading: false,
    error: 'Contexto deprecado - migre a useGoogleServices()',
    apisStatus: {},
    refreshConfig: async () => {},
    updateConfig: async () => {},
    mapsService: {},
    calendarService: {},
    driveService: {}
  };

  return (
    <GoogleApisContext.Provider value={value}>
      {children}
    </GoogleApisContext.Provider>
  );
};

export const useGoogleApis = (): GoogleApisContextType => {
  console.warn('⚠️ useGoogleApis está deprecado. Use useGoogleServices() directamente.');
  const context = useContext(GoogleApisContext);
  if (context === undefined) {
    throw new Error('useGoogleApis debe ser usado dentro de un GoogleApisProvider');
  }
  return context;
};

// Exports adicionales para compatibilidad con componentes que aún los usan
export const useGoogleApisContext = useGoogleApis;
export const useGoogleApiStatus = () => {
  console.warn('⚠️ useGoogleApiStatus está deprecado. Use useGoogleServices() directamente.');
  return {};
};

export default GoogleApisProvider;
