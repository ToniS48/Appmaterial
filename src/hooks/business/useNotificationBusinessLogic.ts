/**
 * Hook de negocio para notificaciones
 * Separación completa entre UI, lógica de negocio y acceso a datos
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  NotificationConfig, 
  NotificationsBusinessLogic,
  NotificationValidationResult 
} from '../../business/notifications/NotificationsBusinessLogic';

export interface UseNotificationConfigurationState {
  config: NotificationConfig;
  updateField: (field: keyof NotificationConfig, value: any) => void;
  resetConfig: () => void;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  minutesOptions: any[];
  hoursOptions: any[];
  daysOptions: any[];
  reminderTimeOptions: any[];
  configurationSummary: string;
  configMetrics: any;
  validation: NotificationValidationResult;
  formatTime: (minutes: number) => string;
  getDefaultEmailTemplate: () => string;
  getDefaultSmsTemplate: () => string;
}

/**
 * Hook para manejo del estado y lógica de configuración de notificaciones
 */
export const useNotificationConfigurationState = (initialConfig: NotificationConfig): UseNotificationConfigurationState => {
  const [config, setConfig] = useState<NotificationConfig>(initialConfig);

  // Actualizar config cuando cambie el inicial
  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  // Validación reactiva
  const validation = useMemo(() => 
    NotificationsBusinessLogic.validateNotificationConfig(config), 
    [config]
  );

  // Opciones para dropdowns (memoizadas para performance)
  const minutesOptions = useMemo(() => 
    NotificationsBusinessLogic.getMinutesOptions(), 
    []
  );

  const hoursOptions = useMemo(() => 
    NotificationsBusinessLogic.getHoursOptions(), 
    []
  );

  const daysOptions = useMemo(() => 
    NotificationsBusinessLogic.getDaysOptions(), 
    []
  );

  const reminderTimeOptions = useMemo(() => 
    NotificationsBusinessLogic.getReminderTimeOptions(), 
    []
  );

  // Resumen de configuración
  const configurationSummary = useMemo(() => 
    NotificationsBusinessLogic.generateConfigurationSummary(config), 
    [config]
  );

  // Métricas de configuración
  const configMetrics = useMemo(() => 
    NotificationsBusinessLogic.calculateConfigMetrics(config), 
    [config]
  );

  // Manejador para actualizar campos individuales
  const updateField = useCallback((field: keyof NotificationConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Reset de configuración
  const resetConfig = useCallback(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  // Función para formatear tiempo (delegada a la lógica de negocio)
  const formatTime = useCallback((minutes: number) => 
    NotificationsBusinessLogic.formatTime(minutes), 
    []
  );

  // Función para obtener template por defecto de email
  const getDefaultEmailTemplate = useCallback(() => 
    NotificationsBusinessLogic.getDefaultEmailTemplate(), 
    []
  );

  // Función para obtener template por defecto de SMS
  const getDefaultSmsTemplate = useCallback(() => 
    NotificationsBusinessLogic.getDefaultSmsTemplate(), 
    []
  );

  return {
    config,
    updateField,
    resetConfig,
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
    minutesOptions,
    hoursOptions,
    daysOptions,
    reminderTimeOptions,
    configurationSummary,
    configMetrics,
    validation,
    formatTime,
    getDefaultEmailTemplate,
    getDefaultSmsTemplate
  };
};
