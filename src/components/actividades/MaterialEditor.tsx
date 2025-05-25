import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, FormErrorMessage,
  Stack, Text, useColorModeValue, Alert, AlertIcon, Checkbox
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import MaterialSelector from './MaterialSelector';
import { MaterialEditorProps } from '../../types/editor';
import { MaterialAsignado } from '../../types/actividad';
import { normalizarMaterial } from '../../utils/materialUtils';

interface MaterialItem {
  materialId: string;
  nombre: string;
  cantidad: number | string;
  [key: string]: any; // Para cualquier otra propiedad que pueda existir
}

const MaterialEditor = forwardRef<
  { submitForm: () => void },
  MaterialEditorProps
>(({ data, onSave, onCancel, onNecesidadMaterialChange, mostrarBotones = true, isInsideForm = false }, ref) => {
  const { control, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      materiales: data.materiales || []
    }
  });

  const [materiales] = useState<MaterialAsignado[]>(data.materiales || []);
  const [necesidadMaterial, setNecesidadMaterial] = useState<boolean>(data.necesidadMaterial || false);
  
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  
  // Lista memoizada de materiales para evitar re-renders
  const materialesList = watch('materiales') || [];

  // Asegurar que los materiales siempre tengan el formato correcto
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      console.log('MaterialEditor - submitForm llamado');
      
      // Ejecutar handleSubmit con onSubmit como callback
      try {
        handleSubmit((formData) => {
          console.log('Material form data:', formData);
          if (!formData.materiales) formData.materiales = [];
          
          // Validar y limpiar los materiales - formato estandarizado para ambos modos
          const materialesValidados = Array.isArray(formData.materiales) ? 
            formData.materiales
              .filter((m: MaterialItem) => m && m.materialId)
              .map((m: MaterialItem) => ({
                materialId: m.materialId,
                nombre: m.nombre || '',
                cantidad: typeof m.cantidad === 'number' ? m.cantidad : parseInt(String(m.cantidad), 10) || 1
              })) : [];
          
          console.log('Materiales validados:', materialesValidados);
          onSave(materialesValidados);
        })();
      } catch (error) {
        console.error('Error en submitForm de MaterialEditor:', error);
        // Fallback: enviar la lista actual en caso de error
        const materialesActuales = watch('materiales') || [];
        const materialesValidados = materialesActuales
          .filter((m: MaterialItem) => m && m.materialId)
          .map((m: MaterialItem) => ({
            materialId: m.materialId,
            nombre: m.nombre || '',
            cantidad: typeof m.cantidad === 'number' ? m.cantidad : parseInt(String(m.cantidad), 10) || 1
          }));
        onSave(materialesValidados);
      }
    }
  }));

  // Función de envío del formulario
  const onSubmit = (formData: any) => {
    console.log('Materiales seleccionados:', formData.materiales);
    
    // Validar y enviar los datos
    const materialesValidados = Array.isArray(formData.materiales) ? 
      formData.materiales
        .filter((m: MaterialItem) => m && m.materialId)
        .map((m: MaterialItem) => ({
          materialId: m.materialId,
          nombre: m.nombre || '',
          cantidad: typeof m.cantidad === 'number' ? m.cantidad : parseInt(String(m.cantidad), 10) || 1
        })) : [];
    
    onSave(materialesValidados);
  };

  // Usar un Box normal o un form según el contexto
  const WrapperComponent = isInsideForm ? Box : 'form';
  
  // Añadir manejo del cambio de necesidad de material
  const handleNecesidadMaterialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setNecesidadMaterial(newValue);
    
    // Notificar al componente padre a través del callback
    if (onNecesidadMaterialChange) {
      onNecesidadMaterialChange(newValue);
    }
  };
  
  // Preparar los materiales normalizados para el selector
  const prepararMateriales = () => {
    if (!Array.isArray(data.materiales)) return [];
    
    return data.materiales.map((material: MaterialAsignado) => ({
      id: material.materialId ? `temp-${material.materialId}` : `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      materialId: material.materialId || '',
      nombre: material.nombre || '',
      cantidad: typeof material.cantidad === 'number' ? material.cantidad : parseInt(String(material.cantidad || '1'), 10) || 1
    }));
  };
  
  return (
    <WrapperComponent 
      {...(isInsideForm ? {} : { onSubmit: handleSubmit(onSubmit) })}
    >
      <FormControl isInvalid={!!errors.materiales}>
        <FormLabel>Selección de material</FormLabel>
        
        <MaterialSelector 
          control={control} 
          name="materiales" 
          materialesActuales={prepararMateriales()}
          error={errors.materiales} 
          cardBg={cardBg}
          borderColor={borderColor}
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

      <FormControl mb={4}>
        <Checkbox 
          isChecked={necesidadMaterial}
          onChange={handleNecesidadMaterialChange}
          colorScheme="brand"
        >
          Esta actividad requiere material
        </Checkbox>
      </FormControl>
      
      {/* Mostrar selector de material solo si necesidadMaterial es true */}
      {necesidadMaterial && (
        <MaterialSelector 
          control={control} 
          name="materiales" 
          materialesActuales={prepararMateriales()}
          error={errors.materiales} 
          cardBg={cardBg}
          borderColor={borderColor}
        />
      )}

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
    </WrapperComponent>
  );
});

// Agregar displayName para debugging
MaterialEditor.displayName = 'MaterialEditor';

export default MaterialEditor;