import React, { useEffect } from 'react';
import {
  Box,
  HStack,
  Button,
} from '@chakra-ui/react';
import { useForm, FormProvider } from 'react-hook-form';
import { ActividadInfoForm } from './ActividadInfoForm';

interface InfoEditorProps {
  data: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  mostrarBotones?: boolean;
}

const InfoEditor: React.FC<InfoEditorProps> = ({
  data,
  onSave,
  onCancel,
  mostrarBotones = true
}) => {
  const methods = useForm({
    defaultValues: {
      nombre: data?.nombre || '',
      lugar: data?.lugar || '',
      fechaInicio: data?.fechaInicio || null,
      fechaFin: data?.fechaFin || null,
      tipo: data?.tipo || [],
      subtipo: data?.subtipo || []
    }
  });

  // Efecto para resetear el formulario cuando cambian los datos
  useEffect(() => {
    const formData = {
      nombre: data?.nombre || '',
      lugar: data?.lugar || '',
      fechaInicio: data?.fechaInicio || null,
      fechaFin: data?.fechaFin || null,
      tipo: data?.tipo || [],
      subtipo: data?.subtipo || []
    };
    
    console.log('InfoEditor - Reseteando formulario con nuevos datos:', formData);
    methods.reset(formData);
  }, [data, methods]);

  const onSubmit = (formData: any) => {
    console.log("Enviando datos desde InfoEditor:", formData);
    onSave(formData);
  };

  return (
    <FormProvider {...methods}>
      <Box as="form" onSubmit={methods.handleSubmit(onSubmit)}>
        <ActividadInfoForm />

        {mostrarBotones && (
          <HStack justify="flex-end">
            <Button onClick={onCancel}>
              Cancelar
            </Button>
            <Button colorScheme="brand" type="submit">
              Guardar
            </Button>
          </HStack>
        )}
      </Box>
    </FormProvider>
  );
};

export default InfoEditor;