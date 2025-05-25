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


const InfoEditor = forwardRef<
  { submitForm: () => void },
  InfoEditorProps
>(({ actividad, onSave, onCancel, mostrarBotones = false }, ref) => {
  const [selectedTipos, setSelectedTipos] = useState<TipoActividad[]>(actividad.tipo || []);
  const [selectedSubtipos, setSelectedSubtipos] = useState<SubtipoActividad[]>(actividad.subtipo || []);
  
  // Sincronizar estado local cuando cambien las props de la actividad
  useEffect(() => {
    console.log("InfoEditor - useEffect sincronizando con actividad:", actividad);
    console.log("InfoEditor - tipos recibidos en props:", actividad.tipo);
    console.log("InfoEditor - subtipos recibidos en props:", actividad.subtipo);
    
    setSelectedTipos(actividad.tipo || []);
    setSelectedSubtipos(actividad.subtipo || []);
  }, [actividad.tipo, actividad.subtipo]);
  
  // Variables de color adaptativas para modo oscuro/claro
  const inputBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
    const { register, handleSubmit, control, formState: { errors, isSubmitting }, watch, reset } = useForm({

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


  // Sincronizar formulario cuando cambien las props de la actividad
  useEffect(() => {
    console.log("InfoEditor - Reseteando formulario con nueva actividad:", actividad);
    reset({
      nombre: actividad.nombre,
      lugar: actividad.lugar,
      descripcion: actividad.descripcion || '',
      fechaInicio: actividad.fechaInicio instanceof Date ? actividad.fechaInicio : 
                   actividad.fechaInicio?.toDate ? actividad.fechaInicio.toDate() : new Date(),
      fechaFin: actividad.fechaFin instanceof Date ? actividad.fechaFin : 
                actividad.fechaFin?.toDate ? actividad.fechaFin.toDate() : new Date(),
      dificultad: actividad.dificultad || 'media'
    });
  }, [actividad, reset]);

  const handleTipoChange = (tipo: TipoActividad) => {
    if (selectedTipos.includes(tipo)) {
      setSelectedTipos(selectedTipos.filter(t => t !== tipo));
    } else {
      setSelectedTipos([...selectedTipos, tipo]);
    }
  };

  const handleSubtipoChange = (subtipo: SubtipoActividad) => {
    if (selectedSubtipos.includes(subtipo)) {
      setSelectedSubtipos(selectedSubtipos.filter(s => s !== subtipo));
    } else {
      setSelectedSubtipos([...selectedSubtipos, subtipo]);
    }
  };
  const onSubmit = (data: any) => {
    // Asegurarse de que los datos básicos estén presentes y validados antes de enviar
    console.log("InfoEditor - Datos recibidos del formulario:", data);
    console.log("InfoEditor - Tipos seleccionados:", selectedTipos);
    console.log("InfoEditor - Subtipos seleccionados:", selectedSubtipos);
    
    // Verificación de datos críticos
    if (!selectedTipos.length) {
      console.warn("Debe seleccionar al menos un tipo de actividad");
      return; // No enviar datos incompletos
    }
    
    if (!selectedSubtipos.length) {
      console.warn("Debe seleccionar al menos un subtipo de actividad");
      return; // No enviar datos incompletos
    }
    
    const datosValidados = {
      ...data,
      nombre: data.nombre?.trim() || "",
      lugar: data.lugar?.trim() || "",
      tipo: selectedTipos,
      subtipo: selectedSubtipos
    };
    
    console.log("InfoEditor - Datos validados enviados al padre:", datosValidados);
    
    // Enviar datos al componente padre
    onSave(datosValidados);

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