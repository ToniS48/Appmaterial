/**
 * Utilidades para manejo de ubicaciones y nombres de lugares
 */

/**
 * Trunca un texto de ubicación largo a una versión más corta y amigable
 * para mostrar en tarjetas de actividades
 * 
 * @param locationText - Texto de ubicación (puede ser largo)
 * @param maxLength - Longitud máxima permitida (default: 40 caracteres)
 * @returns Texto truncado de manera inteligente
 */
export const truncateLocationText = (locationText: string, maxLength: number = 40): string => {
  if (!locationText) return '';
  
  // Si ya es corto, devolverlo tal como está
  if (locationText.length <= maxLength) {
    return locationText;
  }

  // Separar por comas y limpiar espacios
  const parts = locationText.split(',').map(part => part.trim());
  
  // Si solo hay una parte, truncar con "..."
  if (parts.length === 1) {
    return locationText.substring(0, maxLength - 3) + '...';
  }

  // Para múltiples partes, intentar mantener las 2 más importantes
  // Generalmente las primeras 2 partes son: "Lugar, Región"
  const shortVersion = parts.slice(0, 2).join(', ');
  
  // Si la versión corta sigue siendo muy larga, truncar la segunda parte
  if (shortVersion.length > maxLength) {
    const firstPart = parts[0];
    const remainingLength = maxLength - firstPart.length - 2; // -2 para ", "
    
    if (remainingLength > 5) { // Solo si queda espacio suficiente para algo útil
      const secondPartTruncated = parts[1].substring(0, remainingLength - 3) + '...';
      return `${firstPart}, ${secondPartTruncated}`;
    } else {
      // Si no queda espacio, solo mostrar la primera parte
      return firstPart.length > maxLength ? firstPart.substring(0, maxLength - 3) + '...' : firstPart;
    }
  }

  return shortVersion;
};

/**
 * Verifica si un texto de ubicación parece ser del formato largo de Nominatim
 * y necesita ser truncado
 */
export const isLongLocationText = (locationText: string): boolean => {
  if (!locationText) return false;
  
  // Considera "largo" si tiene más de 3 partes separadas por comas
  // o si supera los 50 caracteres
  const parts = locationText.split(',');
  return parts.length > 3 || locationText.length > 50;
};

/**
 * Formatea un texto de ubicación para mostrar en tarjetas de manera consistente
 */
export const formatLocationForCard = (locationText: string): string => {
  if (!locationText) return '';
  
  // Si parece ser un texto largo, truncarlo
  if (isLongLocationText(locationText)) {
    return truncateLocationText(locationText, 35); // Un poco más restrictivo para tarjetas
  }
  
  return locationText;
};
