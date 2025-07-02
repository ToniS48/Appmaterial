/**
 * Hook personalizado para gestionar las APIs de Google
 * Proporciona acceso centralizado a configuraciones y funciones de las APIs de Google
 */

import { useState, useEffect, useCallback } from 'react';
import { GoogleApisConfigService, GoogleApisConfig } from '../services/configuracionService';

export interface UseGoogleApisReturn {
  config: GoogleApisConfig | null;
  loading: boolean;
  error: string | null;
  
  // Estados de las APIs
  isMapEnabled: boolean;
  isCalendarEnabled: boolean;
  isDriveEnabled: boolean;
  isGmailEnabled: boolean;
  isChatEnabled: boolean;
  isMessagingEnabled: boolean;
  
  // Funciones de utilidad
  getApiKey: (apiType: keyof GoogleApisConfig) => string;
  isApiConfigured: (apiType: keyof GoogleApisConfig) => boolean;
  refreshConfig: () => Promise<void>;
  updateConfig: (updates: Partial<GoogleApisConfig>) => Promise<void>;
  
  // Configuraciones específicas
  mapsConfig: {
    apiKey: string;
    embedApiKey: string;
    geocodingApiKey: string;
    defaultZoom: number;
    defaultLatitude: number;
    defaultLongitude: number;
    enabled: boolean;
  };
  
  calendarConfig: {
    apiKey: string;
    enabled: boolean;
  };
  
  driveConfig: {
    apiKey: string;
    enabled: boolean;
  };
}

const defaultConfig: GoogleApisConfig = {
  // API Keys
  mapsJavaScriptApiKey: '',
  mapsEmbedApiKey: '',
  geocodingApiKey: '',
  driveApiKey: '',
  calendarApiKey: '',
  gmailApiKey: '',
  chatApiKey: '',
  cloudMessagingApiKey: '',
  
  // Nuevas APIs avanzadas
  analyticsApiKey: '',
  bigQueryApiKey: '',
  pubSubApiKey: '',
  extensionsApiKey: '',
  
  // Configuraciones por defecto
  mapsDefaultZoom: 10,
  mapsDefaultLatitude: 40.4168, // Madrid
  mapsDefaultLongitude: -3.7038, // Madrid
  
  // Estados de habilitación
  mapsEnabled: false,
  driveEnabled: false,
  calendarEnabled: false,
  gmailEnabled: false,
  chatEnabled: false,
  cloudMessagingEnabled: false,
  analyticsEnabled: false,
  bigQueryEnabled: false,
  pubSubEnabled: false,
  extensionsEnabled: false,
};

export const useGoogleApis = (): UseGoogleApisReturn => {
  const [config, setConfig] = useState<GoogleApisConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar configuración inicial
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const googleConfig = await GoogleApisConfigService.get();
      setConfig(googleConfig);
    } catch (err) {
      console.error('Error cargando configuración de Google APIs:', err);
      setError('Error al cargar la configuración');
      // Usar configuración por defecto en caso de error
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto inicial
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Función para actualizar configuración
  const updateConfig = useCallback(async (updates: Partial<GoogleApisConfig>) => {
    if (!config) return;
    
    try {
      setError(null);
      const updatedConfig = { ...config, ...updates };
      await GoogleApisConfigService.save(updatedConfig);
      setConfig(updatedConfig);
    } catch (err) {
      console.error('Error actualizando configuración:', err);
      setError('Error al actualizar la configuración');
      throw err;
    }
  }, [config]);

  // Función para refrescar configuración
  const refreshConfig = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  // Función para obtener una API key específica
  const getApiKey = useCallback((apiType: keyof GoogleApisConfig): string => {
    if (!config) return '';
    return (config[apiType] as string) || '';
  }, [config]);

  // Función para verificar si una API está configurada
  const isApiConfigured = useCallback((apiType: keyof GoogleApisConfig): boolean => {
    const apiKey = getApiKey(apiType);
    return apiKey.length > 0;
  }, [getApiKey]);

  // Estados derivados
  const isMapEnabled = config?.mapsEnabled && (
    isApiConfigured('mapsJavaScriptApiKey') || isApiConfigured('mapsEmbedApiKey')
  ) || false;
  
  const isCalendarEnabled = config?.calendarEnabled && isApiConfigured('calendarApiKey') || false;
  const isDriveEnabled = config?.driveEnabled && isApiConfigured('driveApiKey') || false;
  const isGmailEnabled = config?.gmailEnabled && isApiConfigured('gmailApiKey') || false;
  const isChatEnabled = config?.chatEnabled && isApiConfigured('chatApiKey') || false;
  const isMessagingEnabled = config?.cloudMessagingEnabled && isApiConfigured('cloudMessagingApiKey') || false;

  // Configuraciones específicas
  const mapsConfig = {
    apiKey: getApiKey('mapsJavaScriptApiKey'),
    embedApiKey: getApiKey('mapsEmbedApiKey'),
    geocodingApiKey: getApiKey('geocodingApiKey'),
    defaultZoom: config?.mapsDefaultZoom || 10,
    defaultLatitude: config?.mapsDefaultLatitude || 40.4168,
    defaultLongitude: config?.mapsDefaultLongitude || -3.7038,
    enabled: isMapEnabled,
  };

  const calendarConfig = {
    apiKey: getApiKey('calendarApiKey'),
    enabled: isCalendarEnabled,
  };

  const driveConfig = {
    apiKey: getApiKey('driveApiKey'),
    enabled: isDriveEnabled,
  };

  return {
    config,
    loading,
    error,
    
    // Estados de las APIs
    isMapEnabled,
    isCalendarEnabled,
    isDriveEnabled,
    isGmailEnabled,
    isChatEnabled,
    isMessagingEnabled,
    
    // Funciones de utilidad
    getApiKey,
    isApiConfigured,
    refreshConfig,
    updateConfig,
    
    // Configuraciones específicas
    mapsConfig,
    calendarConfig,
    driveConfig,
  };
};

export default useGoogleApis;
