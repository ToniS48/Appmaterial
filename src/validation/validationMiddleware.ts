import { z } from 'zod';
import { logger } from '../utils/loggerUtils';

export interface ValidationError {
  path: string[];
  message: string;
}

export class ValidationResult<T> {
  private _success: boolean;
  private _data?: T;
  private _errors: ValidationError[] = [];
  
  private constructor(success: boolean, data?: T, errors: ValidationError[] = []) {
    this._success = success;
    this._data = data;
    this._errors = errors;
  }
  
  get success(): boolean {
    return this._success;
  }
  
  get data(): T | undefined {
    return this._data;
  }
  
  get errors(): ValidationError[] {
    return [...this._errors];
  }
  
  get firstError(): string | undefined {
    return this._errors.length > 0 ? this._errors[0].message : undefined;
  }
  
  static success<T>(data: T): ValidationResult<T> {
    return new ValidationResult<T>(true, data);
  }
  
  static failure<T>(errors: ValidationError[]): ValidationResult<T> {
    return new ValidationResult<T>(false, undefined, errors);
  }
}

/**
 * Middleware de validación que usa Zod para validar datos
 * antes de ejecutar lógica de negocio
 */
export function validateWithZod<T, R>(
  schema: z.ZodSchema<T>,
  businessLogic: (data: T) => Promise<R>
): (input: unknown) => Promise<R> {
  return async (input: unknown): Promise<R> => {
    try {
      // Validar input con schema Zod
      const validData = schema.parse(input);
      
      // Si pasa la validación, ejecutar lógica de negocio
      return await businessLogic(validData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          path: err.path,
          message: err.message
        }));
        
        logger.warn('Validación fallida:', { 
          errors: validationErrors,
          input: JSON.stringify(input).substring(0, 200) // Truncar para no llenar logs
        });
        
        throw new Error(`Validación fallida: ${validationErrors[0].message}`);
      }
      
      // Si no es un error de Zod, re-lanzar
      throw error;
    }
  };
}

/**
 * Función para validar datos sin ejecutar lógica de negocio
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const validData = schema.parse(data);
    return ValidationResult.success(validData);  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => ({
        path: err.path.map(p => String(p)),
        message: err.message
      }));
      
      return ValidationResult.failure(validationErrors);
    }
    
    // Si no es un error de Zod, convertir a error de validación genérico
    return ValidationResult.failure([{
      path: [],
      message: error instanceof Error ? error.message : 'Error de validación desconocido'
    }]);
  }
}