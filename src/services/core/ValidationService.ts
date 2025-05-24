/**
 * Servicio centralizado de validación que elimina la duplicación de lógica de validación
 * en múltiples formularios y componentes
 */

export interface ValidationRule<T = any> {
  validator: (value: T) => boolean;
  message: string;
}

export interface ValidationSchema {
  [field: string]: ValidationRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class ValidationService {
  private static instance: ValidationService;
  
  // Reglas de validación comunes reutilizables
  private commonRules = {
    required: (message = 'Este campo es obligatorio'): ValidationRule => ({
      validator: (value: any) => value !== null && value !== undefined && value !== '',
      message
    }),

    email: (message = 'Introduce un email válido'): ValidationRule => ({
      validator: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !value || emailRegex.test(value);
      },
      message
    }),

    minLength: (min: number, message?: string): ValidationRule => ({
      validator: (value: string) => !value || value.length >= min,
      message: message || `Mínimo ${min} caracteres`
    }),

    maxLength: (max: number, message?: string): ValidationRule => ({
      validator: (value: string) => !value || value.length <= max,
      message: message || `Máximo ${max} caracteres`
    }),

    phone: (message = 'Introduce un teléfono válido'): ValidationRule => ({
      validator: (value: string) => {
        const phoneRegex = /^[+]?[\d\s\-()]{9,}$/;
        return !value || phoneRegex.test(value);
      },
      message
    }),

    positiveNumber: (message = 'Debe ser un número positivo'): ValidationRule => ({
      validator: (value: number) => value === undefined || value === null || value > 0,
      message
    }),

    dateRange: (startDate: Date, endDate: Date, message = 'La fecha de fin debe ser posterior a la de inicio'): ValidationRule => ({
      validator: () => !startDate || !endDate || endDate >= startDate,
      message
    }),

    arrayNotEmpty: (message = 'Debe seleccionar al menos una opción'): ValidationRule => ({
      validator: (value: any[]) => value && Array.isArray(value) && value.length > 0,
      message
    })
  };

  // Esquemas de validación predefinidos para entidades comunes
  private schemas: Record<string, ValidationSchema> = {
    usuario: {
      nombre: [this.commonRules.required('El nombre es obligatorio')],
      apellidos: [this.commonRules.required('Los apellidos son obligatorios')],
      email: [
        this.commonRules.required('El email es obligatorio'),
        this.commonRules.email()
      ],
      telefono: [this.commonRules.phone()]
    },

    material: {
      nombre: [
        this.commonRules.required('El nombre del material es obligatorio'),
        this.commonRules.minLength(3, 'El nombre debe tener al menos 3 caracteres')
      ],
      tipo: [this.commonRules.required('El tipo de material es obligatorio')],
      cantidad: [
        this.commonRules.required('La cantidad es obligatoria'),
        this.commonRules.positiveNumber()
      ]
    },

    actividad: {
      nombre: [
        this.commonRules.required('El nombre de la actividad es obligatorio'),
        this.commonRules.minLength(5, 'El nombre debe tener al menos 5 caracteres')
      ],
      lugar: [this.commonRules.required('El lugar es obligatorio')],
      tipo: [this.commonRules.arrayNotEmpty('Debe seleccionar al menos un tipo')],
      subtipo: [this.commonRules.arrayNotEmpty('Debe seleccionar al menos un subtipo')]
    },

    prestamo: {
      materialId: [this.commonRules.required('Debe seleccionar un material')],
      cantidad: [
        this.commonRules.required('La cantidad es obligatoria'),
        this.commonRules.positiveNumber()
      ],
      fechaDevolucion: [this.commonRules.required('La fecha de devolución es obligatoria')]
    }
  };

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Validar un objeto completo usando un esquema predefinido
   */
  public validate(entityType: string, data: Record<string, any>): ValidationResult {
    const schema = this.schemas[entityType];
    if (!schema) {
      throw new Error(`Esquema de validación no encontrado para: ${entityType}`);
    }

    return this.validateWithSchema(schema, data);
  }

  /**
   * Validar usando un esquema personalizado
   */
  public validateWithSchema(schema: ValidationSchema, data: Record<string, any>): ValidationResult {
    const errors: Record<string, string> = {};

    Object.entries(schema).forEach(([field, rules]) => {
      const value = data[field];
      
      for (const rule of rules) {
        if (!rule.validator(value)) {
          errors[field] = rule.message;
          break; // Solo mostrar el primer error por campo
        }
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validar un campo específico
   */
  public validateField(entityType: string, fieldName: string, value: any): string | null {
    const schema = this.schemas[entityType];
    if (!schema || !schema[fieldName]) {
      return null;
    }

    const rules = schema[fieldName];
    for (const rule of rules) {
      if (!rule.validator(value)) {
        return rule.message;
      }
    }

    return null;
  }

  /**
   * Agregar o actualizar esquema de validación
   */
  public addSchema(entityType: string, schema: ValidationSchema): void {
    this.schemas[entityType] = schema;
  }

  /**
   * Obtener reglas comunes para usar en validaciones personalizadas
   */
  public getCommonRules() {
    return this.commonRules;
  }

  /**
   * Validación específica para fechas de actividades
   */
  public validateActivityDates(fechaInicio: Date, fechaFin: Date): ValidationResult {
    const errors: Record<string, string> = {};

    if (!fechaInicio) {
      errors.fechaInicio = 'La fecha de inicio es obligatoria';
    }

    if (!fechaFin) {
      errors.fechaFin = 'La fecha de fin es obligatoria';
    }

    if (fechaInicio && fechaFin) {
      if (fechaFin <= fechaInicio) {
        errors.fechaFin = 'La fecha de fin debe ser posterior a la de inicio';
      }

      const now = new Date();
      if (fechaInicio < now) {
        errors.fechaInicio = 'La fecha de inicio no puede ser en el pasado';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validación específica para material en préstamos
   */
  public validateMaterialAvailability(materialId: string, cantidadSolicitada: number, cantidadDisponible: number): ValidationResult {
    const errors: Record<string, string> = {};

    if (!materialId) {
      errors.materialId = 'Debe seleccionar un material';
    }

    if (!cantidadSolicitada || cantidadSolicitada <= 0) {
      errors.cantidad = 'La cantidad debe ser mayor a 0';
    }

    if (cantidadSolicitada > cantidadDisponible) {
      errors.cantidad = `Solo hay ${cantidadDisponible} unidades disponibles`;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Export singleton instance
export const validationService = ValidationService.getInstance();
