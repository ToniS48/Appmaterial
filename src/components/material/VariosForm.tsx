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

interface VariosFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  control: Control<any>;
}

// Categorías de material varios
const CATEGORIAS_VARIOS = [
  { value: 'equipoTPV', label: 'Equipo TPV' },
  { value: 'tienda', label: 'Tienda' },
  { value: 'poteEstanco', label: 'Pote Estanco' },
  { value: 'iluminacion', label: 'Iluminación' },
  { value: 'arneses', label: 'Arneses' },
  { value: 'mosquetones', label: 'Mosquetones' },
  { value: 'herramientas', label: 'Herramientas' },
  { value: 'otro', label: 'Otro' }
];

// Subcategorías por categoría
const SUBCATEGORIAS = {
  equipoTPV: [
    { value: 'bloqueadores', label: 'Bloqueadores' },
    { value: 'descensores', label: 'Descensores' },
    { value: 'poleas', label: 'Poleas' },
    { value: 'otro', label: 'Otro' }
  ],
  tienda: [
    { value: 'carpas', label: 'Carpas' },
    { value: 'toldos', label: 'Toldos' },
    { value: 'otro', label: 'Otro' }
  ],
  iluminacion: [
    { value: 'frontales', label: 'Frontales' },
    { value: 'lamparas', label: 'Lámparas' },
    { value: 'baterias', label: 'Baterías' },
    { value: 'otro', label: 'Otro' }
  ],
  arneses: [
    { value: 'completos', label: 'Arneses completos' },
    { value: 'pecho', label: 'Arneses de pecho' },
    { value: 'pelvis', label: 'Arneses de pelvis' },
    { value: 'otro', label: 'Otro' }
  ],
  mosquetones: [
    { value: 'hms', label: 'HMS' },
    { value: 'seguridad', label: 'Seguridad' },
    { value: 'basicos', label: 'Básicos' },
    { value: 'otro', label: 'Otro' }
  ],
  herramientas: [
    { value: 'taladros', label: 'Taladros' },
    { value: 'brocas', label: 'Brocas' },
    { value: 'martillos', label: 'Martillos' },
    { value: 'otro', label: 'Otro' }
  ]
};

const VariosForm: React.FC<VariosFormProps> = ({ 
  register, 
  errors,
  control 
}) => {
  const [categoria, setCategoria] = React.useState('');
  const [subcategorias, setSubcategorias] = React.useState<{value: string, label: string}[]>([]);

  // Actualizar subcategorías cuando cambia la categoría
  React.useEffect(() => {
    if (categoria) {
      setSubcategorias(SUBCATEGORIAS[categoria as keyof typeof SUBCATEGORIAS] || []);
    } else {
      setSubcategorias([]);
    }
  }, [categoria]);

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
      <FormControl isRequired isInvalid={!!errors.categoria}>
        <FormLabel>Categoría</FormLabel>
        <Select
          {...register('categoria', { 
            required: 'La categoría es obligatoria' 
          })}
          placeholder="Seleccione una categoría"
          onChange={(e) => setCategoria(e.target.value)}
        >
          {CATEGORIAS_VARIOS.map(cat => (
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