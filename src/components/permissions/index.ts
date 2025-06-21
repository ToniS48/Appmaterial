// Exportaciones de componentes de permisos
export { default as WithPermissions } from './WithPermissions';
export { default as PermissionManager } from './PermissionManager';
export { default as PermissionInfo } from './PermissionInfo';

// Exportaciones de hooks de permisos
export { usePermissions } from '../../hooks/permissions/usePermissions';

// Re-exportaciones de tipos
export * from '../../types/permissions';
export * from '../../config/permissions';
