import React, { useState } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Stack,
  Divider,
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
  useColorModeValue,
  SimpleGrid
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons'; // Añadir esta importación
import DashboardLayout from '../../components/layouts/DashboardLayout';
import MaterialDropdownManagerFunctional from '../../components/admin/MaterialDropdownManagerFunctional';
import WeatherConfiguration from '../../components/admin/WeatherConfiguration';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import messages from '../../constants/messages';

const ConfiguracionPage: React.FC = () => {
  const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    notificacionesEmail: true,
    diasRecordatorio: 7,
    limiteElementosTabla: 10,
    modoOscuro: false,
    idiomaApp: 'es',
    diasAntelacionRevision: 30,
    backupAutomatico: true,
    frecuenciaBackup: 'semanal',
    googleDriveUrl: '',
    googleDriveTopoFolder: '',
    googleDriveDocFolder: ''
  });
  
      
  // Simular carga de configuraciones
  React.useEffect(() => {
    const cargarConfiguraciones = async () => {
      try {
        setIsLoading(true);
        // En una implementación real, cargarías las configuraciones desde Firebase
        const docRef = doc(db, "configuracion", "global");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSettings({...settings, ...docSnap.data()});
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
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Aquí enviarías las configuraciones a Firebase
      const docRef = doc(db, "configuracion", "global");
      await updateDoc(docRef, settings);
      
      toast({
        title: "Configuración actualizada",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error al actualizar la configuración:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
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
        
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setSettings({
        ...settings,
        [name]: target.checked
      });
    } else if (type === 'number') {
      setSettings({
        ...settings,
        [name]: parseInt(value)
      });
    } else {
      setSettings({
        ...settings,
        [name]: value
      });
    }
  };
  
  const handleSwitchChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      [name]: e.target.checked
    });
  };

  // Función para limpiar el caché de la aplicación
  const limpiarCache = () => {
    try {
      // Limpiar localStorage (preservando token)
      const authToken = localStorage.getItem('auth_token');
      localStorage.clear();
      if (authToken) localStorage.setItem('auth_token', authToken);
      
      // Limpiar sessionStorage
      sessionStorage.clear();
      
      // Desregistrar Service Workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for (let registration of registrations) {
            registration.unregister();
            console.log('Service Worker desregistrado');
          }
        });
      }
      
      // Forzar recarga completa
      window.location.reload();
      
      toast({
        title: "Caché limpiado",
        description: "Se ha limpiado el caché de la aplicación y se recargará la página.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error al limpiar caché:", error);
      toast({
        title: "Error",
        description: "No se pudo limpiar el caché de la aplicación",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <DashboardLayout title="Configuración del Sistema">
      <Box p={5}>
        <Card mb={5} variant="outline">
          <CardBody>
            <HStack mb={4}>
              <Heading size="md">Configuración</Heading>
              <Badge colorScheme="purple">Solo Admin</Badge>
            </HStack>
            <Text color="gray.600">
              Aquí puedes configurar los parámetros generales del sistema. Estos cambios afectarán a todos los usuarios.
            </Text>
          </CardBody>
        </Card>
          <Tabs colorScheme="brand" isLazy>          <TabList mb={4}>
            <Tab>General</Tab>
            <Tab>Notificaciones</Tab>
            <Tab>Seguridad</Tab>
            <Tab>Formularios Material</Tab>
            <Tab>Clima</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <Box as="form" onSubmit={handleSubmit}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl>
                    <FormLabel>Idioma de la aplicación</FormLabel>
                    <Select
                      name="idiomaApp"
                      value={settings.idiomaApp}
                      onChange={handleChange}
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="ca">Català</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Elementos por página en tablas</FormLabel>
                    <Select
                      name="limiteElementosTabla"
                      value={settings.limiteElementosTabla}
                      onChange={handleChange}
                    >
                      <option value="5">5 elementos</option>
                      <option value="10">10 elementos</option>
                      <option value="20">20 elementos</option>
                      <option value="50">50 elementos</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
                
                <Divider my={6} />
                
                <FormControl display="flex" alignItems="center" mb={4}>
                  <FormLabel htmlFor="modoOscuro" mb="0">
                    Modo oscuro por defecto
                  </FormLabel>
                  <Switch
                    id="modoOscuro"
                    name="modoOscuro"
                    isChecked={settings.modoOscuro}
                    onChange={handleSwitchChange('modoOscuro')}
                    colorScheme="brand"
                  />
                </FormControl>

                <Divider my={6} />

                <FormControl mt={4}>
                  <FormLabel>URL de Google Drive del club</FormLabel>
                  <Input
                    name="googleDriveUrl"
                    value={settings.googleDriveUrl}
                    onChange={handleChange}
                    placeholder="https://drive.google.com/drive/folders/XXXX"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    URL de la carpeta compartida principal del club
                  </Text>
                </FormControl>

                <FormControl mt={4}>
                  <FormLabel>Subcarpeta de Topografías</FormLabel>
                  <Input
                    name="googleDriveTopoFolder"
                    value={settings.googleDriveTopoFolder}
                    onChange={handleChange}
                    placeholder="topografias"
                  />
                </FormControl>

                <FormControl mt={4}>
                  <FormLabel>Subcarpeta de Documentos</FormLabel>
                  <Input
                    name="googleDriveDocFolder"
                    value={settings.googleDriveDocFolder}
                    onChange={handleChange}
                    placeholder="documentos"
                  />
                </FormControl>

                <Box>
                  <Heading size="sm" mb={3}>Mantenimiento</Heading>
                  <Text mb={3} color="gray.600">
                    Limpiar el caché puede ayudar si los cambios recientes no se muestran correctamente.
                  </Text>
                  
                  <Button
                    colorScheme="red"
                    variant="outline"
                    onClick={limpiarCache}
                    leftIcon={<DeleteIcon />}
                    size="md"
                  >
                    Limpiar caché de la aplicación
                  </Button>
                </Box>
                
                <Button
                  mt={6}
                  colorScheme="brand"
                  type="submit"
                  isLoading={isLoading}
                >
                  Guardar cambios
                </Button>
              </Box>
            </TabPanel>
            
            <TabPanel>
              <Box as="form" onSubmit={handleSubmit}>
                <FormControl display="flex" alignItems="center" mb={4}>
                  <FormLabel htmlFor="notificacionesEmail" mb="0">
                    Enviar notificaciones por email
                  </FormLabel>
                  <Switch
                    id="notificacionesEmail"
                    name="notificacionesEmail"
                    isChecked={settings.notificacionesEmail}
                    onChange={handleSwitchChange('notificacionesEmail')}
                    colorScheme="brand"
                  />
                </FormControl>
                
                <FormControl mt={4}>
                  <FormLabel>Días de antelación para recordatorios de revisión</FormLabel>
                  <Select
                    name="diasAntelacionRevision"
                    value={settings.diasAntelacionRevision}
                    onChange={handleChange}
                  >
                    <option value="7">7 días</option>
                    <option value="15">15 días</option>
                    <option value="30">30 días</option>
                    <option value="60">60 días</option>
                  </Select>
                </FormControl>
                
                <Divider my={6} />
                
                <FormControl mt={4}>
                  <FormLabel>Días para recordatorio de préstamos</FormLabel>
                  <Select
                    name="diasRecordatorio"
                    value={settings.diasRecordatorio}
                    onChange={handleChange}
                  >
                    <option value="3">3 días</option>
                    <option value="7">7 días</option>
                    <option value="14">14 días</option>
                  </Select>
                </FormControl>
                
                <Button
                  mt={6}
                  colorScheme="brand"
                  type="submit"
                  isLoading={isLoading}
                >
                  Guardar cambios
                </Button>
              </Box>
            </TabPanel>
            
            <TabPanel>
              <Box as="form" onSubmit={handleSubmit}>
                <FormControl display="flex" alignItems="center" mb={4}>
                  <FormLabel htmlFor="backupAutomatico" mb="0">
                    Habilitar copia de seguridad automática
                  </FormLabel>
                  <Switch
                    id="backupAutomatico"
                    name="backupAutomatico"
                    isChecked={settings.backupAutomatico}
                    onChange={handleSwitchChange('backupAutomatico')}
                    colorScheme="brand"
                  />
                </FormControl>
                
                <FormControl mt={4}>
                  <FormLabel>Frecuencia de copia de seguridad</FormLabel>
                  <Select
                    name="frecuenciaBackup"
                    value={settings.frecuenciaBackup}
                    onChange={handleChange}
                    isDisabled={!settings.backupAutomatico}
                  >
                    <option value="diario">Diario</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                  </Select>
                </FormControl>
                
                <Divider my={6} />
                
                <Button
                  mt={6}
                  colorScheme="brand"
                  type="submit"
                  isLoading={isLoading}
                >
                  Guardar cambios
                </Button>
                
                <Button
                  mt={6}
                  ml={4}
                  colorScheme="blue"
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: messages.configuracion.backupIniciado,
                      description: messages.configuracion.backupIniciandose,
                      status: "info",
                      duration: 5000,
                      isClosable: true,
                    });
                  }}
                  isLoading={isLoading}
                >                  Realizar copia de seguridad ahora
                </Button>
              </Box>
            </TabPanel>
            
            {/* Nueva pestaña para gestión de dropdowns de material */}
            <TabPanel>
              <Card>
                <CardBody>
                  <HStack mb={4}>
                    <Heading size="md">Gestión de Formularios de Material</Heading>
                    <Badge colorScheme="blue">Configuración Dinámica</Badge>
                  </HStack>
                  <Text color="gray.600" mb={6}>
                    Gestiona las opciones disponibles en los formularios de nuevo material. 
                    Los cambios se aplicarán inmediatamente a todos los formularios de material.
                  </Text>                  <MaterialDropdownManagerFunctional />
                </CardBody>
              </Card>
            </TabPanel>

            <TabPanel>
              <WeatherConfiguration />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </DashboardLayout>
  );
};

export default ConfiguracionPage;