import React from 'react';
import { UseFormRegister, FieldErrors, Control } from 'react-hook-form';
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

interface AnclajeFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  control: Control<any>;
}

const AnclajeForm: React.FC<AnclajeFormProps> = ({ 
  register, 
  errors,
  control 
}) => {
  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
      <FormControl isRequired isInvalid={!!errors.tipoAnclaje}>
        <FormLabel>Tipo de anclaje</FormLabel>
        <Select
          {...register('tipoAnclaje', { 
            required: 'El tipo de anclaje es obligatorio' 
          })}
          placeholder="Seleccione un tipo"
        >
          <option value="quimico">Químico</option>
          <option value="mecanico">Mecánico</option>
          <option value="as">AS</option>
          <option value="otro">Otro</option>
        </Select>
        {errors.tipoAnclaje && (
          <FormErrorMessage>{errors.tipoAnclaje.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      <FormControl isRequired isInvalid={!!errors.cantidad}>
        <FormLabel>Cantidad total</FormLabel>
        <NumberInput min={1} defaultValue={10}>
          <NumberInputField
            {...register('cantidad', {
              required: 'La cantidad es obligatoria',
              min: { value: 1, message: 'La cantidad mínima es 1' }
            })}
          />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        {errors.cantidad && (
          <FormErrorMessage>{errors.cantidad.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      <FormControl isRequired isInvalid={!!errors.cantidadDisponible}>
        <FormLabel>Cantidad disponible</FormLabel>
        <NumberInput min={0}>
          <NumberInputField
            {...register('cantidadDisponible', {
              required: 'La cantidad disponible es obligatoria',
              min: { value: 0, message: 'La cantidad mínima disponible es 0' },
              validate: (value, formValues) => 
                parseInt(value) <= parseInt(formValues.cantidad) || 
                'La cantidad disponible no puede ser mayor que la cantidad total'
            })}
          />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
        {errors.cantidadDisponible && (
          <FormErrorMessage>{errors.cantidadDisponible.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
    </SimpleGrid>
  );
};

export default AnclajeForm;