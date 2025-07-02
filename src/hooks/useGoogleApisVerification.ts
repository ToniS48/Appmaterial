/**
 * Hook para verificación de Google APIs usando scripts Node.js
 */

import { useState, useCallback } from 'react';

export interface GoogleApisVerificationResult {
  success: boolean;
  errors: string[];
  summary: {
    backend: {
      configured: boolean;
      errors: string[];
    };
    analytics: {
      configured: boolean;
      errors: string[];
    };
    bigQuery: {
      configured: boolean;
      errors: string[];
    };
  };
  timestamp: string;
  environment: string;
}

export interface UseGoogleApisVerificationReturn {
  verification: GoogleApisVerificationResult | null;
  loading: boolean;
  error: string | null;
  verifyApis: () => Promise<void>;
  getHealthStatus: () => Promise<boolean>;
}

export function useGoogleApisVerification(): UseGoogleApisVerificationReturn {
  const [verification, setVerification] = useState<GoogleApisVerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyApis = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/verification/google-apis');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: GoogleApisVerificationResult = await response.json();
      setVerification(result);
      
    } catch (err: any) {
      console.error('Error verificando APIs de Google:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  const getHealthStatus = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3001/api/verification/health');
      return response.ok;
    } catch (err) {
      console.error('Error verificando estado del servidor:', err);
      return false;
    }
  }, []);

  return {
    verification,
    loading,
    error,
    verifyApis,
    getHealthStatus
  };
}

export default useGoogleApisVerification;
