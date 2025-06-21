/**
 * Índice de componentes del Dashboard de Usuarios
 * Exporta todos los módulos del dashboard para facilitar las importaciones
 */

// Componentes principales
export { default as EstadisticasPrincipales } from './EstadisticasPrincipales';
export { default as EventosTab } from './EventosTab';
export { default as UsuariosProblematicosTab } from './UsuariosProblematicosTab';
export { default as ComparacionAñosTab } from './ComparacionAñosTab';
export { default as ReportesTab } from './ReportesTab';
export { default as HerramientasAdminTab } from './HerramientasAdminTab';

// Hooks y utilidades
export { default as useDashboard } from './useDashboard';

// Tipos e interfaces
export * from './types';
