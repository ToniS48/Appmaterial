import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
  Box, Button, FormControl, FormLabel, FormErrorMessage,
  Stack, Text, useColorModeValue, Alert, AlertIcon, Checkbox
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import MaterialSelector from './MaterialSelector';
import { MaterialAsignado } from '../../types/actividad';

interface MaterialItem {
  materialId: string;
  nombre: string;
  cantidad: number | string;
  [key: string]: any; // Para cualquier otra propiedad que pueda existir
}

interface MaterialEditorProps {
  data: any;
  onSave: (data: any) => void;
  onCancel?: () => void;
  onNecesidadMaterialChange?: (necesidad: boolean) => void;
  mostrarBotones?: boolean;
  isInsideForm?: boolean;
  // Nuevas props para la lógica condicional
  responsables?: {
    responsableActividadId?: string;
    responsableMaterialId?: string;
    creadorId?: string;
  };
  usuarios?: Array<{ uid: string; nombre: string; apellidos: string; }>;
}

const MaterialEditor = forwardRef<
  { submitForm: () => void },
  MaterialEditorProps
>(({ data, onSave, onCancel, onNecesidadMaterialChange, mostrarBotones = true, isInsideForm = false, responsables, usuarios }, ref) => {
  const { control, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      materiales: data.materiales || []
    }  });

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
    // Función helper para obtener nombre del usuario
  const obtenerNombreUsuario = (uid: string) => {
    const usuario = usuarios?.find(u => u.uid === uid);
    return usuario ? `${usuario.nombre} ${usuario.apellidos}`.trim() : uid;
  };

  // Verificar si hay responsable de material asignado
  const tieneResponsableMaterial = responsables?.responsableMaterialId;
  
  // Función para renderizar información de responsables
  const renderizarResponsables = () => {
    if (!responsables) return null;

    const responsableActividad = responsables.responsableActividadId ? 
      obtenerNombreUsuario(responsables.responsableActividadId) : null;
    const responsableMaterial = responsables.responsableMaterialId ? 
      obtenerNombreUsuario(responsables.responsableMaterialId) : null;

    if (!responsableActividad && !responsableMaterial) return null;

    return (
      <Text fontSize="sm" color="gray.600" mb={4}>
        {responsableActividad && (
          <Text as="span">
            Responsable de actividad: <Text as="span" fontWeight="medium">{responsableActividad}</Text>
          </Text>
        )}
        {responsableActividad && responsableMaterial && <Text as="span"> • </Text>}
        {responsableMaterial && (
          <Text as="span">
            Responsable de material: <Text as="span" fontWeight="medium">{responsableMaterial}</Text>
          </Text>
        )}
      </Text>
    );
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
      {/* Si no hay responsable de material, mostrar pantalla bloqueada */}
      {!tieneResponsableMaterial ? (
        <Alert status="warning">
          <AlertIcon />
          <Box>
            <Text fontWeight="medium">Se requiere asignar un responsable de material</Text>
            <Text fontSize="sm" mt={2}>
              Para poder seleccionar material para esta actividad, es necesario que primero se asigne 
              un responsable de material en la pestaña de participantes.
            </Text>
          </Box>
        </Alert>
      ) : (
        /* Mostrar formulario de material solo si hay responsable */
        <FormControl isInvalid={!!errors.materiales}>
          <MaterialSelector 
            control={control} 
            name="materiales" 
            materialesActuales={prepararMateriales()}
            error={errors.materiales} 
            cardBg={cardBg}
            borderColor={borderColor}
            responsables={responsables}
            usuarios={usuarios}
          />
          
          {errors.materiales && (
            <FormErrorMessage>{errors.materiales.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
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