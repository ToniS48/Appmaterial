import React from 'react';
import {
  Box,
  HStack,
  Button,
} from '@chakra-ui/react';
import { useForm, FormProvider } from 'react-hook-form';
import { ActividadInfoForm } from './ActividadInfoForm'; // Importar como exportación nombrada
import { useAuth } from '../../contexts/AuthContext';

interface ActividadFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  mostrarBotones?: boolean;
}

const ActividadForm: React.FC<ActividadFormProps> = ({
  onSave,
  onCancel,
  mostrarBotones = true
}) => {
  const { currentUser } = useAuth();
  // Asegurar que defaultValues contiene todos los campos requeridos
  const methods = useForm({
    defaultValues: {
      nombre: '',
      lugar: '',
      ubicacionLat: 0, // Coordenadas para el clima
      ubicacionLon: 0, // Coordenadas para el clima
      fechaInicio: new Date(),
      fechaFin: new Date(Date.now() + 86400000), // Un día después por defecto
      tipo: [],
      subtipo: [],
      necesidadMaterial: false, // Campo crítico para los préstamos
      participanteIds: currentUser ? [currentUser.uid] : [],
      creadorId: currentUser?.uid || '',
      responsableActividadId: '',
      estado: 'planificada',
      comentarios: [],
      enlaces: []
    }
  });

  const onSubmit = (formData: any) => {
    console.log("Enviando datos desde ActividadForm:", formData);
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

export default ActividadForm;
