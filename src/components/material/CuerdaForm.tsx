import React from 'react';
import { UseFormRegister, FieldErrors, Control, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import {
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Select,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react';
import DatePicker from '../common/DatePicker';

interface CuerdaFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  control: Control<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

const CuerdaForm: React.FC<CuerdaFormProps> = ({ 
  register, 
  errors, 
  control,
  watch,
  setValue 
}) => {
  // Calcular vida útil restante basado en fecha de primer uso y usos
  const fechaPrimerUso = watch('fechaPrimerUso');
  const usos = watch('usos') || 0;
  
  // Esta función simula un cálculo de vida útil. En un caso real sería más complejo.
  React.useEffect(() => {
    if (fechaPrimerUso) {
      // Estimar 10 años de vida desde el primer uso - descontando por número de usos
      // (Este cálculo es simplemente ilustrativo)
      const vidaTotal = 10 * 365; // 10 años en días
      const diasTranscurridos = Math.floor((new Date().getTime() - new Date(fechaPrimerUso).getTime()) / (1000 * 60 * 60 * 24));
      const descuentoPorUsos = usos * 2; // Cada uso descuenta 2 días
      
      const vidaRestante = Math.max(0, vidaTotal - diasTranscurridos - descuentoPorUsos);
      setValue('vidaUtilRestante', vidaRestante);
    }
  }, [fechaPrimerUso, usos, setValue]);

  // Obtener el año actual para limitar el input
  const currentYear = new Date().getFullYear();

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
      <FormControl isRequired isInvalid={!!errors.codigo}>
        <FormLabel>Código</FormLabel>
        <Input
          {...register('codigo', { 
            required: 'El código es obligatorio' 
          })}
          placeholder="Código interno"
        />
        {errors.codigo && (
          <FormErrorMessage>{errors.codigo.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      <FormControl isRequired isInvalid={!!errors.longitud}>
        <FormLabel>Longitud (metros)</FormLabel>
        <NumberInput min={1} max={200} defaultValue={50}>
          <NumberInputField
            id="longitud"  // Añadir esta línea
            {...register('longitud', {
              required: 'La longitud es obligatoria',
              min: { value: 1, message: 'La longitud mínima es 1m' },
              max: { value: 200, message: 'La longitud máxima es 200m' }
            })}
          />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        {errors.longitud && (
          <FormErrorMessage>{errors.longitud.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      <FormControl isRequired isInvalid={!!errors.diametro}>
        <FormLabel>Diámetro (mm)</FormLabel>
        <NumberInput min={8} max={13} defaultValue={9} step={0.1} precision={1}>
          <NumberInputField
            {...register('diametro', {
              required: 'El diámetro es obligatorio',
              min: { value: 8, message: 'El diámetro mínimo es 8mm' },
              max: { value: 13, message: 'El diámetro máximo es 13mm' }
            })}
          />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        {errors.diametro && (
          <FormErrorMessage>{errors.diametro.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      <FormControl isInvalid={!!errors.usos}>
        <FormLabel>Número de usos</FormLabel>
        <NumberInput min={0} defaultValue={0}>
          <NumberInputField
            {...register('usos', {
              min: { value: 0, message: 'El valor no puede ser negativo' }
            })}
          />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        {errors.usos && (
          <FormErrorMessage>{errors.usos.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      <FormControl isRequired isInvalid={!!errors.tipoCuerda}>
        <FormLabel>Tipo de cuerda</FormLabel>
        <Select
          {...register('tipoCuerda', { 
            required: 'El tipo de cuerda es obligatorio' 
          })}
          placeholder="Seleccione un tipo"
        >
          <option value="espeleologia">Espeleología</option>
          <option value="barrancos">Barrancos</option>
          <option value="mixta">Mixta</option>
        </Select>
        {errors.tipoCuerda && (
          <FormErrorMessage>{errors.tipoCuerda.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      <FormControl isInvalid={!!errors.numeroSerie}>
        <FormLabel>Número de serie</FormLabel>
        <Input
          {...register('numeroSerie')}
          placeholder="Número de serie del fabricante"
        />
        {errors.numeroSerie && (
          <FormErrorMessage>{errors.numeroSerie.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      <FormControl isInvalid={!!errors.fechaFabricacion}>
        <FormLabel>Año de fabricación</FormLabel>
        <NumberInput 
          min={1980} 
          max={currentYear}
          defaultValue={currentYear}
        >
          <NumberInputField
            {...register('fechaFabricacion', {
              validate: value => {
                const year = parseInt(value);
                if (isNaN(year)) return 'Debe ser un año válido';
                if (year < 1980) return 'El año debe ser posterior a 1980';
                if (year > currentYear) return 'El año no puede ser futuro';
                return true;
              }
            })}
            placeholder="AAAA"
          />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        {errors.fechaFabricacion && (
          <FormErrorMessage>{errors.fechaFabricacion.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      <FormControl isInvalid={!!errors.fechaPrimerUso}>
        <FormLabel>Fecha de primer uso</FormLabel>
        <DatePicker
          name="fechaPrimerUso"
          control={control}
        />
        {errors.fechaPrimerUso && (
          <FormErrorMessage>{errors.fechaPrimerUso.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      <FormControl isReadOnly>
        <FormLabel>Vida útil restante (días)</FormLabel>
        <Input
          {...register('vidaUtilRestante')}
          readOnly
        />
      </FormControl>
    </SimpleGrid>
  );
};

export default CuerdaForm;