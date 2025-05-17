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
} from '@chakra-ui/react';
import { useFormContext, Controller } from 'react-hook-form';
import { TipoActividad } from '../../types/actividad';
import { TIPOS_ACTIVIDAD } from '../../constants/actividadOptions';
import DatePicker from '../common/DatePicker';
import { Timestamp } from 'firebase/firestore';

export const ActividadInfoForm = () => {
  const { register, control, formState: { errors } } = useFormContext();

  const [selectedTipos, setSelectedTipos] = useState<TipoActividad[]>([]);

  const handleTipoChange = (tipo: { value: TipoActividad; label: string }) => {
    setSelectedTipos(prevTipos => {
      const isSelected = prevTipos.includes(tipo.value);
      const newTipos = isSelected ? prevTipos.filter(t => t !== tipo.value) : [...prevTipos, tipo.value];
      return newTipos;
    });
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
          {TIPOS_ACTIVIDAD.map((tipo) => (
            <div key={tipo.value}>
              <label>
                <input 
                  type="checkbox" 
                  value={tipo.value}
                  {...register('tipo')}
                  onChange={() => handleTipoChange(tipo)}
                />
                {tipo.label}
              </label>
            </div>
          ))}
          <FormErrorMessage>{errors.tipo?.message?.toString()}</FormErrorMessage>
        </FormControl>
      </SimpleGrid>
    </Box>
  );
};