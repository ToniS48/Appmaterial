/**
 * Hook de negocio para gestión de actividades
 * Separación completa entre UI, lógica de negocio y acceso a datos
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ActivityConfig, 
  ActivitiesBusinessLogic,
  ActivityValidationResult 
} from '../../business/activities/ActivitiesBusinessLogic';

export interface UseActivityConfigurationState {
  config: ActivityConfig;
  updateField: (field: keyof ActivityConfig, value: any) => void;
  resetConfig: () => void;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  advanceCreationOptions: any[];
  modificationLimitOptions: any[];
  participantsLimitOptions: any[];
  minTimeOptions: any[];
  maxTimeOptions: any[];
  configurationSummary: string;
  configMetrics: any;
  validation: ActivityValidationResult;
  formatDuration: (minutes: number) => string;
  isValidDuration: (minutes: number) => boolean;
}

/**
 * Hook para manejo del estado y lógica de configuración de actividades
 */
export const useActivityConfigurationState = (initialConfig: ActivityConfig): UseActivityConfigurationState => {
  const [config, setConfig] = useState<ActivityConfig>(initialConfig);

  // Actualizar config cuando cambie el inicial
  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  // Validación reactiva
  const validation = useMemo(() => 
    ActivitiesBusinessLogic.validateActivityConfig(config), 
    [config]
  );

  // Opciones para dropdowns (memoizadas para performance)
  const advanceCreationOptions = useMemo(() => 
    ActivitiesBusinessLogic.getAdvanceCreationOptions(), 
    []
  );

  const modificationLimitOptions = useMemo(() => 
    ActivitiesBusinessLogic.getModificationLimitOptions(), 
    []
  );

  const participantsLimitOptions = useMemo(() => 
    ActivitiesBusinessLogic.getParticipantsLimitOptions(), 
    []
  );

  const minTimeOptions = useMemo(() => 
    ActivitiesBusinessLogic.getMinTimeOptions(), 
    []
  );

  const maxTimeOptions = useMemo(() => 
    ActivitiesBusinessLogic.getMaxTimeOptions(), 
    []
  );

  // Resumen de configuración
  const configurationSummary = useMemo(() => 
    ActivitiesBusinessLogic.generateConfigurationSummary(config), 
    [config]
  );

  // Métricas de configuración
  const configMetrics = useMemo(() => 
    ActivitiesBusinessLogic.calculateConfigMetrics(config), 
    [config]
  );

  // Manejador para actualizar campos individuales
  const updateField = useCallback((field: keyof ActivityConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Reset de configuración
  const resetConfig = useCallback(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  // Función para formatear duración (delegada a la lógica de negocio)
  const formatDuration = useCallback((minutes: number) => 
    ActivitiesBusinessLogic.formatDuration(minutes), 
    []
  );

  // Función para validar duración (delegada a la lógica de negocio)
  const isValidDuration = useCallback((minutes: number) => 
    ActivitiesBusinessLogic.isValidDuration(minutes, config), 
    [config]
  );

  return {
    config,
    updateField,
    resetConfig,
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
    advanceCreationOptions,
    modificationLimitOptions,
    participantsLimitOptions,
    minTimeOptions,
    maxTimeOptions,
    configurationSummary,
    configMetrics,
    validation,
    formatDuration,
    isValidDuration
  };
};
