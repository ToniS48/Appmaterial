// Utilidades para manejo de materiales
import { MaterialField, MaterialItem } from '../components/material/types';

/**
 * Normaliza un valor de cantidad a un número válido
 * @param cantidad - Cantidad a normalizar (puede ser string, number o undefined)
 * @param defaultValue - Valor por defecto si la conversión falla (por defecto: 1)
 * @returns Valor numérico normalizado
 */
export const normalizeCantidad = (cantidad: any, defaultValue: number = 1): number => {
  if (typeof cantidad === 'number') return Math.max(0, cantidad);
  if (typeof cantidad === 'string') {
    const parsed = parseInt(cantidad, 10);
    return isNaN(parsed) ? defaultValue : Math.max(0, parsed);
  }
  return defaultValue;
};

/**
 * Valida si un objeto es un material válido con propiedades requeridas
 * @param material - Objeto material a validar
 * @returns Boolean indicando si el material es válido
 */
export const isMaterialValido = (material: any): boolean => {
  return material && typeof material === 'object' && 
         typeof material.id === 'string' && 
         typeof material.nombre === 'string';
};

/**
 * Normaliza un material para tener una estructura consistente
 * @param material - Material a normalizar
 * @returns Material normalizado con ID, materialId, nombre y cantidad
 */
export const normalizarMaterial = (material: any): MaterialField => {
  if (!material) {
    return {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      materialId: '',
      nombre: 'Material sin nombre',
      cantidad: 1
    };
  }
  
  return {
    id: material.id || material.materialId || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    materialId: material.materialId || '',
    nombre: material.nombre || 'Material sin nombre',
    cantidad: normalizeCantidad(material.cantidad)
  };
};

/**
 * Genera un ID único basado en patrón temporal
 * @returns ID único basado en timestamp y cadena aleatoria
 */
export const generateUniqueId = (): string => {
  return `material-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Calcula la disponibilidad real de un material teniendo en cuenta los ya seleccionados
 * @param material - Material a evaluar
 * @param materialesSeleccionados - Lista de materiales ya seleccionados
 * @returns Número de unidades disponibles
 */
export const calcularDisponibilidadReal = (material: MaterialItem, materialesSeleccionados: MaterialField[]): number => {
  if (!material || !material.id) return 0;
  
  // Obtener cuántas unidades ya están seleccionadas
  const seleccionadasActualmente = materialesSeleccionados
    .filter(field => field.materialId === material.id)
    .reduce((total, field) => total + normalizeCantidad(field.cantidad), 0);
  
  // Para cuerdas individuales o materiales sin cantidadDisponible
  if (material.tipo === 'cuerda' && (!material.cantidadDisponible && material.cantidadDisponible !== 0)) {
    return seleccionadasActualmente > 0 ? 0 : 1;
  }
  
  // Para otros tipos de material con cantidad
  return Math.max(0, (material.cantidadDisponible || 0) - seleccionadasActualmente);
};

// Constantes para mensajes de error
export const ERROR_MESSAGES = {
  NO_SELECTION: 'Debe seleccionar un material',
  NOT_FOUND: 'El material seleccionado no existe',
  INVALID_QUANTITY: 'La cantidad debe ser mayor que cero',
  INSUFFICIENT: 'No hay suficientes unidades disponibles'
};
