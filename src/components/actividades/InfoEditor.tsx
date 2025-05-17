import React from 'react';
import {
  Box,
  HStack,
  Button,
} from '@chakra-ui/react';
import { useForm, FormProvider } from 'react-hook-form';
import { ActividadInfoForm } from './ActividadInfoForm'; // Importar como exportación nombrada

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