// Componente mínimo para debug
import React from 'react';
import {
  FormControl, FormLabel, Input,
  Button, Wrap, WrapItem, Box
} from '@chakra-ui/react';
import { useFormContext } from 'react-hook-form';

export const MinimalActividadInfoForm: React.FC = () => {
  const { register, watch } = useFormContext();
  
  // Valores seguros
  const tiposSeleccionados = watch('tipo') || [];
  const subtiposSeleccionados = watch('subtipo') || [];
  
  // Verificación adicional de seguridad para evitar errores de undefined
  const tiposSeguro = Array.isArray(tiposSeleccionados) ? tiposSeleccionados : [];
  const subtiposSeguro = Array.isArray(subtiposSeleccionados) ? subtiposSeleccionados : [];

  console.log('MinimalActividadInfoForm - tiposSeguro:', tiposSeguro);
  console.log('MinimalActividadInfoForm - subtiposSeguro:', subtiposSeguro);

  const tipoOptions = [
    { value: 'espeleologia', label: 'Espeleología' },
    { value: 'barranquismo', label: 'Barranquismo' }
  ];

  return (
    <Box>
      <FormControl mb={4}>
        <FormLabel>Nombre de la actividad</FormLabel>
        <Input
          {...register('nombre')}
          placeholder="Ejemplo: Exploración Cueva del Agua"
        />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel>Tipo de actividad</FormLabel>
        <Wrap spacing={2}>
          {tipoOptions.map((tipo) => (
            <WrapItem key={tipo.value}>
              <Button
                size="sm"
                variant={tiposSeguro.includes(tipo.value) ? "solid" : "outline"}
                colorScheme={tiposSeguro.includes(tipo.value) ? "brand" : "gray"}
                mb={1}
              >
                {tipo.label}
              </Button>
            </WrapItem>
          ))}
        </Wrap>
      </FormControl>
    </Box>
  );
};
