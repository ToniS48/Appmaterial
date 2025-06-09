import React, { useMemo, useCallback, useRef } from 'react';
import {
  FormControl, FormLabel, FormErrorMessage, Input,
  SimpleGrid, Textarea, Box, Button, Wrap, WrapItem
} from '@chakra-ui/react';
import { Controller, useFormContext, FieldError } from 'react-hook-form';
import DatePicker from '../common/DatePicker';
import { useActividadInfoValidation } from '../../hooks/useActividadInfoValidation';
import { TIPOS_ACTIVIDAD, SUBTIPOS_ACTIVIDAD, DIFICULTADES_ACTIVIDAD } from '../../constants/actividadOptions';
import { TipoActividad, SubtipoActividad } from '../../types/actividad';

// Función helper para extraer el mensaje de error
const getErrorMessage = (error: any): string => {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    if ('message' in error && typeof error.message === 'string') return error.message;
    if ('type' in error && error.type === 'manual') return error.message || '';
  }
  return '';
};

// Definir tipos específicos para mejorar la seguridad de tipo
type FilterCallback<T> = (value: T) => boolean;

// Interfaz para las propiedades del componente
interface ActividadInfoFormProps {
  onCancel?: () => void;
}

export const ActividadInfoForm: React.FC<ActividadInfoFormProps> = ({ onCancel }) => {
  const { register, control, watch, setValue, formState: { errors: formErrors }, setError: setFormError, clearErrors: clearFormErrors } = useFormContext();
  const { 
    errors: validationErrors, 
    validateFechas, 
    validateTipo, 
    validateSubtipo, 
    validateNombre, 
    validateLugar,
    validateFechaInicio,
    validateFechaFin,
    handleFieldTouched 
  } = useActividadInfoValidation();
  
  // Combinar errores del formulario y del hook de validación
  const errors = {
    ...formErrors,
    ...validationErrors
  };
  
  // Usar refs para evitar re-renderizados innecesarios
  const validationTimeoutRef = useRef<NodeJS.Timeout>();
  // Observar fechas y tipos seleccionados para validación cruzada
  const fechaInicio = watch('fechaInicio');
  const fechaFin = watch('fechaFin');
  const tiposSeleccionados = watch('tipo') || [];
  const subtiposSeleccionados = watch('subtipo') || [];
  const dificultadSeleccionada = watch('dificultad') || 'media';
  
  // Verificación adicional de seguridad para evitar errores de undefined
  const tiposSeguro = Array.isArray(tiposSeleccionados) ? tiposSeleccionados : [];
  const subtiposSeguro = Array.isArray(subtiposSeleccionados) ? subtiposSeleccionados : [];

  // Optimización: Diferir la validación de fechas para evitar violaciones
  React.useEffect(() => {
    // Limpiar timeout anterior si existe
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
      // Diferir la validación para el próximo tick
    validationTimeoutRef.current = setTimeout(() => {
      if (fechaInicio && fechaFin) {
        validateFechas(fechaInicio, fechaFin, true); // validación silenciosa
      }
    }, 0);
    
    // Cleanup
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [fechaInicio, fechaFin, validateFechas]);  // Función específica para validar tipos de actividad
  const isValidTipo = useCallback((value: unknown): value is TipoActividad => {
    return value !== null && value !== undefined && typeof value === 'string';
  }, []);

  // Función específica para validar subtipos de actividad
  const isValidSubtipo = useCallback((value: unknown): value is SubtipoActividad => {
    return value !== null && value !== undefined && typeof value === 'string';
  }, []);
  
  // Optimizar con useCallback para evitar re-creaciones
  const handleTipoToggle = useCallback((value: TipoActividad): void => {
    console.log('🎯 [TIPO TOGGLE DEBUG] ANTES DEL TOGGLE:');
    console.log('⏰ Timestamp:', new Date().toLocaleTimeString());
    console.log('🔘 Valor a togglear:', value);
    console.log('📦 Estado actual tiposSeguro:', tiposSeguro);
    console.log('📋 Estado tiposSeleccionados:', tiposSeleccionados);
    console.log('✅ Es array tiposSeguro:', Array.isArray(tiposSeguro));
    console.log('📏 Longitud tiposSeguro:', tiposSeguro.length);

    let newValues: TipoActividad[];
    
    // Filtrar valores con tipo explícito
    const filterValidTipos: FilterCallback<TipoActividad> = 
      (tipo) => tipo !== value && isValidTipo(tipo);
      
    if (tiposSeguro.includes(value)) {
      // Si ya está seleccionado, lo quitamos (filtrando valores nulos/indefinidos)
      newValues = tiposSeguro.filter(filterValidTipos);
    } else {
      // Si no está seleccionado, lo añadimos (filtrando valores nulos/indefinidos)
      newValues = [...tiposSeguro.filter(isValidTipo), value];
    }
    
    console.log('🎯 [TIPO TOGGLE DEBUG] DESPUÉS DEL TOGGLE:');
    console.log('⏰ Timestamp:', new Date().toLocaleTimeString());
    console.log('🔘 Valor toggleado:', value);
    console.log('📦 Valores antiguos:', tiposSeguro);
    console.log('🆕 Valores nuevos:', newValues);
    console.log('✅ Es array newValues:', Array.isArray(newValues));    console.log('📏 Longitud newValues:', newValues.length);    setValue('tipo', newValues);
    // Diferir la validación para evitar violaciones
    setTimeout(() => {
      const errorMsg = validateTipo(newValues);
      if (errorMsg) {
        setFormError('tipo', { type: 'manual', message: errorMsg });
      } else {
        clearFormErrors('tipo');
      }
    }, 0);}, [tiposSeguro, isValidTipo, setValue, validateTipo, tiposSeleccionados]);
  
  // Optimizar con useCallback para evitar re-creaciones
  const handleSubtipoToggle = useCallback((value: SubtipoActividad): void => {
    console.log('🎯 [SUBTIPO TOGGLE DEBUG] ANTES DEL TOGGLE:');
    console.log('⏰ Timestamp:', new Date().toLocaleTimeString());
    console.log('🔘 Valor a togglear:', value);
    console.log('📦 Estado actual subtiposSeguro:', subtiposSeguro);
    console.log('📋 Estado subtiposSeleccionados:', subtiposSeleccionados);
    console.log('✅ Es array subtiposSeguro:', Array.isArray(subtiposSeguro));
    console.log('📏 Longitud subtiposSeguro:', subtiposSeguro.length);

    let newValues: SubtipoActividad[];
    
    // Filtrar valores con tipo explícito
    const filterValidSubtipos: FilterCallback<SubtipoActividad> = 
      (subtipo) => subtipo !== value && isValidSubtipo(subtipo);
      
    if (subtiposSeguro.includes(value)) {
      // Si ya está seleccionado, lo quitamos (filtrando valores nulos/indefinidos)
      newValues = subtiposSeguro.filter(filterValidSubtipos);
    } else {
      // Si no está seleccionado, lo añadimos (filtrando valores nulos/indefinidos)
      newValues = [...subtiposSeguro.filter(isValidSubtipo), value];
    }
    
    console.log('🎯 [SUBTIPO TOGGLE DEBUG] DESPUÉS DEL TOGGLE:');
    console.log('⏰ Timestamp:', new Date().toLocaleTimeString());
    console.log('🔘 Valor toggleado:', value);
    console.log('📦 Valores antiguos:', subtiposSeguro);
    console.log('🆕 Valores nuevos:', newValues);
    console.log('✅ Es array newValues:', Array.isArray(newValues));    console.log('📏 Longitud newValues:', newValues.length);
      setValue('subtipo', newValues);
    // Diferir la validación para evitar violaciones
    setTimeout(() => {
      const errorMsg = validateSubtipo(newValues);
      if (errorMsg) {
        setFormError('subtipo', { type: 'manual', message: errorMsg });
      }
    }, 0);
  }, [subtiposSeguro, isValidSubtipo, setValue, validateSubtipo, subtiposSeleccionados]);

  // Optimizar con useCallback para el manejo de dificultad
  const handleDificultadToggle = useCallback((value: 'baja' | 'media' | 'alta'): void => {
    console.log('🎯 [DIFICULTAD TOGGLE DEBUG]:', {
      valorSeleccionado: value,
      dificultadActual: dificultadSeleccionada,
      timestamp: new Date().toLocaleTimeString()
    });
    
    setValue('dificultad', value);
  }, [dificultadSeleccionada, setValue]);
  // Memoizar opciones de tipos para evitar re-renderizados
  const tipoOptions = useMemo(() => TIPOS_ACTIVIDAD, []);
  const subtipoOptions = useMemo(() => SUBTIPOS_ACTIVIDAD, []);
  const dificultadOptions = useMemo(() => DIFICULTADES_ACTIVIDAD, []);

  return (
    <Box>      <FormControl isRequired isInvalid={!!errors.nombre} mb={4}>
        <FormLabel>Nombre de la actividad</FormLabel>
        <Input          {...register('nombre', {
            required: true,
            onBlur: (e) => {
              handleFieldTouched('nombre');
              // Validación silenciosa (mostrar error inline pero no toast)
              validateNombre(e.target.value, true);
            }
          })}
          placeholder="Ejemplo: Exploración Cueva del Agua"
        />        {errors.nombre && (
          <FormErrorMessage>{getErrorMessage(errors.nombre)}</FormErrorMessage>
        )}
      </FormControl>

      <FormControl isRequired isInvalid={!!errors.lugar} mb={4}>
        <FormLabel>Lugar</FormLabel>
        <Input          {...register('lugar', {
                        required: true,
            onBlur: (e) => {
              handleFieldTouched('lugar');
              validateLugar(e.target.value, true);
            }
          })}
          placeholder="Ejemplo: Montanejos, Castellón"
        />        {errors.lugar && (
          <FormErrorMessage>{getErrorMessage(errors.lugar)}</FormErrorMessage>
        )}
      </FormControl>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
        <FormControl isRequired isInvalid={!!errors.fechaInicio}>
          <FormLabel>Fecha de inicio</FormLabel>
          <Controller
            name="fechaInicio"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (              <DatePicker
                selectedDate={field.value}
                onChange={(date: Date | null) => {
                  field.onChange(date);
                  if (date) {
                                      handleFieldTouched('fechaInicio');
                    validateFechaInicio(date, true);
                  }
                }}
              />
            )}
          />          {errors.fechaInicio && (
            <FormErrorMessage>{getErrorMessage(errors.fechaInicio)}</FormErrorMessage>
          )}
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.fechaFin}>
          <FormLabel>Fecha de finalización</FormLabel>
          <Controller
            name="fechaFin"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (              <DatePicker
                selectedDate={field.value}
                                onChange={(date: Date | null) => {
                  field.onChange(date);
                  if (date) {
                    handleFieldTouched('fechaFin');
                    validateFechaFin(date, true);
                  }
                }}
              />
            )}
          />          {errors.fechaFin && (
            <FormErrorMessage>{getErrorMessage(errors.fechaFin)}</FormErrorMessage>
          )}
        </FormControl>
      </SimpleGrid>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>        {/* Selección de tipo por botones */}
        <FormControl isRequired isInvalid={!!errors.tipo}>
          <FormLabel>Tipo de actividad</FormLabel>
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <Wrap spacing={2}>                {tipoOptions.map((tipo) => (
                  <WrapItem key={tipo.value}>
                    <Button
                      size="sm"
                      variant={tiposSeguro.includes(tipo.value) ? "solid" : "outline"}
                      colorScheme={tiposSeguro.includes(tipo.value) ? "brand" : "gray"}
                      onClick={() => handleTipoToggle(tipo.value)}
                      mb={1}
                    >
                      {tipo.label}
                    </Button>
                  </WrapItem>
                ))}
              </Wrap>
            )}
          />          {errors.tipo && (
            <FormErrorMessage>{getErrorMessage(errors.tipo)}</FormErrorMessage>
          )}
        </FormControl>        {/* Selección de subtipo por botones */}
        <FormControl isRequired isInvalid={!!errors.subtipo}>
          <FormLabel>Subtipo</FormLabel>
          <Controller
            name="subtipo"
            control={control}
            render={({ field }) => (
              <Wrap spacing={2}>
                {subtipoOptions.map((subtipo) => (
                  <WrapItem key={subtipo.value}>                    <Button
                      size="sm"
                      variant={subtiposSeguro.includes(subtipo.value) ? "solid" : "outline"}
                      colorScheme={subtiposSeguro.includes(subtipo.value) ? "brand" : "gray"}
                      onClick={() => handleSubtipoToggle(subtipo.value)}
                      mb={1}
                    >
                      {subtipo.label}
                    </Button>
                  </WrapItem>
                ))}              </Wrap>
            )}
          />          {errors.subtipo && (
            <FormErrorMessage>{getErrorMessage(errors.subtipo)}</FormErrorMessage>
          )}</FormControl>
      </SimpleGrid>      <FormControl mb={4}>
        <FormLabel>Dificultad</FormLabel>
        <Controller
          name="dificultad"
          control={control}
          render={({ field }) => (
            <Wrap spacing={2}>
              {dificultadOptions.map((dificultad) => (
                <WrapItem key={dificultad.value}>
                  <Button
                    size="sm"
                    variant={dificultadSeleccionada === dificultad.value ? "solid" : "outline"}
                    colorScheme={dificultadSeleccionada === dificultad.value ? dificultad.color : "gray"}
                    onClick={() => handleDificultadToggle(dificultad.value)}
                    mb={1}
                  >
                    {dificultad.label}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
          )}
        />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Descripción</FormLabel>
        <Textarea 
          id="descripcion"  // Añadir esta línea
          {...register('descripcion')}
          placeholder="Descripción de la actividad..."
          rows={3}
        />
      </FormControl>
    </Box>
  );
};