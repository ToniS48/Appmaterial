// Tipos para el sistema de permisos de configuración

export type PermissionLevel = 'none' | 'read' | 'edit' | 'full';

export interface ConfigurationPermissions {
  // Permisos para variables del sistema
  variables: {
    loanManagement: PermissionLevel;
    notifications: PermissionLevel;
    materialManagement: PermissionLevel;
    activityManagement: PermissionLevel;
    reputationSystem: PermissionLevel;
    reports: PermissionLevel;
  };
  
  // Permisos para APIs y servicios
  apis: {
    googleDrive: PermissionLevel;
    weatherServices: PermissionLevel;
    notificationServices: PermissionLevel;
    backupAnalytics: PermissionLevel;
  };
  
  // Permisos para otras pestañas
  material: {
    stockConfiguration: PermissionLevel;
    maintenanceSettings: PermissionLevel;
  };
  
  security: PermissionLevel;
  dropdowns: PermissionLevel;
  systemViewer: PermissionLevel;
}

export interface UserRolePermissions {
  admin: ConfigurationPermissions;
  vocal: ConfigurationPermissions;
  usuario?: ConfigurationPermissions;
}

export interface PermissionContext {
  userRole: 'admin' | 'vocal' | 'usuario';
  permissions: ConfigurationPermissions;
  hasPermission: (section: string, subsection?: string, level?: PermissionLevel) => boolean;
  canEdit: (section: string, subsection?: string) => boolean;
  canRead: (section: string, subsection?: string) => boolean;
}
