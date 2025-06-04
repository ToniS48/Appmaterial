import { useEffect, useState, useRef, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { checkEmailAvailability, validateEmail } from '../utils/validationUtils';
import { handleFirebaseError } from '../utils/errorHandling';
import messages from '../constants/messages';
import { LoadingState } from '../types/ui';

// Tipos genéricos para flexibilidad
type FormValues = Record<string, string>;
type FormErrors = Record<string, string>;
type ValidationFunction = (value: string, formValues?: FormValues) => string;

// Interfaz para las opciones de configuración
interface ValidationOptions {
  validateOnChange?: boolean;
  validateEmail?: boolean;
  checkEmailAvailability?: boolean;
  debounceTime?: number;
}

// Interfaz para las reglas de validación
interface ValidationRules<T extends FormValues> {
  [key: string]: ValidationFunction | {
    validate: ValidationFunction;
    dependsOn?: Array<keyof T>;  // Esto asegura que solo se pueden usar claves de T
  };
}

// Nueva interfaz para el caché de emails con TTL
interface EmailCacheEntry {
  isAvailable: boolean;
  timestamp: number;
}

// Constantes para el caché
const EMAIL_CACHE_MAX_SIZE = 100;
const EMAIL_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

// Lista de dominios de email temporales/desechables comunes
const DISPOSABLE_EMAIL_DOMAINS = [
  'yopmail.com',
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'guerrillamail.com',
  'example.com'
];

export function useFormValidation<T extends FormValues>(
  initialValues: T,
  validationRules: ValidationRules<T>,
  options: ValidationOptions = {}
) {
  const {
    validateOnChange = true,
    validateEmail: shouldValidateEmail = false,
    checkEmailAvailability: shouldCheckEmail = false,
    debounceTime = 500
  } = options;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  
  // Caché para los emails ya verificados - modificado para incluir timestamp
  const emailCacheRef = useRef<Record<string, EmailCacheEntry>>({});

  // Función para limpiar entradas antiguas del caché
  const cleanupExpiredCache = () => {
    const now = Date.now();
    const updatedCache: Record<string, EmailCacheEntry> = {};
    
    // Mantener solo las entradas que no han expirado
    Object.entries(emailCacheRef.current).forEach(([email, entry]) => {
      if (now - entry.timestamp < EMAIL_CACHE_TTL) {
        updatedCache[email] = entry;
      }
    });
    
    emailCacheRef.current = updatedCache;
  };

  // Función para validar un campo individual
  const validateField = (name: string, value: string): string => {
    const rule = validationRules[name];
    
    if (!rule) return '';
    
    if (typeof rule === 'function') {
      return rule(value, values);
    } else {
      return rule.validate(value, values);
    }
  };

  // Función para verificar si un email podría ser desechable o inválido
  const isPotentiallyInvalidEmail = (email: string): boolean => {
    if (!email || email.trim().length === 0) return true;
    
    // Verificar formato básico antes de analizar partes
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return true;
    
    const domain = email.split('@')[1].toLowerCase();
    
    // Verificar si es un dominio de email desechable conocido
    return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
  };  // Función debounced para verificar disponibilidad de email con optimizaciones
  const debouncedCheckEmail = useRef<ReturnType<typeof debounce>>();

  // Inicializar la función debounced
  useEffect(() => {
    debouncedCheckEmail.current = debounce(async (email: string) => {
      // No verificar si el email está vacío o es obviamente inválido
      if (!email || email.trim().length === 0) {
        return;
      }

      try {
        setLoadingState('validating_email');
        
        // Validar el formato del email antes de continuar
        const emailFormatError = validateEmail(email);
        if (emailFormatError) {
          setErrors(prev => ({ ...prev, email: emailFormatError }));
          return;
        }
        
        // Verificar si el email podría ser desechable o temporario
        if (isPotentiallyInvalidEmail(email)) {
          setErrors(prev => ({ ...prev, email: messages.validation.disposableEmail }));
          return;
      }
      
      // Verificar y limpiar el caché si es necesario
      const now = Date.now();
      
      // Limpiar entradas expiradas antes de verificar
      cleanupExpiredCache();
      
      // Limitar tamaño del caché
      if (Object.keys(emailCacheRef.current).length > EMAIL_CACHE_MAX_SIZE) {
        // Si el caché es demasiado grande, lo reiniciamos
        emailCacheRef.current = {};
      }
      
      // Verificar si ya hemos consultado este email antes y no ha expirado
      if (emailCacheRef.current[email] !== undefined) {
        const cacheEntry = emailCacheRef.current[email];
        
        // Verificar si la entrada del caché no ha expirado
        if (now - cacheEntry.timestamp < EMAIL_CACHE_TTL) {
          if (!cacheEntry.isAvailable) {
            setErrors(prev => ({ ...prev, email: messages.validation.emailInUse }));
          } else {
            // Limpiar el error si el email está disponible
            setErrors(prev => {
              const newErrors = { ...prev };
              if (newErrors.email === messages.validation.emailInUse) {
                delete newErrors.email;
              }
              return newErrors;
            });
          }
          setLoadingState('idle');
          return;
        }
      }

      // Si pasó todas las validaciones previas o la entrada del caché ha expirado, ahora sí verificar con Firebase
      if (shouldCheckEmail) {
        try {
          const isAvailable = await checkEmailAvailability(email);
          
          // Guardar en caché el resultado para futuras verificaciones
          emailCacheRef.current[email] = {
            isAvailable: isAvailable,
            timestamp: now
          };
          
          if (!isAvailable) {
            setErrors(prev => ({ ...prev, email: messages.validation.emailInUse }));
          } else {
            // Limpiar el error si el email está disponible
            setErrors(prev => {
              const newErrors = { ...prev };
              if (newErrors.email === messages.validation.emailInUse) {
                delete newErrors.email;
              }
              return newErrors;
            });
          }
        } catch (error) {
          handleFirebaseError(error, messages.validation.emailCheckError);
        }
      }      } finally {
        setLoadingState('idle');
      }
    }, debounceTime);
  }, [shouldCheckEmail, debounceTime]);

  // Crear la referencia para acceder al método cancel
  const checkEmailAvailabilityDebounced = debouncedCheckEmail.current;

  // Manejador de cambios en campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setValues(prev => ({ ...prev, [name]: value }));
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    
    if (validateOnChange && touchedFields[name]) {
      // Validar el campo actual
      const error = validateField(name, value);
      
      setErrors(prev => ({ ...prev, [name]: error }));
        // Para email, verificar disponibilidad si no hay errores de formato
      if (name === 'email' && shouldValidateEmail) {
        if (!error && value.trim()) {  // Solo verificar si no hay error de formato y no está vacío
          checkEmailAvailabilityDebounced?.(value);
        } else {
          // Cancelar cualquier verificación pendiente si el email no es válido
          checkEmailAvailabilityDebounced?.cancel();
          setLoadingState('idle');
        }
      }
      
      // Verificar campos dependientes (como confirmPassword cuando cambia password)
      const dependentFields = Object.entries(validationRules).filter(([_, rule]) => {
        if (typeof rule === 'object' && rule.dependsOn) {
          return rule.dependsOn.includes(name as keyof T);
        }
        return false;
      });
      
      dependentFields.forEach(([fieldName]) => {
        const fieldValue = values[fieldName];
        if (fieldValue && touchedFields[fieldName]) {
          const dependentError = validateField(fieldName, fieldValue);
          setErrors(prev => ({ ...prev, [fieldName]: dependentError }));
        }
      });
    }
  };
  // Validar todo el formulario
  const validateForm = async (): Promise<boolean> => {
    const newErrors: FormErrors = {};
    checkEmailAvailabilityDebounced?.cancel(); // Cancelar cualquier verificación pendiente
    
    // Validar cada campo
    for (const fieldName in validationRules) {
      const value = values[fieldName] || '';
      const error = validateField(fieldName, value);
      newErrors[fieldName] = error;
    }
    
    // Verificar disponibilidad de email si es necesario
    if (shouldValidateEmail && shouldCheckEmail && values.email && !newErrors.email) {
      try {
        setLoadingState('validating_email');
        
        // Verificar si el email podría ser desechable
        if (isPotentiallyInvalidEmail(values.email)) {
          newErrors.email = messages.validation.disposableEmail;
        } else {
          // Limpiar caché expirado antes de verificar
          cleanupExpiredCache();
          
          const now = Date.now();
          const cachedResult = emailCacheRef.current[values.email];
          
          if (cachedResult && now - cachedResult.timestamp < EMAIL_CACHE_TTL) {
            // Usar el resultado en caché si no ha expirado
            if (!cachedResult.isAvailable) {
              newErrors.email = messages.validation.emailInUse;
            }
          } else {
            // Si no está en caché o ha expirado, consultar Firebase
            const isAvailable = await checkEmailAvailability(values.email);
            
            // Actualizar el caché con el nuevo resultado
            emailCacheRef.current[values.email] = {
              isAvailable: isAvailable,
              timestamp: now
            };
            
            if (!isAvailable) {
              newErrors.email = messages.validation.emailInUse;
            }
          }
        }
      } catch (error) {
        handleFirebaseError(error, messages.validation.emailCheckError);
        newErrors.email = messages.validation.emailCheckError;
      } finally {
        setLoadingState('idle');
      }
    }
    
    setErrors(newErrors);
    setTouchedFields(
      Object.keys(validationRules).reduce((acc, field) => ({ ...acc, [field]: true }), {})
    );
    
    return !Object.values(newErrors).some(error => error !== '');
  };

  // Función para establecer valores y errores manualmente (útil para inicialización)
  const setFormValues = (newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  };
  
  // Función para resetear el formulario
  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouchedFields({});
    // Ahora ejecutamos una limpieza del caché en lugar de mantenerlo indefinidamente
    cleanupExpiredCache();
  };
    // Limpiar debounce al desmontar
  useEffect(() => {
    return () => {
      checkEmailAvailabilityDebounced?.cancel();
      // También podríamos ejecutar cleanupExpiredCache aquí
    };
  }, [checkEmailAvailabilityDebounced]);

  return {
    values,
    errors,
    loadingState,
    isValidatingEmail: loadingState === 'validating_email',
    handleChange,
    validateForm,
    setFormValues,
    resetForm,
    setLoadingState
  };
}