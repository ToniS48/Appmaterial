import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Switch,
  Select,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useToast,
  Card,
  CardBody,
  Text,
  Badge,
  HStack,
  SimpleGrid,
  Alert,
  AlertIcon,
  VStack,
  Divider
} from '@chakra-ui/react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import MaterialDropdownManagerFunctional from '../admin/MaterialDropdownManagerFunctional';
import SystemVariablesViewer from '../admin/SystemVariablesViewer';

interface ConfigurationManagerProps {
  /** Rol del usuario (admin, vocal) */
  userRole: 'admin' | 'vocal';
  /** Título personalizado para la página */
  title?: string;
}

interface ConfigSettings {
  // Variables del sistema configurables
  variables: {
    // Gestión de préstamos y devoluciones
    diasGraciaDevolucion: number;
    diasMaximoRetraso: number;
    diasBloqueoPorRetraso: number;
      // Notificaciones automáticas
    recordatorioPreActividad: number;
    recordatorioDevolucion: number;
    notificacionRetrasoDevolucion: number;
    diasAntelacionRevision: number;
    
    // Gestión de material
    tiempoMinimoEntrePrestamos: number;
    porcentajeStockMinimo: number;
    diasRevisionPeriodica: number;
    
    // Gestión de actividades
    diasMinimoAntelacionCreacion: number;
    diasMaximoModificacion: number;
    limiteParticipantesPorDefecto: number;
    
    // Sistema de puntuación y reputación
    penalizacionRetraso: number;
    bonificacionDevolucionTemprana: number;
    umbraLinactividadUsuario: number;
      // Configuración de reportes
    diasHistorialReportes: number;
    limiteElementosExportacion: number;
  };
  // Configuración de APIs y servicios externos
  apis: {
    // URLs de Google Drive del club
    googleDriveUrl: string;
    googleDriveTopoFolder: string;
    googleDriveDocFolder: string;
    
    // Servicios meteorológicos
    weatherEnabled: boolean;
    weatherApiKey: string;
    weatherApiUrl: string;
    aemetEnabled: boolean;
    aemetApiKey: string;
    aemetUseForSpain: boolean;
    temperatureUnit: string;
    windSpeedUnit: string;
    precipitationUnit: string;
    
    // Configuración de backup
    backupApiKey: string;
    
    // Servicios de notificaciones
    emailServiceKey: string;
    smsServiceKey: string;
    notificationsEnabled: boolean;
    
    // Analytics
    analyticsKey: string;
    analyticsEnabled: boolean;
  };
  
  // Configuraciones adicionales solo para admin
  backupAutomatico?: boolean;
  frecuenciaBackup?: string;
}

/**
 * Componente compartido para gestión de configuración del sistema
 * Permite diferentes niveles de acceso según el rol del usuario
 */
const ConfigurationManager: React.FC<ConfigurationManagerProps> = ({
  userRole,
  title = 'Configuración del Sistema'
}) => {
  const { userProfile } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<ConfigSettings>({
    // Variables del sistema configurables
    variables: {
      // Gestión de préstamos y devoluciones
      diasGraciaDevolucion: 3,
      diasMaximoRetraso: 15,
      diasBloqueoPorRetraso: 30,
        // Notificaciones automáticas
      recordatorioPreActividad: 7,
      recordatorioDevolucion: 1,
      notificacionRetrasoDevolucion: 3,
      diasAntelacionRevision: 30,
      
      // Gestión de material
      tiempoMinimoEntrePrestamos: 1,
      porcentajeStockMinimo: 20,
      diasRevisionPeriodica: 180,
      
      // Gestión de actividades
      diasMinimoAntelacionCreacion: 3,
      diasMaximoModificacion: 2,
      limiteParticipantesPorDefecto: 20,
      
      // Sistema de puntuación y reputación
      penalizacionRetraso: 5,
      bonificacionDevolucionTemprana: 2,
      umbraLinactividadUsuario: 365,
        // Configuración de reportes
      diasHistorialReportes: 365,
      limiteElementosExportacion: 1000,
    },      // Configuración de APIs y servicios externos
    apis: {
      // URLs de Google Drive del club
      googleDriveUrl: '',
      googleDriveTopoFolder: '',
      googleDriveDocFolder: '',
      
      // Servicios meteorológicos
      weatherEnabled: true,
      weatherApiKey: '',
      weatherApiUrl: 'https://api.open-meteo.com/v1/forecast',
      aemetEnabled: false,
      aemetApiKey: '',
      aemetUseForSpain: true,
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      precipitationUnit: 'mm',
      
      // Configuración de backup
      backupApiKey: '',
      
      // Servicios de notificaciones
      emailServiceKey: '',
      smsServiceKey: '',
      notificationsEnabled: true,
      
      // Analytics
      analyticsKey: '',
      analyticsEnabled: false,
    },
    
    // Configuraciones adicionales solo para admin
    ...(userRole === 'admin' && {
      backupAutomatico: true,
      frecuenciaBackup: 'semanal'
    })
  });

  // Cargar configuraciones desde Firebase
  useEffect(() => {
    const cargarConfiguraciones = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(db, "configuracion", "global");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error al cargar la configuración:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar la configuración",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    cargarConfiguraciones();
  }, [toast]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    try {
      setIsLoading(true);
        // Determinar qué configuraciones puede actualizar cada rol
      const configToUpdate = userRole === 'admin' 
        ? settings // Admin puede actualizar todo
        : {
            variables: settings.variables
          }; // Vocal solo puede actualizar las variables del sistema
        const docRef = doc(db, "configuracion", "global");
      await updateDoc(docRef, configToUpdate as any);
      
      toast({
        title: "Configuración guardada",
        description: "Las configuraciones se han guardado correctamente",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error al guardar la configuración:", error);
      toast({
        title: "Error",
        description: "Error al guardar la configuración",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setSettings(prev => ({
        ...prev,
        [name]: parseInt(value)
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleVariableChange = (variableName: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [variableName]: value
      }
    }));
  };

  const handleSwitchChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      [name]: e.target.checked
    }));
  };

  const handleApiChange = (apiName: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      apis: {
        ...prev.apis,
        [apiName]: value
      }
    }));
  };

  const handleApiSwitchChange = (apiName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    handleApiChange(apiName, e.target.checked);
  };

  // Verificar permisos
  const tienePermisos = userProfile && (userProfile.rol === userRole || userProfile.rol === 'admin');

  if (!tienePermisos) {
    return (
      <Box p={5}>
        <Alert status="error">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Acceso restringido</Text>
            <Text>No tienes permisos para acceder a esta configuración.</Text>
          </Box>
        </Alert>
      </Box>
    );
  }  // Definir pestañas según el rol
  const tabs = [
    { id: 'variables', label: 'General', roles: ['admin', 'vocal'] },
    { id: 'material', label: 'Material', roles: ['admin', 'vocal'] },
    { id: 'apis', label: 'APIs', roles: ['admin', 'vocal'] },
    { id: 'security', label: 'Seguridad', roles: ['admin'] },
    { id: 'dropdowns', label: 'Formularios Material', roles: ['admin'] },
    { id: 'system-viewer', label: 'Visor Sistema', roles: ['admin'] }
  ].filter(tab => tab.roles.includes(userRole));

  return (
    <Box p={5}>
      <Card mb={5} variant="outline">
        <CardBody>
          <HStack mb={4}>
            <Heading size="md">{title}</Heading>
            <Badge colorScheme={userRole === 'admin' ? 'purple' : 'blue'}>
              {userRole === 'admin' ? 'Solo Admin' : 'Acceso Vocal'}
            </Badge>
          </HStack>
          <Text color="gray.600">
            {userRole === 'admin' 
              ? 'Configuración completa del sistema. Estos cambios afectarán a todos los usuarios.'
              : 'Como vocal, puedes modificar las variables del sistema y configuraciones de material. Las preferencias personales (idioma, tema, notificaciones) se gestionan desde tu perfil de usuario.'
            }
          </Text>
        </CardBody>
      </Card>

      <Tabs colorScheme="brand" isLazy>
        <TabList mb={4}>
          {tabs.map(tab => (
            <Tab key={tab.id}>{tab.label}</Tab>
          ))}
        </TabList>
        
        <TabPanels>
          {/* Variables del Sistema */}
          {tabs.find(t => t.id === 'variables') && (
            <TabPanel>
              <VStack spacing={8} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Gestor de Variables del Sistema</Text>
                    <Text>
                      Configura los parámetros que controlan el comportamiento automático del sistema. 
                      Estas variables afectan las reglas de negocio y notificaciones.
                    </Text>
                  </Box>
                </Alert>

                {/* Sección: Gestión de Préstamos y Devoluciones */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="blue.600">
                      📦 Gestión de Préstamos y Devoluciones
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="sm">Días de gracia para devolución</FormLabel>
                        <Select
                          value={settings.variables.diasGraciaDevolucion}
                          onChange={(e) => handleVariableChange('diasGraciaDevolucion', parseInt(e.target.value))}
                        >
                          <option value="1">1 día</option>
                          <option value="2">2 días</option>
                          <option value="3">3 días</option>
                          <option value="5">5 días</option>
                          <option value="7">7 días</option>
                        </Select>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Días adicionales después del fin de actividad para devolver material
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Días máximos de retraso</FormLabel>
                        <Select
                          value={settings.variables.diasMaximoRetraso}
                          onChange={(e) => handleVariableChange('diasMaximoRetraso', parseInt(e.target.value))}
                        >
                          <option value="7">7 días</option>
                          <option value="15">15 días</option>
                          <option value="30">30 días</option>
                          <option value="45">45 días</option>
                        </Select>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Días máximos de retraso antes de aplicar penalizaciones
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Días de bloqueo por retraso grave</FormLabel>
                        <Select
                          value={settings.variables.diasBloqueoPorRetraso}
                          onChange={(e) => handleVariableChange('diasBloqueoPorRetraso', parseInt(e.target.value))}
                        >
                          <option value="15">15 días</option>
                          <option value="30">30 días</option>
                          <option value="60">60 días</option>
                          <option value="90">90 días</option>
                        </Select>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Días de bloqueo automático por retrasos graves
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Tiempo mínimo entre préstamos</FormLabel>
                        <Select
                          value={settings.variables.tiempoMinimoEntrePrestamos}
                          onChange={(e) => handleVariableChange('tiempoMinimoEntrePrestamos', parseInt(e.target.value))}
                        >
                          <option value="0">Sin restricción</option>
                          <option value="1">1 día</option>
                          <option value="2">2 días</option>
                          <option value="7">7 días</option>
                        </Select>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Tiempo mínimo entre préstamos del mismo material
                        </Text>
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Sección: Notificaciones Automáticas */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="green.600">
                      🔔 Notificaciones Automáticas
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="sm">Recordatorio pre-actividad</FormLabel>
                        <Select
                          value={settings.variables.recordatorioPreActividad}
                          onChange={(e) => handleVariableChange('recordatorioPreActividad', parseInt(e.target.value))}
                        >
                          <option value="1">1 día antes</option>
                          <option value="3">3 días antes</option>
                          <option value="7">7 días antes</option>
                          <option value="14">14 días antes</option>
                        </Select>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Días de antelación para recordar actividades próximas
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Recordatorio de devolución</FormLabel>
                        <Select
                          value={settings.variables.recordatorioDevolucion}
                          onChange={(e) => handleVariableChange('recordatorioDevolucion', parseInt(e.target.value))}
                        >
                          <option value="1">1 día antes</option>
                          <option value="2">2 días antes</option>
                          <option value="3">3 días antes</option>
                          <option value="5">5 días antes</option>
                        </Select>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Días antes del vencimiento para recordar devolución
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Notificación por retraso</FormLabel>
                        <Select
                          value={settings.variables.notificacionRetrasoDevolucion}
                          onChange={(e) => handleVariableChange('notificacionRetrasoDevolucion', parseInt(e.target.value))}
                        >
                          <option value="1">Al día siguiente</option>
                          <option value="3">3 días después</option>
                          <option value="7">7 días después</option>
                        </Select>                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Días de retraso para notificar automáticamente
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Recordatorio de revisión de material</FormLabel>
                        <Select
                          value={settings.variables.diasAntelacionRevision}
                          onChange={(e) => handleVariableChange('diasAntelacionRevision', parseInt(e.target.value))}
                        >
                          <option value="15">15 días antes</option>
                          <option value="30">30 días antes</option>
                          <option value="60">60 días antes</option>
                          <option value="90">90 días antes</option>
                        </Select>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Días de antelación para notificar revisión de material
                        </Text>
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Sección: Gestión de Actividades */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="purple.600">
                      🗓️ Gestión de Actividades
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="sm">Antelación mínima para crear actividad</FormLabel>
                        <Select
                          value={settings.variables.diasMinimoAntelacionCreacion}
                          onChange={(e) => handleVariableChange('diasMinimoAntelacionCreacion', parseInt(e.target.value))}
                        >
                          <option value="1">1 día</option>
                          <option value="3">3 días</option>
                          <option value="7">7 días</option>
                          <option value="14">14 días</option>
                        </Select>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Días mínimos de antelación para crear una actividad
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Límite para modificar actividad</FormLabel>
                        <Select
                          value={settings.variables.diasMaximoModificacion}
                          onChange={(e) => handleVariableChange('diasMaximoModificacion', parseInt(e.target.value))}
                        >
                          <option value="1">1 día antes</option>
                          <option value="2">2 días antes</option>
                          <option value="3">3 días antes</option>
                          <option value="7">7 días antes</option>
                        </Select>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Días antes de actividad donde ya no se puede modificar
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Límite de participantes por defecto</FormLabel>
                        <Select
                          value={settings.variables.limiteParticipantesPorDefecto}
                          onChange={(e) => handleVariableChange('limiteParticipantesPorDefecto', parseInt(e.target.value))}
                        >
                          <option value="10">10 participantes</option>
                          <option value="15">15 participantes</option>
                          <option value="20">20 participantes</option>
                          <option value="25">25 participantes</option>
                          <option value="30">30 participantes</option>
                        </Select>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Límite por defecto de participantes en nuevas actividades
                        </Text>
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Sección: Sistema de Puntuación */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="orange.600">
                      ⭐ Sistema de Puntuación y Reputación
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="sm">Penalización por retraso</FormLabel>
                        <Select
                          value={settings.variables.penalizacionRetraso}
                          onChange={(e) => handleVariableChange('penalizacionRetraso', parseInt(e.target.value))}
                        >
                          <option value="1">1 punto</option>
                          <option value="3">3 puntos</option>
                          <option value="5">5 puntos</option>
                          <option value="10">10 puntos</option>
                        </Select>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Puntos a descontar por cada retraso
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Bonificación por devolución temprana</FormLabel>
                        <Select
                          value={settings.variables.bonificacionDevolucionTemprana}
                          onChange={(e) => handleVariableChange('bonificacionDevolucionTemprana', parseInt(e.target.value))}
                        >
                          <option value="1">1 punto</option>
                          <option value="2">2 puntos</option>
                          <option value="3">3 puntos</option>
                          <option value="5">5 puntos</option>
                        </Select>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Puntos extra por devolución antes del plazo
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Umbral de inactividad de usuario</FormLabel>
                        <Select
                          value={settings.variables.umbraLinactividadUsuario}
                          onChange={(e) => handleVariableChange('umbraLinactividadUsuario', parseInt(e.target.value))}
                        >
                          <option value="180">180 días (6 meses)</option>
                          <option value="365">365 días (1 año)</option>
                          <option value="730">730 días (2 años)</option>
                        </Select>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Días sin actividad para marcar usuario como inactivo
                        </Text>
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Sección: Configuración de Reportes */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="teal.600">
                      📊 Configuración de Reportes
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="sm">Días de historial en reportes</FormLabel>
                        <Select
                          value={settings.variables.diasHistorialReportes}
                          onChange={(e) => handleVariableChange('diasHistorialReportes', parseInt(e.target.value))}
                        >
                          <option value="90">90 días (3 meses)</option>
                          <option value="180">180 días (6 meses)</option>
                          <option value="365">365 días (1 año)</option>
                          <option value="730">730 días (2 años)</option>
                        </Select>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Período de historial incluido en reportes automáticos
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Límite de elementos en exportación</FormLabel>
                        <Select
                          value={settings.variables.limiteElementosExportacion}
                          onChange={(e) => handleVariableChange('limiteElementosExportacion', parseInt(e.target.value))}
                        >
                          <option value="500">500 elementos</option>
                          <option value="1000">1000 elementos</option>
                          <option value="2000">2000 elementos</option>
                          <option value="5000">5000 elementos</option>
                        </Select>
                        <Text fontSize="xs" color="gray.600" mt={1}>
                          Máximo número de elementos en exportaciones
                        </Text>
                      </FormControl>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                <Button 
                  onClick={handleSubmit}
                  colorScheme="brand"
                  size="lg"
                  isLoading={isLoading}
                  loadingText="Guardando variables..."
                >
                  💾 Guardar variables del sistema
                </Button>
              </VStack>
            </TabPanel>
          )}          {/* Material */}
          {tabs.find(t => t.id === 'material') && (
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Configuración de Material</Text>
                    <Text>Configura los parámetros relacionados con la gestión de material del club.</Text>
                  </Box>                </Alert>

                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Configuraciones de Material</Text>
                    <Text fontSize="sm">
                      Las configuraciones específicas de material (como días de revisión, formularios dinámicos) 
                      se gestionan desde la pestaña "Variables del Sistema" y la configuración de administrador.
                    </Text>
                  </Box>
                </Alert>

                <Button
                  onClick={handleSubmit}
                  colorScheme="brand" 
                  isLoading={isLoading}
                  loadingText="Guardando..."
                >
                  Guardar configuración de material
                </Button>              </VStack>
            </TabPanel>          )}

          {/* APIs */}
          {tabs.find(t => t.id === 'apis') && (
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Configuración de APIs y Servicios Externos</Text>
                    <Text>
                      Configura las claves de API y servicios externos que utiliza la aplicación.
                      {userRole === 'vocal' && ' Como vocal, solo puedes habilitar/deshabilitar servicios.'}
                    </Text>
                  </Box>
                </Alert>

                {/* Servicios Meteorológicos */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="blue.600">
                      🌤️ Servicios Meteorológicos
                    </Heading>
                    <VStack spacing={4} align="stretch">
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel htmlFor="weatherEnabled" mb="0" fontSize="sm">
                            Habilitar servicio meteorológico
                          </FormLabel>
                          <Text fontSize="xs" color="gray.600" mt={1}>
                            Activar/desactivar la integración con servicios de clima
                          </Text>
                        </Box>
                        <Switch
                          id="weatherEnabled"
                          isChecked={settings.apis.weatherEnabled}
                          onChange={handleApiSwitchChange('weatherEnabled')}
                          colorScheme="brand"
                        />
                      </FormControl>

                      <Divider />

                      {/* Open-Meteo Configuration */}
                      <Box>
                        <Text fontWeight="semibold" mb={2} color="blue.700">📡 Open-Meteo (API gratuita)</Text>
                        <Text fontSize="xs" color="gray.600" mb={3}>
                          Servicio meteorológico de código abierto y completamente gratuito. No requiere API key.
                        </Text>
                        
                        <FormControl>
                          <FormLabel fontSize="sm">URL base de Open-Meteo</FormLabel>
                          <Input
                            name="weatherApiUrl"
                            value={settings.apis.weatherApiUrl}
                            onChange={(e) => handleApiChange('weatherApiUrl', e.target.value)}
                            placeholder="https://api.open-meteo.com/v1/forecast"
                            isReadOnly={userRole === 'vocal'}
                            bg={userRole === 'vocal' ? "gray.50" : undefined}
                          />
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            URL base para las consultas meteorológicas globales
                          </Text>
                        </FormControl>
                      </Box>

                      <Divider />

                      {/* AEMET Configuration */}
                      <Box>
                        <Text fontWeight="semibold" mb={2} color="orange.700">🇪🇸 AEMET - España</Text>
                        <Text fontSize="xs" color="gray.600" mb={3}>
                          Datos oficiales de la Agencia Estatal de Meteorología española para mayor precisión en territorio español.
                        </Text>
                        
                        <VStack spacing={3} align="stretch">
                          <FormControl display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                              <FormLabel htmlFor="aemetEnabled" mb="0" fontSize="sm">
                                Habilitar AEMET para España
                              </FormLabel>
                              <Text fontSize="xs" color="gray.600" mt={1}>
                                Usar datos oficiales de AEMET para actividades en España
                              </Text>
                            </Box>
                            <Switch
                              id="aemetEnabled"
                              isChecked={settings.apis.aemetEnabled}
                              onChange={handleApiSwitchChange('aemetEnabled')}
                              colorScheme="brand"
                              isDisabled={!settings.apis.weatherEnabled}
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="sm">API Key de AEMET</FormLabel>
                            <Input
                              name="aemetApiKey"
                              value={settings.apis.aemetApiKey}
                              onChange={(e) => handleApiChange('aemetApiKey', e.target.value)}
                              placeholder="Introduce tu API key de AEMET"
                              type={userRole === 'vocal' ? 'password' : 'text'}
                              isReadOnly={userRole === 'vocal'}
                              bg={userRole === 'vocal' ? "gray.50" : undefined}
                              isDisabled={!settings.apis.weatherEnabled || !settings.apis.aemetEnabled}
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              {userRole === 'vocal' 
                                ? 'Solo administradores pueden modificar las claves de API' 
                                : (
                                  <>
                                    Obtén tu API key gratuita en{' '}
                                    <Text as="span" color="blue.500" textDecoration="underline">
                                      opendata.aemet.es
                                    </Text>
                                  </>
                                )
                              }
                            </Text>
                          </FormControl>

                          <FormControl display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                              <FormLabel htmlFor="aemetUseForSpain" mb="0" fontSize="sm">
                                Usar AEMET automáticamente para España
                              </FormLabel>
                              <Text fontSize="xs" color="gray.600" mt={1}>
                                Detectar automáticamente ubicaciones españolas y usar AEMET
                              </Text>
                            </Box>
                            <Switch
                              id="aemetUseForSpain"
                              isChecked={settings.apis.aemetUseForSpain}
                              onChange={handleApiSwitchChange('aemetUseForSpain')}
                              colorScheme="brand"
                              isDisabled={!settings.apis.weatherEnabled || !settings.apis.aemetEnabled}
                            />
                          </FormControl>
                        </VStack>
                      </Box>

                      <Divider />

                      {/* Configuración de Unidades */}
                      <Box>
                        <Text fontWeight="semibold" mb={2} color="teal.700">⚙️ Configuración de Unidades</Text>
                        <Text fontSize="xs" color="gray.600" mb={3}>
                          Personaliza las unidades de medida para mostrar en los pronósticos.
                        </Text>
                        
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                          <FormControl>
                            <FormLabel fontSize="sm">Temperatura</FormLabel>
                            <Select
                              value={settings.apis.temperatureUnit}
                              onChange={(e) => handleApiChange('temperatureUnit', e.target.value)}
                              isDisabled={!settings.apis.weatherEnabled}
                              size="sm"
                            >
                              <option value="celsius">Celsius (°C)</option>
                              <option value="fahrenheit">Fahrenheit (°F)</option>
                            </Select>
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="sm">Velocidad del viento</FormLabel>
                            <Select
                              value={settings.apis.windSpeedUnit}
                              onChange={(e) => handleApiChange('windSpeedUnit', e.target.value)}
                              isDisabled={!settings.apis.weatherEnabled}
                              size="sm"
                            >
                              <option value="kmh">km/h</option>
                              <option value="ms">m/s</option>
                              <option value="mph">mph</option>
                            </Select>
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="sm">Precipitación</FormLabel>
                            <Select
                              value={settings.apis.precipitationUnit}
                              onChange={(e) => handleApiChange('precipitationUnit', e.target.value)}
                              isDisabled={!settings.apis.weatherEnabled}
                              size="sm"
                            >
                              <option value="mm">Milímetros (mm)</option>
                              <option value="inch">Pulgadas (inch)</option>
                            </Select>
                          </FormControl>
                        </SimpleGrid>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Servicios de Notificaciones */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="green.600">
                      🔔 Servicios de Notificaciones
                    </Heading>
                    <VStack spacing={4} align="stretch">
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel htmlFor="notificationsEnabled" mb="0" fontSize="sm">
                            Habilitar notificaciones automáticas
                          </FormLabel>
                          <Text fontSize="xs" color="gray.600" mt={1}>
                            Activar/desactivar el sistema de notificaciones
                          </Text>
                        </Box>
                        <Switch
                          id="notificationsEnabled"
                          isChecked={settings.apis.notificationsEnabled}
                          onChange={handleApiSwitchChange('notificationsEnabled')}
                          colorScheme="brand"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Clave del servicio de correo</FormLabel>
                        <Input
                          name="emailServiceKey"
                          value={settings.apis.emailServiceKey}
                          onChange={(e) => handleApiChange('emailServiceKey', e.target.value)}
                          placeholder="Clave de API para servicio de correo"
                          type={userRole === 'vocal' ? 'password' : 'text'}
                          isReadOnly={userRole === 'vocal'}
                          bg={userRole === 'vocal' ? "gray.50" : undefined}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {userRole === 'vocal' 
                            ? 'Solo administradores pueden modificar las claves' 
                            : 'Para servicios como SendGrid, Mailgun, etc.'
                          }
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Clave del servicio SMS</FormLabel>
                        <Input
                          name="smsServiceKey"
                          value={settings.apis.smsServiceKey}
                          onChange={(e) => handleApiChange('smsServiceKey', e.target.value)}
                          placeholder="Clave de API para servicio SMS"
                          type={userRole === 'vocal' ? 'password' : 'text'}
                          isReadOnly={userRole === 'vocal'}
                          bg={userRole === 'vocal' ? "gray.50" : undefined}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {userRole === 'vocal' 
                            ? 'Solo administradores pueden modificar las claves' 
                            : 'Para servicios como Twilio, Nexmo, etc.'
                          }
                        </Text>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Servicios de Backup y Analytics - Solo Admin */}
                {userRole === 'admin' && (
                  <>
                    <Card>
                      <CardBody>
                        <Heading size="sm" mb={4} color="purple.600">
                          💾 Servicios de Backup
                        </Heading>
                        <VStack spacing={4} align="stretch">
                          <FormControl>
                            <FormLabel fontSize="sm">Clave de API para backup</FormLabel>
                            <Input
                              name="backupApiKey"
                              value={settings.apis.backupApiKey}
                              onChange={(e) => handleApiChange('backupApiKey', e.target.value)}
                              placeholder="Clave de API para servicio de backup automático"
                              type="password"
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              Para servicios de backup en la nube (AWS S3, Google Cloud, etc.)
                            </Text>
                          </FormControl>
                        </VStack>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <Heading size="sm" mb={4} color="orange.600">
                          📊 Servicios de Analytics
                        </Heading>
                        <VStack spacing={4} align="stretch">
                          <FormControl display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                              <FormLabel htmlFor="analyticsEnabled" mb="0" fontSize="sm">
                                Habilitar analytics
                              </FormLabel>
                              <Text fontSize="xs" color="gray.600" mt={1}>
                                Recopilar estadísticas de uso de la aplicación
                              </Text>
                            </Box>
                            <Switch
                              id="analyticsEnabled"
                              isChecked={settings.apis.analyticsEnabled}
                              onChange={handleApiSwitchChange('analyticsEnabled')}
                              colorScheme="brand"
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="sm">Clave de Analytics</FormLabel>
                            <Input
                              name="analyticsKey"
                              value={settings.apis.analyticsKey}
                              onChange={(e) => handleApiChange('analyticsKey', e.target.value)}
                              placeholder="Clave de Google Analytics o similar"
                              type="password"
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              Para servicios como Google Analytics, Mixpanel, etc.
                            </Text>
                          </FormControl>
                        </VStack>
                      </CardBody>
                    </Card>
                  </>
                )}

                {/* Enlaces de Google Drive del Club */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="blue.600">
                      🔗 Enlaces de Google Drive del Club {userRole === 'vocal' && '(Solo lectura)'}
                    </Heading>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel fontSize="sm">URL principal de Google Drive</FormLabel>
                        <Input
                          name="googleDriveUrl"
                          value={settings.apis.googleDriveUrl}
                          onChange={(e) => handleApiChange('googleDriveUrl', e.target.value)}
                          isReadOnly={userRole === 'vocal'}
                          bg={userRole === 'vocal' ? "gray.50" : undefined}
                          placeholder={userRole === 'vocal' ? "Solo administradores pueden modificar" : "https://drive.google.com/drive/folders/XXXX"}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {userRole === 'vocal' 
                            ? 'Solo administradores pueden modificar los enlaces del club' 
                            : 'URL de la carpeta compartida principal del club'
                          }
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Subcarpeta de Topografías</FormLabel>
                        <Input
                          name="googleDriveTopoFolder"
                          value={settings.apis.googleDriveTopoFolder}
                          onChange={(e) => handleApiChange('googleDriveTopoFolder', e.target.value)}
                          isReadOnly={userRole === 'vocal'}
                          bg={userRole === 'vocal' ? "gray.50" : undefined}
                          placeholder={userRole === 'vocal' ? "Solo administradores pueden modificar" : "topografias"}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Nombre de la subcarpeta que contiene las topografías
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Subcarpeta de Documentos</FormLabel>
                        <Input
                          name="googleDriveDocFolder"
                          value={settings.apis.googleDriveDocFolder}
                          onChange={(e) => handleApiChange('googleDriveDocFolder', e.target.value)}
                          isReadOnly={userRole === 'vocal'}
                          bg={userRole === 'vocal' ? "gray.50" : undefined}
                          placeholder={userRole === 'vocal' ? "Solo administradores pueden modificar" : "documentos"}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Nombre de la subcarpeta que contiene los documentos del club
                        </Text>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Estado de las APIs */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="teal.600">
                      📋 Estado de los Servicios
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <Badge colorScheme={settings.apis.googleDriveUrl ? 'green' : 'yellow'}>
                            {settings.apis.googleDriveUrl ? 'Configurado' : 'Pendiente'}
                          </Badge>
                          <Text fontSize="sm">Google Drive del Club</Text>
                        </HStack>
                        <HStack>
                          <Badge colorScheme={settings.apis.weatherEnabled ? 'green' : 'red'}>
                            {settings.apis.weatherEnabled ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Text fontSize="sm">Open-Meteo</Text>
                        </HStack>
                        <HStack>
                          <Badge colorScheme={
                            settings.apis.aemetEnabled && settings.apis.aemetApiKey 
                              ? 'green' 
                              : settings.apis.aemetEnabled 
                                ? 'yellow' 
                                : 'gray'
                          }>
                            {settings.apis.aemetEnabled && settings.apis.aemetApiKey 
                              ? 'Configurado' 
                              : settings.apis.aemetEnabled 
                                ? 'Pendiente API' 
                                : 'Inactivo'
                            }
                          </Badge>
                          <Text fontSize="sm">AEMET (España)</Text>
                        </HStack>
                        <HStack>
                          <Badge colorScheme={settings.apis.notificationsEnabled ? 'green' : 'red'}>
                            {settings.apis.notificationsEnabled ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Text fontSize="sm">Notificaciones</Text>
                        </HStack>
                      </VStack>
                      {userRole === 'admin' && (
                        <VStack align="start" spacing={2}>
                          <HStack>
                            <Badge colorScheme={settings.apis.backupApiKey ? 'green' : 'yellow'}>
                              {settings.apis.backupApiKey ? 'Configurado' : 'Pendiente'}
                            </Badge>
                            <Text fontSize="sm">Backup Automático</Text>
                          </HStack>
                          <HStack>
                            <Badge colorScheme={settings.apis.analyticsEnabled ? 'green' : 'red'}>
                              {settings.apis.analyticsEnabled ? 'Activo' : 'Inactivo'}
                            </Badge>
                            <Text fontSize="sm">Analytics</Text>
                          </HStack>
                        </VStack>
                      )}
                    </SimpleGrid>
                  </CardBody>
                </Card>

                <Button 
                  onClick={handleSubmit}
                  colorScheme="brand"
                  isLoading={isLoading}
                  loadingText="Guardando..."
                >
                  💾 Guardar configuración de APIs
                </Button>
              </VStack>
            </TabPanel>
          )}

          {/* Seguridad - Solo Admin */}
          {tabs.find(t => t.id === 'security') && userRole === 'admin' && (
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Configuraciones de Seguridad</Text>
                    <Text>Configuraciones críticas del sistema. Modificar con precaución.</Text>
                  </Box>
                </Alert>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="backupAutomatico" mb="0">
                    Backup automático
                  </FormLabel>
                  <Switch
                    id="backupAutomatico"
                    name="backupAutomatico"
                    isChecked={settings.backupAutomatico}
                    onChange={handleSwitchChange('backupAutomatico')}
                    colorScheme="brand"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Frecuencia de backup</FormLabel>
                  <Select
                    name="frecuenciaBackup"
                    value={settings.frecuenciaBackup}
                    onChange={handleChange}
                  >
                    <option value="diario">Diario</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                  </Select>
                </FormControl>

                <Button 
                  onClick={handleSubmit}
                  colorScheme="brand"
                  isLoading={isLoading}
                  loadingText="Guardando..."
                >
                  Guardar configuración de seguridad
                </Button>
              </VStack>
            </TabPanel>
          )}

          {/* Formularios Material - Solo Admin */}
          {tabs.find(t => t.id === 'dropdowns') && userRole === 'admin' && (
            <TabPanel>
              <MaterialDropdownManagerFunctional />
            </TabPanel>
          )}

          {/* Visor Sistema - Solo Admin */}
          {tabs.find(t => t.id === 'system-viewer') && userRole === 'admin' && (
            <TabPanel>
              <SystemVariablesViewer />
            </TabPanel>
          )}

          {/* APIs */}
          {tabs.find(t => t.id === 'apis') && (
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="bold">Configuración de APIs y Servicios Externos</Text>
                    <Text>
                      Configura las claves de API y servicios externos que utiliza la aplicación.
                      {userRole === 'vocal' && ' Como vocal, solo puedes habilitar/deshabilitar servicios.'}
                    </Text>
                  </Box>
                </Alert>                {/* Servicios Meteorológicos */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="blue.600">
                      🌤️ Servicios Meteorológicos
                    </Heading>
                    <VStack spacing={4} align="stretch">
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel htmlFor="weatherEnabled" mb="0" fontSize="sm">
                            Habilitar servicio meteorológico
                          </FormLabel>
                          <Text fontSize="xs" color="gray.600" mt={1}>
                            Activar/desactivar la integración con servicios de clima
                          </Text>
                        </Box>
                        <Switch
                          id="weatherEnabled"
                          isChecked={settings.apis.weatherEnabled}
                          onChange={handleApiSwitchChange('weatherEnabled')}
                          colorScheme="brand"
                        />
                      </FormControl>

                      <Divider />

                      {/* Open-Meteo Configuration */}
                      <Box>
                        <Text fontWeight="semibold" mb={2} color="blue.700">📡 Open-Meteo (API gratuita)</Text>
                        <Text fontSize="xs" color="gray.600" mb={3}>
                          Servicio meteorológico de código abierto y completamente gratuito. No requiere API key.
                        </Text>
                        
                        <FormControl>
                          <FormLabel fontSize="sm">URL base de Open-Meteo</FormLabel>
                          <Input
                            name="weatherApiUrl"
                            value={settings.apis.weatherApiUrl}
                            onChange={(e) => handleApiChange('weatherApiUrl', e.target.value)}
                            placeholder="https://api.open-meteo.com/v1/forecast"
                            isReadOnly={userRole === 'vocal'}
                            bg={userRole === 'vocal' ? "gray.50" : undefined}
                          />
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            URL base para las consultas meteorológicas globales
                          </Text>
                        </FormControl>
                      </Box>

                      <Divider />

                      {/* AEMET Configuration */}
                      <Box>
                        <Text fontWeight="semibold" mb={2} color="orange.700">🇪🇸 AEMET - España</Text>
                        <Text fontSize="xs" color="gray.600" mb={3}>
                          Datos oficiales de la Agencia Estatal de Meteorología española para mayor precisión en territorio español.
                        </Text>
                        
                        <VStack spacing={3} align="stretch">
                          <FormControl display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                              <FormLabel htmlFor="aemetEnabled" mb="0" fontSize="sm">
                                Habilitar AEMET para España
                              </FormLabel>
                              <Text fontSize="xs" color="gray.600" mt={1}>
                                Usar datos oficiales de AEMET para actividades en España
                              </Text>
                            </Box>
                            <Switch
                              id="aemetEnabled"
                              isChecked={settings.apis.aemetEnabled}
                              onChange={handleApiSwitchChange('aemetEnabled')}
                              colorScheme="brand"
                              isDisabled={!settings.apis.weatherEnabled}
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="sm">API Key de AEMET</FormLabel>
                            <Input
                              name="aemetApiKey"
                              value={settings.apis.aemetApiKey}
                              onChange={(e) => handleApiChange('aemetApiKey', e.target.value)}
                              placeholder="Introduce tu API key de AEMET"
                              type={userRole === 'vocal' ? 'password' : 'text'}
                              isReadOnly={userRole === 'vocal'}
                              bg={userRole === 'vocal' ? "gray.50" : undefined}
                              isDisabled={!settings.apis.weatherEnabled || !settings.apis.aemetEnabled}
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              {userRole === 'vocal' 
                                ? 'Solo administradores pueden modificar las claves de API' 
                                : (
                                  <>
                                    Obtén tu API key gratuita en{' '}
                                    <Text as="span" color="blue.500" textDecoration="underline">
                                      opendata.aemet.es
                                    </Text>
                                  </>
                                )
                              }
                            </Text>
                          </FormControl>

                          <FormControl display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                              <FormLabel htmlFor="aemetUseForSpain" mb="0" fontSize="sm">
                                Usar AEMET automáticamente para España
                              </FormLabel>
                              <Text fontSize="xs" color="gray.600" mt={1}>
                                Detectar automáticamente ubicaciones españolas y usar AEMET
                              </Text>
                            </Box>
                            <Switch
                              id="aemetUseForSpain"
                              isChecked={settings.apis.aemetUseForSpain}
                              onChange={handleApiSwitchChange('aemetUseForSpain')}
                              colorScheme="brand"
                              isDisabled={!settings.apis.weatherEnabled || !settings.apis.aemetEnabled}
                            />
                          </FormControl>
                        </VStack>
                      </Box>

                      <Divider />

                      {/* Configuración de Unidades */}
                      <Box>
                        <Text fontWeight="semibold" mb={2} color="teal.700">⚙️ Configuración de Unidades</Text>
                        <Text fontSize="xs" color="gray.600" mb={3}>
                          Personaliza las unidades de medida para mostrar en los pronósticos.
                        </Text>
                        
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                          <FormControl>
                            <FormLabel fontSize="sm">Temperatura</FormLabel>
                            <Select
                              value={settings.apis.temperatureUnit}
                              onChange={(e) => handleApiChange('temperatureUnit', e.target.value)}
                              isDisabled={!settings.apis.weatherEnabled}
                              size="sm"
                            >
                              <option value="celsius">Celsius (°C)</option>
                              <option value="fahrenheit">Fahrenheit (°F)</option>
                            </Select>
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="sm">Velocidad del viento</FormLabel>
                            <Select
                              value={settings.apis.windSpeedUnit}
                              onChange={(e) => handleApiChange('windSpeedUnit', e.target.value)}
                              isDisabled={!settings.apis.weatherEnabled}
                              size="sm"
                            >
                              <option value="kmh">km/h</option>
                              <option value="ms">m/s</option>
                              <option value="mph">mph</option>
                            </Select>
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="sm">Precipitación</FormLabel>
                            <Select
                              value={settings.apis.precipitationUnit}
                              onChange={(e) => handleApiChange('precipitationUnit', e.target.value)}
                              isDisabled={!settings.apis.weatherEnabled}
                              size="sm"
                            >
                              <option value="mm">Milímetros (mm)</option>
                              <option value="inch">Pulgadas (inch)</option>
                            </Select>
                          </FormControl>
                        </SimpleGrid>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Servicios de Notificaciones */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="green.600">
                      🔔 Servicios de Notificaciones
                    </Heading>
                    <VStack spacing={4} align="stretch">
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel htmlFor="notificationsEnabled" mb="0" fontSize="sm">
                            Habilitar notificaciones automáticas
                          </FormLabel>
                          <Text fontSize="xs" color="gray.600" mt={1}>
                            Activar/desactivar el sistema de notificaciones
                          </Text>
                        </Box>
                        <Switch
                          id="notificationsEnabled"
                          isChecked={settings.apis.notificationsEnabled}
                          onChange={handleApiSwitchChange('notificationsEnabled')}
                          colorScheme="brand"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Clave del servicio de correo</FormLabel>
                        <Input
                          name="emailServiceKey"
                          value={settings.apis.emailServiceKey}
                          onChange={(e) => handleApiChange('emailServiceKey', e.target.value)}
                          placeholder="Clave de API para servicio de correo"
                          type={userRole === 'vocal' ? 'password' : 'text'}
                          isReadOnly={userRole === 'vocal'}
                          bg={userRole === 'vocal' ? "gray.50" : undefined}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {userRole === 'vocal' 
                            ? 'Solo administradores pueden modificar las claves' 
                            : 'Para servicios como SendGrid, Mailgun, etc.'
                          }
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Clave del servicio SMS</FormLabel>
                        <Input
                          name="smsServiceKey"
                          value={settings.apis.smsServiceKey}
                          onChange={(e) => handleApiChange('smsServiceKey', e.target.value)}
                          placeholder="Clave de API para servicio SMS"
                          type={userRole === 'vocal' ? 'password' : 'text'}
                          isReadOnly={userRole === 'vocal'}
                          bg={userRole === 'vocal' ? "gray.50" : undefined}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {userRole === 'vocal' 
                            ? 'Solo administradores pueden modificar las claves' 
                            : 'Para servicios como Twilio, Nexmo, etc.'
                          }
                        </Text>
                      </FormControl>
                    </VStack>
                  </CardBody>                </Card>

                {/* Servicios de Backup y Analytics - Solo Admin */}
                {userRole === 'admin' && (
                  <>
                    <Card>
                      <CardBody>
                        <Heading size="sm" mb={4} color="purple.600">
                          💾 Servicios de Backup
                        </Heading>
                        <VStack spacing={4} align="stretch">
                          <FormControl>
                            <FormLabel fontSize="sm">Clave de API para backup</FormLabel>
                            <Input
                              name="backupApiKey"
                              value={settings.apis.backupApiKey}
                              onChange={(e) => handleApiChange('backupApiKey', e.target.value)}
                              placeholder="Clave de API para servicio de backup automático"
                              type="password"
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              Para servicios de backup en la nube (AWS S3, Google Cloud, etc.)
                            </Text>
                          </FormControl>
                        </VStack>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <Heading size="sm" mb={4} color="orange.600">
                          📊 Servicios de Analytics
                        </Heading>
                        <VStack spacing={4} align="stretch">
                          <FormControl display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                              <FormLabel htmlFor="analyticsEnabled" mb="0" fontSize="sm">
                                Habilitar analytics
                              </FormLabel>
                              <Text fontSize="xs" color="gray.600" mt={1}>
                                Recopilar estadísticas de uso de la aplicación
                              </Text>
                            </Box>
                            <Switch
                              id="analyticsEnabled"
                              isChecked={settings.apis.analyticsEnabled}
                              onChange={handleApiSwitchChange('analyticsEnabled')}
                              colorScheme="brand"
                            />
                          </FormControl>

                          <FormControl>
                            <FormLabel fontSize="sm">Clave de Analytics</FormLabel>
                            <Input
                              name="analyticsKey"
                              value={settings.apis.analyticsKey}
                              onChange={(e) => handleApiChange('analyticsKey', e.target.value)}
                              placeholder="Clave de Google Analytics o similar"
                              type="password"
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              Para servicios como Google Analytics, Mixpanel, etc.
                            </Text>
                          </FormControl>
                        </VStack>
                      </CardBody>
                    </Card>
                  </>
                )}

                {/* Enlaces de Google Drive del Club */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="blue.600">
                      🔗 Enlaces de Google Drive del Club {userRole === 'vocal' && '(Solo lectura)'}
                    </Heading>
                    <VStack spacing={4} align="stretch">
                      <FormControl>
                        <FormLabel fontSize="sm">URL principal de Google Drive</FormLabel>
                        <Input
                          name="googleDriveUrl"
                          value={settings.apis.googleDriveUrl}
                          onChange={(e) => handleApiChange('googleDriveUrl', e.target.value)}
                          isReadOnly={userRole === 'vocal'}
                          bg={userRole === 'vocal' ? "gray.50" : undefined}
                          placeholder={userRole === 'vocal' ? "Solo administradores pueden modificar" : "https://drive.google.com/drive/folders/XXXX"}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {userRole === 'vocal' 
                            ? 'Solo administradores pueden modificar los enlaces del club' 
                            : 'URL de la carpeta compartida principal del club'
                          }
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Subcarpeta de Topografías</FormLabel>
                        <Input
                          name="googleDriveTopoFolder"
                          value={settings.apis.googleDriveTopoFolder}
                          onChange={(e) => handleApiChange('googleDriveTopoFolder', e.target.value)}
                          isReadOnly={userRole === 'vocal'}
                          bg={userRole === 'vocal' ? "gray.50" : undefined}
                          placeholder={userRole === 'vocal' ? "Solo administradores pueden modificar" : "topografias"}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Nombre de la subcarpeta que contiene las topografías
                        </Text>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm">Subcarpeta de Documentos</FormLabel>
                        <Input
                          name="googleDriveDocFolder"
                          value={settings.apis.googleDriveDocFolder}
                          onChange={(e) => handleApiChange('googleDriveDocFolder', e.target.value)}
                          isReadOnly={userRole === 'vocal'}
                          bg={userRole === 'vocal' ? "gray.50" : undefined}
                          placeholder={userRole === 'vocal' ? "Solo administradores pueden modificar" : "documentos"}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Nombre de la subcarpeta que contiene los documentos del club
                        </Text>
                      </FormControl>
                    </VStack>
                  </CardBody>                </Card>

                {/* Estado de las APIs */}
                <Card>
                  <CardBody>
                    <Heading size="sm" mb={4} color="teal.600">
                      📋 Estado de los Servicios
                    </Heading>                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <Badge colorScheme={settings.apis.googleDriveUrl ? 'green' : 'yellow'}>
                            {settings.apis.googleDriveUrl ? 'Configurado' : 'Pendiente'}
                          </Badge>
                          <Text fontSize="sm">Google Drive del Club</Text>
                        </HStack>
                        <HStack>
                          <Badge colorScheme={settings.apis.weatherEnabled ? 'green' : 'red'}>
                            {settings.apis.weatherEnabled ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Text fontSize="sm">Open-Meteo</Text>
                        </HStack>
                        <HStack>
                          <Badge colorScheme={
                            settings.apis.aemetEnabled && settings.apis.aemetApiKey 
                              ? 'green' 
                              : settings.apis.aemetEnabled 
                                ? 'yellow' 
                                : 'gray'
                          }>
                            {settings.apis.aemetEnabled && settings.apis.aemetApiKey 
                              ? 'Configurado' 
                              : settings.apis.aemetEnabled 
                                ? 'Pendiente API' 
                                : 'Inactivo'
                            }
                          </Badge>
                          <Text fontSize="sm">AEMET (España)</Text>
                        </HStack>
                        <HStack>
                          <Badge colorScheme={settings.apis.notificationsEnabled ? 'green' : 'red'}>
                            {settings.apis.notificationsEnabled ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <Text fontSize="sm">Notificaciones</Text>
                        </HStack>
                      </VStack>
                      {userRole === 'admin' && (
                        <VStack align="start" spacing={2}>
                          <HStack>
                            <Badge colorScheme={settings.apis.backupApiKey ? 'green' : 'yellow'}>
                              {settings.apis.backupApiKey ? 'Configurado' : 'Pendiente'}
                            </Badge>
                            <Text fontSize="sm">Backup Automático</Text>
                          </HStack>
                          <HStack>
                            <Badge colorScheme={settings.apis.analyticsEnabled ? 'green' : 'red'}>
                              {settings.apis.analyticsEnabled ? 'Activo' : 'Inactivo'}
                            </Badge>
                            <Text fontSize="sm">Analytics</Text>
                          </HStack>
                        </VStack>
                      )}
                    </SimpleGrid>
                  </CardBody>
                </Card>

                <Button 
                  onClick={handleSubmit}
                  colorScheme="brand"
                  isLoading={isLoading}
                  loadingText="Guardando..."
                >
                  💾 Guardar configuración de APIs
                </Button>
              </VStack>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ConfigurationManager;
