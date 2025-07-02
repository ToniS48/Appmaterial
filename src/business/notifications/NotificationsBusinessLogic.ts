/**
 * Lógica de Negocio para Notificaciones
 * Separación completa de UI, lógica y acceso a datos
 */

export interface NotificationConfig {
  emailActivo: boolean;
  smsActivo: boolean;
  pushActivo: boolean;
  minutosAntes: number;
  horasAntes: number;
  diasAntes: number;
  notificarCreacion: boolean;
  notificarModificacion: boolean;
  notificarCancelacion: boolean;
  notificarRecordatorio: boolean;
  tiempoRecordatorio: number;
  templateEmail: string;
  templateSms: string;
}

export interface NotificationOption {
  value: number | boolean | string;
  label: string;
}

export interface NotificationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Clase de lógica de negocio para notificaciones
 */
export class NotificationsBusinessLogic {
  private static readonly MIN_MINUTES = 5;
  private static readonly MAX_MINUTES = 1440; // 24 horas
  private static readonly MIN_HOURS = 1;
  private static readonly MAX_HOURS = 72; // 3 días
  private static readonly MIN_DAYS = 1;
  private static readonly MAX_DAYS = 30;

  /**
   * Valida la configuración de notificaciones
   */
  static validateNotificationConfig(config: NotificationConfig): NotificationValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validaciones críticas
    if (!config.emailActivo && !config.smsActivo && !config.pushActivo) {
      errors.push('Debe activar al menos un método de notificación');
    }

    if (config.minutosAntes < this.MIN_MINUTES || config.minutosAntes > this.MAX_MINUTES) {
      errors.push(`Los minutos de anticipación deben estar entre ${this.MIN_MINUTES} y ${this.MAX_MINUTES}`);
    }

    if (config.horasAntes < this.MIN_HOURS || config.horasAntes > this.MAX_HOURS) {
      errors.push(`Las horas de anticipación deben estar entre ${this.MIN_HOURS} y ${this.MAX_HOURS}`);
    }

    if (config.diasAntes < this.MIN_DAYS || config.diasAntes > this.MAX_DAYS) {
      errors.push(`Los días de anticipación deben estar entre ${this.MIN_DAYS} y ${this.MAX_DAYS}`);
    }

    if (config.tiempoRecordatorio < 5 || config.tiempoRecordatorio > 1440) {
      errors.push('El tiempo de recordatorio debe estar entre 5 y 1440 minutos');
    }

    // Validaciones de templates
    if (config.emailActivo && (!config.templateEmail || config.templateEmail.length < 10)) {
      errors.push('El template de email debe tener al menos 10 caracteres');
    }

    if (config.smsActivo && (!config.templateSms || config.templateSms.length < 5)) {
      errors.push('El template de SMS debe tener al menos 5 caracteres');
    }

    // Advertencias
    if (config.minutosAntes < 15) {
      warnings.push('Un recordatorio muy próximo puede no dar tiempo suficiente');
    }

    if (config.diasAntes > 7) {
      warnings.push('Recordatorios muy anticipados pueden ser ignorados');
    }

    if (!config.notificarCreacion && !config.notificarModificacion && !config.notificarRecordatorio) {
      warnings.push('Sin notificaciones activas, el sistema será menos informativo');
    }

    // Validación de lógica de negocio
    if (config.tiempoRecordatorio >= (config.minutosAntes + config.horasAntes * 60 + config.diasAntes * 1440)) {
      warnings.push('El tiempo de recordatorio es mayor que los otros intervalos');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Genera opciones para minutos de anticipación
   */
  static getMinutesOptions(): NotificationOption[] {
    return [
      { value: 5, label: '5 minutos' },
      { value: 10, label: '10 minutos' },
      { value: 15, label: '15 minutos' },
      { value: 30, label: '30 minutos' },
      { value: 60, label: '1 hora' }
    ];
  }

  /**
   * Genera opciones para horas de anticipación
   */
  static getHoursOptions(): NotificationOption[] {
    return [
      { value: 1, label: '1 hora' },
      { value: 2, label: '2 horas' },
      { value: 6, label: '6 horas' },
      { value: 12, label: '12 horas' },
      { value: 24, label: '24 horas' }
    ];
  }

  /**
   * Genera opciones para días de anticipación
   */
  static getDaysOptions(): NotificationOption[] {
    return [
      { value: 1, label: '1 día' },
      { value: 2, label: '2 días' },
      { value: 3, label: '3 días' },
      { value: 7, label: '1 semana' },
      { value: 14, label: '2 semanas' }
    ];
  }

  /**
   * Genera opciones para tiempo de recordatorio
   */
  static getReminderTimeOptions(): NotificationOption[] {
    return [
      { value: 15, label: '15 minutos' },
      { value: 30, label: '30 minutos' },
      { value: 60, label: '1 hora' },
      { value: 120, label: '2 horas' },
      { value: 240, label: '4 horas' }
    ];
  }

  /**
   * Genera resumen legible de la configuración
   */
  static generateConfigurationSummary(config: NotificationConfig): string {
    const methods = [];
    if (config.emailActivo) methods.push('Email');
    if (config.smsActivo) methods.push('SMS');
    if (config.pushActivo) methods.push('Push');

    const notifications = [];
    if (config.notificarCreacion) notifications.push('Creación');
    if (config.notificarModificacion) notifications.push('Modificación');
    if (config.notificarRecordatorio) notifications.push('Recordatorio');

    return `Métodos: ${methods.join(', ')} | Eventos: ${notifications.join(', ')} | Anticipación: ${config.minutosAntes}min, ${config.horasAntes}h, ${config.diasAntes}d`;
  }

  /**
   * Calcula métricas de configuración
   */
  static calculateConfigMetrics(config: NotificationConfig) {
    return {
      methodsActive: [config.emailActivo, config.smsActivo, config.pushActivo].filter(Boolean).length,
      eventsActive: [config.notificarCreacion, config.notificarModificacion, config.notificarCancelacion, config.notificarRecordatorio].filter(Boolean).length,
      anticipationScore: this.calculateAnticipationScore(config),
      completenessScore: this.calculateCompletenessScore(config)
    };
  }

  /**
   * Formatea tiempo en formato legible
   */
  static formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  }

  /**
   * Obtiene template por defecto para email
   */
  static getDefaultEmailTemplate(): string {
    return `Estimado/a {nombre},

Le recordamos que tiene una actividad programada:

Actividad: {actividad}
Fecha: {fecha}
Hora: {hora}
Lugar: {lugar}

Por favor, confirme su asistencia.

Saludos cordiales,
Equipo de Gestión`;
  }

  /**
   * Obtiene template por defecto para SMS
   */
  static getDefaultSmsTemplate(): string {
    return `Recordatorio: {actividad} el {fecha} a las {hora} en {lugar}. Confirme asistencia.`;
  }

  private static calculateAnticipationScore(config: NotificationConfig): number {
    // Puntuación basada en balance de anticipación
    let score = 50;
    
    if (config.minutosAntes >= 15 && config.minutosAntes <= 30) score += 20;
    if (config.horasAntes >= 2 && config.horasAntes <= 12) score += 20;
    if (config.diasAntes >= 1 && config.diasAntes <= 3) score += 10;
    
    return Math.min(100, score);
  }

  private static calculateCompletenessScore(config: NotificationConfig): number {
    let score = 0;
    
    // Métodos activos
    if (config.emailActivo) score += 25;
    if (config.smsActivo) score += 25;
    if (config.pushActivo) score += 20;
    
    // Eventos cubiertos
    if (config.notificarCreacion) score += 10;
    if (config.notificarModificacion) score += 5;
    if (config.notificarRecordatorio) score += 15;
    
    return Math.min(100, score);
  }
}
