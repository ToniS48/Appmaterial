import { useState, useEffect, useMemo, useCallback } from 'react';
import { WeatherBusinessLogic, WeatherConfig, ValidationResult } from '../../business/weather/WeatherBusinessLogic';

/**
 * Hook para la lógica de negocio de configuración meteorológica
 * Separado de UI y Firestore, solo lógica pura
 */
export const useWeatherBusinessLogic = (config: WeatherConfig) => {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });

  // Validar configuración cuando cambie
  useEffect(() => {
    const result = WeatherBusinessLogic.validateConfiguration(config);
    setValidation(result);
  }, [config]);

  // Determinar si mostrar opciones de AEMET
  const shouldShowAemetOptions = useMemo(() => {
    return WeatherBusinessLogic.shouldShowAemetOptions(config);
  }, [config.weatherEnabled]);

  // Determinar si deshabilitar controles de unidades
  const shouldDisableUnits = useMemo(() => {
    return WeatherBusinessLogic.shouldDisableUnits(config);
  }, [config.weatherEnabled]);

  // Obtener opciones de unidades
  const unitOptions = useMemo(() => {
    return WeatherBusinessLogic.getUnitOptions();
  }, []);

  // Aplicar correcciones automáticas
  const applyAutoCorrections = useCallback((configToCorrect: WeatherConfig): WeatherConfig => {
    return WeatherBusinessLogic.applyAutoCorrections(configToCorrect);
  }, []);

  // Obtener recomendación de proveedor para una ubicación
  const getProviderRecommendation = useCallback((location: { lat: number; lon: number }) => {
    return WeatherBusinessLogic.getProviderRecommendation(location, config);
  }, [config]);

  // Generar resumen de configuración
  const configurationSummary = useMemo(() => {
    return WeatherBusinessLogic.getConfigurationSummary(config);
  }, [config]);

  // Verificar si una ubicación está en España
  const isLocationInSpain = useCallback((location: { lat: number; lon: number }) => {
    return WeatherBusinessLogic.isLocationInSpain(location);
  }, []);

  return {
    // Estado de validación
    validation,
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,

    // Estados derivados
    shouldShowAemetOptions,
    shouldDisableUnits,
    configurationSummary,

    // Opciones para UI
    unitOptions,

    // Funciones de lógica de negocio
    applyAutoCorrections,
    getProviderRecommendation,
    isLocationInSpain
  };
};

/**
 * Hook para gestionar el estado de la configuración meteorológica
 * Incluye lógica de negocio y manejo de estado
 */
export const useWeatherConfigurationState = (initialConfig: WeatherConfig) => {
  const [config, setConfig] = useState<WeatherConfig>(initialConfig);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedConfig, setLastSavedConfig] = useState<WeatherConfig>(initialConfig);

  // Usar lógica de negocio
  const businessLogic = useWeatherBusinessLogic(config);

  // Actualizar configuración con validación automática
  const updateConfig = useCallback((updates: Partial<WeatherConfig>) => {
    setConfig((prevConfig: WeatherConfig) => {
      const newConfig = { ...prevConfig, ...updates };
      // Aplicar correcciones automáticas
      const correctedConfig = businessLogic.applyAutoCorrections(newConfig);
      setIsDirty(true);
      return correctedConfig;
    });
  }, [businessLogic]);

  // Actualizar un campo específico
  const updateField = useCallback(<K extends keyof WeatherConfig>(
    field: K,
    value: WeatherConfig[K]
  ) => {
    updateConfig({ [field]: value });
  }, [updateConfig]);

  // Resetear a última configuración guardada
  const resetConfig = useCallback(() => {
    setConfig(lastSavedConfig);
    setIsDirty(false);
  }, [lastSavedConfig]);

  // Marcar como guardado
  const markAsSaved = useCallback((savedConfig: WeatherConfig) => {
    setLastSavedConfig(savedConfig);
    setIsDirty(false);
  }, []);

  // Verificar si se puede guardar
  const canSave = useMemo(() => {
    return isDirty && businessLogic.isValid;
  }, [isDirty, businessLogic.isValid]);

  // Obtener cambios realizados
  const getChanges = useMemo(() => {
    const changes: Partial<WeatherConfig> = {};
    (Object.keys(config) as Array<keyof WeatherConfig>).forEach(key => {
      if (config[key] !== lastSavedConfig[key]) {
        (changes as any)[key] = config[key];
      }
    });
    return changes;
  }, [config, lastSavedConfig]);

  return {
    // Estado actual
    config,
    isDirty,
    canSave,
    changes: getChanges,

    // Acciones
    updateConfig,
    updateField,
    resetConfig,
    markAsSaved,

    // Lógica de negocio
    ...businessLogic
  };
};

/**
 * Hook para manejar configuración meteorológica con efectos secundarios
 * (ejemplo: lógica que debe ejecutarse cuando cambian ciertos valores)
 */
export const useWeatherConfigurationEffects = (
  config: WeatherConfig,
  onConfigChange?: (config: WeatherConfig) => void
) => {
  const businessLogic = useWeatherBusinessLogic(config);

  // Efecto: Cuando se deshabilita el servicio meteorológico, deshabilitar AEMET
  useEffect(() => {
    if (!config.weatherEnabled && (config.aemetEnabled || config.aemetUseForSpain)) {
      const correctedConfig = {
        ...config,
        aemetEnabled: false,
        aemetUseForSpain: false
      };
      onConfigChange?.(correctedConfig);
    }
  }, [config.weatherEnabled, config.aemetEnabled, config.aemetUseForSpain, onConfigChange]);

  // Efecto: Cuando se deshabilita AEMET, deshabilitar uso automático
  useEffect(() => {
    if (!config.aemetEnabled && config.aemetUseForSpain) {
      const correctedConfig = {
        ...config,
        aemetUseForSpain: false
      };
      onConfigChange?.(correctedConfig);
    }
  }, [config.aemetEnabled, config.aemetUseForSpain, onConfigChange]);

  // Efecto: Establecer valores por defecto cuando se habilita el servicio
  useEffect(() => {
    if (config.weatherEnabled && 
        (!config.temperatureUnit || !config.windSpeedUnit || !config.precipitationUnit)) {
      const correctedConfig = {
        ...config,
        temperatureUnit: config.temperatureUnit || 'celsius',
        windSpeedUnit: config.windSpeedUnit || 'kmh',
        precipitationUnit: config.precipitationUnit || 'mm'
      };
      onConfigChange?.(correctedConfig);
    }
  }, [config.weatherEnabled, config.temperatureUnit, config.windSpeedUnit, config.precipitationUnit, onConfigChange]);

  return {
    ...businessLogic,
    
    // Funciones de utilidad adicionales
    getConfigurationStatus: () => {
      if (!config.weatherEnabled) return 'disabled';
      if (businessLogic.errors.length > 0) return 'error';
      if (businessLogic.warnings.length > 0) return 'warning';
      return 'ok';
    },

    getStatusMessage: () => {
      if (!config.weatherEnabled) return 'Servicio meteorológico deshabilitado';
      if (businessLogic.errors.length > 0) return businessLogic.errors[0];
      if (businessLogic.warnings.length > 0) return businessLogic.warnings[0];
      return 'Configuración válida';
    }
  };
};
