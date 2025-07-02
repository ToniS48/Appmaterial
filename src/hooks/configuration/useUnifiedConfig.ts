/**
 * Hook unificado optimizado para gestión de configuración
 * Versión simplificada con máxima eficiencia y uso correcto de FirestoreConverters
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useToast } from '@chakra-ui/react';
import { 
  weatherConfigConverter, 
  materialConfigConverter,
  systemConfigConverter,
  safeFirestoreUpdate 
} from '../../services/firestore/FirestoreConverters';

// Tipos simplificados para configuración
export interface ConfigHookResult<T> {
  data: T;
  setData: (data: T | ((prev: T) => T)) => void;
  loading: boolean;
  saving: boolean;
  error: string | null;
  save: (newData?: Partial<T>) => Promise<boolean>;
  reload: () => Promise<void>;
}

/**
 * Hook genérico simplificado para configuración
 */
const useConfigGeneric = <T>(
  documentId: string,
  defaultConfig: T,
  converter?: any
): ConfigHookResult<T> => {
  const [data, setData] = useState<T>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  // Usar ref para mantener datos actuales sin causar re-renders
  const currentDataRef = useRef<T>(defaultConfig);
  
  // Actualizar ref cuando data cambia
  useEffect(() => {
    currentDataRef.current = data;
  }, [data]);

  // Función de carga
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const docRef = doc(db, 'configuracion', documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setData({ ...defaultConfig, ...docSnap.data() } as T);
      } else {
        // Crear documento con valores por defecto
        await setDoc(docRef, defaultConfig as any, { merge: true });
        setData(defaultConfig);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error(`Error loading config ${documentId}:`, err);
      toast({
        title: 'Error al cargar configuración',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [documentId, toast]);

  // Función de guardado
  const saveConfig = useCallback(async (newData?: Partial<T>): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);
      
      const currentData = newData ? { ...currentDataRef.current, ...newData } : currentDataRef.current;
      const docRef = doc(db, 'configuracion', documentId);
      
      await setDoc(docRef, currentData as any, { merge: true });
      
      // Solo actualizar si es diferente
      if (newData) {
        setData(currentData);
      }
      
      toast({
        title: 'Configuración guardada',
        status: 'success',
        duration: 2000,
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar';
      setError(errorMessage);
      console.error(`Error saving config ${documentId}:`, err);
      toast({
        title: 'Error al guardar',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [documentId, toast]);

  // Cargar al inicializar
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    data,
    setData,
    loading,
    saving,
    error,
    save: saveConfig,
    reload: loadConfig
  };
};

// Hooks específicos optimizados usando la función genérica con converters
export const useWeatherConfig = () => {
  const result = useConfigGeneric('weather', {
    weatherEnabled: false,
    aemetEnabled: false,
    aemetUseForSpain: false,
    temperatureUnit: 'celsius' as const,
    windSpeedUnit: 'kmh' as const,
    precipitationUnit: 'mm' as const
  });
  
  // Sobrescribir la función save para usar el converter de Firestore
  const originalSave = result.save;
  const saveWithConverter = useCallback(async (newData?: Partial<any>): Promise<boolean> => {
    try {
      const { WeatherConfigService } = await import('../../services/configuracionService');
      const currentData = newData ? { ...result.data, ...newData } : result.data;
      await WeatherConfigService.save(currentData);
      
      if (newData) {
        result.setData(currentData);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving weather config:', error);
      return originalSave(newData);
    }
  }, [result.data, result.setData, originalSave]);
  
  return {
    ...result,
    save: saveWithConverter
  };
};

export const useMaterialConfig = () => useConfigGeneric('material', {
  porcentajeStockMinimo: 10,
  diasRevisionPeriodica: 90,
  tiempoMinimoEntrePrestamos: 0
});

export const useVariablesConfig = () => useConfigGeneric('variables', {
  // Gestión de préstamos
  diasGraciaDevolucion: 3,
  diasMaximoRetraso: 15,
  diasBloqueoPorRetraso: 30,
  tiempoMinimoEntrePrestamos: 0,
  
  // Notificaciones
  recordatorioPreActividad: 1,
  recordatorioDevolucion: 1,
  notificacionRetrasoDevolucion: 0,
  
  // Gestión de actividades
  diasAntelacionRevision: 15,
  diasMinimoAntelacionCreacion: 0,
  diasMaximoModificacion: 0,
  limiteParticipantesPorDefecto: 0,
  
  // Material
  porcentajeStockMinimo: 10,
  diasRevisionPeriodica: 90,
  
  // Sistema de reputación
  penalizacionRetraso: 0,
  bonificacionDevolucionTemprana: 0,
  umbraLinactividadUsuario: 0,
  
  // Reportes
  diasHistorialReportes: 90,
  limiteElementosExportacion: 1000
});

export const useApisConfig = () => useConfigGeneric('apis', {
  // Google APIs
  driveApiKey: '',
  mapsEmbedApiKey: '',
  calendarApiKey: '',
  gmailApiKey: '',
  chatApiKey: '',
  cloudMessagingApiKey: '',
  
  // Weather APIs
  weatherApiUrl: 'https://api.open-meteo.com/v1/forecast',
  aemetApiKey: ''
});

export const usePermissionsConfig = () => useConfigGeneric('permissions', {
  admin: {
    variables: { full: true },
    apis: { full: true },
    material: { full: true },
    security: true,
    dropdowns: true,
    systemViewer: true
  },
  vocal: {
    variables: { limited: true },
    apis: { read: true },
    material: { limited: true },
    security: false,
    dropdowns: true,
    systemViewer: true
  }
});

export const useDropdownsConfig = () => useConfigGeneric('dropdowns', {
  tipoActividad: [],
  dificultad: [],
  modalidad: [],
  temporada: []
});

export const useSecurityConfig = () => useConfigGeneric('security', {
  sessionTimeout: 3600,
  maxLoginAttempts: 5,
  passwordMinLength: 8,
  enableTwoFactor: false
});

// Exportar también la función genérica para casos especiales
export const useConfig = useConfigGeneric;

// Hook unificado que combina múltiples configuraciones
export const useUnifiedConfig = () => {
  const weather = useWeatherConfig();
  const material = useMaterialConfig();
  const apis = useApisConfig();
  const variables = useVariablesConfig();
  const permissions = usePermissionsConfig();
  
  return {
    weather,
    material,
    apis,
    variables,
    permissions,
    // Estado general
    loading: weather.loading || material.loading || apis.loading,
    saving: weather.saving || material.saving || apis.saving,
    error: weather.error || material.error || apis.error
  };
};

// Export default for backward compatibility
export default useUnifiedConfig;
