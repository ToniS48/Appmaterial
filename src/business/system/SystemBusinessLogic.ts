/**
 * Lógica de negocio para configuración general del sistema
 * Separada completamente de UI y Firestore
 */

export interface SystemVariablesConfig {
  diasGraciaDevolucion: number;
  diasMaximoRetraso: number;
  diasBloqueoPorRetraso: number;
  recordatorioPreActividad: number;
  recordatorioDevolucion: number;
  notificacionRetrasoDevolucion: number;
  diasMinimoAntelacionCreacion: number;
  diasMaximoModificacion: number;
  limiteParticipantesPorDefecto: number;
  penalizacionRetraso: number;
  bonificacionDevolucionTemprana: number;
  umbraLinactividadUsuario: number;
  diasHistorialReportes: number;
  limiteElementosExportacion: number;
}

export interface SystemValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  criticalIssues: string[];
}

export class SystemBusinessLogic {
  // Límites del sistema
  static readonly LIMITS = {
    MIN_GRACE_DAYS: 0,
    MAX_GRACE_DAYS: 30,
    MIN_MAX_DELAY_DAYS: 1,
    MAX_MAX_DELAY_DAYS: 365,
    MIN_BLOCK_DAYS: 1,
    MAX_BLOCK_DAYS: 365,
    MIN_REMINDER_DAYS: 0,
    MAX_REMINDER_DAYS: 30,
    MIN_CREATION_DAYS: 0,
    MAX_CREATION_DAYS: 90,
    MIN_MODIFICATION_DAYS: 0,
    MAX_MODIFICATION_DAYS: 30,
    MIN_PARTICIPANTS: 1,
    MAX_PARTICIPANTS: 100,
    MIN_PENALTY: 0,
    MAX_PENALTY: 100,
    MIN_BONUS: 0,
    MAX_BONUS: 50,
    MIN_INACTIVITY_DAYS: 30,
    MAX_INACTIVITY_DAYS: 365,
    MIN_HISTORY_DAYS: 30,
    MAX_HISTORY_DAYS: 1095, // 3 años
    MIN_EXPORT_LIMIT: 100,
    MAX_EXPORT_LIMIT: 10000
  };

  /**
   * Valida toda la configuración del sistema
   */
  static validateConfiguration(config: SystemVariablesConfig): SystemValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const criticalIssues: string[] = [];

    // Validaciones de rangos
    this.validateRanges(config, errors);

    // Validaciones de coherencia lógica
    this.validateLogicalConsistency(config, errors, warnings, criticalIssues);

    // Validaciones de rendimiento
    this.validatePerformanceImpact(config, warnings);

    return {
      isValid: errors.length === 0 && criticalIssues.length === 0,
      errors,
      warnings,
      criticalIssues
    };
  }

  /**
   * Valida que los valores estén dentro de rangos aceptables
   */
  private static validateRanges(config: SystemVariablesConfig, errors: string[]): void {
    const validations = [
      {
        field: 'diasGraciaDevolucion',
        value: config.diasGraciaDevolucion,
        min: this.LIMITS.MIN_GRACE_DAYS,
        max: this.LIMITS.MAX_GRACE_DAYS,
        name: 'Días de gracia para devolución'
      },
      {
        field: 'diasMaximoRetraso',
        value: config.diasMaximoRetraso,
        min: this.LIMITS.MIN_MAX_DELAY_DAYS,
        max: this.LIMITS.MAX_MAX_DELAY_DAYS,
        name: 'Días máximo de retraso'
      },
      {
        field: 'diasBloqueoPorRetraso',
        value: config.diasBloqueoPorRetraso,
        min: this.LIMITS.MIN_BLOCK_DAYS,
        max: this.LIMITS.MAX_BLOCK_DAYS,
        name: 'Días de bloqueo por retraso'
      },
      {
        field: 'recordatorioPreActividad',
        value: config.recordatorioPreActividad,
        min: this.LIMITS.MIN_REMINDER_DAYS,
        max: this.LIMITS.MAX_REMINDER_DAYS,
        name: 'Recordatorio pre-actividad'
      },
      {
        field: 'recordatorioDevolucion',
        value: config.recordatorioDevolucion,
        min: this.LIMITS.MIN_REMINDER_DAYS,
        max: this.LIMITS.MAX_REMINDER_DAYS,
        name: 'Recordatorio de devolución'
      },
      {
        field: 'limiteParticipantesPorDefecto',
        value: config.limiteParticipantesPorDefecto,
        min: this.LIMITS.MIN_PARTICIPANTS,
        max: this.LIMITS.MAX_PARTICIPANTS,
        name: 'Límite de participantes'
      },
      {
        field: 'penalizacionRetraso',
        value: config.penalizacionRetraso,
        min: this.LIMITS.MIN_PENALTY,
        max: this.LIMITS.MAX_PENALTY,
        name: 'Penalización por retraso'
      },
      {
        field: 'limiteElementosExportacion',
        value: config.limiteElementosExportacion,
        min: this.LIMITS.MIN_EXPORT_LIMIT,
        max: this.LIMITS.MAX_EXPORT_LIMIT,
        name: 'Límite de elementos en exportación'
      }
    ];

    validations.forEach(({ value, min, max, name }) => {
      if (value < min || value > max) {
        errors.push(`${name} debe estar entre ${min} y ${max}`);
      }
    });
  }

  /**
   * Valida la coherencia lógica entre parámetros
   */
  private static validateLogicalConsistency(
    config: SystemVariablesConfig,
    errors: string[],
    warnings: string[],
    criticalIssues: string[]
  ): void {
    // Regla crítica: El bloqueo debe ser proporcional al retraso máximo
    if (config.diasBloqueoPorRetraso < config.diasMaximoRetraso) {
      criticalIssues.push(
        'Los días de bloqueo deben ser igual o mayor a los días máximo de retraso para ser efectivos'
      );
    }

    // Regla: Los recordatorios deben ser antes de la fecha límite
    if (config.recordatorioDevolucion <= 0) {
      warnings.push('Sin recordatorios de devolución puede aumentar los retrasos');
    }

    if (config.recordatorioPreActividad <= 0) {
      warnings.push('Sin recordatorios pre-actividad puede reducir la participación');
    }

    // Regla: Días de gracia vs penalización
    if (config.diasGraciaDevolucion > 7 && config.penalizacionRetraso > 0) {
      warnings.push(
        'Muchos días de gracia con penalización puede crear inconsistencias en el sistema'
      );
    }

    // Regla: Antelación para creación vs modificación
    if (config.diasMinimoAntelacionCreacion > 0 && 
        config.diasMaximoModificacion > config.diasMinimoAntelacionCreacion) {
      warnings.push(
        'Permitir modificaciones más allá de la antelación mínima puede crear confusión'
      );
    }

    // Regla: Límites de exportación muy altos
    if (config.limiteElementosExportacion > 5000) {
      warnings.push('Límites de exportación muy altos pueden afectar el rendimiento');
    }

    // Regla: Historial muy extenso
    if (config.diasHistorialReportes > 730) { // 2 años
      warnings.push('Historial muy extenso puede ralentizar las consultas');
    }
  }

  /**
   * Valida el impacto en rendimiento
   */
  private static validatePerformanceImpact(
    config: SystemVariablesConfig,
    warnings: string[]
  ): void {
    // Verificar configuraciones que pueden impactar rendimiento
    if (config.umbraLinactividadUsuario < 30) {
      warnings.push('Umbral de inactividad muy bajo puede generar muchas notificaciones');
    }

    if (config.notificacionRetrasoDevolucion > 0 && config.notificacionRetrasoDevolucion < 1) {
      warnings.push('Notificaciones muy frecuentes pueden saturar el sistema');
    }
  }

  /**
   * Calcula el impacto de los cambios en la configuración
   */
  static calculateImpact(
    currentConfig: SystemVariablesConfig,
    newConfig: SystemVariablesConfig
  ): {
    userImpact: string[];
    systemImpact: string[];
    operationalImpact: string[];
  } {
    const userImpact: string[] = [];
    const systemImpact: string[] = [];
    const operationalImpact: string[] = [];

    // Analizar cambios en días de gracia
    if (newConfig.diasGraciaDevolucion !== currentConfig.diasGraciaDevolucion) {
      const change = newConfig.diasGraciaDevolucion - currentConfig.diasGraciaDevolucion;
      if (change > 0) {
        userImpact.push(`Los usuarios tendrán ${change} días adicionales sin penalización`);
      } else {
        userImpact.push(`Los usuarios tendrán ${Math.abs(change)} días menos sin penalización`);
      }
    }

    // Analizar cambios en penalización
    if (newConfig.penalizacionRetraso !== currentConfig.penalizacionRetraso) {
      const change = newConfig.penalizacionRetraso - currentConfig.penalizacionRetraso;
      if (change > 0) {
        userImpact.push(`Aumentará la penalización por retraso en ${change} puntos`);
      } else {
        userImpact.push(`Disminuirá la penalización por retraso en ${Math.abs(change)} puntos`);
      }
    }

    // Analizar cambios en límites de exportación
    if (newConfig.limiteElementosExportacion !== currentConfig.limiteElementosExportacion) {
      const change = newConfig.limiteElementosExportacion - currentConfig.limiteElementosExportacion;
      if (change > 0) {
        systemImpact.push(`Permitirá exportar ${change} elementos adicionales`);
      } else {
        systemImpact.push(`Limitará la exportación en ${Math.abs(change)} elementos`);
      }
    }

    // Analizar cambios operacionales
    if (newConfig.diasMinimoAntelacionCreacion !== currentConfig.diasMinimoAntelacionCreacion) {
      operationalImpact.push('Cambios en los plazos de creación de actividades');
    }

    if (newConfig.limiteParticipantesPorDefecto !== currentConfig.limiteParticipantesPorDefecto) {
      operationalImpact.push('Cambios en el límite por defecto de participantes');
    }

    return {
      userImpact,
      systemImpact,
      operationalImpact
    };
  }

  /**
   * Aplica correcciones automáticas a la configuración
   */
  static applyAutoCorrections(config: SystemVariablesConfig): SystemVariablesConfig {
    const corrected = { ...config };

    // Aplicar límites
    Object.keys(corrected).forEach(key => {
      const field = key as keyof SystemVariablesConfig;
      const value = corrected[field];
      
      // Aplicar correcciones específicas por campo
      switch (field) {
        case 'diasGraciaDevolucion':
          corrected[field] = Math.max(
            this.LIMITS.MIN_GRACE_DAYS,
            Math.min(this.LIMITS.MAX_GRACE_DAYS, value)
          );
          break;
        case 'diasMaximoRetraso':
          corrected[field] = Math.max(
            this.LIMITS.MIN_MAX_DELAY_DAYS,
            Math.min(this.LIMITS.MAX_MAX_DELAY_DAYS, value)
          );
          break;
        case 'penalizacionRetraso':
          corrected[field] = Math.max(
            this.LIMITS.MIN_PENALTY,
            Math.min(this.LIMITS.MAX_PENALTY, value)
          );
          break;
        // Agregar más casos según sea necesario
      }
    });

    // Correcciones de coherencia
    if (corrected.diasBloqueoPorRetraso < corrected.diasMaximoRetraso) {
      corrected.diasBloqueoPorRetraso = corrected.diasMaximoRetraso;
    }

    return corrected;
  }

  /**
   * Obtiene recomendaciones basadas en la configuración actual
   */
  static getRecommendations(config: SystemVariablesConfig): string[] {
    const recommendations: string[] = [];

    // Recomendaciones basadas en configuración
    if (config.diasGraciaDevolucion === 0 && config.penalizacionRetraso > 10) {
      recommendations.push(
        'Considera agregar al menos 1 día de gracia para equilibrar las penalizaciones'
      );
    }

    if (config.recordatorioDevolucion === 0) {
      recommendations.push(
        'Activar recordatorios de devolución puede reducir significativamente los retrasos'
      );
    }

    if (config.limiteParticipantesPorDefecto < 5) {
      recommendations.push(
        'Un límite muy bajo de participantes puede limitar la participación en actividades'
      );
    }

    if (config.diasHistorialReportes > 365) {
      recommendations.push(
        'Considera reducir el historial de reportes para mejorar el rendimiento'
      );
    }

    if (config.limiteElementosExportacion > 5000) {
      recommendations.push(
        'Un límite muy alto de exportación puede causar problemas de rendimiento'
      );
    }

    return recommendations;
  }

  /**
   * Genera un resumen ejecutivo de la configuración
   */
  static getConfigurationSummary(config: SystemVariablesConfig): {
    policies: string[];
    restrictions: string[];
    performance: string[];
  } {
    const policies = [
      `Días de gracia: ${config.diasGraciaDevolucion}`,
      `Penalización por retraso: ${config.penalizacionRetraso} puntos`,
      `Bloqueo por retraso: ${config.diasBloqueoPorRetraso} días`
    ];

    const restrictions = [
      `Participantes por defecto: ${config.limiteParticipantesPorDefecto}`,
      `Antelación mínima: ${config.diasMinimoAntelacionCreacion} días`,
      `Modificación hasta: ${config.diasMaximoModificacion} días antes`
    ];

    const performance = [
      `Historial de reportes: ${config.diasHistorialReportes} días`,
      `Límite de exportación: ${config.limiteElementosExportacion} elementos`,
      `Umbral de inactividad: ${config.umbraLinactividadUsuario} días`
    ];

    return {
      policies,
      restrictions,
      performance
    };
  }
}
