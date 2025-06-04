/**
 * Hook para cargar materiales con filtros y opciones específicas
 * Versión unificada para el inventario de materiales
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getMaterialStock } from './materialUtils';
import { MaterialItem, MaterialField } from '../types/material';

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

interface UseMaterialQueryOptions {
  materialesSeleccionados?: MaterialField[];
  searchTerm?: string;
  filtroTipo?: string;
  enabled?: boolean;
}

/**
 * Hook unificado para cargar materiales desde Firebase
 * @param options Opciones de configuración del hook
 * @returns Objeto con materiales, estados y funciones auxiliares
 */
export const useMaterialQuery = (options: UseMaterialQueryOptions = {}): UseMaterialQueryResult => {
  const { 
    materialesSeleccionados = [], 
    searchTerm = '', 
    filtroTipo = 'todos',
    enabled = true 
  } = options;
  
  const [materiales, setMateriales] = useState<MaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
    // Función para calcular disponibilidad real (memoizada por materialId y cantidad seleccionada)
  const calcularDisponibilidad = useCallback((material: MaterialItem): number => {
    return getMaterialStock(material);
  }, []);
  
  // Función para cargar los materiales
  const cargarMateriales = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const materialesRef = collection(db, 'material_deportivo');
      const q = query(
        materialesRef,
        where('estado', '==', 'disponible'),
        orderBy('nombre', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const materialesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MaterialItem[];
      
      setMateriales(materialesData);
    } catch (err) {
      console.error('Error cargando materiales:', err);
      setError('Error al cargar los materiales');
      setMateriales([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);
  
  // Cargar materiales al montar el componente
  useEffect(() => {
    cargarMateriales();
  }, [cargarMateriales]);
  
  // Materiales con disponibilidad > 0 (memoizado)
  const materialesDisponibles = useMemo(() => {
    return materiales.filter(material => {
      const disponibilidadReal = calcularDisponibilidad(material);
      return disponibilidadReal > 0;
    });
  }, [materiales, calcularDisponibilidad]);
  
  // Materiales filtrados por búsqueda y tipo (memoizado)
  const materialesFiltrados = useMemo(() => {
    return materialesDisponibles.filter(material => {
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

export default useMaterialQuery;
