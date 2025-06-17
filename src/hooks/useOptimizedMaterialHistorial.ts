/**
 * Hook optimizado para consultas de historial de materiales
 * Implementa cache local, deduplicación y memoización
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { materialHistorialService } from '../services/domain/MaterialHistorialService';
import { EventoMaterial, TipoEventoMaterial, FiltroHistorial } from '../types/materialHistorial';
import { SimpleCache } from '../utils/performanceUtils';

interface UseOptimizedHistorialOptions {
  materialId?: string;
  tipoEvento?: TipoEventoMaterial;
  año?: number;
  limit?: number;
  enableCache?: boolean;
  cacheTime?: number;
}

interface UseOptimizedHistorialResult {
  eventos: EventoMaterial[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

// Cache global para historial
const historialCache = new SimpleCache<EventoMaterial[]>(10 * 60 * 1000); // 10 minutos

export const useOptimizedMaterialHistorial = (
  options: UseOptimizedHistorialOptions = {}
): UseOptimizedHistorialResult => {
  const [eventos, setEventos] = useState<EventoMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Referencias para evitar ejecuciones múltiples
  const currentRequestRef = useRef<Promise<EventoMaterial[]> | null>(null);
  const lastOptionsRef = useRef<string>('');

  // Generar clave de cache única basada en opciones
  const cacheKey = useMemo(() => {
    return JSON.stringify({
      materialId: options.materialId,
      tipoEvento: options.tipoEvento,
      año: options.año,
      limit: options.limit
    });
  }, [options.materialId, options.tipoEvento, options.año, options.limit]);

  // Función para cargar eventos optimizada
  const fetchEventos = useCallback(async (): Promise<EventoMaterial[]> => {
    // Verificar cache primero si está habilitado
    if (options.enableCache !== false) {
      const cached = historialCache.get(cacheKey);
      if (cached) {
        console.log('📦 Cache hit para historial de materiales');
        return cached;
      }
    }

    // Si ya hay una petición en curso, esperarla
    if (currentRequestRef.current) {
      console.log('⏳ Reutilizando petición en curso para historial');
      return await currentRequestRef.current;
    }

    // Crear nueva petición
    const requestPromise = (async () => {
      try {
        console.log('🔄 Cargando historial desde servidor');
          let result: EventoMaterial[];
        
        if (options.materialId) {
          result = await materialHistorialService.obtenerHistorial({ 
            materiales: [options.materialId] 
          });
        } else if (options.año) {
          result = await materialHistorialService.obtenerHistorial({ 
            años: [options.año] 
          });
        } else {
          result = await materialHistorialService.obtenerHistorial();
        }

        // Aplicar filtros adicionales
        if (options.tipoEvento) {
          result = result.filter(evento => evento.tipoEvento === options.tipoEvento);
        }

        if (options.limit) {
          result = result.slice(0, options.limit);
        }

        // Guardar en cache
        if (options.enableCache !== false) {
          historialCache.set(cacheKey, result);
        }

        return result;
      } finally {
        currentRequestRef.current = null;
      }
    })();

    currentRequestRef.current = requestPromise;
    return await requestPromise;
  }, [cacheKey, options.materialId, options.año, options.tipoEvento, options.limit, options.enableCache]);

  // Función de refetch
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Limpiar cache para esta consulta específica
      historialCache.clear();
      const result = await fetchEventos();
      setEventos(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar historial';
      setError(errorMessage);
      console.error('Error al cargar historial:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchEventos]);

  // Función para limpiar cache
  const clearCache = useCallback(() => {
    historialCache.clear();
    console.log('🧹 Cache de historial limpiado');
  }, []);

  // Efecto principal para cargar datos
  useEffect(() => {
    // Evitar ejecuciones innecesarias comparando opciones serializadas
    const currentOptions = JSON.stringify(options);
    if (currentOptions === lastOptionsRef.current) {
      return;
    }
    lastOptionsRef.current = currentOptions;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchEventos();
        setEventos(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar historial';
        setError(errorMessage);
        console.error('Error al cargar historial:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchEventos, cacheKey]);

  return {
    eventos,
    loading,
    error,
    refetch,
    clearCache
  };
};

export default useOptimizedMaterialHistorial;
