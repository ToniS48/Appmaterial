/**
 * Lógica de negocio para configuración de material
 * Separada completamente de UI y Firestore
 */

export interface MaterialConfig {
  porcentajeStockMinimo: number;
  diasRevisionPeriodica: number;
  tiempoMinimoEntrePrestamos: number;
}

export interface MaterialValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class MaterialBusinessLogic {
  // Constantes de negocio
  static readonly MIN_STOCK_PERCENTAGE = 5;
  static readonly MAX_STOCK_PERCENTAGE = 50;
  static readonly MIN_REVISION_DAYS = 7;
  static readonly MAX_REVISION_DAYS = 365;
  static readonly MIN_TIME_BETWEEN_LOANS = 0;
  static readonly MAX_TIME_BETWEEN_LOANS = 168; // 1 semana en horas

  /**
   * Valida la configuración de material
   */
  static validateConfiguration(config: MaterialConfig): MaterialValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validar porcentaje de stock mínimo
    if (config.porcentajeStockMinimo < this.MIN_STOCK_PERCENTAGE) {
      errors.push(`El porcentaje de stock mínimo no puede ser menor a ${this.MIN_STOCK_PERCENTAGE}%`);
    }
    if (config.porcentajeStockMinimo > this.MAX_STOCK_PERCENTAGE) {
      errors.push(`El porcentaje de stock mínimo no puede ser mayor a ${this.MAX_STOCK_PERCENTAGE}%`);
    }

    // Validar días de revisión periódica
    if (config.diasRevisionPeriodica < this.MIN_REVISION_DAYS) {
      errors.push(`Los días de revisión no pueden ser menores a ${this.MIN_REVISION_DAYS}`);
    }
    if (config.diasRevisionPeriodica > this.MAX_REVISION_DAYS) {
      errors.push(`Los días de revisión no pueden ser mayores a ${this.MAX_REVISION_DAYS}`);
    }

    // Validar tiempo mínimo entre préstamos
    if (config.tiempoMinimoEntrePrestamos < this.MIN_TIME_BETWEEN_LOANS) {
      errors.push(`El tiempo mínimo entre préstamos no puede ser negativo`);
    }
    if (config.tiempoMinimoEntrePrestamos > this.MAX_TIME_BETWEEN_LOANS) {
      errors.push(`El tiempo mínimo entre préstamos no puede ser mayor a ${this.MAX_TIME_BETWEEN_LOANS} horas`);
    }

    // Advertencias
    if (config.porcentajeStockMinimo < 10) {
      warnings.push('Un stock mínimo menor al 10% puede causar desabastecimientos frecuentes');
    }
    if (config.porcentajeStockMinimo > 30) {
      warnings.push('Un stock mínimo mayor al 30% puede limitar excesivamente los préstamos');
    }

    if (config.diasRevisionPeriodica < 30) {
      warnings.push('Revisiones muy frecuentes pueden generar carga de trabajo innecesaria');
    }
    if (config.diasRevisionPeriodica > 180) {
      warnings.push('Revisiones muy espaciadas pueden permitir que se acumule material deteriorado');
    }

    if (config.tiempoMinimoEntrePrestamos > 24) {
      warnings.push('Un tiempo muy largo entre préstamos puede frustrar a los usuarios');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calcula si un material debe ser revisado
   */
  static shouldReviewMaterial(
    lastReviewDate: Date,
    config: MaterialConfig
  ): boolean {
    const daysSinceReview = this.getDaysBetween(lastReviewDate, new Date());
    return daysSinceReview >= config.diasRevisionPeriodica;
  }

  /**
   * Calcula si el stock está por debajo del mínimo
   */
  static isStockBelowMinimum(
    currentStock: number,
    totalStock: number,
    config: MaterialConfig
  ): boolean {
    if (totalStock === 0) return false;
    const currentPercentage = (currentStock / totalStock) * 100;
    return currentPercentage < config.porcentajeStockMinimo;
  }

  /**
   * Calcula cuántas unidades deben estar disponibles como mínimo
   */
  static calculateMinimumStock(
    totalStock: number,
    config: MaterialConfig
  ): number {
    return Math.ceil((totalStock * config.porcentajeStockMinimo) / 100);
  }

  /**
   * Verifica si se puede hacer un nuevo préstamo basado en el tiempo transcurrido
   */
  static canMakeNewLoan(
    lastLoanDate: Date | null,
    config: MaterialConfig
  ): boolean {
    if (!lastLoanDate) return true;
    
    const hoursSinceLastLoan = this.getHoursBetween(lastLoanDate, new Date());
    return hoursSinceLastLoan >= config.tiempoMinimoEntrePrestamos;
  }

  /**
   * Obtiene las opciones disponibles para porcentaje de stock
   */
  static getStockPercentageOptions() {
    return [
      { value: 5, label: '5%' },
      { value: 10, label: '10%' },
      { value: 15, label: '15%' },
      { value: 20, label: '20%' },
      { value: 25, label: '25%' },
      { value: 30, label: '30%' }
    ];
  }

  /**
   * Obtiene las opciones disponibles para días de revisión
   */
  static getRevisionDaysOptions() {
    return [
      { value: 15, label: '15 días' },
      { value: 30, label: '30 días' },
      { value: 60, label: '60 días' },
      { value: 90, label: '90 días' },
      { value: 120, label: '120 días' },
      { value: 180, label: '180 días' }
    ];
  }

  /**
   * Obtiene las opciones disponibles para tiempo entre préstamos
   */
  static getTimeBetweenLoansOptions() {
    return [
      { value: 0, label: 'Sin restricción' },
      { value: 1, label: '1 hora' },
      { value: 6, label: '6 horas' },
      { value: 12, label: '12 horas' },
      { value: 24, label: '1 día' },
      { value: 48, label: '2 días' },
      { value: 72, label: '3 días' }
    ];
  }

  /**
   * Genera un resumen de la configuración
   */
  static getConfigurationSummary(config: MaterialConfig): string {
    const parts = [
      `Stock mínimo: ${config.porcentajeStockMinimo}%`,
      `Revisión cada ${config.diasRevisionPeriodica} días`
    ];

    if (config.tiempoMinimoEntrePrestamos > 0) {
      parts.push(`Tiempo entre préstamos: ${config.tiempoMinimoEntrePrestamos}h`);
    }

    return parts.join(' • ');
  }

  /**
   * Calcula días entre dos fechas
   */
  private static getDaysBetween(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Calcula horas entre dos fechas
   */
  private static getHoursBetween(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return timeDiff / (1000 * 3600);
  }

  /**
   * Aplica correcciones automáticas a valores fuera de rango
   */
  static applyAutoCorrections(config: MaterialConfig): MaterialConfig {
    return {
      porcentajeStockMinimo: Math.max(
        this.MIN_STOCK_PERCENTAGE,
        Math.min(this.MAX_STOCK_PERCENTAGE, config.porcentajeStockMinimo)
      ),
      diasRevisionPeriodica: Math.max(
        this.MIN_REVISION_DAYS,
        Math.min(this.MAX_REVISION_DAYS, config.diasRevisionPeriodica)
      ),
      tiempoMinimoEntrePrestamos: Math.max(
        this.MIN_TIME_BETWEEN_LOANS,
        Math.min(this.MAX_TIME_BETWEEN_LOANS, config.tiempoMinimoEntrePrestamos)
      )
    };
  }

  /**
   * Estima el impacto de cambios en la configuración
   */
  static estimateConfigurationImpact(
    currentConfig: MaterialConfig,
    newConfig: MaterialConfig,
    currentStats: {
      totalMaterials: number;
      averageLoansPerDay: number;
      materialsNeedingReview: number;
    }
  ): {
    stockImpact: string;
    reviewImpact: string;
    loanImpact: string;
  } {
    const stockImpact = this.calculateStockImpact(currentConfig, newConfig, currentStats);
    const reviewImpact = this.calculateReviewImpact(currentConfig, newConfig, currentStats);
    const loanImpact = this.calculateLoanImpact(currentConfig, newConfig, currentStats);

    return {
      stockImpact,
      reviewImpact,
      loanImpact
    };
  }

  private static calculateStockImpact(
    current: MaterialConfig,
    proposed: MaterialConfig,
    stats: { totalMaterials: number }
  ): string {
    const currentMinStock = this.calculateMinimumStock(stats.totalMaterials, current);
    const proposedMinStock = this.calculateMinimumStock(stats.totalMaterials, proposed);
    const difference = proposedMinStock - currentMinStock;

    if (difference > 0) {
      return `Se requerirán ${difference} unidades adicionales como stock mínimo`;
    } else if (difference < 0) {
      return `Se liberarán ${Math.abs(difference)} unidades del stock mínimo`;
    }
    return 'Sin cambios en el stock mínimo';
  }

  private static calculateReviewImpact(
    current: MaterialConfig,
    proposed: MaterialConfig,
    stats: { materialsNeedingReview: number }
  ): string {
    if (proposed.diasRevisionPeriodica < current.diasRevisionPeriodica) {
      return 'Aumentará la frecuencia de revisiones';
    } else if (proposed.diasRevisionPeriodica > current.diasRevisionPeriodica) {
      return 'Disminuirá la frecuencia de revisiones';
    }
    return 'Sin cambios en la frecuencia de revisiones';
  }

  private static calculateLoanImpact(
    current: MaterialConfig,
    proposed: MaterialConfig,
    stats: { averageLoansPerDay: number }
  ): string {
    if (proposed.tiempoMinimoEntrePrestamos > current.tiempoMinimoEntrePrestamos) {
      return 'Podría reducir la frecuencia de préstamos';
    } else if (proposed.tiempoMinimoEntrePrestamos < current.tiempoMinimoEntrePrestamos) {
      return 'Permitirá préstamos más frecuentes';
    }
    return 'Sin cambios en las restricciones de préstamos';
  }
}
