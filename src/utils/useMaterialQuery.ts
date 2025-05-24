/**
 * Hook para cargar materiales con filtros y opciones específicas
 * Versión simplificada para el inventario de materiales
 */
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Material } from '../types/material';

interface UseMaterialQueryResult {
  data: Material[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseMaterialQueryOptions {
  enabled?: boolean;
  filters?: {
    estado?: string;
    tipo?: string;
  };
}

/**
 * Hook para cargar materiales desde Firebase
 */
export const useMaterialQuery = (options: UseMaterialQueryOptions = {}): UseMaterialQueryResult => {
  const { enabled = true, filters = {} } = options;
  
  const [data, setData] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMateriales = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // Crear query base con ordenamiento
      let materialesQuery = query(
        collection(db, 'material_deportivo'),
        orderBy('nombre', 'asc')
      );

      const snapshot = await getDocs(materialesQuery);
      
      let materialesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Material[];

      // Aplicar filtros en cliente si están definidos
      if (filters.estado) {
        materialesData = materialesData.filter(material => material.estado === filters.estado);
      }

      if (filters.tipo) {
        materialesData = materialesData.filter(material => material.tipo === filters.tipo);
      }

      setData(materialesData);
    } catch (err) {
      console.error('Error al cargar materiales:', err);
      setError('Error al cargar los materiales');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, filters.estado, filters.tipo]);

  useEffect(() => {
    fetchMateriales();
  }, [fetchMateriales]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchMateriales
  };
};

export default useMaterialQuery;
