import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
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

const InfoEditor = forwardRef<
  { submitForm: () => void },
  InfoEditorProps
>(({ actividad, onSave, onCancel, mostrarBotones = false }, ref) => {
  const [selectedTipos, setSelectedTipos] = useState<TipoActividad[]>(actividad.tipo || []);
  const [selectedSubtipos, setSelectedSubtipos] = useState<SubtipoActividad[]>(actividad.subtipo || []);
  
  // Sincronizar estado local cuando cambien las props de la actividad
  useEffect(() => {
    console.log("InfoEditor - useEffect sincronizando con actividad:", actividad);
    console.log("InfoEditor - tipos recibidos en props:", actividad.tipo);
    console.log("InfoEditor - subtipos recibidos en props:", actividad.subtipo);
    
    setSelectedTipos(actividad.tipo || []);
    setSelectedSubtipos(actividad.subtipo || []);
  }, [actividad.tipo, actividad.subtipo]);
  
  // Variables de color adaptativas para modo oscuro/claro
  const inputBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
    const { register, handleSubmit, control, formState: { errors, isSubmitting }, watch, reset } = useForm({
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

  // Sincronizar formulario cuando cambien las props de la actividad
  useEffect(() => {
    console.log("InfoEditor - Reseteando formulario con nueva actividad:", actividad);
    reset({
      nombre: actividad.nombre,
      lugar: actividad.lugar,
      descripcion: actividad.descripcion || '',
      fechaInicio: actividad.fechaInicio instanceof Date ? actividad.fechaInicio : 
                   actividad.fechaInicio?.toDate ? actividad.fechaInicio.toDate() : new Date(),
      fechaFin: actividad.fechaFin instanceof Date ? actividad.fechaFin : 
                actividad.fechaFin?.toDate ? actividad.fechaFin.toDate() : new Date(),
      dificultad: actividad.dificultad || 'media'
    });
  }, [actividad, reset]);

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
    // Asegurarse de que los datos básicos estén presentes y validados antes de enviar
    console.log("InfoEditor - Datos recibidos del formulario:", data);
    console.log("InfoEditor - Tipos seleccionados:", selectedTipos);
    console.log("InfoEditor - Subtipos seleccionados:", selectedSubtipos);
    
    // Verificación de datos críticos
    if (!selectedTipos.length) {
      console.warn("Debe seleccionar al menos un tipo de actividad");
      return; // No enviar datos incompletos
    }
    
    if (!selectedSubtipos.length) {
      console.warn("Debe seleccionar al menos un subtipo de actividad");
      return; // No enviar datos incompletos
    }
    
    const datosValidados = {
      ...data,
      nombre: data.nombre?.trim() || "",
      lugar: data.lugar?.trim() || "",
      tipo: selectedTipos,
      subtipo: selectedSubtipos
    };
    
    console.log("InfoEditor - Datos validados enviados al padre:", datosValidados);
    
    // Enviar datos al componente padre
    onSave(datosValidados);
  };

  // 3. Exponer el método submitForm usando useImperativeHandle
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      handleSubmit(onSubmit)();
    }
  }));

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

      <FormControl isRequired>
        <FormLabel>Tipo de actividad</FormLabel>
        <Box mb={2}>
          <Text fontSize="sm" color="red.500" mb={1}>
            Debes seleccionar al menos un tipo de actividad
          </Text>
          {TIPOS_ACTIVIDAD.map((tipo) => (
            <Button
              key={tipo.value}
              size="sm"
              m={1}
              variant={selectedTipos.includes(tipo.value as TipoActividad) ? "solid" : "outline"}
              colorScheme={selectedTipos.includes(tipo.value as TipoActividad) ? "brand" : "gray"}
              onClick={() => handleTipoChange(tipo.value as TipoActividad)}
            >
              {tipo.label}
            </Button>
          ))}
        </Box>
        
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
      </FormControl>

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
});

// 5. Agregar displayName para debugging
InfoEditor.displayName = 'InfoEditor';

export default InfoEditor;