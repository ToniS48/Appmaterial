/**
 * Índice de componentes de estadísticas de actividades
 * 
 * Exporta todos los componentes relacionados con estadísticas de actividades
 * para facilitar su importación en otras partes de la aplicación.
 */

// Componente principal con estadísticas detalladas
export { default as EstadisticasAnualesActividades } from './EstadisticasAnualesActividades';

// Componente card compacto para dashboards
export { default as EstadisticasActividadesCard } from './EstadisticasActividadesCard';

// Ejemplo de uso (para desarrollo/documentación)
export { default as EjemploUsoEstadisticasCard } from './EjemploUsoEstadisticasCard';

/**
 * Guía de uso rápido:
 * 
 * // Para dashboard principal - card compacta
 * import { EstadisticasActividadesCard } from '../components/actividades/estadisticas';
 * <EstadisticasActividadesCard añoSeleccionado={2024} compacto={false} />
 * 
 * // Para página de estadísticas completa
 * import { EstadisticasAnualesActividades } from '../components/actividades/estadisticas';
 * <EstadisticasAnualesActividades añoSeleccionado={2024} />
 * 
 * // Para versión compacta en sidebar
 * import { EstadisticasActividadesCard } from '../components/actividades/estadisticas';
 * <EstadisticasActividadesCard añoSeleccionado={2024} compacto={true} />
 */
