import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  FormErrorMessage,
  Stack,
  Heading,
  Divider,
  useToast,
  SimpleGrid,
  Checkbox,
  Text,
  Tag,
  TagLabel,
  TagCloseButton,
  Flex,
  HStack
} from '@chakra-ui/react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import DatePicker from '../common/DatePicker';
import { crearActividad, actualizarActividad } from '../../services/actividadService';
import { listarUsuarios } from '../../services/usuarioService';
import { Actividad, TipoActividad, SubtipoActividad, EstadoActividad } from '../../types/actividad';
import { Usuario } from '../../types/usuario';
import { Timestamp } from 'firebase/firestore';
import MaterialSelector from '../actividades/MaterialSelector';
import { useDisclosure } from '@chakra-ui/react';
import { FiUsers, FiExternalLink, FiFolder } from 'react-icons/fi'; 
import ParticipantesSelector from './ParticipantesSelector';
import messages from '../../constants/messages';
import { obtenerConfiguracionDrive } from '../../services/configuracionService';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { TIPOS_ACTIVIDAD, SUBTIPOS_ACTIVIDAD, DIFICULTADES } from '../../constants/actividadOptions';

interface ActividadFormData {
  nombre: string;
  tipo: TipoActividad[];
  subtipo: SubtipoActividad[];
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
  lugar: string;
  responsableActividadId: string;
  responsableMaterialId?: string;
  participanteIds: string[];
  materiales: { materialId: string; nombre: string; cantidad: number }[];
  estado: EstadoActividad;
  enlacesWikiloc: { url: string, esEmbed: boolean }[]; 
  enlacesTopografias: string[];
  enlacesDrive: string[];
  enlacesWeb: string[];
  dificultad?: 'baja' | 'media' | 'alta';
  nuevoEnlace?: string;
}

interface ActividadFormProps {
  actividad?: Actividad;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ESTADOS_ACTIVIDAD = [
  { value: 'planificada', label: 'Planificada' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'finalizada', label: 'Finalizada' },
  { value: 'cancelada', label: 'Cancelada' }
];

const ActividadForm: React.FC<ActividadFormProps> = ({ 
  actividad, 
  onSuccess, 
  onCancel 
}) => {
  const { currentUser, userProfile } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nuevoEnlace, setNuevoEnlace] = useState('');
  const [selectedTipos, setSelectedTipos] = useState<TipoActividad[]>(actividad?.tipo || []);
  const [selectedSubtipos, setSelectedSubtipos] = useState<SubtipoActividad[]>(actividad?.subtipo || []);
  const [driveConfig, setDriveConfig] = useState({
    googleDriveUrl: '',
    googleDriveTopoFolder: '',
    googleDriveDocFolder: ''
  });
  
  const [nuevoEnlaceWikiloc, setNuevoEnlaceWikiloc] = useState({ url: '', esEmbed: false });
  const [nuevoEnlaceTopografia, setNuevoEnlaceTopografia] = useState('');
  const [nuevoEnlaceDrive, setNuevoEnlaceDrive] = useState('');
  const [nuevoEnlaceWeb, setNuevoEnlaceWeb] = useState('');

  const { 
    register, 
    handleSubmit, 
    control,
    formState: { errors }, 
    setValue,
    watch,
    reset
  } = useForm<ActividadFormData>({
    defaultValues: actividad ? {
      ...actividad,
      fechaInicio: actividad.fechaInicio instanceof Timestamp ? 
        actividad.fechaInicio.toDate() : actividad.fechaInicio,
      fechaFin: actividad.fechaFin instanceof Timestamp ? 
        actividad.fechaFin.toDate() : actividad.fechaFin,
      enlacesWikiloc: actividad.enlacesWikiloc || [],
      enlacesTopografias: actividad.enlacesTopografias || [],
      enlacesDrive: actividad.enlacesDrive || [],
      enlacesWeb: actividad.enlacesWeb || [],
    } : {
      nombre: '',
      tipo: [],
      subtipo: [],
      descripcion: '',
      fechaInicio: new Date(),
      fechaFin: new Date(Date.now() + 24 * 60 * 60 * 1000),
      lugar: '',
      responsableActividadId: userProfile?.uid || '',
      participanteIds: userProfile ? [userProfile.uid] : [],
      materiales: [],
      estado: 'planificada',
      enlacesWikiloc: [],
      enlacesTopografias: [], 
      enlacesDrive: [],
      enlacesWeb: [],
      dificultad: 'media'
    }
  });

  
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const usuariosData = await listarUsuarios();
        setUsuarios(usuariosData.filter(u => u.activo));
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
      }
    };
    
    fetchUsuarios();
  }, []);

  useEffect(() => {
    const cargarConfiguracionDrive = async () => {
      try {
        const config = await obtenerConfiguracionDrive();
        setDriveConfig(config);
      } catch (error) {
        console.error("Error al cargar configuración de Drive:", error);
      }
    };
    
    cargarConfiguracionDrive();
  }, []);

  useEffect(() => {
    if (actividad) {
      setSelectedTipos(actividad.tipo || []);
      setSelectedSubtipos(actividad.subtipo || []);
      
      reset({
        ...actividad,
        fechaInicio: actividad.fechaInicio instanceof Timestamp ? 
          actividad.fechaInicio.toDate() : actividad.fechaInicio,
        fechaFin: actividad.fechaFin instanceof Timestamp ? 
          actividad.fechaFin.toDate() : actividad.fechaFin,
        enlacesWikiloc: actividad.enlacesWikiloc || [],
        enlacesTopografias: actividad.enlacesTopografias || [],
        enlacesDrive: actividad.enlacesDrive || [],
        enlacesWeb: actividad.enlacesWeb || [],
      });
    }
  }, [actividad, reset]);

  const handleTipoChange = (tipo: TipoActividad) => {
    if (selectedTipos.includes(tipo)) {
      setSelectedTipos(selectedTipos.filter(t => t !== tipo));
    } else {
      setSelectedTipos([...selectedTipos, tipo]);
    }
    setValue('tipo', selectedTipos.includes(tipo) ? 
      selectedTipos.filter(t => t !== tipo) : 
      [...selectedTipos, tipo]
    );
  };

  const handleSubtipoChange = (subtipo: SubtipoActividad) => {
    if (selectedSubtipos.includes(subtipo)) {
      setSelectedSubtipos(selectedSubtipos.filter(s => s !== subtipo));
    } else {
      setSelectedSubtipos([...selectedSubtipos, subtipo]);
    }
    setValue('subtipo', selectedSubtipos.includes(subtipo) ? 
      selectedSubtipos.filter(s => s !== subtipo) : 
      [...selectedSubtipos, subtipo]
    );
  };

  const onSubmit: SubmitHandler<ActividadFormData> = async (data) => {
    if (selectedTipos.length === 0) {
      toast({
        title: messages.actividades.toast.errorGuardar,
        description: messages.actividades.form.tipoError,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (selectedSubtipos.length === 0) {
      toast({
        title: messages.actividades.toast.errorGuardar,
        description: messages.actividades.form.tipoError,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!userProfile) return;

    try {
      setIsSubmitting(true);
      
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const fechaInicio = new Date(data.fechaInicio);
      fechaInicio.setHours(0, 0, 0, 0);
      
      const fechaFin = new Date(data.fechaFin);
      fechaFin.setHours(0, 0, 0, 0);
      
      let estadoAutomatico: EstadoActividad = data.estado;
      
      if (data.estado !== 'cancelada') {
        const mañana = new Date(hoy);
        mañana.setDate(mañana.getDate() + 1);
        
        if (hoy.getTime() > fechaFin.getTime()) {
          estadoAutomatico = 'finalizada';
        } else if (hoy.getTime() === fechaFin.getTime()) {
          estadoAutomatico = 'en_curso';
        } else if (hoy.getTime() >= fechaInicio.getTime()) {
          estadoAutomatico = 'en_curso';
        } else {
          estadoAutomatico = 'planificada';
        }
      }
      
      const actividadData = {
        ...data,
        estado: estadoAutomatico,
        tipo: selectedTipos,
        subtipo: selectedSubtipos,
        materiales: data.materiales,
        responsableMaterialId: data.responsableMaterialId || data.responsableActividadId || userProfile.uid,
        enlacesWikiloc: data.enlacesWikiloc || [],
        enlacesTopografias: data.enlacesTopografias || [],
        enlacesDrive: data.enlacesDrive || [],
        enlacesWeb: data.enlacesWeb || [],
        enlaces: [
          ...(data.enlacesWikiloc || []).map(e => e.url),
          ...(data.enlacesTopografias || []), 
          ...(data.enlacesDrive || []), 
          ...(data.enlacesWeb || [])
        ]
      };

      let resultado;
      if (actividad?.id) {
        resultado = await actualizarActividad(actividad.id, actividadData);
        toast({
          title: messages.actividades.toast.actividadActualizada,
          description: messages.actividades.toast.actividadActualizadaDesc,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        resultado = await crearActividad({
          nombre: data.nombre,
          descripcion: data.descripcion || '',
          lugar: data.lugar,
          fechaInicio: data.fechaInicio,
          fechaFin: data.fechaFin,
          creadorId: userProfile.uid,
          responsableActividadId: data.responsableActividadId || userProfile.uid,
          responsableMaterialId: data.responsableMaterialId,
          participanteIds: data.participanteIds || [userProfile.uid],
          tipo: actividadData.tipo,
          subtipo: actividadData.subtipo,
          dificultad: data.dificultad,
          necesidadMaterial: Array.isArray(data.materiales) && data.materiales.length > 0,
          materiales: data.materiales || [],
          estado: actividadData.estado as EstadoActividad,
          comentarios: [],
          enlaces: actividadData.enlaces || [],
          enlacesWikiloc: data.enlacesWikiloc || [],
          enlacesTopografias: data.enlacesTopografias || [],
          enlacesDrive: data.enlacesDrive || [],
          enlacesWeb: data.enlacesWeb || [],
          imagenesTopografia: [],
          archivosAdjuntos: []
        });
        toast({
          title: messages.actividades.toast.actividadActualizada,
          description: messages.actividades.toast.actividadActualizadaDesc,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        reset();
      }
      
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error al guardar actividad:", error);
      toast({
        title: messages.actividades.toast.errorGuardar,
        description: messages.actividades.toast.errorGuardarDesc,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { isOpen: isParticipantesOpen, onOpen: onParticipantesOpen, onClose: onParticipantesClose } = useDisclosure();
  
  const handleParticipantesChange = (selectedIds: string[]) => {
    setValue('participanteIds', selectedIds);
  };

  // Si quieres añadir validación para asegurarte de que las URLs sean de Drive
  const isDriveUrl = (url: string) => {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  };

  return (
    <Box 
      as="form" 
      onSubmit={handleSubmit(onSubmit)}
      className="form-container"
      p={5} 
      shadow="md" 
      borderWidth="1px" 
      borderRadius="md" 
      bg="white"
    >
      
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
        <FormControl isRequired isInvalid={!!errors.nombre}>
          <FormLabel>{messages.actividades.form.nombreLabel}</FormLabel>
          <Input 
            {...register('nombre', { 
              required: 'El nombre es obligatorio',
              maxLength: { value: 100, message: 'El nombre es demasiado largo' }
            })} 
          />
          {errors.nombre && (
            <FormErrorMessage>{errors.nombre.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.lugar}>
          <FormLabel>{messages.actividades.form.lugarLabel}</FormLabel>
          <Input 
            {...register('lugar', { 
              required: 'El lugar es obligatorio'
            })} 
          />
          {errors.lugar && (
            <FormErrorMessage>{errors.lugar.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
      </SimpleGrid>
      
      <Box mb={6}>
        <Text fontWeight="bold" mb={2}>{messages.actividades.form.tipoLabel}</Text>
        <HStack spacing={4} mb={4}>
          {TIPOS_ACTIVIDAD.map(tipo => (
            <Button
              key={tipo.value}
              colorScheme={selectedTipos.includes(tipo.value as TipoActividad) ? "brand" : "gray"}
              onClick={() => handleTipoChange(tipo.value as TipoActividad)}
              size="sm"
            >
              {tipo.label}
            </Button>
          ))}
        </HStack>
        
        <Text fontWeight="bold" mb={2}>{messages.actividades.form.subtipoLabel}</Text>
        <HStack spacing={4}>
          {SUBTIPOS_ACTIVIDAD.map(subtipo => (
            <Button
              key={subtipo.value}
              colorScheme={selectedSubtipos.includes(subtipo.value as SubtipoActividad) ? "brand" : "gray"}
              onClick={() => handleSubtipoChange(subtipo.value as SubtipoActividad)}
              size="sm"
            >
              {subtipo.label}
            </Button>
          ))}
        </HStack>
        <FormControl isRequired isInvalid={!!errors.dificultad} mt={4}>
          <FormLabel>{messages.actividades.form.dificultadLabel}</FormLabel>
          <Select 
            {...register('dificultad', { 
              required: 'La dificultad es obligatoria'
            })}
          >
            {DIFICULTADES.map(dificultad => (
              <option key={dificultad.value} value={dificultad.value}>
                {dificultad.label}
              </option>
            ))}
          </Select>
          {errors.dificultad && (
            <FormErrorMessage>{errors.dificultad.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
      </Box>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
        <FormControl isRequired isInvalid={!!errors.fechaInicio}>
          <FormLabel>{messages.actividades.form.fechaInicioLabel}</FormLabel>
          <Controller
            name="fechaInicio"
            control={control}
            rules={{ required: 'La fecha de inicio es obligatoria' }}
            render={({ field }) => <DatePicker {...field} control={control} />}
          />
          {errors.fechaInicio && (
            <FormErrorMessage>{errors.fechaInicio.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
        
        <FormControl isRequired isInvalid={!!errors.fechaFin}>
          <FormLabel>{messages.actividades.form.fechaFinLabel}</FormLabel>
          <Controller
            name="fechaFin"
            control={control}
            rules={{ 
              required: 'La fecha de finalización es obligatoria',
              validate: {
                afterStart: (value: Date) => {
                  const fechaInicio = watch('fechaInicio');
                  return !fechaInicio || value >= fechaInicio || 
                    'La fecha de finalización debe ser posterior a la fecha de inicio';
                }
              }
            }}
            render={({ field }) => <DatePicker {...field} control={control} />}
          />
          {errors.fechaFin && (
            <FormErrorMessage>{errors.fechaFin.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
      </SimpleGrid>
      
      <FormControl mb={6} isInvalid={!!errors.descripcion}>
        <FormLabel>{messages.actividades.form.descripcionLabel}</FormLabel>
        <Textarea 
          {...register('descripcion')} 
          placeholder="Descripción detallada de la actividad"
          rows={3}
        />
        {errors.descripcion && (
          <FormErrorMessage>{errors.descripcion.message?.toString()}</FormErrorMessage>
        )}
      </FormControl>
      
      <Divider mb={6} />
      
      <Heading size="sm" mb={4}>{messages.actividades.form.responsablesLabel}</Heading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} mb={6}>
        <FormControl isRequired isInvalid={!!errors.responsableActividadId}>
          <FormLabel>{messages.actividades.form.responsableActividadLabel}</FormLabel>
          <Select 
            {...register('responsableActividadId', { 
              required: 'El responsable de la actividad es obligatorio' 
            })}
          >
            <option value="">{messages.actividades.form.seleccionaResponsable}</option>
            {usuarios.map(usuario => (
              <option key={usuario.uid} value={usuario.uid}>
                {usuario.nombre} {usuario.apellidos}
              </option>
            ))}
          </Select>
          {errors.responsableActividadId && (
            <FormErrorMessage>{errors.responsableActividadId.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
        
        <FormControl isInvalid={!!errors.participanteIds}>
          <FormLabel>{messages.actividades.form.participantesLabel}</FormLabel>
          <Flex>
            <Button 
              leftIcon={<FiUsers />} 
              onClick={onParticipantesOpen} 
              colorScheme="brand" 
              variant="outline"
              width="full"
            >
              {watch('participanteIds')?.length || 0} participantes seleccionados
            </Button>
          </Flex>
          {errors.participanteIds && (
            <FormErrorMessage>{errors.participanteIds.message?.toString()}</FormErrorMessage>
          )}
        </FormControl>
      </SimpleGrid>
      
      <Divider mb={6} />
      
      <Divider mb={6} />
      
      <Box mb={6}>
  <Heading size="sm" mb={4}>{messages.actividades.form.enlacesLabel}</Heading>
  
  <Box mb={4} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
    <Heading size="xs" mb={3}>{messages.actividades.form.wikilocLabel}</Heading>
    <Flex mb={2} alignItems="center">
      <Input
        placeholder="URL del track de Wikiloc"
        value={nuevoEnlaceWikiloc.url}
        onChange={(e) => setNuevoEnlaceWikiloc({...nuevoEnlaceWikiloc, url: e.target.value})}
        mr={2}
      />
      <Checkbox 
        isChecked={nuevoEnlaceWikiloc.esEmbed}
        onChange={(e) => setNuevoEnlaceWikiloc({...nuevoEnlaceWikiloc, esEmbed: e.target.checked})}
        mr={2}
      >
        Es código de embebido
      </Checkbox>
      <Button 
        onClick={() => {
          if (nuevoEnlaceWikiloc.url.trim()) {
            const enlacesActuales = watch('enlacesWikiloc') || [];
            setValue('enlacesWikiloc', [...enlacesActuales, {...nuevoEnlaceWikiloc}]);
            setNuevoEnlaceWikiloc({ url: '', esEmbed: false });
          }
        }} 
        colorScheme="brand"
      >
        Añadir
      </Button>
    </Flex>
    
    {(watch('enlacesWikiloc') || []).length > 0 && (
      <Box mt={2}>
        {(watch('enlacesWikiloc') || []).map((enlace, index) => (
          <Flex key={`wikiloc-${index}`} alignItems="center" mb={2}>
            <Text flex="1" isTruncated>
              {enlace.esEmbed ? '📋 Código embebido' : '🔗'} {enlace.url}
            </Text>
            <Button 
              size="sm" 
              colorScheme="red" 
              onClick={() => {
                const enlaces = [...(watch('enlacesWikiloc') || [])];
                enlaces.splice(index, 1);
                setValue('enlacesWikiloc', enlaces);
              }}
            >
              Eliminar
            </Button>
          </Flex>
        ))}
      </Box>
    )}
  </Box>
  
  <Box mb={4} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
    <Heading size="xs" mb={3}>{messages.actividades.form.topoLabel}</Heading>
    
    {driveConfig.googleDriveUrl && (
      <Button 
        leftIcon={<FiFolder />}
        colorScheme="blue" 
        variant="outline" 
        size="sm" 
        mb={3}
        onClick={() => {
          let topoUrl = driveConfig.googleDriveUrl;
          if (driveConfig.googleDriveTopoFolder) {
            if (topoUrl.endsWith('/')) {
              topoUrl += driveConfig.googleDriveTopoFolder;
            } else {
              topoUrl += '/' + driveConfig.googleDriveTopoFolder;
            }
          }
          window.open(topoUrl, '_blank');
        }}
      >
        Explorar topografías en Drive
      </Button>
    )}
    
    <Flex mb={2}>
      <Input
        placeholder="URL de la topografía"
        value={nuevoEnlaceTopografia}
        onChange={(e) => setNuevoEnlaceTopografia(e.target.value)}
        mr={2}
      />
      <Button 
        onClick={() => {
          if (nuevoEnlaceTopografia.trim()) {
            const enlacesActuales = watch('enlacesTopografias') || [];
            setValue('enlacesTopografias', [...enlacesActuales, nuevoEnlaceTopografia.trim()]);
            setNuevoEnlaceTopografia('');
          }
        }} 
        colorScheme="brand"
      >
        Añadir
      </Button>
    </Flex>
    
    {(watch('enlacesTopografias') || []).length > 0 && (
      <Box mt={2}>
        {(watch('enlacesTopografias') || []).map((enlace, index) => (
          <Flex key={`topo-${index}`} alignItems="center" mb={2}>
            <Text flex="1" isTruncated>🗺️ {enlace}</Text>
            <Button 
              size="sm" 
              colorScheme="red" 
              onClick={() => {
                const enlaces = [...(watch('enlacesTopografias') || [])];
                enlaces.splice(index, 1);
                setValue('enlacesTopografias', enlaces);
              }}
            >
              Eliminar
            </Button>
          </Flex>
        ))}
      </Box>
    )}
  </Box>

  <Box p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
    <Heading size="xs" mb={3}>{messages.actividades.form.driveLabel}</Heading>
    
    {driveConfig.googleDriveUrl && (
      <Button 
        leftIcon={<FiFolder />}
        colorScheme="blue" 
        variant="outline" 
        size="sm" 
        mb={3}
        onClick={() => {
          let docUrl = driveConfig.googleDriveUrl;
          if (driveConfig.googleDriveDocFolder) {
            if (docUrl.endsWith('/')) {
              docUrl += driveConfig.googleDriveDocFolder;
            } else {
              docUrl += '/' + driveConfig.googleDriveDocFolder;
            }
          }
          window.open(docUrl, '_blank');
        }}
      >
        Explorar documentos en Drive
      </Button>
    )}
    
    <Flex mb={2}>
      <Input
        placeholder="URL del documento de Google Drive"
        value={nuevoEnlaceDrive}
        onChange={(e) => setNuevoEnlaceDrive(e.target.value)}
        mr={2}
      />
      <Button 
        onClick={() => {
          if (nuevoEnlaceDrive.trim()) {
            if (!isDriveUrl(nuevoEnlaceDrive)) {
              toast({
                title: "URL no válida",
                description: "Por favor introduce una URL válida de Google Drive",
                status: "warning",
                duration: 3000,
              });
              return;
            }
            const enlacesActuales = watch('enlacesDrive') || [];
            setValue('enlacesDrive', [...enlacesActuales, nuevoEnlaceDrive.trim()]);
            setNuevoEnlaceDrive('');
          }
        }} 
        colorScheme="brand"
      >
        Añadir
      </Button>
    </Flex>
    
    {(watch('enlacesDrive') || []).length > 0 && (
      <Box mt={2}>
        {(watch('enlacesDrive') || []).map((enlace, index) => (
          <Flex key={`drive-${index}`} alignItems="center" mb={2}>
            <Text flex="1" isTruncated>📄 {enlace}</Text>
            <Button 
              size="sm" 
              colorScheme="red" 
              onClick={() => {
                const enlaces = [...(watch('enlacesDrive') || [])];
                enlaces.splice(index, 1);
                setValue('enlacesDrive', enlaces);
              }}
            >
              Eliminar
            </Button>
          </Flex>
        ))}
      </Box>
    )}
  </Box>

  <Box p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
    <Heading size="xs" mb={3}>{messages.actividades.form.webLabel}</Heading>
    <Flex mb={2}>
      <Input
        placeholder="URL del sitio web"
        value={nuevoEnlaceWeb}
        onChange={(e) => setNuevoEnlaceWeb(e.target.value)}
        mr={2}
      />
      <Button 
        onClick={() => {
          if (nuevoEnlaceWeb.trim()) {
            const enlacesActuales = watch('enlacesWeb') || [];
            setValue('enlacesWeb', [...enlacesActuales, nuevoEnlaceWeb.trim()]);
            setNuevoEnlaceWeb('');
          }
        }} 
        colorScheme="brand"
      >
        Añadir
      </Button>
    </Flex>
    
    {(watch('enlacesWeb') || []).length > 0 && (
      <Box mt={2}>
        {(watch('enlacesWeb') || []).map((enlace, index) => (
          <Flex key={`web-${index}`} alignItems="center" mb={2}>
            <Text flex="1" isTruncated>🌐 {enlace}</Text>
            <Button 
              size="sm" 
              colorScheme="red" 
              onClick={() => {
                const enlaces = [...(watch('enlacesWeb') || [])];
                enlaces.splice(index, 1);
                setValue('enlacesWeb', enlaces);
              }}
            >
              Eliminar
            </Button>
          </Flex>
        ))}
      </Box>
    )}
  </Box>
</Box>
      
      <Stack direction="row" spacing={4} justify="flex-end">
        {onCancel && (
          <Button 
            variant="outline" 
            onClick={onCancel}
            isDisabled={isSubmitting}
          >
            {messages.actividades.form.cancelarLabel}
          </Button>
        )}
        
        <Button
          type="submit"
          colorScheme="brand"
          isLoading={isSubmitting}
          loadingText="Guardando..."
        >
          {actividad ? messages.actividades.form.actualizarLabel : messages.actividades.form.crearLabel} Actividad
        </Button>
      </Stack>

      <ParticipantesSelector
        isOpen={isParticipantesOpen}
        onClose={onParticipantesClose}
        usuarios={usuarios}
        selectedParticipants={watch('participanteIds') || []}
        onSave={handleParticipantesChange}
      />
    </Box>
  );
};

export default ActividadForm;