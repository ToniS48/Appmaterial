import React, { useState } from 'react';
import {
  FormControl, FormLabel, FormErrorMessage, Input,
  Checkbox, SimpleGrid, Textarea, Box, Button, Wrap, WrapItem,
  HStack, Tag, TagLabel, TagCloseButton, Flex
} from '@chakra-ui/react';
import { Controller, useFormContext } from 'react-hook-form';
import DatePicker from '../common/DatePicker';
import { useActividadInfoValidation } from '../../hooks/useActividadInfoValidation';
import { TIPOS_ACTIVIDAD, SUBTIPOS_ACTIVIDAD } from '../../constants/actividadOptions';
import { TipoActividad, SubtipoActividad, TipoActividadOption, SubtipoActividadOption } from '../../types/actividad';
import { FiX } from 'react-icons/fi';
import validationMessages from '../../constants/validationMessages';

// Definir tipos específicos para mejorar la seguridad de tipo
type FilterCallback<T> = (value: T) => boolean;
type FindOptionCallback<T extends string, U extends {value: T, label: string}> = (option: U) => boolean;

// Interfaz para las propiedades del componente
interface ActividadInfoFormProps {
  onCancel?: () => void;
}

export const ActividadInfoForm: React.FC<ActividadInfoFormProps> = ({ onCancel }) => {
  const { register, control, watch, setValue } = useFormContext();
  const validation = useActividadInfoValidation();
  
  // Observar fechas y tipos seleccionados para validación cruzada
  const fechaInicio = watch('fechaInicio');
  const fechaFin = watch('fechaFin');
  const tiposSeleccionados = watch('tipo') || [];
  const subtiposSeleccionados = watch('subtipo') || [];
    // Validar fechas relacionadas cuando ambas están presentes
  React.useEffect(() => {
    if (fechaInicio && fechaFin) {
      validation.validateFechas(fechaInicio, fechaFin, true); // validación silenciosa
    }
  }, [fechaInicio, fechaFin, validation]);

  // Función helper tipada para filtrar valores no válidos (null/undefined)
  const isValidValue = <T extends string>(value: unknown): value is T => {
    return value !== null && value !== undefined && typeof value === 'string';
  };

  // Función helper tipada para encontrar opciones en arrays
  const findOptionByValue = <T extends string, U extends {value: T, label: string}>(
    options: ReadonlyArray<U>,
    value: T
  ): U | undefined => {
    return options.find((option) => option.value === value);
  };

  // Manejar selección de tipo con tipado correcto
  const handleTipoToggle = (value: TipoActividad): void => {
    let newValues: TipoActividad[];
    
    // Filtrar valores con tipo explícito
    const filterValidTipos: FilterCallback<TipoActividad> = 
      (tipo) => tipo !== value && isValidValue(tipo);
      
    if (tiposSeleccionados.includes(value)) {
      // Si ya está seleccionado, lo quitamos (filtrando valores nulos/indefinidos)
      newValues = tiposSeleccionados.filter(filterValidTipos);
    } else {
      // Si no está seleccionado, lo añadimos (filtrando valores nulos/indefinidos)
      newValues = [...tiposSeleccionados.filter(isValidValue), value];
    }
    setValue('tipo', newValues);
    validation.validateTipo(newValues);
  };

  // Manejar selección de subtipo con tipado correcto
  const handleSubtipoToggle = (value: SubtipoActividad): void => {
    let newValues: SubtipoActividad[];
    
    // Filtrar valores con tipo explícito
    const filterValidSubtipos: FilterCallback<SubtipoActividad> = 
      (subtipo) => subtipo !== value && isValidValue(subtipo);
      
    if (subtiposSeleccionados.includes(value)) {
      // Si ya está seleccionado, lo quitamos (filtrando valores nulos/indefinidos)
      newValues = subtiposSeleccionados.filter(filterValidSubtipos);
    } else {
      // Si no está seleccionado, lo añadimos (filtrando valores nulos/indefinidos)
      newValues = [...subtiposSeleccionados.filter(isValidValue), value];
    }
    setValue('subtipo', newValues);
    validation.validateSubtipo(newValues);
  };

  // Añadir estado para control de campos tocados
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Marcar un campo como tocado cuando el usuario interactúa con él
  const handleFieldTouched = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  return (
    <Box>
      <FormControl isRequired isInvalid={!!validation.errors.nombre} mb={4}>
        <FormLabel>Nombre de la actividad</FormLabel>
        <Input          {...register('nombre', {
            required: true,
            onBlur: (e) => {
              handleFieldTouched('nombre');
              // Validación silenciosa (mostrar error inline pero no toast)
              validation.validateNombre(e.target.value, true);
            }
          })}
          placeholder="Ejemplo: Exploración Cueva del Agua"
        />
        {validation.errors.nombre && (
          <FormErrorMessage>{validation.errors.nombre}</FormErrorMessage>
        )}
      </FormControl>

      <FormControl isRequired isInvalid={!!validation.errors.lugar} mb={4}>
        <FormLabel>Lugar</FormLabel>
        <Input          {...register('lugar', {
            required: true,
            onBlur: (e) => {
              handleFieldTouched('lugar');
              validation.validateLugar(e.target.value, true);
            }
          })}
          placeholder="Ejemplo: Montanejos, Castellón"
        />
        {validation.errors.lugar && (
          <FormErrorMessage>{validation.errors.lugar}</FormErrorMessage>
        )}
      </FormControl>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
        <FormControl isRequired isInvalid={!!validation.errors.fechaInicio}>
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
                    validation.validateFechaInicio(date, true);
                  }
                }}
              />
            )}
          />
          {validation.errors.fechaInicio && (
            <FormErrorMessage>{validation.errors.fechaInicio}</FormErrorMessage>
          )}
        </FormControl>

        <FormControl isRequired isInvalid={!!validation.errors.fechaFin}>
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
                    validation.validateFechaFin(date, true);
                  }
                }}
              />
            )}
          />
          {validation.errors.fechaFin && (
            <FormErrorMessage>{validation.errors.fechaFin}</FormErrorMessage>
          )}
        </FormControl>
      </SimpleGrid>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>        {/* Selección de tipo por botones */}
        <FormControl isInvalid={!!validation.errors.tipo}>
          <FormLabel>Tipo de actividad</FormLabel>
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <Wrap spacing={2}>
                {TIPOS_ACTIVIDAD.map((tipo) => (
                  <WrapItem key={tipo.value}>
                    <Button
                      size="sm"
                      variant={tiposSeleccionados.includes(tipo.value) ? "solid" : "outline"}
                      colorScheme={tiposSeleccionados.includes(tipo.value) ? "brand" : "gray"}
                      onClick={() => handleTipoToggle(tipo.value)}
                      mb={1}
                    >
                      {tipo.label}
                    </Button>
                  </WrapItem>
                ))}
              </Wrap>
            )}
          />
          {validation.errors.tipo && (
            <FormErrorMessage>{validation.errors.tipo}</FormErrorMessage>
          )}
        </FormControl>        {/* Selección de subtipo por botones */}
        <FormControl isInvalid={!!validation.errors.subtipo}>
          <FormLabel>Subtipo</FormLabel>
          <Controller
            name="subtipo"
            control={control}
            render={({ field }) => (
              <Wrap spacing={2}>
                {SUBTIPOS_ACTIVIDAD.map((subtipo) => (
                  <WrapItem key={subtipo.value}>
                    <Button
                      size="sm"
                      variant={subtiposSeleccionados.includes(subtipo.value) ? "solid" : "outline"}
                      colorScheme={subtiposSeleccionados.includes(subtipo.value) ? "brand" : "gray"}
                      onClick={() => handleSubtipoToggle(subtipo.value)}
                      mb={1}
                    >
                      {subtipo.label}
                    </Button>
                  </WrapItem>
                ))}
              </Wrap>
            )}
          />
          {validation.errors.subtipo && (
            <FormErrorMessage>{validation.errors.subtipo}</FormErrorMessage>
          )}
        </FormControl>
      </SimpleGrid>

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