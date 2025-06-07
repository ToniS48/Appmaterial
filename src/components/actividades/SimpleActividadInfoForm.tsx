// Versión simplificada del componente sin el hook de validación problemático
import React from 'react';
import {
  FormControl, FormLabel, Input,
  SimpleGrid, Textarea, Box, Button, Wrap, WrapItem
} from '@chakra-ui/react';
import { Controller, useFormContext } from 'react-hook-form';
import DatePicker from '../common/DatePicker';
import { TIPOS_ACTIVIDAD, SUBTIPOS_ACTIVIDAD } from '../../constants/actividadOptions';

export const SimpleActividadInfoForm: React.FC = () => {
  const { register, control, watch, setValue } = useFormContext();
  
  // Observar tipos seleccionados
  const tiposSeleccionados = watch('tipo') || [];
  const subtiposSeleccionados = watch('subtipo') || [];
  
  // Verificación adicional de seguridad para evitar errores de undefined
  const tiposSeguro = Array.isArray(tiposSeleccionados) ? tiposSeleccionados : [];
  const subtiposSeguro = Array.isArray(subtiposSeleccionados) ? subtiposSeleccionados : [];

  const handleTipoToggle = (value: string) => {
    let newValues: string[];
    
    if (tiposSeguro.includes(value)) {
      newValues = tiposSeguro.filter(tipo => tipo !== value);
    } else {
      newValues = [...tiposSeguro, value];
    }
    setValue('tipo', newValues);
  };

  const handleSubtipoToggle = (value: string) => {
    let newValues: string[];
    
    if (subtiposSeguro.includes(value)) {
      newValues = subtiposSeguro.filter(subtipo => subtipo !== value);
    } else {
      newValues = [...subtiposSeguro, value];
    }
    setValue('subtipo', newValues);
  };

  return (
    <Box>
      <FormControl mb={4}>
        <FormLabel>Nombre de la actividad</FormLabel>
        <Input
          {...register('nombre')}
          placeholder="Ejemplo: Exploración Cueva del Agua"
        />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Lugar</FormLabel>
        <Input
          {...register('lugar')}
          placeholder="Ejemplo: Montanejos, Castellón"
        />
      </FormControl>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
        <FormControl>
          <FormLabel>Fecha de inicio</FormLabel>
          <Controller
            name="fechaInicio"
            control={control}
            render={({ field }) => (
              <DatePicker
                selectedDate={field.value}
                onChange={(date: Date | null) => {
                  field.onChange(date);
                }}
              />
            )}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Fecha de finalización</FormLabel>
          <Controller
            name="fechaFin"
            control={control}
            render={({ field }) => (
              <DatePicker
                selectedDate={field.value}
                onChange={(date: Date | null) => {
                  field.onChange(date);
                }}
              />
            )}
          />
        </FormControl>
      </SimpleGrid>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
        <FormControl>
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
          />
        </FormControl>

        <FormControl>
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
                      variant={subtiposSeguro.includes(subtipo.value) ? "solid" : "outline"}
                      colorScheme={subtiposSeguro.includes(subtipo.value) ? "brand" : "gray"}
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
        </FormControl>
      </SimpleGrid>

      <FormControl mb={4}>
        <FormLabel>Descripción</FormLabel>
        <Textarea 
          {...register('descripcion')}
          placeholder="Descripción de la actividad..."
          rows={3}
        />
      </FormControl>
    </Box>
  );
};
