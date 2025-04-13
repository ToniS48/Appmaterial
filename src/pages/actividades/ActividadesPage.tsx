import React, { useState, useEffect } from 'react';
import messages from '../../constants/messages';
import {
  Box,
  Heading,
  Text,
  Flex,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Spinner,
  SimpleGrid,
  Card,
  CardBody,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast
} from '@chakra-ui/react';
import { AddIcon, CalendarIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { listarActividades, obtenerActividadesProximas, obtenerActividadesClasificadas, unirseActividad } from '../../services/actividadService';
import { Actividad } from '../../types/actividad';
import ActividadDetalle from '../../components/actividades/ActividadDetalle';
import ActividadCard from '../../components/actividades/ActividadCard';
import { useAuth } from '../../contexts/AuthContext';

const ActividadesPage: React.FC = () => {
  // Estados
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [proximasActividades, setProximasActividades] = useState<Actividad[]>([]);
  const [actividadesResponsable, setActividadesResponsable] = useState<Actividad[]>([]);
  const [actividadesParticipante, setActividadesParticipante] = useState<Actividad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);
  
  // Hooks
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { userProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Cargar actividades
  const cargarActividades = async () => {
    if (!userProfile?.uid) return;
    
    try {
      setIsLoading(true);
      
      // Cargar todas las actividades
      const todasActividades = await listarActividades();
      setActividades(todasActividades);
      
      // Cargar próximas actividades
      const actividadesProximas = await obtenerActividadesProximas(5);
      setProximasActividades(actividadesProximas);
      
      // Cargar actividades clasificadas
      const { actividadesResponsable, actividadesParticipante } = 
        await obtenerActividadesClasificadas(userProfile.uid);
      
      setActividadesResponsable(actividadesResponsable);
      setActividadesParticipante(actividadesParticipante);
    } catch (error) {
      console.error('Error al cargar actividades:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las actividades",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    cargarActividades();
  }, [userProfile?.uid]);

  // Función para unirse a una actividad
  const handleUnirseActividad = async (actividadId: string) => {
    if (!userProfile?.uid) return;
    
    try {
      await unirseActividad(actividadId, userProfile.uid);
      toast({
        title: "¡Te has unido!",
        description: "Te has unido correctamente a la actividad",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Recargar datos para reflejar cambios
      await cargarActividades();
    } catch (error) {
      console.error("Error al unirse a la actividad:", error);
      toast({
        title: "Error",
        description: "No se pudo unir a la actividad",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Formatear fecha
  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Renderizar tarjeta de actividad
  const renderActividadCard = (actividad: Actividad) => {
    return (
      <ActividadCard
        key={actividad.id}
        actividad={actividad}
        onVerDetalles={() => {
          setSelectedActividad(actividad);
          onDetailOpen();
        }}
        onUnirse={
          // Solo mostrar unirse si no es responsable ni participante
          userProfile && 
          actividad.creadorId !== userProfile.uid && 
          actividad.responsableActividadId !== userProfile.uid &&
          actividad.responsableMaterialId !== userProfile.uid &&
          !actividad.participanteIds?.includes(userProfile.uid) &&
          actividad.estado !== 'finalizada' && 
          actividad.estado !== 'cancelada'
            ? () => handleUnirseActividad(actividad.id as string)
            : undefined
        }
        mostrarBotones={true}
        mostrarDescripcion={true}
      />
    );
  };

  return (
    <DashboardLayout title="Actividades">
      <Box>
        <Flex 
          direction={{ base: "column", md: "row" }} 
          justify="space-between" 
          align={{ base: "start", md: "center" }}
          mb={6}
          gap={3}
        >
          <HStack 
            spacing={4} 
            direction={{ base: "column", md: "row" }}
            width={{ base: "100%", md: "auto" }}
          >
            <Button 
              leftIcon={<CalendarIcon />} 
              colorScheme="brand" 
              variant="outline"
              as={RouterLink}
              to="/activities/calendario"
              width={{ base: "100%", md: "auto" }}
            >
              Ver Calendario
            </Button>
            <Button 
              leftIcon={<AddIcon />} 
              colorScheme="brand" 
              onClick={() => navigate('/activities/create')}
              width={{ base: "100%", md: "auto" }}
            >
              Nueva Actividad
            </Button>
          </HStack>
        </Flex>

        {isLoading ? (
          <Flex justify="center" align="center" height="200px">
            <Spinner size="xl" />
          </Flex>
        ) : (
          <Tabs 
            variant="enclosed" 
            colorScheme="brand" 
            onChange={(index) => setTabIndex(index)}
            isLazy
          >
            <TabList>
              <Tab>Todas</Tab>
              <Tab>Próximas</Tab>
              <Tab>Como Responsable</Tab>
              <Tab>Como Participante</Tab>
            </TabList>
            
            <TabPanels>
              {/* Pestaña de Todas las Actividades - Ahora con diseño unificado */}
              <TabPanel px={0}>
                {actividades.length > 0 ? (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {actividades.map(actividad => renderActividadCard(actividad))}
                  </SimpleGrid>
                ) : (
                  <Card>
                    <CardBody textAlign="center">
                      <Text>{messages.dashboard.sinActividadesDisponibles}</Text>
                      <Button 
                        mt={4} 
                        leftIcon={<AddIcon />} 
                        colorScheme="brand" 
                        size="sm"
                        onClick={() => navigate('/activities/create')}
                      >
                        {messages.dashboard.crearPrimeraActividad}
                      </Button>
                    </CardBody>
                  </Card>
                )}
              </TabPanel>

              {/* Las demás pestañas quedan igual, ya tenían el diseño correcto */}
              <TabPanel px={0}>
                {proximasActividades.length > 0 ? (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {proximasActividades.map(actividad => renderActividadCard(actividad))}
                  </SimpleGrid>
                ) : (
                  <Card>
                    <CardBody textAlign="center">
                      <Text>{messages.dashboard.sinActividadesProximas}</Text>
                    </CardBody>
                  </Card>
                )}
              </TabPanel>

              <TabPanel px={0}>
                {actividadesResponsable.length > 0 ? (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {actividadesResponsable.map(actividad => renderActividadCard(actividad))}
                  </SimpleGrid>
                ) : (
                  <Card>
                    <CardBody textAlign="center">
                      <Text>{messages.dashboard.sinActividadesResponsable}</Text>
                    </CardBody>
                  </Card>
                )}
              </TabPanel>

              <TabPanel px={0}>
                {actividadesParticipante.length > 0 ? (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {actividadesParticipante.map(actividad => renderActividadCard(actividad))}
                  </SimpleGrid>
                ) : (
                  <Card>
                    <CardBody textAlign="center">
                      <Text>{messages.dashboard.sinActividadesParticipante}</Text>
                    </CardBody>
                  </Card>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </Box>

      {/* Modal para ver detalle de actividad */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedActividad ? (
              <>
                {selectedActividad.nombre}
                {selectedActividad.lugar && (
                  <Text as="span" fontWeight="normal" fontSize="md" ml={1}>
                    ({selectedActividad.lugar})
                  </Text>
                )}
                <Text fontSize="sm" color="gray.600" fontWeight="normal" mt={1}>
                  {formatDate(selectedActividad.fechaInicio)} 
                  {selectedActividad.fechaFin && (
                    <> → {formatDate(selectedActividad.fechaFin)}</>
                  )}
                </Text>
              </>
            ) : "Detalle de actividad"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedActividad && (
              <ActividadDetalle 
                actividad={selectedActividad}
                onClose={onDetailClose}
                onActividadUpdated={() => {
                  cargarActividades();
                  onDetailClose();
                }}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
};

export default ActividadesPage;