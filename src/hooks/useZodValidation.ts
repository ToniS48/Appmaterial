import { useCallback, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { z } from 'zod';

/**
 * Hook para manejar validaciones basadas en esquemas Zod
 * @param schema - Esquema Zod para validación
 * @returns Objeto con función de validación y estado de errores
 */
export function useZodValidation<T>(schema: z.Schema<T>) {
  // Estado para almacenar errores de validación
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  /**
   * Valida los datos contra el esquema Zod
   * @param data - Datos a validar
   * @param options - Opciones de validación
   * @returns true si los datos son válidos, false si no
   */
  const validate = (
    data: unknown, 
    options: { 
      showToast?: boolean;
      fieldPath?: string; 
    } = { showToast: true }
  ): data is T => {
    try {
      // Validar con el esquema Zod
      schema.parse(data);
      
      // Si la validación es exitosa, limpiar errores
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Convertir errores de Zod a un formato más fácil de usar
        const formattedErrors: Record<string, string> = {};
        
        error.errors.forEach(err => {
          // Convertir el path del error en una string (ej: "user.email")
          const path = err.path.join('.');
          formattedErrors[path || '_global'] = err.message;
        });
        
        // Actualizar estado de errores
        setErrors(formattedErrors);
          // Mostrar el primer error como toast si la opción está activada
        if (options.showToast && error.errors.length > 0) {
          // Usar un ID único para el toast basado en el mensaje para evitar duplicados
          const toastId = `validation-${error.errors[0].message.replace(/\s+/g, '-')}`;
          
          // Comprobar si hay un toast con el mismo ID activo
          if (!toast.isActive(toastId)) {
            toast({
              id: toastId,
              title: "Error de validación",
              description: error.errors[0].message,
              status: "error",
              duration: 3000, // Reducir la duración para mejorar UX
              isClosable: true,
            });
          }
        }
      } else {
        // Para errores que no son de Zod
        console.error("Error inesperado durante la validación:", error);
        setErrors({ _global: "Error inesperado durante la validación" });
        
        if (options.showToast) {
          toast({
            title: "Error",
            description: "Ha ocurrido un error inesperado al validar los datos",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      }
      return false;
    }
  };

  /**
   * Valida un campo específico y devuelve el mensaje de error o undefined
   * @param field - Nombre del campo a validar
   * @param value - Valor a validar
   * @param options - Opciones de validación (showToast)
   * @returns Mensaje de error o undefined si es válido
   */  const validateField = (
    field: string,
    value: unknown,
    options: { showToast?: boolean } = {}
  ): string | undefined => {
    const showToast = options.showToast ?? false;
    try {
      // Verificar si el esquema es un objeto con shape
      const isObjectSchema = typeof (schema as any).shape === 'object';
      if (!isObjectSchema || !((schema as any).shape?.[field])) {
        return undefined;
      }
      // Crear un esquema parcial para validar solo este campo
      const partialSchema = z.object({ [field]: (schema as any).shape[field] });
      partialSchema.parse({ [field]: value });
      
      // Si llegamos aquí, el campo es válido, limpiar errores
      if (errors[field]) {
        const newErrorsObj = { ...errors };
        delete newErrorsObj[field];
        setErrors(newErrorsObj);
      }
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || `Campo ${field} inválido`;
        
        // Solo mostrar error en UI, sin toast si showToast es false
        setError(field, errorMessage, showToast);
        return errorMessage;
      }
      return "Error durante la validación";
    }
  };

  /**
   * Establece manualmente un error
   */  const setError = (field: string, message: string, showToast = false) => {
    setErrors(prev => ({
      ...prev,
      [field]: message
    }));
    
    if (showToast) {
      // Usar un ID único para el toast basado en el mensaje para evitar duplicados
      const toastId = `validation-${field}-${message.replace(/\s+/g, '-')}`;
      
      // Comprobar si hay un toast con el mismo ID activo
      if (!toast.isActive(toastId)) {
        toast({
          id: toastId,
          title: "Error de validación",
          description: message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  /**
   * Limpia todos los errores o un campo específico
   */
  const clearErrors = useCallback((fields?: string | string[]) => {
    if (!fields) {
      if (Object.keys(errors).length === 0) {
        return; // No actualizar si ya no hay errores
      }
      setErrors({});
      return;
    }

    const fieldsToClean = Array.isArray(fields) ? fields : [fields];
    
    // Verificar si hay algún campo para limpiar
    let needsUpdate = false;
    for (const field of fieldsToClean) {
      if (errors[field]) {
        needsUpdate = true;
        break;
      }
    }
    
    // Solo actualizar el estado si realmente hay cambios
    if (needsUpdate) {
      setErrors(prev => {
        const newErrors = { ...prev };
        fieldsToClean.forEach(field => {
          delete newErrors[field];
        });
        return newErrors;
      });
    }
  }, [errors]);

  return {
    errors,
    validate,
    validateField,
    setError,
    clearErrors,
    hasErrors: Object.keys(errors).length > 0
  };
}