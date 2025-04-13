import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, FormErrorMessage,
  Input, Textarea, SimpleGrid, Stack, HStack, Text,
  Select
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import DatePicker from '../common/DatePicker';
import { Actividad, TipoActividad, SubtipoActividad } from '../../types/actividad';
import { TIPOS_ACTIVIDAD, SUBTIPOS_ACTIVIDAD, DIFICULTADES, OpcionValor } from '../../constants/actividadOptions';
import { Timestamp } from 'firebase/firestore';
import { FiArrowRight } from 'react-icons/fi';

interface InfoEditorProps {
  actividad: Actividad;
  onSave: (data: Partial<Actividad>) => void;
  onCancel: () => void;
}

const InfoEditor: React.FC<InfoEditorProps> = ({ actividad, onSave, onCancel }) => {
  const [selectedTipos, setSelectedTipos] = useState<TipoActividad[]>(actividad.tipo || []);
  const [selectedSubtipos, setSelectedSubtipos] = useState<SubtipoActividad[]>(actividad.subtipo || []);
  
  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      nombre: actividad.nombre,
      lugar: actividad.lugar,
      descripcion: actividad.descripcion || '',
      fechaInicio: actividad.fechaInicio instanceof Date ? actividad.fechaInicio : new Date(actividad.fechaInicio.toDate()),
      fechaFin: actividad.fechaFin instanceof Date ? actividad.fechaFin : new Date(actividad.fechaFin.toDate()),
      dificultad: actividad.dificultad || 'media'
    }
  });

  const handleTipoChange = (tipo: TipoActividad) => {
    if (selectedTipos.includes(tipo)) {
      setSelectedTipos(selectedTipos.filter(t => t !== tipo));
    } else {
      setSelectedTipos([...selectedTipos, tipo]);
    }
  };

  const handleSubtipoChange = (subtipo: SubtipoActividad) => {
    if (selectedSubtipos.includes(subtipo)) {
      setSelectedSubtipos(selectedSubtipos.filter(s => s !== subtipo));
    } else {
      setSelectedSubtipos([...selectedSubtipos, subtipo]);
    }
  };

  const onSubmit = (data: any) => {
    onSave({
      ...data,
      tipo: selectedTipos,
      subtipo: selectedSubtipos
    });
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
        <FormControl isRequired isInvalid={!!errors.nombre}>
          <FormLabel>Nombre</FormLabel>
          <Input 
            {...register('nombre', { 
              required: 'El nombre es obligatorio',
              maxLength: { value: 100, message: 'El nombre es demasiado largo' }
            })} 
          />
          {errors.nombre && (
            <FormErrorMessage>{errors.nombre.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.lugar}>
          <FormLabel>Lugar</FormLabel>
          <Input 
            {...register('lugar', { 
              required: 'El lugar es obligatorio'
            })} 
          />
          {errors.lugar && (
            <FormErrorMessage>{errors.lugar.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
      </SimpleGrid>

      <FormControl mb={6} isInvalid={!!errors.descripcion}>
        <FormLabel>Descripción</FormLabel>
        <Textarea 
          {...register('descripcion')} 
          placeholder="Descripción detallada de la actividad"
          rows={3}
        />
        {errors.descripcion && (
          <FormErrorMessage>{errors.descripcion.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>

      <Box mb={6}>
        <Text fontWeight="bold" mb={2}>Tipo de actividad</Text>
        <HStack spacing={4} mb={4}>
          {TIPOS_ACTIVIDAD.map(tipo => (
            <Button
              key={tipo.value}
              colorScheme={selectedTipos.includes(tipo.value) ? "brand" : "gray"}
              onClick={() => handleTipoChange(tipo.value)}
              size="sm"
            >
              {tipo.label}
            </Button>
          ))}
        </HStack>
        
        <Text fontWeight="bold" mb={2}>Subtipo de actividad</Text>
        <HStack spacing={4}>
          {SUBTIPOS_ACTIVIDAD.map(subtipo => (
            <Button
              key={subtipo.value}
              colorScheme={selectedSubtipos.includes(subtipo.value) ? "brand" : "gray"}
              onClick={() => handleSubtipoChange(subtipo.value)}
              size="sm"
            >
              {subtipo.label}
            </Button>
          ))}
        </HStack>

        <FormControl isRequired isInvalid={!!errors.dificultad} mt={4}>
          <FormLabel>Dificultad</FormLabel>
          <Select 
            {...register('dificultad', { 
              required: 'La dificultad es obligatoria'
            })}
          >
            {DIFICULTADES.map((dificultad: OpcionValor) => (
              <option key={dificultad.value} value={dificultad.value}>
                {dificultad.label}
              </option>
            ))}
          </Select>
          {errors.dificultad && (
            <FormErrorMessage>{errors.dificultad.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
        <FormControl isRequired isInvalid={!!errors.fechaInicio}>
          <FormLabel>Fecha de inicio</FormLabel>
          <Controller
            name="fechaInicio"
            control={control}
            rules={{ required: 'La fecha de inicio es obligatoria' }}
            render={({ field }) => <DatePicker {...field} control={control} />}
          />
          {errors.fechaInicio && (
            <FormErrorMessage>{errors.fechaInicio.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.fechaFin}>
          <FormLabel>Fecha de fin</FormLabel>
          <Controller
            name="fechaFin"
            control={control}
            rules={{ 
              required: 'La fecha de finalización es obligatoria',
              validate: {
                afterStart: (value: Date) => {
                  const fechaInicio = watch('fechaInicio');
                  return !fechaInicio || value >= fechaInicio || 
                    'La fecha de finalización debe ser posterior a la fecha de inicio';
                }
              }
            }}
            render={({ field }) => <DatePicker {...field} control={control} />}
          />
          {errors.fechaFin && (
            <FormErrorMessage>{errors.fechaFin.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
      </SimpleGrid>
      
      {/* Botones de guardar/cancelar */}
      <Stack direction="row" spacing={4} mt={6} justify="flex-end">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" colorScheme="brand" rightIcon={<FiArrowRight />}>
          Continuar: Participantes
        </Button>
      </Stack>
    </Box>
  );
};

export default InfoEditor;