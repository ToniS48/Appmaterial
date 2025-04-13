import React from 'react';
import {
  Box, Button, FormControl, FormLabel, FormErrorMessage,
  Stack, Text
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { Actividad } from '../../types/actividad';
import MaterialSelector from './MaterialSelector';

interface MaterialEditorProps {
  actividad: Actividad;
  onSave: (materiales: any[]) => void;
  onCancel: () => void;
}

const MaterialEditor: React.FC<MaterialEditorProps> = ({ 
  actividad, 
  onSave, 
  onCancel 
}) => {
  const { control, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      materiales: actividad.materiales || []
    }
  });

  const onSubmit = (data: { materiales: any[] }) => {
    onSave(data.materiales);
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <MaterialSelector 
        control={control}
        errors={errors}
        existingMaterials={(watch('materiales') || []).map(material => ({
          id: material.materialId,
          materialId: material.materialId,
          nombre: material.nombre,
          cantidad: material.cantidad
        }))}
      />

      <Stack direction="row" spacing={4} mt={6} justify="flex-end">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" colorScheme="brand">
          Guardar Material
        </Button>
      </Stack>
    </Box>
  );
};

export default MaterialEditor;