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

// Custom hook para cargar materiales y su manejo
import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { calcularDisponibilidadReal } from './materialUtils';
import { MaterialItem, MaterialField } from '../components/material/types';

interface UseMaterialQueryResult {
  materiales: MaterialItem[];
  materialesDisponibles: MaterialItem[];
  materialesFiltrados: MaterialItem[];
  materialesPorTipo: {
    cuerda: MaterialItem[];
    anclaje: MaterialItem[];
    varios: MaterialItem[];
  };
  isLoading: boolean;
  error: string | null;
  calcularDisponibilidad: (material: MaterialItem) => number;
  recargarMateriales: () => Promise<void>;
}

/**
 * Hook para gestionar la carga y filtrado de materiales
 * @param materialesSeleccionados - Lista de materiales ya seleccionados
 * @param searchTerm - Término de búsqueda para filtrar materiales
 * @param filtroTipo - Filtro por tipo de material
 * @returns Objeto con materiales, estados y funciones auxiliares
 */
export const useMaterialQuery = (
  materialesSeleccionados: MaterialField[] = [],
  searchTerm: string = '',
  filtroTipo: string = 'todos'
): UseMaterialQueryResult => {
  const [materiales, setMateriales] = useState<MaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Función para calcular disponibilidad real (memoizada por materialId y cantidad seleccionada)
  const calcularDisponibilidad = useCallback((material: MaterialItem): number => {
    return calcularDisponibilidadReal(material, materialesSeleccionados);
  }, [materialesSeleccionados]);
  
  // Función para cargar los materiales
  const cargarMateriales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const materialesRef = collection(db, 'material_deportivo');
      const q = query(
        materialesRef,
        where('estado', '==', 'disponible')
      );
      
      const snapshot = await getDocs(q);
      const materialesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MaterialItem[];
      
      setMateriales(materialesData);
    } catch (error) {
      console.error("Error al cargar materiales:", error);
      setError("No se pudieron cargar los materiales disponibles");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Cargar materiales al montar el componente
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        await cargarMateriales();
      } catch (error) {
        if (isMounted) {
          console.error("Error en la carga inicial de materiales:", error);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [cargarMateriales]);
  
  // Filtrar materiales disponibles (memoizado)
  const materialesDisponibles = useMemo(() => {
    return materiales.filter(material => {
      // Solo filtrar si el ID está presente
      if (!material.id) return false;
      
      // NO filtrar materiales seleccionados para materiales múltiples (anclajes/varios)
      if (material.tipo === 'anclaje' || material.tipo === 'varios') {
        return true; // Siempre mostrar materiales con múltiples unidades
      }
      
      // Para materiales individuales como cuerdas, verificar que no estén ya seleccionados
      return !materialesSeleccionados.some(field => field.materialId === material.id);
    });
  }, [materiales, materialesSeleccionados]);
  
  // Filtrar por búsqueda y tipo (memoizado)
  const materialesFiltrados = useMemo(() => {
    return materialesDisponibles.filter(material => {
      // Calcular disponibilidad real
      const disponibilidadReal = calcularDisponibilidad(material);
      
      // Filtrar por búsqueda
      const matchesSearch = searchTerm.trim() === '' ||
                           material.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (material.codigo && material.codigo.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtrar por tipo
      const matchesTipo = filtroTipo === 'todos' || material.tipo === filtroTipo;
      
      return disponibilidadReal > 0 && matchesSearch && matchesTipo;
    });
  }, [materialesDisponibles, calcularDisponibilidad, searchTerm, filtroTipo]);
  
  // Separar materiales por tipo (memoizado)
  const materialesPorTipo = useMemo(() => {
    return {
      cuerda: materialesFiltrados.filter(m => m.tipo === 'cuerda'),
      anclaje: materialesFiltrados.filter(m => m.tipo === 'anclaje'),
      varios: materialesFiltrados.filter(m => m.tipo === 'varios')
    };
  }, [materialesFiltrados]);
  
  return {
    materiales,
    materialesDisponibles,
    materialesFiltrados,
    materialesPorTipo,
    isLoading,
    error,
    calcularDisponibilidad,
    recargarMateriales: cargarMateriales
  };
};

