import React, { useState, useEffect, useRef, useMemo, lazy, Suspense, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, 
  Container, 
  Flex, 
  Heading, 
  Spinner, 
  Center, 
  Alert, 
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  useToast,
  Badge,
  Card,
  CardBody,
  HStack
} from '@chakra-ui/react';
import { FiFileText, FiUsers, FiPackage, FiLink, FiArrowLeft, FiChevronLeft, FiChevronRight, FiSave } from 'react-icons/fi';
import { Timestamp } from 'firebase/firestore';

// Imports de componentes y servicios
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { obtenerActividad, crearActividad, actualizarActividad } from '../../services/actividadService';
import { useAuth } from '../../contexts/AuthContext';
import { Actividad, EstadoActividad } from '../../types/actividad';

// Importar utilidades
import { normalizarFecha, toDate, toTimestamp, compareDates } from '../../utils/dateUtils';
import { validateActividad } from '../../utils/actividadUtils';
import { determinarEstadoActividad } from '../../utils/dateUtils';
import { verificarConexionFirebase } from '../../utils/firebaseUtils';

// Lazy loading para componentes pesados
const InfoEditor = lazy(() => import('../../components/actividades/InfoEditor'));
const ParticipantesEditor = lazy(() => import('../../components/actividades/ParticipantesEditor'));
const MaterialEditor = lazy(() => import('../../components/actividades/MaterialEditor'));
const EnlacesEditor = lazy(() => import('../../components/actividades/EnlacesEditor'));

// OPTIMIZACIONES DE RENDIMIENTO INTEGRADAS
// ========================================

// Función para configurar optimizaciones del scheduler de React
const setupSchedulerOptimizer = (): (() => void) => {
  // Almacenar referencias originales sin modificar las APIs nativas
  // Usaremos observadores de rendimiento en su lugar
  
  const performanceObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        // Detectar operaciones largas y registrarlas
        console.debug('Operación larga detectada:', entry.name, entry.duration);
      }
    }
  });

  try {
    performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
  } catch (error) {
    console.debug('PerformanceObserver no disponible');
  }

  // Función de limpieza
  return () => {
    try {
      performanceObserver.disconnect();
    } catch (error) {
      console.debug('Error al desconectar PerformanceObserver');
    }
  };
};

// Función para diferir operaciones costosas
const deferCallback = async <T,>(operation: () => T | Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    const executeOperation = async () => {
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        executeOperation();
      }, { timeout: 200 });
    } else {
      setTimeout(executeOperation, 0);
    }
  });
};

// Hook para optimizar click handlers
const useOptimizedClickHandler = <T extends any[]>(
  handler: (...args: T) => void | Promise<void>
) => {
  const lastExecutionRef = useRef<number>(0);
  const throttleDelay = 100;

  return useCallback((...args: T) => {
    const now = performance.now();
    const timeSinceLastExecution = now - lastExecutionRef.current;

    if (timeSinceLastExecution < throttleDelay) {
      setTimeout(() => {
        handler(...args);
        lastExecutionRef.current = performance.now();
      }, throttleDelay - timeSinceLastExecution);
      return;
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(async () => {
        await handler(...args);
      });
    } else {
      setTimeout(() => handler(...args), 0);
    }
    
    lastExecutionRef.current = now;
  }, [handler]);
};

// Optimizador de cambio de pestañas
const optimizeTabChange = (originalHandler: (index: number) => void) => {
  let lastChangeTime = 0;
  const throttleDelay = 100;

  return function(newIndex: number) {
    const now = performance.now();
    
    if (now - lastChangeTime < throttleDelay) {
      setTimeout(() => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => originalHandler(newIndex));
        } else {
          originalHandler(newIndex);
        }
      }, throttleDelay);
    } else {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => originalHandler(newIndex));
      } else {
        originalHandler(newIndex);
      }
    }
    
    lastChangeTime = now;
  };
};

// Validador optimizado
const createOptimizedValidator = <T,>(originalValidator: (data: T) => string | null | boolean) => {
  return async function(data: T): Promise<boolean> {
    return new Promise((resolve) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          try {
            const result = originalValidator(data);
            if (typeof result === 'boolean') {
              resolve(result);
            } else if (typeof result === 'string') {
              resolve(false);
            } else {
              // result es null, que significa válido
              resolve(true);
            }
          } catch (error) {
            console.warn('Error en validador optimizado:', error);
            resolve(false);
          }
        });
      } else {
        setTimeout(() => {
          try {
            const result = originalValidator(data);
            if (typeof result === 'boolean') {
              resolve(result);
            } else if (typeof result === 'string') {
              resolve(false);
            } else {
              // result es null, que significa válido
              resolve(true);
            }
          } catch (error) {
            console.warn('Error en validador optimizado:', error);
            resolve(false);
          }
        }, 0);
      }
    });
  };
};

const ActividadFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast({
    position: "top",
    duration: 5000,
    isClosable: true,
  });
  const { userProfile } = useAuth();
  
  // Estados principales
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [error, setError] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<Actividad>>({});

  // Indicadores de secciones editadas
  const [infoEdited, setInfoEdited] = useState<boolean>(false);
  const [participantesEdited, setParticipantesEdited] = useState<boolean>(false);
  const [materialEdited, setMaterialEdited] = useState<boolean>(false);
  const [enlacesEdited, setEnlacesEdited] = useState<boolean>(false);

  // Estados de control
  const [isSaving, setIsSaving] = useState(false);

  // Referencias para componentes
  const infoEditorRef = useRef<any>(null);
  const participantesEditorRef = useRef<any>(null);
  const materialEditorRef = useRef<any>(null);
  const enlacesEditorRef = useRef<any>(null);
  
  // Optimizaciones de rendimiento
  const optimizedValidator = useMemo(() => {
    return createOptimizedValidator((data: Partial<Actividad>) => {
      return validateActividad(data);
    });
  }, []);

  const optimizedTabChange = useMemo(() => {
    return optimizeTabChange((newIndex: number) => {
      setTabIndex(newIndex);
    });
  }, []);

  // Función para guardar en localStorage de forma diferida
  const saveToLocalStorage = (data: Partial<Actividad>) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        localStorage.setItem('actividad_temp_data', JSON.stringify(data));
      });
    } else {
      setTimeout(() => {
        localStorage.setItem('actividad_temp_data', JSON.stringify(data));
      }, 0);
    }
  };
  // Aplicar optimizador del scheduler al montar el componente
  useEffect(() => {
    const cleanup = setupSchedulerOptimizer();
    return cleanup;
  }, []);

  // Verificar conexión al cargar
  useEffect(() => {
    const verificarConexion = async () => {
      try {
        const conectado = await verificarConexionFirebase();
        if (!conectado) {
          toast({
            title: "Problema de conexión",
            description: "No se pudo conectar con la base de datos. Revise su conexión a internet.",
            status: "warning",
            duration: 5000,
            isClosable: true
          });
        }
      } catch (error) {
        console.error('Error al verificar conexión:', error);
        toast({
          title: "Error de conexión",
          description: "Se produjo un error al verificar la conexión con la base de datos.",
          status: "error",
          duration: 5000,
          isClosable: true
        });
      }
    };
    
    verificarConexion();
  }, [toast]);

  // Cargar actividad si estamos en modo edición - OPTIMIZADO
  useEffect(() => {
    const cargarActividad = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Diferir la carga usando deferCallback para evitar violaciones
        await deferCallback(async () => {
          const actividadData = await obtenerActividad(id);
          
          // Procesar datos en chunks para evitar bloquear UI
          const processedData = {
            ...actividadData,
            // Asegurar que los arrays estén inicializados
            participanteIds: actividadData.participanteIds || [],
            materiales: actividadData.materiales || [],
            enlacesWikiloc: actividadData.enlacesWikiloc || [],
            enlacesTopografias: actividadData.enlacesTopografias || [],
            enlacesDrive: actividadData.enlacesDrive || [],
            enlacesWeb: actividadData.enlacesWeb || []
          };
          
          setActividad(processedData);
          setFormData(processedData);
        });
      } catch (error) {
        console.error('Error al cargar la actividad:', error);
        setError('No se pudo cargar la actividad para editar');
      } finally {
        setLoading(false);
      }
    };

    cargarActividad();
  }, [id]);

  // Para nuevo registro, inicializar con datos básicos
  useEffect(() => {
    if (!id && userProfile) {
      const mañana = new Date();
      mañana.setDate(mañana.getDate() + 1);
      
      const inicialData: Partial<Actividad> = {
        creadorId: userProfile.uid,
        responsableActividadId: userProfile.uid,
        fechaInicio: mañana,
        fechaFin: new Date(mañana.getTime() + 24 * 60 * 60 * 1000),
        participanteIds: [userProfile.uid],
        necesidadMaterial: false,
        tipo: [],
        subtipo: [],
        estado: 'planificada' as EstadoActividad,
        materiales: [],
        enlacesWikiloc: [],
        enlacesTopografias: [],
        enlacesDrive: [],
        enlacesWeb: []
      };
      
      setFormData(inicialData);
      setInfoEdited(false);
      setParticipantesEdited(false);
      setMaterialEdited(false);
      setEnlacesEdited(false);
    }
  }, [id, userProfile]);  // Función para obtener actividad completa
  const getCompleteActivity = (data: Partial<Actividad>): Actividad => {
    const completeActivity = {
      id: data.id,
      nombre: data.nombre || '',
      tipo: data.tipo || [],
      subtipo: data.subtipo || [],
      descripcion: data.descripcion || '',
      fechaInicio: data.fechaInicio || new Date(),
      fechaFin: data.fechaFin || new Date(Date.now() + 24 * 60 * 60 * 1000),
      lugar: data.lugar || '',
      responsableActividadId: data.responsableActividadId || (userProfile?.uid || ''),
      participanteIds: data.participanteIds || [],
      necesidadMaterial: data.necesidadMaterial || false,
      materiales: data.materiales || [],
      estado: (data.estado as EstadoActividad) || 'planificada',
      creadorId: data.creadorId || (userProfile?.uid || ''),
      comentarios: data.comentarios || [],
      fechaActualizacion: Timestamp.fromDate(new Date()),
      enlacesWikiloc: data.enlacesWikiloc || [],
      enlacesTopografias: data.enlacesTopografias || [],
      enlacesDrive: data.enlacesDrive || [],
      enlacesWeb: data.enlacesWeb || [],
      imagenesTopografia: data.imagenesTopografia || [],
      archivosAdjuntos: data.archivosAdjuntos || [],
      enlaces: [
        ...(data.enlacesWikiloc?.map(e => e.url) || []),
        ...(data.enlacesTopografias || []),
        ...(data.enlacesDrive || []),
        ...(data.enlacesWeb || [])
      ]
    } as Actividad;
    
    console.log("ActividadFormPage - getCompleteActivity enviando a InfoEditor:", completeActivity);
    console.log("ActividadFormPage - tipos enviados a InfoEditor:", completeActivity.tipo);
    console.log("ActividadFormPage - subtipos enviados a InfoEditor:", completeActivity.subtipo);
    
    return completeActivity;
  };
  // Handlers de guardado optimizados
  const handleInfoSave = useOptimizedClickHandler(async (infoData: Partial<Actividad>) => {
    await deferCallback(async () => {
      console.log("ActividadFormPage - handleInfoSave recibió:", infoData);
      
      // Convertir fechas de manera segura
      const fechaInicio = infoData.fechaInicio instanceof Timestamp ? 
        infoData.fechaInicio.toDate() : infoData.fechaInicio;
      const fechaFin = infoData.fechaFin instanceof Timestamp ? 
        infoData.fechaFin.toDate() : infoData.fechaFin;
        
      // Actualizar estado de forma optimizada
      setFormData(prevFormData => {
        const updatedData = {
          ...prevFormData,
          ...infoData,
          nombre: infoData.nombre?.trim() || '',
          lugar: infoData.lugar?.trim() || '',
          tipo: infoData.tipo || [],
          subtipo: infoData.subtipo || [],
          fechaInicio: fechaInicio,
          fechaFin: fechaFin
        };
        
        console.log("ActividadFormPage - formData actualizado:", updatedData);
        console.log("ActividadFormPage - tipos en formData:", updatedData.tipo);
        console.log("ActividadFormPage - subtipos en formData:", updatedData.subtipo);
        
        // Guardar en localStorage de forma diferida
        saveToLocalStorage(updatedData);
        
        return updatedData;
      });
      
      setInfoEdited(true);
      toast({
        title: "Información guardada",
        status: "success",
        duration: 3000
      });
      
      optimizedTabChange(1);
    });
  });

  const handleParticipantesSave = useOptimizedClickHandler(async (participanteIds: string[]) => {
    await deferCallback(async () => {
      setFormData((prev: Partial<Actividad>) => ({
        ...prev,
        participanteIds
      }));
      
      setParticipantesEdited(true);
      toast({
        title: "Participantes guardados",
        status: "success",
        duration: 3000
      });
      
      optimizedTabChange(2);
    });
  });

  const handleMaterialSave = useOptimizedClickHandler(async (materiales: any[]) => {
    await deferCallback(async () => {
      setFormData((prev: Partial<Actividad>) => {
        const updatedData = {
          ...prev,
          materiales: materiales,
          necesidadMaterial: materiales.length > 0
        };
        
        saveToLocalStorage(updatedData);
        return updatedData;
      });
      
      setMaterialEdited(true);
      toast({
        title: "Material guardado",
        status: "success",
        duration: 3000
      });
      
      if (tabIndex === 2) {
        optimizedTabChange(3);
      }
    });
  });

  const handleEnlacesSave = useOptimizedClickHandler(async (enlaces: Partial<Actividad>) => {
    await deferCallback(async () => {
      setFormData((prev: Partial<Actividad>) => ({
        ...prev,
        ...enlaces
      }));
      setEnlacesEdited(true);
      
      // Si estamos en la última pestaña, guardar toda la actividad
      try {
        const isValid = await optimizedValidator({...formData, ...enlaces});
        if (!isValid) {
          toast({
            title: "Datos incompletos",
            description: "Por favor completa todos los campos requeridos",
            status: "error",
            duration: 5000
          });
          return;
        }

        await handleSaveAll();
      } catch (error) {
        console.error("Error al validar enlaces:", error);
        toast({
          title: "Error",
          description: "Error al validar los datos",
          status: "error",
          duration: 3000
        });
      }
    });
  });

  // Función de guardado final optimizada
  const handleSaveAll = useOptimizedClickHandler(async () => {
    try {
      setIsSaving(true);
      
      await deferCallback(async () => {
        // Determinar estado según fechas de forma segura
        const hoy = normalizarFecha(new Date());
        const fechaInicio = normalizarFecha(toDate(formData.fechaInicio));
        const fechaFin = normalizarFecha(toDate(formData.fechaFin));

        let estadoAutomatico: EstadoActividad = 'planificada';

        // Solo cambiar estado si todas las fechas son válidas
        if (hoy && fechaInicio && fechaFin && formData.estado !== 'cancelada') {
          const compFin = compareDates(hoy, fechaFin);
          const compInicio = compareDates(hoy, fechaInicio);
          
          if (compFin !== null && compFin > 0) {
            estadoAutomatico = 'finalizada';
          } else if (compInicio !== null && compInicio >= 0) {
            estadoAutomatico = 'en_curso';
          } else {
            estadoAutomatico = 'planificada';
          }
        }

        // Crear el objeto de actividad completo
        const actividadCompleta = {
          nombre: formData.nombre || '',
          tipo: formData.tipo || [],
          subtipo: formData.subtipo || [],
          descripcion: formData.descripcion || '',
          lugar: formData.lugar || '',
          responsableActividadId: formData.responsableActividadId || userProfile?.uid || '',
          participanteIds: formData.participanteIds || [],
          necesidadMaterial: formData.materiales ? formData.materiales.length > 0 : false,
          materiales: formData.materiales || [],
          estado: estadoAutomatico,
          comentarios: formData.comentarios || [],
          creadorId: formData.creadorId || userProfile?.uid || '',
          fechaInicio: toTimestamp(formData.fechaInicio) || Timestamp.fromDate(new Date()),
          fechaFin: toTimestamp(formData.fechaFin) || Timestamp.fromDate(new Date()),
          fechaActualizacion: Timestamp.fromDate(new Date()),
          enlacesWikiloc: formData.enlacesWikiloc || [],
          enlacesTopografias: formData.enlacesTopografias || [],
          enlacesDrive: formData.enlacesDrive || [],
          enlacesWeb: formData.enlacesWeb || [],
          imagenesTopografia: formData.imagenesTopografia || [],
          archivosAdjuntos: formData.archivosAdjuntos || [],
          enlaces: [
            ...(formData.enlacesWikiloc?.map(e => e.url) || []),
            ...(formData.enlacesTopografias || []),
            ...(formData.enlacesDrive || []),
            ...(formData.enlacesWeb || [])
          ]
        };

        let resultado: Actividad;
        
        if (id) {
          resultado = await actualizarActividad(id, actividadCompleta);
          toast({
            title: "Actividad actualizada",
            status: "success",
            duration: 5000
          });
        } else {
          resultado = await crearActividad(actividadCompleta);
          toast({
            title: "Actividad creada",
            status: "success",
            duration: 5000
          });
        }
        
        // Limpiar localStorage tras guardar correctamente
        localStorage.removeItem('actividad_temp_data');
        
        navigate(`/activities/${resultado.id}`);
      });
    } catch (error) {
      console.error("Error al guardar la actividad:", error);
      toast({
        title: "Error",
        description: "Se produjo un error al guardar la actividad. Por favor, inténtelo de nuevo.",
        status: "error",
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  });

  const handleCancel = () => {
    navigate(id ? `/activities/${id}` : '/activities');
  };

  // Función optimizada para cambio de pestañas con validación
  const handleTabButtons = async (action: 'prev' | 'next' | 'save') => {
    switch (action) {
      case 'prev':
        if (tabIndex > 0) {
          optimizedTabChange(tabIndex - 1);
        }
        break;
        
      case 'next':
        if (tabIndex < 3) {
          // Validar pestaña actual antes de avanzar
          let canAdvance = true;
          
          if (tabIndex === 0 && !infoEdited) {
            toast({
              title: "Información incompleta",
              description: "Por favor completa la información básica antes de continuar",
              status: "warning",
              duration: 3000
            });
            canAdvance = false;
          }
          
          if (canAdvance) {
            optimizedTabChange(tabIndex + 1);
          }
        }
        break;
        
      case 'save':
        // Guardar la pestaña actual
        switch (tabIndex) {
          case 0: // Información
            if (infoEditorRef.current?.submitForm) {
              infoEditorRef.current.submitForm();
            }
            break;
            
          case 1: // Participantes
            if (participantesEditorRef.current?.submitForm) {
              participantesEditorRef.current.submitForm();
            }
            break;
            
          case 2: // Material
            if (materialEditorRef.current?.submitForm) {
              materialEditorRef.current.submitForm();
            }
            break;
            
          case 3: // Enlaces
            if (enlacesEditorRef.current?.submitForm) {
              enlacesEditorRef.current.submitForm();
            } else {
              // Para la última pestaña, guardar todo
              handleSaveAll();
            }
            break;
        }
        break;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title={id ? "Editar Actividad" : "Nueva Actividad"}>
        <Center py={10}>
          <Spinner size="xl" color="brand.500" />
        </Center>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Error">
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={id ? "Editar Actividad" : "Nueva Actividad"}>
      <Container maxW="1200px" py={6}>
        <Card mb={6}>
          <CardBody>
            <Heading size="lg" mb={4}>
              {id ? "Editar Actividad" : "Crear Nueva Actividad"}
            </Heading>
            
            <Tabs index={tabIndex} onChange={(index) => optimizedTabChange(index)} variant="enclosed" colorScheme="brand" isFitted>
              <TabList>
                <Tab>
                  <FiFileText style={{marginRight: '8px'}} /> 
                  Información
                  {infoEdited && <Badge ml={2} colorScheme="green" borderRadius="full">✓</Badge>}
                </Tab>
                <Tab>
                  <FiUsers style={{marginRight: '8px'}} /> 
                  Participantes
                  {participantesEdited && <Badge ml={2} colorScheme="green" borderRadius="full">✓</Badge>}
                </Tab>
                <Tab>
                  <FiPackage style={{marginRight: '8px'}} /> 
                  Material
                  {materialEdited && <Badge ml={2} colorScheme="green" borderRadius="full">✓</Badge>}
                </Tab>
                <Tab>
                  <FiLink style={{marginRight: '8px'}} /> 
                  Enlaces
                  {enlacesEdited && <Badge ml={2} colorScheme="green" borderRadius="full">✓</Badge>}
                </Tab>
              </TabList>
              
              <TabPanels>
                <TabPanel>
                  <Suspense fallback={<Spinner />}>
                    <InfoEditor 
                      ref={infoEditorRef}
                      actividad={getCompleteActivity(formData)}
                      onSave={handleInfoSave} 
                      onCancel={handleCancel}
                      mostrarBotones={false}
                    />
                  </Suspense>
                  {!infoEdited && (
                    <Alert status="warning" mt={4}>
                      <AlertIcon />
                      Completa la información básica antes de continuar
                    </Alert>
                  )}
                </TabPanel>
                
                <TabPanel>
                  <Suspense fallback={<Spinner />}>
                    <ParticipantesEditor 
                      ref={participantesEditorRef}
                      actividad={getCompleteActivity(formData)}
                      onSave={handleParticipantesSave}
                      onCancel={handleCancel}
                      mostrarBotones={false}
                    />
                  </Suspense>
                </TabPanel>
                
                <TabPanel>
                  <Suspense fallback={<Spinner />}>
                    <MaterialEditor 
                      ref={materialEditorRef}
                      actividad={getCompleteActivity(formData)}
                      onSave={handleMaterialSave}
                      onCancel={handleCancel}
                      mostrarBotones={false}
                    />
                  </Suspense>
                </TabPanel>
                
                <TabPanel>
                  <Suspense fallback={<Spinner />}>
                    <EnlacesEditor 
                      ref={enlacesEditorRef}
                      actividad={getCompleteActivity(formData)}
                      onSave={handleEnlacesSave}
                      onCancel={handleCancel}
                      esNuevo={!id}
                      mostrarBotones={false}
                    />
                  </Suspense>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
        
        {/* Barra de navegación y botones */}
        <Box pt={4} pb={2} borderTop="1px" borderColor="gray.200" width="100%" mt={4}>
          <Flex justify="space-between" maxW="1200px" mx="auto">
            <Button 
              leftIcon={<FiArrowLeft />}
              onClick={handleCancel}
              variant="outline"
            >
              Cancelar
            </Button>
            
            <HStack spacing={3}>
              <Button 
                leftIcon={<FiChevronLeft />} 
                onClick={() => handleTabButtons('prev')} 
                isDisabled={tabIndex === 0}
                variant="ghost"
              >
                Anterior
              </Button>
              <Button 
                rightIcon={<FiChevronRight />} 
                onClick={() => handleTabButtons('next')} 
                isDisabled={tabIndex === 3}
                variant="ghost"
              >
                Siguiente
              </Button>
              <Button 
                leftIcon={<FiSave />} 
                colorScheme="brand" 
                onClick={() => tabIndex === 3 ? handleSaveAll() : handleTabButtons('save')}
                isLoading={isSaving}
                loadingText="Guardando..."
              >
                {tabIndex === 3 ? (id ? "Actualizar actividad" : "Crear actividad") : "Guardar y continuar"}
              </Button>
            </HStack>
          </Flex>
        </Box>
      </Container>
    </DashboardLayout>
  );
};

export default ActividadFormPage;
