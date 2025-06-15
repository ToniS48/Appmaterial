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

interface VariosFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  control: Control<any>;
  categoriasVarios?: DropdownOption[];
  subcategoriasVarios?: Record<string, DropdownOption[]>;
}

// Configuración por defecto (fallback) - se mantendrá como respaldo
// Las categorías y subcategorías ahora se cargan dinámicamente

const VariosForm: React.FC<VariosFormProps> = ({ 
  register, 
  errors,
  control,
  categoriasVarios = [],
  subcategoriasVarios = {}
}) => {
  const [categoria, setCategoria] = React.useState('');
  const [subcategorias, setSubcategorias] = React.useState<DropdownOption[]>([]);

  // Actualizar subcategorías cuando cambia la categoría
  React.useEffect(() => {
    if (categoria && subcategoriasVarios[categoria]) {
      setSubcategorias(subcategoriasVarios[categoria]);
    } else {
      setSubcategorias([]);
    }
  }, [categoria, subcategoriasVarios]);

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
      <FormControl isRequired isInvalid={!!errors.categoria}>
        <FormLabel>Categoría</FormLabel>        <Select
          {...register('categoria', { 
            required: 'La categoría es obligatoria' 
          })}
          placeholder="Seleccione una categoría"
          onChange={(e) => setCategoria(e.target.value)}
        >
          {categoriasVarios.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </Select>
        {errors.categoria && (
          <FormErrorMessage>{errors.categoria.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      {categoria && subcategorias.length > 0 && (
        <FormControl isInvalid={!!errors.subcategoria}>
          <FormLabel>Subcategoría</FormLabel>
          <Select
            {...register('subcategoria')}
            placeholder="Seleccione una subcategoría"
          >
            {subcategorias.map(subcat => (
              <option key={subcat.value} value={subcat.value}>
                {subcat.label}
              </option>
            ))}
          </Select>
          {errors.subcategoria && (
            <FormErrorMessage>{errors.subcategoria.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
      )}
      
      <FormControl isRequired isInvalid={!!errors.cantidad}>
        <FormLabel>Cantidad total</FormLabel>
        <NumberInput min={1} defaultValue={1}>
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

export default VariosForm;