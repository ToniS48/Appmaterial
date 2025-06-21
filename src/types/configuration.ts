export interface ConfigSettings {
  // Variables del sistema configurables
  variables: {
    // Gestión de préstamos y devoluciones
    diasGraciaDevolucion: number;
    diasMaximoRetraso: number;
    diasBloqueoPorRetraso: number;
    // Notificaciones automáticas
    recordatorioPreActividad: number;
    recordatorioDevolucion: number;
    notificacionRetrasoDevolucion: number;
    diasAntelacionRevision: number;
    
    // Gestión de material
    tiempoMinimoEntrePrestamos: number;
    porcentajeStockMinimo: number;
    diasRevisionPeriodica: number;
    
    // Gestión de actividades
    diasMinimoAntelacionCreacion: number;
    diasMaximoModificacion: number;
    limiteParticipantesPorDefecto: number;
    
    // Sistema de puntuación y reputación
    penalizacionRetraso: number;
    bonificacionDevolucionTemprana: number;
    umbraLinactividadUsuario: number;
    // Configuración de reportes
    diasHistorialReportes: number;
    limiteElementosExportacion: number;
  };
  
  // Configuración de APIs y servicios externos
  apis: {
    // URLs de Google Drive del club
    googleDriveUrl: string;
    googleDriveTopoFolder: string;
    googleDriveDocFolder: string;
    
    // Servicios meteorológicos
    weatherEnabled: boolean;
    weatherApiKey: string;
    weatherApiUrl: string;
    aemetEnabled: boolean;
    aemetApiKey: string;
    aemetUseForSpain: boolean;
    temperatureUnit: string;
    windSpeedUnit: string;
    precipitationUnit: string;
    
    // Configuración de backup
    backupApiKey: string;
    
    // Servicios de notificaciones
    emailServiceKey: string;
    smsServiceKey: string;
    notificationsEnabled: boolean;
    
    // Analytics
    analyticsKey: string;
    analyticsEnabled: boolean;
  };
  
  // Configuraciones adicionales solo para admin
  backupAutomatico?: boolean;
  frecuenciaBackup?: string;
}

export interface TabConfig {
  id: string;
  label: string;
  roles: ('admin' | 'vocal')[];
}

export interface ConfigurationProps {
  userRole: 'admin' | 'vocal';
  settings: ConfigSettings;
  isLoading: boolean;
  onSettingsChange: (settings: ConfigSettings) => void;
  onSubmit: () => void;
}

export interface SectionProps extends Omit<ConfigurationProps, 'onSubmit'> {
  handleApiChange: (apiName: string, value: string | boolean) => void;
  handleApiSwitchChange: (apiName: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleVariableChange: (variableName: string, value: number) => void;
}
