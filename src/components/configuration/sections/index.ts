// Exportaciones de componentes de sección

// Secciones de APIs y servicios externos
export { default as WeatherServicesSection } from './API/WeatherServicesSection';
export { default as NotificationServicesSection } from './API/NotificationServicesSection';
export { default as BackupAnalyticsSection } from './Backups/BackupAnalyticsSection';
export { default as GoogleDriveSection } from './Variables/GoogleDriveSection';

// Secciones de variables del sistema
export { default as LoanManagementSection } from './Variables/LoanManagementSection';
export { default as NotificationSection } from './Variables/NotificationSection';
export { default as MaterialManagementSection } from './Material/MaterialManagementSection';
export { default as ActivityManagementSection } from './Variables/ActivityManagementSection';
export { default as ReputationSystemSection } from './Variables/ReputationSystemSection';
export { default as ReportsSection } from './Variables/ReportsSection';

// Secciones de seguridad y permisos
export { default as PermissionsSection } from './Permisos/PermissionsSection';
export type { PermissionsSectionProps } from './Permisos/PermissionsSection';
export { default as VocalPermissionsTab } from './Permisos/VocalPermissionsTab';
export { default as UserPermissionsTab } from './Permisos/UserPermissionsTab';
