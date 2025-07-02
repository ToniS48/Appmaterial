/**
 * Hook para usar servicios avanzados de Google APIs
 * Incluye Analytics, BigQuery, Pub/Sub y Extensions
 */

import { useState, useEffect, useCallback } from 'react';
import GoogleAnalyticsService, { AnalyticsEvent, AnalyticsPageView, AnalyticsMetrics } from '../services/google/GoogleAnalyticsService';
import BigQueryService, { BigQueryQuery, BigQueryJobResult, BigQueryDataset } from '../services/google/BigQueryService';

export interface AdvancedGoogleServicesStatus {
  analytics: {
    enabled: boolean;
    configured: boolean;
    error?: string;
  };
  bigQuery: {
    enabled: boolean;
    configured: boolean;
    error?: string;
  };
  pubSub: {
    enabled: boolean;
    configured: boolean;
    error?: string;
  };
  extensions: {
    enabled: boolean;
    configured: boolean;
    error?: string;
  };
}

export const useAdvancedGoogleServices = () => {
  const [status, setStatus] = useState<AdvancedGoogleServicesStatus>({
    analytics: { enabled: false, configured: false },
    bigQuery: { enabled: false, configured: false },
    pubSub: { enabled: false, configured: false },
    extensions: { enabled: false, configured: false }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Instancias de servicios
  const analyticsService = GoogleAnalyticsService.getInstance();
  const bigQueryService = BigQueryService.getInstance();

  /**
   * Inicializar todos los servicios
   */
  const initializeServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Inicializar Analytics
      await analyticsService.initialize();
      
      // Obtener estado de todos los servicios
      const analyticsStatus = analyticsService.getStatus();
      const bigQueryStatus = bigQueryService.getStatus();

      setStatus({
        analytics: analyticsStatus,
        bigQuery: bigQueryStatus,
        pubSub: { enabled: false, configured: false, error: 'No implementado aún' },
        extensions: { enabled: false, configured: false, error: 'No implementado aún' }
      });

      console.log('Servicios avanzados de Google inicializados');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error inicializando servicios';
      setError(errorMessage);
      console.error('Error inicializando servicios avanzados:', err);
    } finally {
      setLoading(false);
    }
  }, [analyticsService, bigQueryService]);

  // Inicializar al montar el componente
  useEffect(() => {
    initializeServices();
  }, [initializeServices]);

  /**
   * Métodos de Analytics
   */
  const trackEvent = useCallback((event: AnalyticsEvent) => {
    try {
      analyticsService.trackEvent(event);
    } catch (err) {
      console.error('Error enviando evento:', err);
    }
  }, [analyticsService]);

  const trackPageView = useCallback((pageView: AnalyticsPageView) => {
    try {
      analyticsService.trackPageView(pageView);
    } catch (err) {
      console.error('Error enviando vista de página:', err);
    }
  }, [analyticsService]);

  const getAnalyticsMetrics = useCallback(async (startDate: string, endDate: string): Promise<AnalyticsMetrics | null> => {
    try {
      return await analyticsService.getBasicMetrics(startDate, endDate);
    } catch (err) {
      console.error('Error obteniendo métricas:', err);
      return null;
    }
  }, [analyticsService]);

  /**
   * Métodos de BigQuery
   */
  const runBigQueryQuery = useCallback(async (query: BigQueryQuery): Promise<BigQueryJobResult | null> => {
    try {
      setLoading(true);
      return await bigQueryService.runQuery(query);
    } catch (err) {
      console.error('Error ejecutando consulta BigQuery:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [bigQueryService]);

  const getBigQueryDatasets = useCallback(async (): Promise<BigQueryDataset[]> => {
    try {
      return await bigQueryService.listDatasets();
    } catch (err) {
      console.error('Error obteniendo datasets:', err);
      return [];
    }
  }, [bigQueryService]);

  const createMaterialsAnalytics = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      return await bigQueryService.createMaterialsTable();
    } catch (err) {
      console.error('Error creando tabla de materiales:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [bigQueryService]);

  const insertMaterialsData = useCallback(async (materials: any[]): Promise<boolean> => {
    try {
      setLoading(true);
      return await bigQueryService.insertMaterialsData(materials);
    } catch (err) {
      console.error('Error insertando datos de materiales:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [bigQueryService]);

  const getMaterialsAnalytics = useCallback(async (startDate: string, endDate: string): Promise<any> => {
    try {
      setLoading(true);
      return await bigQueryService.getMaterialsAnalytics(startDate, endDate);
    } catch (err) {
      console.error('Error obteniendo analytics de materiales:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [bigQueryService]);

  /**
   * Métodos utilitarios
   */
  const refreshStatus = useCallback(async () => {
    await initializeServices();
  }, [initializeServices]);

  const trackMaterialEvent = useCallback((action: string, materialId?: string, category?: string) => {
    trackEvent({
      eventName: 'material_action',
      eventParams: {
        action,
        material_id: materialId,
        category,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackEvent]);

  const trackUserActivity = useCallback((activity: string, details?: any) => {
    trackEvent({
      eventName: 'user_activity',
      eventParams: {
        activity,
        details: details ? JSON.stringify(details) : undefined,
        timestamp: new Date().toISOString()
      }
    });
  }, [trackEvent]);

  return {
    // Estado
    status,
    loading,
    error,
    
    // Métodos de inicialización
    initializeServices,
    refreshStatus,
    
    // Analytics
    trackEvent,
    trackPageView,
    trackMaterialEvent,
    trackUserActivity,
    getAnalyticsMetrics,
    
    // BigQuery
    runBigQueryQuery,
    getBigQueryDatasets,
    createMaterialsAnalytics,
    insertMaterialsData,
    getMaterialsAnalytics,
    
    // Estado de servicios individuales
    isAnalyticsReady: status.analytics.enabled && status.analytics.configured,
    isBigQueryReady: status.bigQuery.enabled && status.bigQuery.configured,
    
    // Métodos de diagnóstico
    getDetailedStatus: () => status
  };
};

export default useAdvancedGoogleServices;
