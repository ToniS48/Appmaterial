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
  mostrarBotones?: boolean;
  isInsideForm?: boolean;
  control?: any; // Control del formulario padre cuando isInsideForm=true
  actividadId?: string; // Agregar prop para contexto de la actividad
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
>(({ data, onSave, onCancel, mostrarBotones = true, isInsideForm = false, control: parentControl, actividadId, responsables, usuarios }, ref) => {
  // Usar control del padre si isInsideForm=true, sino crear propio useForm
  const ownForm = useForm({
    defaultValues: {
      materiales: data.materiales || []
    }
  });
  
  const control = isInsideForm && parentControl ? parentControl : ownForm.control;
  const formState = isInsideForm && parentControl ? { errors: {} } : ownForm.formState;
  const watch = isInsideForm && parentControl ? parentControl.watch : ownForm.watch;
  const errors = formState.errors || {};
  
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Función para validar y formatear materiales
  const validarMateriales = (materiales: any[]) => {
    if (!Array.isArray(materiales)) return [];
    
    return materiales
      .filter((m: MaterialItem) => m && m.materialId)
      .map((m: MaterialItem) => ({
        materialId: m.materialId,
        nombre: m.nombre || '',
        cantidad: typeof m.cantidad === 'number' ? m.cantidad : parseInt(String(m.cantidad), 10) || 1
      }));
  };

  // Función de envío del formulario
  const onSubmit = (formData: any) => {
    console.log('Materiales seleccionados:', formData.materiales);
    const materialesValidados = validarMateriales(formData.materiales || []);
    onSave(materialesValidados);
  };

  // useImperativeHandle para manejar submitForm
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      console.log('MaterialEditor - submitForm llamado, isInsideForm:', isInsideForm);
      
      if (isInsideForm && parentControl) {
        // Cuando está dentro de un formulario padre, obtener datos directamente del control padre
        const currentMateriales = watch('materiales') || [];
        console.log('MaterialEditor - Materiales del control padre:', currentMateriales);
        
        const materialesValidados = validarMateriales(currentMateriales);
        console.log('MaterialEditor - Materiales validados desde padre:', materialesValidados);
        onSave(materialesValidados);
        return;
      }
      
      // Ejecutar handleSubmit con onSubmit como callback (formulario independiente)
      try {
        ownForm.handleSubmit((formData) => {
          console.log('Material form data:', formData);
          const materialesValidados = validarMateriales(formData.materiales || []);
          console.log('Materiales validados:', materialesValidados);
          onSave(materialesValidados);
        })();
      } catch (error) {
        console.error('Error en submitForm de MaterialEditor:', error);
        // Fallback: enviar la lista actual en caso de error
        const materialesActuales = watch('materiales') || [];
        const materialesValidados = validarMateriales(materialesActuales);
        onSave(materialesValidados);
      }
    }
  }));
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

  // Función helper para obtener nombre del usuario
  const obtenerNombreUsuario = (uid: string) => {
    const usuario = usuarios?.find(u => u.uid === uid);
    return usuario ? `${usuario.nombre} ${usuario.apellidos}`.trim() : uid;
  };

  // Renderizar contenido del formulario
  const renderFormContent = () => (
    <>
      {renderizarResponsables()}
      
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
        <FormControl isInvalid={!!(errors as any)?.materiales}>
          <MaterialSelector 
            control={control} 
            name="materiales" 
            materialesActuales={prepararMateriales()}
            error={(errors as any)?.materiales} 
            cardBg={cardBg}
            borderColor={borderColor}
            actividadId={actividadId}
            responsables={responsables}
            usuarios={usuarios}
          />
          
          {(errors as any)?.materiales && (
            <FormErrorMessage>{(errors as any)?.materiales?.message?.toString()}</FormErrorMessage>
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
    </>
  );

  // Renderizar según si está dentro de un formulario o no
  return isInsideForm ? (
    <Box>
      {renderFormContent()}
    </Box>
  ) : (
    <form onSubmit={ownForm.handleSubmit(onSubmit)}>
      {renderFormContent()}
    </form>
  );
});

// Agregar displayName para debugging
MaterialEditor.displayName = 'MaterialEditor';

export default MaterialEditor;