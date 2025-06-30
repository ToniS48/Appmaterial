import { useState, useEffect, useMemo, useCallback } from 'react';
import { MaterialBusinessLogic, MaterialConfig, MaterialValidationResult } from '../../business/material/MaterialBusinessLogic';

/**
 * Hook para la lógica de negocio de configuración de material
 * Separado de UI y Firestore, solo lógica pura
 */
export const useMaterialBusinessLogic = (config: MaterialConfig) => {
  const [validation, setValidation] = useState<MaterialValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });

  // Validar configuración cuando cambie
  useEffect(() => {
    const result = MaterialBusinessLogic.validateConfiguration(config);
    setValidation(result);
  }, [config]);

  // Obtener opciones para los selectores
  const stockPercentageOptions = useMemo(() => {
    return MaterialBusinessLogic.getStockPercentageOptions();
  }, []);

  const revisionDaysOptions = useMemo(() => {
    return MaterialBusinessLogic.getRevisionDaysOptions();
  }, []);

  const timeBetweenLoansOptions = useMemo(() => {
    return MaterialBusinessLogic.getTimeBetweenLoansOptions();
  }, []);

  // Aplicar correcciones automáticas
  const applyAutoCorrections = useCallback((configToCorrect: MaterialConfig): MaterialConfig => {
    return MaterialBusinessLogic.applyAutoCorrections(configToCorrect);
  }, []);

  // Generar resumen de configuración
  const configurationSummary = useMemo(() => {
    return MaterialBusinessLogic.getConfigurationSummary(config);
  }, [config]);

  // Funciones de cálculo
  const calculateMinimumStock = useCallback((totalStock: number) => {
    return MaterialBusinessLogic.calculateMinimumStock(totalStock, config);
  }, [config]);

  const isStockBelowMinimum = useCallback((currentStock: number, totalStock: number) => {
    return MaterialBusinessLogic.isStockBelowMinimum(currentStock, totalStock, config);
  }, [config]);

  const shouldReviewMaterial = useCallback((lastReviewDate: Date) => {
    return MaterialBusinessLogic.shouldReviewMaterial(lastReviewDate, config);
  }, [config]);

  const canMakeNewLoan = useCallback((lastLoanDate: Date | null) => {
    return MaterialBusinessLogic.canMakeNewLoan(lastLoanDate, config);
  }, [config]);

  return {
    // Estado de validación
    validation,
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,

    // Opciones para UI
    stockPercentageOptions,
    revisionDaysOptions,
    timeBetweenLoansOptions,

    // Resumen
    configurationSummary,

    // Funciones de lógica de negocio
    applyAutoCorrections,
    calculateMinimumStock,
    isStockBelowMinimum,
    shouldReviewMaterial,
    canMakeNewLoan
  };
};

/**
 * Hook para gestionar el estado de la configuración de material
 */
export const useMaterialConfigurationState = (initialConfig: MaterialConfig) => {
  const [config, setConfig] = useState<MaterialConfig>(initialConfig);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedConfig, setLastSavedConfig] = useState<MaterialConfig>(initialConfig);

  // Usar lógica de negocio
  const businessLogic = useMaterialBusinessLogic(config);

  // Actualizar configuración con validación automática
  const updateConfig = useCallback((updates: Partial<MaterialConfig>) => {
    setConfig((prevConfig: MaterialConfig) => {
      const newConfig = { ...prevConfig, ...updates };
      // Aplicar correcciones automáticas
      const correctedConfig = businessLogic.applyAutoCorrections(newConfig);
      setIsDirty(true);
      return correctedConfig;
    });
  }, [businessLogic]);

  // Actualizar un campo específico
  const updateField = useCallback(<K extends keyof MaterialConfig>(
    field: K,
    value: MaterialConfig[K]
  ) => {
    updateConfig({ [field]: value });
  }, [updateConfig]);

  // Resetear a última configuración guardada
  const resetConfig = useCallback(() => {
    setConfig(lastSavedConfig);
    setIsDirty(false);
  }, [lastSavedConfig]);

  // Marcar como guardado
  const markAsSaved = useCallback((savedConfig: MaterialConfig) => {
    setLastSavedConfig(savedConfig);
    setIsDirty(false);
  }, []);

  // Verificar si se puede guardar
  const canSave = useMemo(() => {
    return isDirty && businessLogic.isValid;
  }, [isDirty, businessLogic.isValid]);

  // Obtener cambios realizados
  const getChanges = useMemo(() => {
    const changes: Partial<MaterialConfig> = {};
    (Object.keys(config) as Array<keyof MaterialConfig>).forEach(key => {
      if (config[key] !== lastSavedConfig[key]) {
        changes[key] = config[key];
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
 * Hook para análisis de impacto de cambios en configuración de material
 */
export const useMaterialConfigurationImpact = (
  currentConfig: MaterialConfig,
  newConfig: MaterialConfig,
  materialStats?: {
    totalMaterials: number;
    averageLoansPerDay: number;
    materialsNeedingReview: number;
  }
) => {
  // Calcular impacto solo si hay estadísticas disponibles
  const impact = useMemo(() => {
    if (!materialStats) return null;

    return MaterialBusinessLogic.estimateConfigurationImpact(
      currentConfig,
      newConfig,
      materialStats
    );
  }, [currentConfig, newConfig, materialStats]);

  // Determinar si el cambio es significativo
  const isSignificantChange = useMemo(() => {
    const stockChange = Math.abs(newConfig.porcentajeStockMinimo - currentConfig.porcentajeStockMinimo);
    const revisionChange = Math.abs(newConfig.diasRevisionPeriodica - currentConfig.diasRevisionPeriodica);
    const loanTimeChange = Math.abs(newConfig.tiempoMinimoEntrePrestamos - currentConfig.tiempoMinimoEntrePrestamos);

    return stockChange >= 5 || revisionChange >= 30 || loanTimeChange >= 24;
  }, [currentConfig, newConfig]);

  // Obtener el tipo de cambio más importante
  const primaryChangeType = useMemo(() => {
    const stockChange = Math.abs(newConfig.porcentajeStockMinimo - currentConfig.porcentajeStockMinimo);
    const revisionChange = Math.abs(newConfig.diasRevisionPeriodica - currentConfig.diasRevisionPeriodica);
    const loanTimeChange = Math.abs(newConfig.tiempoMinimoEntrePrestamos - currentConfig.tiempoMinimoEntrePrestamos);

    if (stockChange >= revisionChange && stockChange >= loanTimeChange) {
      return 'stock';
    } else if (revisionChange >= loanTimeChange) {
      return 'revision';
    } else {
      return 'loanTime';
    }
  }, [currentConfig, newConfig]);

  return {
    impact,
    isSignificantChange,
    primaryChangeType,
    hasImpact: impact !== null
  };
};

/**
 * Hook para simulaciones de escenarios con la configuración de material
 */
export const useMaterialConfigurationSimulation = () => {
  const [simulationResults, setSimulationResults] = useState<{
    scenario: string;
    config: MaterialConfig;
    results: {
      minimumStockRequired: number;
      reviewFrequency: string;
      loanRestrictions: string;
    };
  }[]>([]);

  // Simular escenario conservador
  const simulateConservativeScenario = useCallback((totalMaterials: number) => {
    const conservativeConfig: MaterialConfig = {
      porcentajeStockMinimo: 25,
      diasRevisionPeriodica: 60,
      tiempoMinimoEntrePrestamos: 24
    };

    const result = {
      scenario: 'Conservador',
      config: conservativeConfig,
      results: {
        minimumStockRequired: MaterialBusinessLogic.calculateMinimumStock(totalMaterials, conservativeConfig),
        reviewFrequency: 'Cada 2 meses',
        loanRestrictions: 'Mínimo 24h entre préstamos'
      }
    };

    setSimulationResults(prev => [...prev.filter(r => r.scenario !== 'Conservador'), result]);
    return result;
  }, []);

  // Simular escenario balanceado
  const simulateBalancedScenario = useCallback((totalMaterials: number) => {
    const balancedConfig: MaterialConfig = {
      porcentajeStockMinimo: 15,
      diasRevisionPeriodica: 90,
      tiempoMinimoEntrePrestamos: 12
    };

    const result = {
      scenario: 'Balanceado',
      config: balancedConfig,
      results: {
        minimumStockRequired: MaterialBusinessLogic.calculateMinimumStock(totalMaterials, balancedConfig),
        reviewFrequency: 'Cada 3 meses',
        loanRestrictions: 'Mínimo 12h entre préstamos'
      }
    };

    setSimulationResults(prev => [...prev.filter(r => r.scenario !== 'Balanceado'), result]);
    return result;
  }, []);

  // Simular escenario flexible
  const simulateFlexibleScenario = useCallback((totalMaterials: number) => {
    const flexibleConfig: MaterialConfig = {
      porcentajeStockMinimo: 10,
      diasRevisionPeriodica: 120,
      tiempoMinimoEntrePrestamos: 0
    };

    const result = {
      scenario: 'Flexible',
      config: flexibleConfig,
      results: {
        minimumStockRequired: MaterialBusinessLogic.calculateMinimumStock(totalMaterials, flexibleConfig),
        reviewFrequency: 'Cada 4 meses',
        loanRestrictions: 'Sin restricciones'
      }
    };

    setSimulationResults(prev => [...prev.filter(r => r.scenario !== 'Flexible'), result]);
    return result;
  }, []);

  // Ejecutar todas las simulaciones
  const runAllSimulations = useCallback((totalMaterials: number) => {
    simulateConservativeScenario(totalMaterials);
    simulateBalancedScenario(totalMaterials);
    simulateFlexibleScenario(totalMaterials);
  }, [simulateConservativeScenario, simulateBalancedScenario, simulateFlexibleScenario]);

  // Limpiar simulaciones
  const clearSimulations = useCallback(() => {
    setSimulationResults([]);
  }, []);

  return {
    simulationResults,
    simulateConservativeScenario,
    simulateBalancedScenario,
    simulateFlexibleScenario,
    runAllSimulations,
    clearSimulations
  };
};
