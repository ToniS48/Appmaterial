// Utilidades básicas para materiales

import { Material } from '../types/material';

// Interfaz mínima para calcular stock
interface MaterialStockInfo {
  estado?: string;
  tipo?: 'cuerda' | 'anclaje' | 'varios';
  cantidadDisponible?: number;
  cantidad?: number;
}

/**
 * Valida si un material tiene estructura válida
 */
export const isValidMaterial = (material: any): material is Material => {
  return material && 
         material.id && 
         typeof material.id === 'string' &&
         material.nombre && 
         typeof material.nombre === 'string';
};

/**
 * Obtiene el stock disponible de un material
 * Funciona tanto con Material completo como con MaterialItem
 */
export const getMaterialStock = (material: MaterialStockInfo): number => {
  if (!material) {
    return 0;
  }
  
  // Para cuerdas (materiales únicos): solo considerarlos disponibles si el estado es 'disponible'
  if (material.tipo === 'cuerda') {
    return material.estado === 'disponible' ? 1 : 0;
  }
  
  // Para materiales con cantidadDisponible definida, usarla directamente
  if (typeof material.cantidadDisponible === 'number') {
    return material.cantidadDisponible;
  }
  
  // Para materiales con cantidad total (pero sin cantidadDisponible específica)
  if (typeof material.cantidad === 'number') {
    return material.cantidad;
  }
  
  // Para materiales únicos (no cuerdas) que no tienen cantidad numérica:
  // Solo considerarlos disponibles si el estado es 'disponible'
  if (material.estado === 'disponible') {
    return 1;
  }
  
  // En cualquier otro caso, no hay stock disponible
  return 0;
};

/**
 * Genera un ID único para un material
 */
export const generateMaterialId = (): string => {
  return `material-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Calcula el stock restante después de una operación
 */
export const calculateRemainingStock = (material: MaterialStockInfo, operationQuantity: number): number => {
  if (!material) return 0;
  
  const currentStock = getMaterialStock(material);
  const remaining = currentStock - operationQuantity;
  
  return Math.max(0, remaining); // No permitir stock negativo
};

/**
 * Formatea información de stock para mostrar
 */
export const formatStockInfo = (material: MaterialStockInfo): string => {
  const stock = getMaterialStock(material);
  return `Stock disponible: ${stock}`;
};
