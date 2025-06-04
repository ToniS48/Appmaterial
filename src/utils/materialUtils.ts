// Utilidades básicas para materiales

interface Material {
  id: string;
  nombre: string;
  cantidad?: number;
  cantidadDisponible?: number;
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
 */
export const getMaterialStock = (material: Material): number => {
  if (!material) {
    return 0;
  }
  
  if (typeof material.cantidadDisponible === 'number') {
    return material.cantidadDisponible;
  }
  
  if (typeof material.cantidad === 'number') {
    return material.cantidad;
  }
  
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
export const calculateRemainingStock = (material: Material, operationQuantity: number): number => {
  if (!material || !material.id) return 0;
  
  const currentStock = getMaterialStock(material);
  const remaining = currentStock - operationQuantity;
  
  return Math.max(0, remaining); // No permitir stock negativo
};

/**
 * Formatea información de stock para mostrar
 */
export const formatStockInfo = (material: Material): string => {
  const stock = getMaterialStock(material);
  return `Stock disponible: ${stock}`;
};
