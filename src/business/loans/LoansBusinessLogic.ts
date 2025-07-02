/**
 * Lógica de Negocio para Gestión de Préstamos y Devoluciones
 * Separación completa de UI, lógica y acceso a datos
 */

export interface LoanConfig {
  diasMinimoAntelacionPrestamo: number;
  diasMaximoAdelantoPrestamo: number;
  diasLimiteDevolucion: number;
  penalizacionPorDiaRetraso: number;
  limitePrestamosSimultaneos: number;
  alertasActivasPrestamos: boolean;
  alertasActivasDevoluciones: boolean;
}

export interface LoanOption {
  value: number | boolean;
  label: string;
}

export interface LoanValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Clase de lógica de negocio para gestión de préstamos
 */
export class LoansBusinessLogic {
  private static readonly MIN_DAYS_ADVANCE = 1;
  private static readonly MAX_DAYS_ADVANCE = 90;
  private static readonly MIN_RETURN_DAYS = 1;
  private static readonly MAX_RETURN_DAYS = 365;
  private static readonly MIN_PENALTY = 0;
  private static readonly MAX_PENALTY = 100;

  /**
   * Valida la configuración de préstamos
   */
  static validateLoanConfig(config: LoanConfig): LoanValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validaciones críticas
    if (config.diasMinimoAntelacionPrestamo < this.MIN_DAYS_ADVANCE) {
      errors.push(`La antelación mínima debe ser al menos ${this.MIN_DAYS_ADVANCE} día`);
    }

    if (config.diasMaximoAdelantoPrestamo > this.MAX_DAYS_ADVANCE) {
      errors.push(`El adelanto máximo no puede superar ${this.MAX_DAYS_ADVANCE} días`);
    }

    if (config.diasLimiteDevolucion < this.MIN_RETURN_DAYS) {
      errors.push(`El límite de devolución debe ser al menos ${this.MIN_RETURN_DAYS} día`);
    }

    if (config.diasLimiteDevolucion > this.MAX_RETURN_DAYS) {
      errors.push(`El límite de devolución no puede superar ${this.MAX_RETURN_DAYS} días`);
    }

    if (config.penalizacionPorDiaRetraso < this.MIN_PENALTY || config.penalizacionPorDiaRetraso > this.MAX_PENALTY) {
      errors.push(`La penalización debe estar entre ${this.MIN_PENALTY} y ${this.MAX_PENALTY}`);
    }

    if (config.limitePrestamosSimultaneos < 1 || config.limitePrestamosSimultaneos > 20) {
      errors.push('El límite de préstamos simultáneos debe estar entre 1 y 20');
    }

    // Advertencias
    if (config.diasMinimoAntelacionPrestamo > 7) {
      warnings.push('Una antelación mayor a 7 días puede ser muy restrictiva');
    }

    if (config.diasLimiteDevolucion > 30) {
      warnings.push('Un límite de devolución muy largo puede afectar la disponibilidad');
    }

    if (config.penalizacionPorDiaRetraso > 10) {
      warnings.push('Una penalización alta puede desincentivar el uso del sistema');
    }

    // Validación de lógica de negocio
    if (config.diasMaximoAdelantoPrestamo <= config.diasMinimoAntelacionPrestamo) {
      errors.push('El adelanto máximo debe ser mayor que la antelación mínima');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Genera opciones para días de antelación mínima
   */
  static getAdvanceDaysOptions(): LoanOption[] {
    return [
      { value: 1, label: '1 día' },
      { value: 2, label: '2 días' },
      { value: 3, label: '3 días' },
      { value: 7, label: '7 días (1 semana)' },
      { value: 14, label: '14 días (2 semanas)' }
    ];
  }

  /**
   * Genera opciones para días máximos de adelanto
   */
  static getMaxAdvanceOptions(): LoanOption[] {
    return [
      { value: 7, label: '7 días' },
      { value: 14, label: '14 días' },
      { value: 30, label: '30 días' },
      { value: 60, label: '60 días' },
      { value: 90, label: '90 días' }
    ];
  }

  /**
   * Genera opciones para límite de devolución
   */
  static getReturnLimitOptions(): LoanOption[] {
    return [
      { value: 1, label: '1 día' },
      { value: 3, label: '3 días' },
      { value: 7, label: '7 días' },
      { value: 14, label: '14 días' },
      { value: 21, label: '21 días (3 semanas)' },
      { value: 30, label: '30 días (1 mes)' }
    ];
  }

  /**
   * Genera opciones para penalización por día de retraso
   */
  static getPenaltyOptions(): LoanOption[] {
    return [
      { value: 0, label: 'Sin penalización' },
      { value: 1, label: '1 punto' },
      { value: 2, label: '2 puntos' },
      { value: 5, label: '5 puntos' },
      { value: 10, label: '10 puntos' }
    ];
  }

  /**
   * Genera opciones para límite de préstamos simultáneos
   */
  static getSimultaneousLoansOptions(): LoanOption[] {
    return [
      { value: 1, label: '1 préstamo' },
      { value: 2, label: '2 préstamos' },
      { value: 3, label: '3 préstamos' },
      { value: 5, label: '5 préstamos' },
      { value: 10, label: '10 préstamos' }
    ];
  }

  /**
   * Genera resumen legible de la configuración
   */
  static generateConfigurationSummary(config: LoanConfig): string {
    const parts = [
      `Antelación: ${config.diasMinimoAntelacionPrestamo}d`,
      `Adelanto máximo: ${config.diasMaximoAdelantoPrestamo}d`,
      `Límite devolución: ${config.diasLimiteDevolucion}d`,
      `Penalización: ${config.penalizacionPorDiaRetraso}pts/día`,
      `Simultáneos: ${config.limitePrestamosSimultaneos}`
    ];

    return parts.join(' | ');
  }

  /**
   * Calcula métricas de configuración
   */
  static calculateConfigMetrics(config: LoanConfig) {
    return {
      flexibilityScore: this.calculateFlexibilityScore(config),
      restrictionLevel: this.getRestrictionLevel(config),
      penaltyImpact: this.getPenaltyImpact(config.penalizacionPorDiaRetraso)
    };
  }

  private static calculateFlexibilityScore(config: LoanConfig): number {
    // Puntuación de flexibilidad basada en varios factores
    let score = 100;
    
    if (config.diasMinimoAntelacionPrestamo > 3) score -= 20;
    if (config.diasLimiteDevolucion < 7) score -= 30;
    if (config.limitePrestamosSimultaneos < 3) score -= 20;
    if (config.penalizacionPorDiaRetraso > 5) score -= 20;
    
    return Math.max(0, score);
  }

  private static getRestrictionLevel(config: LoanConfig): 'bajo' | 'medio' | 'alto' {
    const restrictiveFactors = [
      config.diasMinimoAntelacionPrestamo > 7,
      config.diasLimiteDevolucion < 7,
      config.limitePrestamosSimultaneos < 2,
      config.penalizacionPorDiaRetraso > 10
    ].filter(Boolean).length;

    if (restrictiveFactors >= 3) return 'alto';
    if (restrictiveFactors >= 2) return 'medio';
    return 'bajo';
  }

  private static getPenaltyImpact(penalty: number): 'ninguno' | 'bajo' | 'medio' | 'alto' {
    if (penalty === 0) return 'ninguno';
    if (penalty <= 2) return 'bajo';
    if (penalty <= 5) return 'medio';
    return 'alto';
  }
}
