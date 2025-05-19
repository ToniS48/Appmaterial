import React, { useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  FormErrorMessage,
  HStack,
  Button,
  Text,
  useColorModeValue,
  Flex,
} from '@chakra-ui/react';
import { useFormContext, Controller } from 'react-hook-form';
import { TipoActividad } from '../../types/actividad';
import { TIPOS_ACTIVIDAD } from '../../constants/actividadOptions';
import DatePicker from '../common/DatePicker';
import { Timestamp } from 'firebase/firestore';

export const ActividadInfoForm = () => {
  const { register, control, formState: { errors }, watch, setValue } = useFormContext();

  const [selectedTipos, setSelectedTipos] = useState<TipoActividad[]>([]);

  // Asegúrate que esta función esté actualizada
  const handleTipoChange = (tipo: any) => {
    const currentValues = watch('tipo') || [];
    const isSelected = currentValues.includes(tipo.value);
    
    const newValue = isSelected
      ? currentValues.filter((value: string) => value !== tipo.value)
      : [...currentValues, tipo.value];
    
    setValue('tipo', newValue, { shouldValidate: true });
  };

  return (
    <Box>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
        <FormControl isRequired isInvalid={!!errors.nombre}>
          <FormLabel>Nombre</FormLabel>
          <Input {...register('nombre', { required: 'Nombre obligatorio' })} />
          <FormErrorMessage>{errors.nombre?.message?.toString()}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.lugar}>
          <FormLabel>Lugar</FormLabel>
          <Input {...register('lugar', { required: 'Lugar obligatorio' })} />
          <FormErrorMessage>{errors.lugar?.message?.toString()}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.fechaInicio}>
          <FormLabel>Fecha Inicio</FormLabel>
          <Controller
            control={control}
            name="fechaInicio"
            rules={{ required: 'Fecha de inicio obligatoria' }}
            render={({ field }) => (
              <DatePicker
                selected={field.value instanceof Timestamp ? field.value.toDate() : field.value}
                onChange={(date: Date | null) => field.onChange(date ? Timestamp.fromDate(date) : null)}
              />
            )}
          />
          <FormErrorMessage>{errors.fechaInicio?.message?.toString()}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.fechaFin}>
          <FormLabel>Fecha Fin</FormLabel>
          <Controller
            control={control}
            name="fechaFin"
            rules={{ required: 'Fecha de fin obligatoria' }}
            render={({ field }) => (
              <DatePicker
                selected={field.value instanceof Timestamp ? field.value.toDate() : field.value}
                onChange={(date: Date | null) => field.onChange(date ? Timestamp.fromDate(date) : null)}
              />
            )}
          />
          <FormErrorMessage>{errors.fechaFin?.message?.toString()}</FormErrorMessage>
        </FormControl>

        <FormControl isRequired isInvalid={!!errors.tipo}>
          <FormLabel>Tipo</FormLabel>
          <Flex gap={2} flexWrap="wrap">
            {TIPOS_ACTIVIDAD.map((tipo) => {
              // Verificar si este tipo está seleccionado
              const isSelected = watch('tipo')?.includes(tipo.value);
              
              return (
                <Button
                  key={tipo.value}
                  size="sm"
                  variant={isSelected ? "solid" : "outline"}
                  colorScheme={isSelected ? "brand" : "gray"}
                  onClick={() => handleTipoChange(tipo)}
                  mb={2}
                >
                  {tipo.label}
                </Button>
              );
            })}
          </Flex>
          <FormErrorMessage>{errors.tipo?.message?.toString()}</FormErrorMessage>
        </FormControl>
      </SimpleGrid>
    </Box>
  );
};