import { FirebaseError } from 'firebase/app';
import { logger } from './loggerUtils';
import { createStandaloneToast } from '@chakra-ui/react'; // Cambiado de toast a createStandaloneToast
import theme from '../styles/theme'; // Importar el tema de la aplicación

// Crear una instancia independiente de toast que no requiere un contexto React
const { toast } = createStandaloneToast({ theme });

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface AppError {
  code: string;
  message: string;
  originalError?: any;
  data?: any;
  severity: ErrorSeverity;
  userMessage?: string; // Mensaje amigable para el usuario
  timestamp: Date;
}

export class ErrorManager {
  private static instance: ErrorManager;
  private errorHandlers: Array<(error: AppError) => void> = [];
  
  private constructor() {
    // Inicializar manejadores por defecto
    this.errorHandlers.push(this.logErrorHandler);
    this.errorHandlers.push(this.toastErrorHandler);
  }
  
  /**
   * Obtiene la instancia singleton
   */
  public static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }
  
  /**
   * Añade un manejador de errores personalizado
   */
  public addErrorHandler(handler: (error: AppError) => void): void {
    this.errorHandlers.push(handler);
  }
  
  /**
   * Maneja un error de la aplicación
   */
  public handleError(error: Error | FirebaseError | unknown, context?: string): AppError {
    const appError = this.normalizeError(error, context);
    
    // Notificar a todos los manejadores registrados
    for (const handler of this.errorHandlers) {
      try {
        handler(appError);
      } catch (handlerError) {
        logger.error('Error en manejador de errores:', handlerError);
      }
    }
    
    return appError;
  }
  
  /**
   * Convierte cualquier error a un AppError normalizado
   */
  private normalizeError(error: any, context?: string): AppError {
    if (error instanceof FirebaseError) {
      return {
        code: error.code || 'firebase/unknown',
        message: error.message,
        originalError: error,
        severity: this.determineSeverity(error),
        userMessage: this.getUserFriendlyMessage(error, context),
        timestamp: new Date()
      };
    }
    
    if (error instanceof Error) {
      return {
        code: 'app/unknown-error',
        message: error.message || 'Error desconocido',
        originalError: error,
        severity: ErrorSeverity.ERROR,
        userMessage: context 
          ? `Error en ${context}: ${error.message}` 
          : `Error: ${error.message}`,
        timestamp: new Date()
      };
    }
    
    // Para errores que no son instancias de Error
    return {
      code: 'app/non-standard-error',
      message: String(error),
      originalError: error,
      severity: ErrorSeverity.ERROR,
      userMessage: context 
        ? `Error en ${context}: ${String(error)}` 
        : `Error: ${String(error)}`,
      timestamp: new Date()
    };
  }
  
  /**
   * Determina la severidad basado en el tipo de error
   */
  private determineSeverity(error: any): ErrorSeverity {
    if (error instanceof FirebaseError) {
      // Errores de permisos son críticos
      if (error.code.includes('permission-denied')) {
        return ErrorSeverity.CRITICAL;
      }
      
      // Errores de autenticación son warnings
      if (error.code.includes('auth/')) {
        return ErrorSeverity.WARNING;
      }
      
      // Errores de conexión son warnings
      if (error.code.includes('unavailable') || error.code.includes('network-request-failed')) {
        return ErrorSeverity.WARNING;
      }
    }
    
    return ErrorSeverity.ERROR;
  }
  
  /**
   * Obtiene un mensaje amigable para el usuario
   */
  private getUserFriendlyMessage(error: any, context?: string): string {
    if (error instanceof FirebaseError) {
      // Mapear códigos de error de Firebase a mensajes amigables
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          return 'Las credenciales proporcionadas son incorrectas. Por favor, verifica tu email y contraseña.';
        
        case 'auth/too-many-requests':
          return 'Has realizado demasiados intentos. Por favor, inténtalo más tarde.';
        
        case 'auth/email-already-in-use':
          return 'Este email ya está registrado. Utiliza otro o recupera tu contraseña.';
        
        case 'permission-denied':
          return 'No tienes permisos para realizar esta acción.';
        
        case 'unavailable':
        case 'network-request-failed':
          return 'Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.';
        
        default:
          return context 
            ? `Error en ${context}: ${error.message}` 
            : `Error: ${error.message}`;
      }
    }
    
    return context 
      ? `Error en ${context}: ${error instanceof Error ? error.message : String(error)}` 
      : `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
  
  /**
   * Manejador que registra errores en el logger
   */
  private logErrorHandler(error: AppError): void {
    const { code, message, severity, originalError, data } = error;
    
    logger.error(`[${code}] ${message}`, {
      severity,
      data,
      error: originalError
    });
  }
  
  /**
   * Manejador que muestra errores como toasts
   */
  private toastErrorHandler(error: AppError): void {
    const { severity, userMessage } = error;
    
    // Convertir severidad a tipo de toast
    let status: 'info' | 'warning' | 'error' | 'success';
    switch (severity) {
      case ErrorSeverity.INFO:
        status = 'info';
        break;
      case ErrorSeverity.WARNING:
        status = 'warning';
        break;
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
      default:
        status = 'error';
        break;
    }
    
    // Usar el toast independiente (ahora siempre disponible)
    toast({
      title: status === 'error' ? 'Error' : 'Aviso',
      description: userMessage,
      status,
      duration: 5000,
      isClosable: true,
      position: 'top'
    });
  }
}

// Exportar instancia singleton y función de conveniencia
export const errorManager = ErrorManager.getInstance();

export function handleAppError(error: any, context?: string): void {
  errorManager.handleError(error, context);
  
  // Si es un error crítico, también lanzarlo para interrumpir la ejecución
  if (errorManager.handleError(error, context).severity === ErrorSeverity.CRITICAL) {
    throw error;
  }
}