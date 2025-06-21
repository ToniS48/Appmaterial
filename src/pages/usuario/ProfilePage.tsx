import React, { useState, useEffect } from 'react';
import {
  Box, Heading, VStack, Card, CardBody, Avatar, 
  Text, Divider, Button, FormControl, FormLabel, Input, 
  FormHelperText, Spinner, Center, Alert, AlertIcon, SimpleGrid,
  Switch, Select, useToast, Tabs, TabList, TabPanels, Tab, TabPanel,
  HStack, Badge
} from '@chakra-ui/react';
import { FiEdit, FiSettings, FiUser } from 'react-icons/fi';
import { Timestamp, FieldValue, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Página de perfil de usuario
 */
const ProfilePage: React.FC = () => {
  const { userProfile, loading } = useAuth();
  const toast = useToast();
  
  // Estados para preferencias personales
  const [preferences, setPreferences] = useState({
    idiomaApp: 'es',
    limiteElementosTabla: 10,
    modoOscuro: false,
    notificacionesEmail: true,
    notificacionesPush: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Cargar preferencias del usuario
  useEffect(() => {
    const cargarPreferencias = async () => {
      if (!userProfile?.uid) return;
      
      try {
        const docRef = doc(db, 'usuarios', userProfile.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.preferencias) {
            setPreferences({ ...preferences, ...data.preferencias });
          }
        }
        setPreferencesLoaded(true);
      } catch (error) {
        console.error('Error cargando preferencias:', error);
        setPreferencesLoaded(true);
      }
    };

    if (userProfile && !loading) {
      cargarPreferencias();
    }
  }, [userProfile, loading]);

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences({
      ...preferences,
      [key]: value
    });
  };

  const handleSwitchChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    handlePreferenceChange(key, e.target.checked);
  };

  const guardarPreferencias = async () => {
    if (!userProfile?.uid) return;

    try {
      setIsLoading(true);
      const docRef = doc(db, 'usuarios', userProfile.uid);
      
      await updateDoc(docRef, {
        preferencias: preferences,
        fechaActualizacion: new Date()
      });

      toast({
        title: "Preferencias guardadas",
        description: "Tus preferencias se han actualizado correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error guardando preferencias:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las preferencias",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Mi Perfil">
        <Center h="300px">
          <Spinner size="xl" color="brand.500" />
        </Center>
      </DashboardLayout>
    );
  }

  if (!userProfile) {
    return (
      <DashboardLayout title="Mi Perfil">
        <Alert status="error" mx="auto" maxW="500px" mt={10}>
          <AlertIcon />
          No se pudo cargar la información del perfil
        </Alert>
      </DashboardLayout>
    );
  }

  const formatearFecha = (fecha: Timestamp | Date | FieldValue | undefined): string => {
    if (!fecha) return 'No disponible';
    
    try {
      if ('seconds' in fecha) {
        // Es un Timestamp de Firestore
        return new Date(fecha.seconds * 1000).toLocaleDateString();
      } else if (fecha instanceof Date) {
        return fecha.toLocaleDateString();
      } else {
        return 'Formato desconocido';
      }
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return 'No disponible';
    }
  };
  return (
    <DashboardLayout title="Mi Perfil">
      <Box maxW="1200px" mx="auto" p={4}>
        <Card mb={6} variant="outline">
          <CardBody>
            <HStack mb={4}>
              <Heading size="md">Mi Perfil</Heading>
              <Badge colorScheme="blue">Personalización</Badge>
            </HStack>
            <Text color="gray.600">
              Gestiona tu información personal y personaliza tu experiencia en la aplicación.
            </Text>
          </CardBody>
        </Card>

        <Tabs colorScheme="brand" isLazy>
          <TabList mb={4}>
            <Tab>
              <HStack spacing={2}>
                <FiUser />
                <Text>Información Personal</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FiSettings />
                <Text>Preferencias</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Pestaña Información Personal */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                {/* Perfil y Avatar */}
                <Card>
                  <CardBody>
                    <VStack align="center" spacing={4}>
                      <Avatar 
                        size="2xl" 
                        name={`${userProfile.nombre} ${userProfile.apellidos || ''}`} 
                        src={userProfile.avatarUrl || undefined}
                      />
                      <Text fontWeight="bold" fontSize="xl">
                        {`${userProfile.nombre} ${userProfile.apellidos || ''}`}
                      </Text>
                      <Text color="gray.500">{userProfile.email}</Text>
                      <Text bg="brand.50" color="brand.700" px={3} py={1} borderRadius="full">
                        {userProfile.rol === 'admin' ? 'Administrador' : 
                         userProfile.rol === 'vocal' ? 'Vocal' : 
                         userProfile.rol === 'socio' ? 'Socio' : 'Invitado'}
                      </Text>
                      <Button colorScheme="brand" leftIcon={<FiEdit />} size="sm">
                        Cambiar Avatar
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Información Personal */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>Información Personal</Heading>
                    <VStack align="stretch" spacing={4}>
                      <FormControl>
                        <FormLabel>Nombre</FormLabel>
                        <Input value={userProfile.nombre} isReadOnly />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Apellidos</FormLabel>
                        <Input value={userProfile.apellidos || ''} isReadOnly />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Email</FormLabel>
                        <Input value={userProfile.email} isReadOnly />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Teléfono</FormLabel>
                        <Input value={userProfile.telefono || ''} isReadOnly />
                        <FormHelperText>Este dato solo es visible para administradores</FormHelperText>
                      </FormControl>

                      <Button colorScheme="brand" leftIcon={<FiEdit />}>
                        Editar Información
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Estadísticas y Acciones */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>Estadísticas</Heading>
                    <VStack align="start" spacing={3}>
                      <Text>Última conexión: {formatearFecha(userProfile.ultimaConexion)}</Text>
                      <Text>Miembro desde: {formatearFecha(userProfile.fechaCreacion)}</Text>
                      <Text>Rol actual: {userProfile.rol}</Text>
                    </VStack>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>Seguridad</Heading>
                    <VStack align="stretch" spacing={3}>
                      <Button variant="outline">
                        Cambiar Contraseña
                      </Button>
                      <Button variant="outline" colorScheme="red">
                        Cerrar Sesión
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>

            {/* Pestaña Preferencias */}
            <TabPanel>
              {!preferencesLoaded ? (
                <Center py={10}>
                  <Spinner size="lg" />
                  <Text ml={4}>Cargando preferencias...</Text>
                </Center>
              ) : (
                <VStack spacing={6} align="stretch">
                  {/* Preferencias de Interfaz */}
                  <Card>
                    <CardBody>
                      <Heading size="md" mb={4} color="blue.600">
                        🎨 Interfaz y Visualización
                      </Heading>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <FormControl>
                          <FormLabel>Idioma de la aplicación</FormLabel>
                          <Select
                            value={preferences.idiomaApp}
                            onChange={(e) => handlePreferenceChange('idiomaApp', e.target.value)}
                          >
                            <option value="es">Español</option>
                            <option value="en">English</option>
                            <option value="ca">Català</option>
                          </Select>
                          <FormHelperText>
                            Idioma principal de la interfaz
                          </FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Elementos por página en tablas</FormLabel>
                          <Select
                            value={preferences.limiteElementosTabla}
                            onChange={(e) => handlePreferenceChange('limiteElementosTabla', parseInt(e.target.value))}
                          >
                            <option value="5">5 elementos</option>
                            <option value="10">10 elementos</option>
                            <option value="20">20 elementos</option>
                            <option value="50">50 elementos</option>
                          </Select>
                          <FormHelperText>
                            Cantidad de elementos mostrados por página
                          </FormHelperText>
                        </FormControl>

                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel htmlFor="modoOscuro" mb="0">
                              Modo oscuro
                            </FormLabel>
                            <FormHelperText mt={0}>
                              Tema oscuro para la interfaz
                            </FormHelperText>
                          </Box>
                          <Switch
                            id="modoOscuro"
                            isChecked={preferences.modoOscuro}
                            onChange={handleSwitchChange('modoOscuro')}
                            colorScheme="brand"
                          />
                        </FormControl>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  {/* Preferencias de Notificaciones */}
                  <Card>
                    <CardBody>
                      <Heading size="md" mb={4} color="green.600">
                        🔔 Notificaciones
                      </Heading>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel htmlFor="notificacionesEmail" mb="0">
                              Notificaciones por correo
                            </FormLabel>
                            <FormHelperText mt={0}>
                              Recibir notificaciones importantes por email
                            </FormHelperText>
                          </Box>
                          <Switch
                            id="notificacionesEmail"
                            isChecked={preferences.notificacionesEmail}
                            onChange={handleSwitchChange('notificacionesEmail')}
                            colorScheme="brand"
                          />
                        </FormControl>

                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel htmlFor="notificacionesPush" mb="0">
                              Notificaciones push
                            </FormLabel>
                            <FormHelperText mt={0}>
                              Notificaciones en tiempo real en el navegador
                            </FormHelperText>
                          </Box>
                          <Switch
                            id="notificacionesPush"
                            isChecked={preferences.notificacionesPush}
                            onChange={handleSwitchChange('notificacionesPush')}
                            colorScheme="brand"
                          />
                        </FormControl>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  {/* Resumen de Configuración */}
                  <Card>
                    <CardBody>
                      <Heading size="md" mb={4} color="purple.600">
                        📋 Resumen de Preferencias
                      </Heading>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <VStack align="start" spacing={2}>
                          <Text fontSize="sm">
                            <strong>Idioma:</strong> {
                              preferences.idiomaApp === 'es' ? 'Español' :
                              preferences.idiomaApp === 'en' ? 'English' : 'Català'
                            }
                          </Text>
                          <Text fontSize="sm">
                            <strong>Elementos por página:</strong> {preferences.limiteElementosTabla}
                          </Text>
                          <Text fontSize="sm">
                            <strong>Tema:</strong> {preferences.modoOscuro ? 'Oscuro' : 'Claro'}
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={2}>
                          <Text fontSize="sm">
                            <strong>Email:</strong> {preferences.notificacionesEmail ? 'Activado' : 'Desactivado'}
                          </Text>
                          <Text fontSize="sm">
                            <strong>Push:</strong> {preferences.notificacionesPush ? 'Activado' : 'Desactivado'}
                          </Text>
                        </VStack>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  {/* Botón Guardar */}
                  <Box textAlign="center">
                    <Button 
                      size="lg"
                      colorScheme="brand"
                      onClick={guardarPreferencias}
                      isLoading={isLoading}
                      loadingText="Guardando..."
                      leftIcon={<FiSettings />}
                    >
                      💾 Guardar Preferencias
                    </Button>
                  </Box>
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </DashboardLayout>
  );
};

export default ProfilePage;