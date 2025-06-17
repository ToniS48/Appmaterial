enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

type LogHandler = (entry: LogEntry) => void;

class Logger {
  private handlers: LogHandler[] = [];
  private minLevel: LogLevel = LogLevel.INFO;
  private context?: string;
  private rateLimiter: Map<string, number> = new Map();
  private readonly RATE_LIMIT_WINDOW = 5000; // 5 segundos
  
  constructor(context?: string) {
    this.context = context;
    
    // Configurar handler de consola por defecto
    this.addHandler(this.consoleHandler);
    
    // En producción, usar un nivel de log más restrictivo
    if (process.env.NODE_ENV === 'production') {
      this.minLevel = LogLevel.ERROR; // Solo errores en producción
    } else {
      this.minLevel = LogLevel.WARN; // Advertencias y errores en desarrollo
    }
  }
  
  /**
   * Configura el nivel mínimo de logs
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }
  
  /**
   * Añade un manejador de logs
   */
  addHandler(handler: LogHandler): void {
    this.handlers.push(handler);
  }
  
  /**
   * Limpia todos los manejadores
   */
  clearHandlers(): void {
    this.handlers = [];
  }
  
  /**
   * Rate limiting para evitar spam de logs
   */
  private shouldLog(message: string): boolean {
    const now = Date.now();
    const lastLog = this.rateLimiter.get(message);
    
    if (!lastLog || (now - lastLog) > this.RATE_LIMIT_WINDOW) {
      this.rateLimiter.set(message, now);
      return true;
    }
    
    return false;
  }
  
  /**
   * Log de nivel debug
   */
  debug(message: string, data?: any): void {
    // Solo logs de debug en desarrollo y si no se está spammeando
    if (process.env.NODE_ENV === 'development' && this.shouldLog(message)) {
      this.log(LogLevel.DEBUG, message, data);
    }
  }
  
  /**
   * Log de nivel info
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }
  
  /**
   * Log de nivel warn
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }
  
  /**
   * Log de nivel error
   */
  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }
  
  /**
   * Método principal de logging
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (level < this.minLevel) {
      return;
    }
    
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context: this.context
    };
    
    // Notificar a todos los handlers
    for (const handler of this.handlers) {
      try {
        handler(entry);
      } catch (error) {
        console.error('Error en handler de log:', error);
      }
    }
    
    // Para errores, recolectar la información para análisis
    if (level === LogLevel.ERROR) {
      this.collectErrorTelemetry(entry);
    }
  }
  
  /**
   * Handler que envía logs a la consola
   */
  private consoleHandler(entry: LogEntry): void {
    const { level, message, data, timestamp, context } = entry;
    
    const contextPrefix = context ? `[${context}] ` : '';
    const formattedMessage = `${timestamp} ${contextPrefix}${message}`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data || '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data || '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data || '');
        break;
    }
  }
  
  /**
   * Recolecta información adicional para errores
   */
  private collectErrorTelemetry(entry: LogEntry): void {
    // En una implementación real, aquí se enviaría información a un servicio
    // de monitoreo de errores como Sentry, LogRocket, etc.
    
    // Ejemplo: código para enviar a un servicio hipotético
    if (process.env.NODE_ENV === 'production') {
      try {
        const errorData = {
          ...entry,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
          url: typeof window !== 'undefined' ? window.location.href : '',
          appVersion: process.env.REACT_APP_VERSION || 'unknown'
        };
        
        // Comentado porque es hipotético
        // ErrorMonitoringService.captureError(errorData);
        
        // Almacenar en localStorage para análisis posterior
        if (typeof window !== 'undefined') {
          try {
            const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
            errors.push(errorData);
            // Limitar a últimos 50 errores
            if (errors.length > 50) errors.shift();
            localStorage.setItem('app_errors', JSON.stringify(errors));
          } catch (e) {
            // Ignorar errores de localStorage
          }
        }
      } catch (error) {
        console.error('Error al recolectar telemetría:', error);
      }
    }
  }
  
  /**
   * Crea un logger con un contexto específico
   */
  createContextLogger(context: string): Logger {
    const contextLogger = new Logger(context);
    contextLogger.handlers = this.handlers;
    contextLogger.minLevel = this.minLevel;
    return contextLogger;
  }
}

// Exportar instancia principal
export const logger = new Logger('App');

// Exportar loggers específicos para servicios
export const actividadLogger = logger.createContextLogger('ActividadService');
export const usuarioLogger = logger.createContextLogger('UsuarioService');
export const materialLogger = logger.createContextLogger('MaterialService');