import React from 'react';
import {
  Box, Button, FormControl, FormLabel, FormErrorMessage,
  Stack, Text, useColorModeValue, Alert, AlertIcon
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { Actividad } from '../../types/actividad';
import MaterialSelector from './MaterialSelector';

interface MaterialEditorProps {
  actividad: Actividad;
  onSave: (materiales: any[]) => void;
  onCancel: () => void;
  mostrarBotones?: boolean;
}

const MaterialEditor: React.FC<MaterialEditorProps> = ({ 
  actividad, 
  onSave, 
  onCancel,
  mostrarBotones = true // Valor predeterminado
}) => {
  const { control, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      materiales: actividad.materiales || []
    }
  });

  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const onSubmit = (data: { materiales: any[] }) => {
    onSave(data.materiales);
  };

  const materialesList = watch('materiales');

  return (
    <Box
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      bg={cardBg}
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      p={5}
    >
      <FormControl isInvalid={!!errors.materiales}>
        <FormLabel fontWeight="bold">Material necesario</FormLabel>
        
        <MaterialSelector 
          control={control} 
          name="materiales" 
          materialesActuales={(actividad.materiales || []).map(material => ({
            id: `temp-${material.materialId}`, // Generamos un id temporal basado en materialId
            materialId: material.materialId,
            nombre: material.nombre,
            cantidad: material.cantidad
          }))}
          error={errors.materiales} 
        />
        
        {errors.materiales && (
          <FormErrorMessage>{errors.materiales.message?.toString()}</FormErrorMessage>
        )}

        {materialesList.length > 0 && (
          <Alert status="info" mt={4}>
            <AlertIcon />
            <Text fontSize="sm">
              Recuerda que el material seleccionado será asignado automáticamente 
              al responsable de material de la actividad.
            </Text>
          </Alert>
        )}
      </FormControl>

      {mostrarBotones && (
        <Stack direction="row" spacing={4} mt={6} justify="flex-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" colorScheme="brand">
            Guardar material
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default MaterialEditor;