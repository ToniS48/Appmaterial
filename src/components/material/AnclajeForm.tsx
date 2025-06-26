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
import { DropdownOption } from '../../services/materialDropdownService';

interface AnclajeFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  control: Control<any>;
  tiposAnclaje?: DropdownOption[];
  subcategoriasAnclaje?: Record<string, DropdownOption[]>;
}

const AnclajeForm: React.FC<AnclajeFormProps> = ({ 
  register, 
  errors,
  control,
  tiposAnclaje = [],
  subcategoriasAnclaje = {}
}) => {
  const [tipoAnclaje, setTipoAnclaje] = React.useState('');
  const [subcategorias, setSubcategorias] = React.useState<DropdownOption[]>([]);

  // Actualizar subcategorías cuando cambia el tipo de anclaje
  React.useEffect(() => {
    if (tipoAnclaje && subcategoriasAnclaje[tipoAnclaje]) {
      setSubcategorias(subcategoriasAnclaje[tipoAnclaje]);
    } else {
      setSubcategorias([]);
    }
  }, [tipoAnclaje, subcategoriasAnclaje]);
  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>      <FormControl isRequired isInvalid={!!errors.tipoAnclaje}>
        <FormLabel>Tipo de anclaje</FormLabel>
        <Select
          {...register('tipoAnclaje', { 
            required: 'El tipo de anclaje es obligatorio' 
          })}
          placeholder="Seleccione un tipo"
          onChange={(e) => setTipoAnclaje(e.target.value)}
        >
          {tiposAnclaje.map(tipo => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </Select>
        {errors.tipoAnclaje && (
          <FormErrorMessage>{errors.tipoAnclaje.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      {tipoAnclaje && subcategorias.length > 0 && (
        <FormControl isInvalid={!!errors.subcategoriaAnclaje}>
          <FormLabel>Subcategoría</FormLabel>
          <Select
            {...register('subcategoriaAnclaje')}
            placeholder="Seleccione una subcategoría"
          >
            {subcategorias.map(subcat => (
              <option key={subcat.value} value={subcat.value}>
                {subcat.label}
              </option>
            ))}
          </Select>
          {errors.subcategoriaAnclaje && (
            <FormErrorMessage>{errors.subcategoriaAnclaje.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
      )}
      
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
