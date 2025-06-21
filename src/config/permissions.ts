import { UserRolePermissions, ConfigurationPermissions } from '../types/permissions';

/**
 * Configuración de permisos por defecto para cada rol
 */
export const DEFAULT_PERMISSIONS: UserRolePermissions = {
  admin: {
    // Los administradores tienen acceso completo a todo
    variables: {
      loanManagement: 'full',
      notifications: 'full',
      materialManagement: 'full',
      activityManagement: 'full',
      reputationSystem: 'full',
      reports: 'full',
    },
    apis: {
      googleDrive: 'full',
      weatherServices: 'full',
      notificationServices: 'full',
      backupAnalytics: 'full',
    },
    material: {
      stockConfiguration: 'full',
      maintenanceSettings: 'full',
    },
    security: 'full',
    dropdowns: 'full',
    systemViewer: 'full',
  },
  
  vocal: {
    // Los vocales tienen permisos limitados pero significativos
    variables: {
      loanManagement: 'edit',     // Pueden editar gestión de préstamos
      notifications: 'edit',      // Pueden editar notificaciones
      materialManagement: 'edit', // Pueden editar gestión de material
      activityManagement: 'edit', // Pueden editar gestión de actividades
      reputationSystem: 'read',   // Solo lectura del sistema de reputación
      reports: 'read',            // Solo lectura de reportes
    },
    apis: {
      googleDrive: 'edit',        // Pueden editar URLs de Google Drive
      weatherServices: 'read',    // Solo lectura de servicios meteorológicos
      notificationServices: 'none', // Sin acceso a servicios de notificación
      backupAnalytics: 'none',    // Sin acceso a backup y analytics
    },
    material: {
      stockConfiguration: 'edit', // Pueden editar configuración de stock
      maintenanceSettings: 'read', // Solo lectura de configuración de mantenimiento
    },
    security: 'none',             // Sin acceso a seguridad
    dropdowns: 'none',           // Sin acceso a formularios
    systemViewer: 'none',        // Sin acceso al visor del sistema
  },
  
  usuario: {
    // Los usuarios normales no tienen acceso a configuración
    variables: {
      loanManagement: 'none',
      notifications: 'none',
      materialManagement: 'none',
      activityManagement: 'none',
      reputationSystem: 'none',
      reports: 'none',
    },
    apis: {
      googleDrive: 'none',
      weatherServices: 'none',
      notificationServices: 'none',
      backupAnalytics: 'none',
    },
    material: {
      stockConfiguration: 'none',
      maintenanceSettings: 'none',
    },
    security: 'none',
    dropdowns: 'none',
    systemViewer: 'none',
  }
};

/**
 * Configuración personalizable de permisos para vocales
 * Permite a los administradores ajustar qué pueden hacer los vocales
 */
export const CUSTOMIZABLE_VOCAL_PERMISSIONS: Partial<ConfigurationPermissions> = {
  variables: {
    loanManagement: 'edit',
    notifications: 'edit',
    materialManagement: 'edit',
    activityManagement: 'edit',
    reputationSystem: 'read',
    reports: 'read',
  },
  apis: {
    googleDrive: 'edit',
    weatherServices: 'read',
    notificationServices: 'none',
    backupAnalytics: 'none',
  },
  material: {
    stockConfiguration: 'edit',
    maintenanceSettings: 'read',
  },
};
