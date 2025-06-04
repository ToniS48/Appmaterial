import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Spinner,
  Card,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Divider,
  Icon
} from '@chakra-ui/react';
import { FiPackage, FiCalendar, FiUser, FiUsers } from 'react-icons/fi';
import { AddIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { Actividad } from '../types/actividad';
import PrestamoForm from '../components/prestamos/PrestamoForm';
import messages from '../constants/messages';

const MisActividadesPage: React.FC = () => {
    const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [actividadesResponsable, setActividadesResponsable] = useState<Actividad[]>([]);
  const [actividadesParticipante, setActividadesParticipante] = useState<Actividad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null);
  const { isOpen: isPrestamoOpen, onOpen: onPrestamoOpen, onClose: onPrestamoClose } = useDisclosure();
  
  // Cargar actividades del usuario clasificadas
  useEffect(() => {
    const fetchActividades = async () => {
      if (!userProfile?.uid) return;
      
      try {
        setIsLoading(true);
                
        setActividadesResponsable(actividadesResponsable);
        setActividadesParticipante(actividadesParticipante);
      } catch (error) {
        console.error('Error al cargar actividades:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActividades();
  }, [userProfile?.uid]);

  // Formatear fecha para mostrar
  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Obtener estado con color para mostrar
  const getEstadoDisplay = (estado: string) => {
    switch (estado) {
      case 'planificada':
        return { label: 'Planificada', color: 'yellow' };
      case 'en_curso':
        return { label: 'En curso', color: 'green' };
      case 'finalizada':
        return { label: 'Finalizada', color: 'blue' };
      case 'cancelada':
        return { label: 'Cancelada', color: 'red' };
      default:
        return { label: estado, color: 'gray' };
    }
  };

  // Modifica la función renderActividadCard
  const renderActividadCard = (actividad: Actividad) => {
    const estado = getEstadoDisplay(actividad.estado);
    const esResponsable = 
      actividad.creadorId === userProfile?.uid || 
      actividad.responsableActividadId === userProfile?.uid || 
      actividad.responsableMaterialId === userProfile?.uid;
    
    return (
      <Card key={actividad.id} mb={4} p={{ base: 3, md: 4 }} width="100%">
        {/* Cabecera con título y badges */}
        <Flex direction="column" mb={2} width="100%">
          <Heading size="sm">{actividad.nombre}</Heading>
          <Flex mt={1} gap={2} flexWrap="wrap">
            {esResponsable && (
              <Badge colorScheme="purple" size="sm">
                {actividad.creadorId === userProfile?.uid ? 'Creador' : 'Responsable'}
              </Badge>
            )}
            <Badge colorScheme={estado.color} size="sm">
              {estado.label}
            </Badge>
          </Flex>
        </Flex>
        
        <Divider my={2} />
        
        {/* Información de la actividad */}
        <Flex align="center" mt={1}>
          <FiCalendar style={{ marginRight: '8px' }} />
          <Text fontSize="sm">{formatDate(actividad.fechaInicio)}</Text>
        </Flex>
        
        <Text fontSize="sm" mt={2}>Lugar: {actividad.lugar || 'No especificado'}</Text>
        
        {actividad.descripcion && (
          <Text fontSize="sm" mt={2} noOfLines={2}>{actividad.descripcion}</Text>
        )}
        
        {/* Botones de acción al final de la tarjeta */}
        {actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && (
          <Flex justify="flex-end" width="100%" mt={3}>
            <Button 
              size={{ base: "sm", md: "md" }}
              colorScheme="purple" 
              leftIcon={<FiPackage />}
              onClick={() => {
                setActividadSeleccionada(actividad);
                onPrestamoOpen();
              }}
              width={{ base: "100%", sm: "auto" }}
            >
              Gestionar material
            </Button>
          </Flex>
        )}
      </Card>
    );
  };

  return (
    <DashboardLayout title="Mis Actividades">
      {/* Contenedor principal centrado con ancho máximo */}
      <Flex justify="center">
        <Box 
          width="100%" 
          maxWidth="1200px" 
          p={{ base: 3, md: 5 }}
        >
          <Flex justify="space-between" align="center" mb={6}>
            <Heading size="lg" textAlign={{ base: "center", md: "left" }}>Mis Actividades</Heading>
            <Button 
              leftIcon={<AddIcon />} 
              colorScheme="brand" 
              onClick={() => navigate('/activities/create')}
            >
              Nueva Actividad
            </Button>
          </Flex>
          
          {isLoading ? (
            <Flex justify="center" align="center" height="200px">
              <Spinner size="xl" />
            </Flex>
          ) : actividadesResponsable.length === 0 && actividadesParticipante.length === 0 ? (
            <Card>
              <CardBody textAlign="center">
                <Text>No tienes actividades registradas</Text>
              </CardBody>
            </Card>
          ) : (
            <Tabs 
              variant="soft-rounded" 
              colorScheme="purple" 
              size={{ base: "sm", md: "md" }}
              isLazy
              sx={{
                '.chakra-tabs__tablist': {
                  borderBottom: '2px solid',
                  borderColor: 'purple.100',
                  mb: 6,
                  pb: 1,
                  gap: { base: 2, md: 4 },
                  flexDirection: { base: 'column', sm: 'row' },
                  width: '100%'
                },
                '.chakra-tabs__tab': {
                  fontWeight: 'medium',
                  _selected: {
                    color: 'purple.500',
                    bg: 'purple.50',
                    fontWeight: 'bold',
                    boxShadow: 'sm'
                  },
                  _active: {
                    bg: 'purple.100'
                  },
                  mb: 2,
                  py: { base: 2, md: 3 },
                  px: { base: 3, md: 4 },
                  width: { base: '100%', sm: 'auto' }
                }
              }}
            >
              <TabList>
                <Tab>
                  <Flex align="center" gap={2}>
                    <Icon as={FiUser} />
                    <Text>{messages.dashboard.secciones.misActividadesResponsable}</Text>
                    <Badge colorScheme="purple" rounded="full" px={2}>
                      {actividadesResponsable.length}
                    </Badge>
                  </Flex>
                </Tab>
                <Tab>
                  <Flex align="center" gap={2}>
                    <Icon as={FiUsers} />
                    <Text>{messages.dashboard.secciones.actividadesParticipante}</Text>
                    <Badge colorScheme="blue" rounded="full" px={2}>
                      {actividadesParticipante.length}
                    </Badge>
                  </Flex>
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel p={0}>
                  {actividadesResponsable.length === 0 ? (
                    <Card bg="gray.50" borderLeft="4px solid" borderColor="purple.500">
                      <CardBody textAlign="center">
                        <Text>No tienes actividades a tu cargo</Text>
                      </CardBody>
                    </Card>
                  ) : (
                    <Box>
                      {actividadesResponsable.map(renderActividadCard)}
                    </Box>
                  )}
                </TabPanel>
                <TabPanel p={0}>
                  {actividadesParticipante.length === 0 ? (
                    <Card bg="gray.50" borderLeft="4px solid" borderColor="blue.500">
                      <CardBody textAlign="center">
                        <Text>No estás participando en otras actividades</Text>
                      </CardBody>
                    </Card>
                  ) : (
                    <Box>
                      {actividadesParticipante.map(renderActividadCard)}
                    </Box>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </Box>
      </Flex>

      {/* Modal para gestionar material */}
      <Modal isOpen={isPrestamoOpen} onClose={onPrestamoClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {actividadSeleccionada ? `Material para ${actividadSeleccionada.nombre}` : 'Gestionar material'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {actividadSeleccionada && (
              <PrestamoForm
                preselectedActividadId={actividadSeleccionada.id}
                onSuccess={() => {
                  onPrestamoClose();
                }}
                onCancel={onPrestamoClose}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
};

export default MisActividadesPage;