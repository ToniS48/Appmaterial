import { useZodValidation } from './useZodValidation';
import { useToast } from '@chakra-ui/react';
import { useCallback, useRef } from 'react';
import validationMessages from '../constants/validationMessages';
import { actividadBaseSchema } from '../schemas/actividadSchema';

/**
 * Hook personalizado para validación de la información básica de actividades
 * Optimizado para evitar violaciones de rendimiento durante el renderizado inicial
 */
export function useActividadInfoValidation() {
  const toast = useToast();
  
  // Llamar el hook directamente al nivel superior (corrige violación de reglas de hooks)
  const { errors, validate, validateField, setError, clearErrors } = useZodValidation(actividadBaseSchema);
  
  // Agregar ref para rastrear el estado de error anterior
  const prevErrorRef = useRef<boolean>(false);
    // Ref para manejar timeouts de validación diferida
  const validationTimeoutRef = useRef<NodeJS.Timeout>();

  // Función helper para diferir validaciones
  const deferValidation = useCallback((validationFn: () => void) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    validationTimeoutRef.current = setTimeout(validationFn, 0);
  }, []);  // Optimizar funciones de validación con useCallback
  const validateNombre = useCallback((nombre: string, silencioso = true) => {
    if (!nombre || nombre.trim() === '') {
      if (!silencioso) {
        setError('nombre', 'El nombre es obligatorio', true);
      }
      return 'El nombre es obligatorio';
    }
    const error = validateField('nombre', nombre);
    return error || undefined;
  }, [validateField, setError]);

  const validateLugar = useCallback((lugar: string, silencioso = true) => {
    if (!lugar || lugar.trim() === '') {
      if (!silencioso) {
        setError('lugar', 'El lugar es obligatorio', true);
      }
      return 'El lugar es obligatorio';
    }
    const error = validateField('lugar', lugar);
    return error || undefined;
  }, [validateField, setError]);  const validateTipo = useCallback((tipo: string[], silencioso = true) => {
    // 🚨 DEBUG VALIDADOR TIPO
    console.log('🔍 [VALIDADOR TIPO] Entrada recibida:', {
      tipo,
      esTipo: typeof tipo,
      esArray: Array.isArray(tipo),
      longitud: tipo?.length,
      contenido: JSON.stringify(tipo, null, 2)
    });
    
    // Tipo es opcional en el formulario básico
    if (!tipo || !Array.isArray(tipo) || tipo.length === 0) {
      console.log('⚠️ [VALIDADOR TIPO] Array vacío o inválido - retornando undefined');
      return undefined; // Sin error si está vacío o no es un array válido
    }
    const error = validateField('tipo', tipo);
    console.log('✅ [VALIDADOR TIPO] Resultado validación:', error || 'SIN ERROR');
    return error || undefined;
  }, [validateField]);  const validateSubtipo = useCallback((subtipo: string[], silencioso = true) => {
    // 🚨 DEBUG VALIDADOR SUBTIPO
    console.log('🔍 [VALIDADOR SUBTIPO] Entrada recibida:', {
      subtipo,
      esTipo: typeof subtipo,
      esArray: Array.isArray(subtipo),
      longitud: subtipo?.length,
      contenido: JSON.stringify(subtipo, null, 2)
    });
    
    // Subtipo es opcional en el formulario básico
    if (!subtipo || !Array.isArray(subtipo) || subtipo.length === 0) {
      console.log('⚠️ [VALIDADOR SUBTIPO] Array vacío o inválido - retornando undefined');
      return undefined; // Sin error si está vacío o no es un array válido
    }
    const error = validateField('subtipo', subtipo);
    console.log('✅ [VALIDADOR SUBTIPO] Resultado validación:', error || 'SIN ERROR');
    return error || undefined;
  }, [validateField]);

  const validateFechaInicio = useCallback((fecha: Date | null | undefined, silencioso = true) => {
    if (!fecha) {
      if (silencioso) {
        return false;
      } else {
        setError('fechaInicio', 'La fecha de inicio es obligatoria', !silencioso);
        return 'La fecha de inicio es obligatoria';
      }
    }
    return validateField('fechaInicio', fecha, { showToast: !silencioso });
  }, [validateField, setError]);
  
  const validateFechaFin = useCallback((fecha: Date | null | undefined, silencioso = true) => {
    if (!fecha) {
      if (silencioso) {
        return false;
      } else {
        setError('fechaFin', 'La fecha de finalización es obligatoria', !silencioso);
        return 'La fecha de finalización es obligatoria';
      }
    }
    return validateField('fechaFin', fecha, { showToast: !silencioso });
  }, [validateField, setError]);

  // Optimizar validateFechas para usar validación diferida
  const validateFechas = useCallback((fechaInicio: Date, fechaFin: Date, silencioso = false) => {
    // Diferir la validación para evitar violaciones
    deferValidation(() => {
      if (fechaInicio && fechaFin) {
        const inicioTime = fechaInicio.getTime();
        const finTime = fechaFin.getTime();
        
        if (inicioTime >= finTime) {
          const errorMsg = 'La fecha de finalización debe ser posterior a la fecha de inicio';
          if (!silencioso) {
            setError('fechaFin', errorMsg, true);
          }
          return false;
        } else {
          // Limpiar errores de fechas si la validación es correcta
          clearErrors(['fechaInicio', 'fechaFin']);
          return true;
        }
      }
      return true;
    });
  }, [deferValidation, setError, clearErrors]);

  // Optimizar handleFieldTouched con useCallback
  const handleFieldTouched = useCallback((fieldName: string) => {
    // Diferir el manejo del campo tocado para evitar violaciones
    deferValidation(() => {
      // Lógica para manejar cuando un campo ha sido tocado
      console.debug(`Campo ${fieldName} tocado`);
    });
  }, [deferValidation]);

  // Cleanup effect para limpiar timeouts
  const cleanup = useCallback(() => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }  }, []);

  return {
    errors,
    validate,
    validateField,
    setError,
    clearErrors,
    validateNombre,
    validateLugar,
    validateTipo,
    validateSubtipo,
    validateFechaInicio,
    validateFechaFin,
    validateFechas,
    handleFieldTouched,
  };
}