/**
 * Hook de negocio para gestión de préstamos
 * Separación completa entre UI, lógica de negocio y acceso a datos
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LoanConfig, 
  LoansBusinessLogic,
  LoanValidationResult 
} from '../../business/loans/LoansBusinessLogic';

export interface UseLoanConfigurationState {
  config: LoanConfig;
  updateField: (field: keyof LoanConfig, value: any) => void;
  resetConfig: () => void;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  advanceDaysOptions: any[];
  maxAdvanceOptions: any[];
  returnLimitOptions: any[];
  penaltyOptions: any[];
  simultaneousLoansOptions: any[];
  configurationSummary: string;
  configMetrics: any;
  validation: LoanValidationResult;
}

/**
 * Hook para manejo del estado y lógica de configuración de préstamos
 */
export const useLoanConfigurationState = (initialConfig: LoanConfig): UseLoanConfigurationState => {
  const [config, setConfig] = useState<LoanConfig>(initialConfig);

  // Actualizar config cuando cambie el inicial
  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  // Validación reactiva
  const validation = useMemo(() => 
    LoansBusinessLogic.validateLoanConfig(config), 
    [config]
  );

  // Opciones para dropdowns (memoizadas para performance)
  const advanceDaysOptions = useMemo(() => 
    LoansBusinessLogic.getAdvanceDaysOptions(), 
    []
  );

  const maxAdvanceOptions = useMemo(() => 
    LoansBusinessLogic.getMaxAdvanceOptions(), 
    []
  );

  const returnLimitOptions = useMemo(() => 
    LoansBusinessLogic.getReturnLimitOptions(), 
    []
  );

  const penaltyOptions = useMemo(() => 
    LoansBusinessLogic.getPenaltyOptions(), 
    []
  );

  const simultaneousLoansOptions = useMemo(() => 
    LoansBusinessLogic.getSimultaneousLoansOptions(), 
    []
  );

  // Resumen de configuración
  const configurationSummary = useMemo(() => 
    LoansBusinessLogic.generateConfigurationSummary(config), 
    [config]
  );

  // Métricas de configuración
  const configMetrics = useMemo(() => 
    LoansBusinessLogic.calculateConfigMetrics(config), 
    [config]
  );

  // Manejador para actualizar campos individuales
  const updateField = useCallback((field: keyof LoanConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Reset de configuración
  const resetConfig = useCallback(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  return {
    config,
    updateField,
    resetConfig,
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
    advanceDaysOptions,
    maxAdvanceOptions,
    returnLimitOptions,
    penaltyOptions,
    simultaneousLoansOptions,
    configurationSummary,
    configMetrics,
    validation
  };
};
