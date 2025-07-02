/**
 * Contexto NUEVO para las APIs de Google
 * Reemplaza GoogleApisContext.tsx usando la nueva integración con Service Account
 * 
 * @since 0.16.4
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useGoogleServices } from '../services/google';

interface NewGoogleApisContextType {
  // Estado de la configuración
  isConfigured: boolean;
  authStatus: 'loading' | 'authenticated' | 'error';
  error: string | null;
  
  // Servicios disponibles
  calendarService: any | null;
  driveService: any | null;
}

const NewGoogleApisContext = createContext<NewGoogleApisContextType | undefined>(undefined);

interface NewGoogleApisProviderProps {
  children: ReactNode;
}

export const NewGoogleApisProvider: React.FC<NewGoogleApisProviderProps> = ({ children }) => {
  const { isConfigured, authStatus, error, calendarService, driveService } = useGoogleServices();

  const value: NewGoogleApisContextType = {
    isConfigured,
    authStatus,
    error,
    calendarService,
    driveService
  };

  return (
    <NewGoogleApisContext.Provider value={value}>
      {children}
    </NewGoogleApisContext.Provider>
  );
};

export const useNewGoogleApis = (): NewGoogleApisContextType => {
  const context = useContext(NewGoogleApisContext);
  if (context === undefined) {
    throw new Error('useNewGoogleApis debe ser usado dentro de un NewGoogleApisProvider');
  }
  return context;
};

export default NewGoogleApisProvider;
