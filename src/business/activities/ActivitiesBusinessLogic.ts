/**
 * Lógica de Negocio para Gestión de Actividades
 * Separación completa de UI, lógica y acceso a datos
 */

export interface ActivityConfig {
  diasMinimoAntelacionCreacion: number;
  diasMaximoModificacion: number;
  limiteParticipantesPorDefecto: number;
  tiempoMinimoActividad: number;
  tiempoMaximoActividad: number;
  alertasActivasActividades: boolean;
  requiereAprobacionAdmin: boolean;
}

export interface ActivityOption {
  value: number | boolean;
  label: string;
}

export interface ActivityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Clase de lógica de negocio para gestión de actividades
 */
export class ActivitiesBusinessLogic {
  private static readonly MIN_ADVANCE_CREATION = 1;
  private static readonly MAX_ADVANCE_CREATION = 365;
  private static readonly MIN_MODIFICATION_LIMIT = 1;
  private static readonly MAX_MODIFICATION_LIMIT = 30;
  private static readonly MIN_PARTICIPANTS = 1;
  private static readonly MAX_PARTICIPANTS = 200;
  private static readonly MIN_ACTIVITY_TIME = 30; // minutos
  private static readonly MAX_ACTIVITY_TIME = 1440; // 24 horas

  /**
   * Valida la configuración de actividades
   */
  static validateActivityConfig(config: ActivityConfig): ActivityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validaciones críticas
    if (config.diasMinimoAntelacionCreacion < this.MIN_ADVANCE_CREATION) {
      errors.push(`La antelación mínima debe ser al menos ${this.MIN_ADVANCE_CREATION} día`);
    }

    if (config.diasMinimoAntelacionCreacion > this.MAX_ADVANCE_CREATION) {
      errors.push(`La antelación mínima no puede superar ${this.MAX_ADVANCE_CREATION} días`);
    }

    if (config.diasMaximoModificacion < this.MIN_MODIFICATION_LIMIT) {
      errors.push(`El límite de modificación debe ser al menos ${this.MIN_MODIFICATION_LIMIT} día`);
    }

    if (config.diasMaximoModificacion > this.MAX_MODIFICATION_LIMIT) {
      errors.push(`El límite de modificación no puede superar ${this.MAX_MODIFICATION_LIMIT} días`);
    }

    if (config.limiteParticipantesPorDefecto < this.MIN_PARTICIPANTS) {
      errors.push(`El límite de participantes debe ser al menos ${this.MIN_PARTICIPANTS}`);
    }

    if (config.limiteParticipantesPorDefecto > this.MAX_PARTICIPANTS) {
      errors.push(`El límite de participantes no puede superar ${this.MAX_PARTICIPANTS}`);
    }

    if (config.tiempoMinimoActividad < this.MIN_ACTIVITY_TIME) {
      errors.push(`El tiempo mínimo de actividad debe ser al menos ${this.MIN_ACTIVITY_TIME} minutos`);
    }

    if (config.tiempoMaximoActividad > this.MAX_ACTIVITY_TIME) {
      errors.push(`El tiempo máximo de actividad no puede superar ${this.MAX_ACTIVITY_TIME} minutos`);
    }

    // Validación de lógica de negocio
    if (config.tiempoMaximoActividad <= config.tiempoMinimoActividad) {
      errors.push('El tiempo máximo debe ser mayor que el tiempo mínimo');
    }

    if (config.diasMaximoModificacion >= config.diasMinimoAntelacionCreacion) {
      errors.push('El límite de modificación debe ser menor que la antelación de creación');
    }

    // Advertencias
    if (config.diasMinimoAntelacionCreacion > 14) {
      warnings.push('Una antelación muy alta puede reducir la flexibilidad');
    }

    if (config.limiteParticipantesPorDefecto > 50) {
      warnings.push('Un límite alto de participantes puede ser difícil de gestionar');
    }

    if (config.tiempoMaximoActividad > 480) { // 8 horas
      warnings.push('Actividades muy largas pueden requerir consideraciones especiales');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Genera opciones para días de antelación mínima para creación
   */
  static getAdvanceCreationOptions(): ActivityOption[] {
    return [
      { value: 1, label: '1 día' },
      { value: 3, label: '3 días' },
      { value: 7, label: '7 días (1 semana)' },
      { value: 14, label: '14 días (2 semanas)' },
      { value: 30, label: '30 días (1 mes)' }
    ];
  }

  /**
   * Genera opciones para límite de modificación
   */
  static getModificationLimitOptions(): ActivityOption[] {
    return [
      { value: 1, label: '1 día antes' },
      { value: 2, label: '2 días antes' },
      { value: 3, label: '3 días antes' },
      { value: 7, label: '7 días antes' },
      { value: 14, label: '14 días antes' }
    ];
  }

  /**
   * Genera opciones para límite de participantes por defecto
   */
  static getParticipantsLimitOptions(): ActivityOption[] {
    return [
      { value: 10, label: '10 participantes' },
      { value: 15, label: '15 participantes' },
      { value: 20, label: '20 participantes' },
      { value: 25, label: '25 participantes' },
      { value: 30, label: '30 participantes' },
      { value: 50, label: '50 participantes' },
      { value: 100, label: '100 participantes' }
    ];
  }

  /**
   * Genera opciones para tiempo mínimo de actividad
   */
  static getMinTimeOptions(): ActivityOption[] {
    return [
      { value: 30, label: '30 minutos' },
      { value: 60, label: '1 hora' },
      { value: 90, label: '1.5 horas' },
      { value: 120, label: '2 horas' },
      { value: 180, label: '3 horas' }
    ];
  }

  /**
   * Genera opciones para tiempo máximo de actividad
   */
  static getMaxTimeOptions(): ActivityOption[] {
    return [
      { value: 120, label: '2 horas' },
      { value: 180, label: '3 horas' },
      { value: 240, label: '4 horas' },
      { value: 360, label: '6 horas' },
      { value: 480, label: '8 horas' },
      { value: 720, label: '12 horas' },
      { value: 1440, label: '24 horas' }
    ];
  }

  /**
   * Genera resumen legible de la configuración
   */
  static generateConfigurationSummary(config: ActivityConfig): string {
    const parts = [
      `Antelación: ${config.diasMinimoAntelacionCreacion}d`,
      `Modificación hasta: ${config.diasMaximoModificacion}d antes`,
      `Participantes: ${config.limiteParticipantesPorDefecto}`,
      `Duración: ${config.tiempoMinimoActividad}-${config.tiempoMaximoActividad}min`
    ];

    return parts.join(' | ');
  }

  /**
   * Calcula métricas de configuración
   */
  static calculateConfigMetrics(config: ActivityConfig) {
    return {
      flexibilityScore: this.calculateFlexibilityScore(config),
      managementComplexity: this.getManagementComplexity(config),
      timeRangeFlexibility: this.getTimeRangeFlexibility(config)
    };
  }

  /**
   * Convierte minutos a formato legible
   */
  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  }

  /**
   * Valida si una duración está dentro del rango permitido
   */
  static isValidDuration(minutes: number, config: ActivityConfig): boolean {
    return minutes >= config.tiempoMinimoActividad && 
           minutes <= config.tiempoMaximoActividad;
  }

  private static calculateFlexibilityScore(config: ActivityConfig): number {
    let score = 100;
    
    if (config.diasMinimoAntelacionCreacion > 7) score -= 25;
    if (config.diasMaximoModificacion > 3) score -= 15;
    if (config.limiteParticipantesPorDefecto < 20) score -= 20;
    if (config.tiempoMaximoActividad < 240) score -= 20; // menos de 4 horas
    if (config.requiereAprobacionAdmin) score -= 15;
    
    return Math.max(0, score);
  }

  private static getManagementComplexity(config: ActivityConfig): 'baja' | 'media' | 'alta' {
    const complexityFactors = [
      config.limiteParticipantesPorDefecto > 50,
      config.tiempoMaximoActividad > 480,
      config.requiereAprobacionAdmin,
      config.diasMinimoAntelacionCreacion > 14
    ].filter(Boolean).length;

    if (complexityFactors >= 3) return 'alta';
    if (complexityFactors >= 2) return 'media';
    return 'baja';
  }

  private static getTimeRangeFlexibility(config: ActivityConfig): 'limitada' | 'moderada' | 'amplia' {
    const timeRange = config.tiempoMaximoActividad - config.tiempoMinimoActividad;
    
    if (timeRange < 90) return 'limitada';      // menos de 1.5 horas de rango
    if (timeRange < 300) return 'moderada';     // menos de 5 horas de rango
    return 'amplia';                            // 5+ horas de rango
  }
}
