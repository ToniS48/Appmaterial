import React, { useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, FormErrorMessage,
  Input, Textarea, SimpleGrid, Stack, HStack, Text,
  Select, useColorModeValue
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import DatePicker from '../common/DatePicker';
import { Actividad, TipoActividad, SubtipoActividad } from '../../types/actividad';
import { TIPOS_ACTIVIDAD, SUBTIPOS_ACTIVIDAD, DIFICULTADES, OpcionValor } from '../../constants/actividadOptions';

interface InfoEditorProps {
  actividad: Actividad;
  onSave: (infoData: Partial<Actividad>) => void;
  onCancel: () => void;
  mostrarBotones?: boolean;
}

const InfoEditor: React.FC<InfoEditorProps> = ({ actividad, onSave, onCancel, mostrarBotones = true }) => {
  const [selectedTipos, setSelectedTipos] = useState<TipoActividad[]>(actividad.tipo || []);
  const [selectedSubtipos, setSelectedSubtipos] = useState<SubtipoActividad[]>(actividad.subtipo || []);
  
  // Variables de color adaptativas para modo oscuro/claro
  const inputBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, watch } = useForm({
    defaultValues: {
      nombre: actividad.nombre,
      lugar: actividad.lugar,
      descripcion: actividad.descripcion || '',
      fechaInicio: actividad.fechaInicio instanceof Date ? actividad.fechaInicio : 
                   actividad.fechaInicio?.toDate ? actividad.fechaInicio.toDate() : new Date(),
      fechaFin: actividad.fechaFin instanceof Date ? actividad.fechaFin : 
                actividad.fechaFin?.toDate ? actividad.fechaFin.toDate() : new Date(),
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
            bg={inputBg}
            borderColor={borderColor}
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
            bg={inputBg}
            borderColor={borderColor} 
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
          bg={inputBg}
          borderColor={borderColor}
        />
        {errors.descripcion && (
          <FormErrorMessage>{errors.descripcion.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>

      <Box mb={6}>
        <Text fontWeight="bold" mb={2}>Tipo de actividad</Text>
        <HStack spacing={4} mb={4} wrap="wrap">
          {TIPOS_ACTIVIDAD.map(tipo => (
            <Button
              key={tipo.value}
              colorScheme={selectedTipos.includes(tipo.value) ? "brand" : "gray"}
              onClick={() => handleTipoChange(tipo.value)}
              size="sm"
              mb={2}
            >
              {tipo.label}
            </Button>
          ))}
        </HStack>
        
        <Text fontWeight="bold" mb={2}>Subtipo de actividad</Text>
        <HStack spacing={4} wrap="wrap">
          {SUBTIPOS_ACTIVIDAD.map(subtipo => (
            <Button
              key={subtipo.value}
              colorScheme={selectedSubtipos.includes(subtipo.value) ? "brand" : "gray"}
              onClick={() => handleSubtipoChange(subtipo.value)}
              size="sm"
              mb={2}
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
            bg={inputBg}
            borderColor={borderColor}
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
            render={({ field }) => <DatePicker {...field} control={control} bgColor={inputBg} />}
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
            render={({ field }) => <DatePicker {...field} control={control} bgColor={inputBg} />}
          />
          {errors.fechaFin && (
            <FormErrorMessage>{errors.fechaFin.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
      </SimpleGrid>
      
      {mostrarBotones !== false && (
        <HStack spacing={4} mt={4} justify="flex-end">
          <Button onClick={onCancel} variant="outline">Cancelar</Button>
          <Button 
            colorScheme="brand" 
            type="submit" 
            isLoading={isSubmitting}
          >
            Guardar información
          </Button>
        </HStack>
      )}
    </Box>
  );
};

export default InfoEditor;