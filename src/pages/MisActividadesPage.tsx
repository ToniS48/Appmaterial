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
import { FiPackage, FiCalendar, FiUser, FiUsers, FiShield } from 'react-icons/fi';
import { AddIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { Actividad } from '../types/actividad';
import { obtenerActividadesClasificadas } from '../services/actividadService';
import PrestamoForm from '../components/prestamos/PrestamoForm';
import messages from '../constants/messages';

const MisActividadesPage: React.FC = () => {
    const navigate = useNavigate();
  const { userProfile } = useAuth();
    // Estados separados por tipo de responsabilidad
  const [actividadesRespActividad, setActividadesRespActividad] = useState<Actividad[]>([]);
  const [actividadesRespMaterial, setActividadesRespMaterial] = useState<Actividad[]>([]);
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
        
        // Obtener actividades clasificadas del usuario
        const { actividadesResponsable, actividadesParticipante } = await obtenerActividadesClasificadas(userProfile.uid);
        
        console.log('🔍 MisActividadesPage - Total actividades responsable:', actividadesResponsable.length);
        console.log('🔍 MisActividadesPage - Total actividades participante:', actividadesParticipante.length);        // Clasificar actividades por tipo específico de responsabilidad (mutuamente excluyentes)
        // Los creadores van a "Resp. Actividad" junto con los responsables de actividad
        const respActividad = actividadesResponsable.filter(act => 
          act.creadorId === userProfile.uid || 
          act.responsableActividadId === userProfile.uid
        );
        
        const respMaterial = actividadesResponsable.filter(act => 
          act.responsableMaterialId === userProfile.uid && 
          act.creadorId !== userProfile.uid && 
          act.responsableActividadId !== userProfile.uid
        );
        
        console.log('🔍 MisActividadesPage - Responsable actividad (incluye creadores):', respActividad.length);
        console.log('🔍 MisActividadesPage - Responsable material:', respMaterial.length);
        console.log('🔍 MisActividadesPage - Solo participante:', actividadesParticipante.length);
        
        // Log detallado de responsabilidades
        actividadesResponsable.forEach(act => {
          const roles = [];
          if (act.creadorId === userProfile.uid) roles.push('Creador');
          if (act.responsableActividadId === userProfile.uid) roles.push('Resp.Actividad');
          if (act.responsableMaterialId === userProfile.uid) roles.push('Resp.Material');
          console.log(`  📋 "${act.nombre}": ${roles.join(', ')}`);
        });
          setActividadesRespActividad(respActividad);
        setActividadesRespMaterial(respMaterial);
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

  // Verificar si la actividad está vencida (fecha de fin ha pasado)
  const isActividadVencida = (actividad: Actividad): boolean => {
    const ahora = new Date();
    let fechaFin: Date;
    
    if (actividad.fechaFin instanceof Date) {
      fechaFin = actividad.fechaFin;
    } else {
      fechaFin = actividad.fechaFin.toDate();
    }
    
    return fechaFin < ahora;
  };
  // Modifica la función renderActividadCard
  const renderActividadCard = (actividad: Actividad) => {
    const estado = getEstadoDisplay(actividad.estado);
    
    // Determinar el tipo de responsabilidad del usuario
    const getRolUsuario = () => {
      const roles = [];
      if (actividad.creadorId === userProfile?.uid) {
        roles.push({ tipo: 'Creador', color: 'purple' });
      }
      if (actividad.responsableActividadId === userProfile?.uid) {
        roles.push({ tipo: 'Resp. Actividad', color: 'blue' });
      }
      if (actividad.responsableMaterialId === userProfile?.uid) {
        roles.push({ tipo: 'Resp. Material', color: 'cyan' });
      }
      return roles;
    };
    
    const rolesUsuario = getRolUsuario();
    
    return (
      <Card key={actividad.id} mb={4} p={{ base: 3, md: 4 }} width="100%">
        {/* Cabecera con título y badges */}        <Flex direction="column" mb={2} width="100%">
          <Heading size="sm">{actividad.nombre}</Heading>
          <Flex mt={1} gap={2} flexWrap="wrap">
            {rolesUsuario.map((rol, index) => (
              <Badge key={index} colorScheme={rol.color} size="sm">
                {rol.tipo}
              </Badge>
            ))}
            <Badge colorScheme={estado.color} size="sm">
              {estado.label}
            </Badge>
          </Flex>
        </Flex>
        
        <Divider my={2} />
          {/* Información de la actividad */}
        <Flex align="center" mt={1}>
          <FiCalendar style={{ marginRight: '8px' }} />
          <Text fontSize="sm">
            {formatDate(actividad.fechaInicio)}
            {actividad.fechaFin && (
              <> → {formatDate(actividad.fechaFin)}</>
            )}
          </Text>
        </Flex>
        
        <Text fontSize="sm" mt={2}>Lugar: {actividad.lugar || 'No especificado'}</Text>
        
        {actividad.descripcion && (
          <Text fontSize="sm" mt={2} noOfLines={2}>{actividad.descripcion}</Text>
        )}
          {/* Botones de acción al final de la tarjeta */}
        {actividad.estado !== 'cancelada' && actividad.estado !== 'finalizada' && rolesUsuario.length > 0 && (
          <Flex justify="flex-end" width="100%" mt={3}>
            <Button 
              size={{ base: "sm", md: "md" }}
              colorScheme="purple" 
              leftIcon={<FiPackage />}
              onClick={() => {
                setActividadSeleccionada(actividad);
                onPrestamoOpen();
              }}
              width={{ base: "100%", sm: "auto" }}            >
              {isActividadVencida(actividad) ? "Devolución de material" : "Gestionar material"}
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
          ) : actividadesRespActividad.length === 0 && actividadesRespMaterial.length === 0 && actividadesParticipante.length === 0 ? (
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
            >              <TabList>
                <Tab>
                  <Flex align="center" gap={2}>
                    <Icon as={FiUser} />
                    <Text>Resp. Actividad</Text>
                    <Badge colorScheme="blue" rounded="full" px={2}>
                      {actividadesRespActividad.length}
                    </Badge>
                  </Flex>
                </Tab>
                <Tab>
                  <Flex align="center" gap={2}>
                    <Icon as={FiPackage} />
                    <Text>Resp. Material</Text>
                    <Badge colorScheme="cyan" rounded="full" px={2}>
                      {actividadesRespMaterial.length}
                    </Badge>
                  </Flex>
                </Tab>
                <Tab>
                  <Flex align="center" gap={2}>
                    <Icon as={FiUsers} />
                    <Text>Participante</Text>
                    <Badge colorScheme="green" rounded="full" px={2}>
                      {actividadesParticipante.length}
                    </Badge>
                  </Flex>
                </Tab>
              </TabList>              <TabPanels>
                <TabPanel p={0}>
                  {actividadesRespActividad.length === 0 ? (
                    <Card bg="gray.50" borderLeft="4px solid" borderColor="blue.500">
                      <CardBody textAlign="center">
                        <Text>No eres responsable de actividades</Text>
                      </CardBody>
                    </Card>
                  ) : (
                    <Box>
                      {actividadesRespActividad.map(renderActividadCard)}
                    </Box>
                  )}
                </TabPanel>
                <TabPanel p={0}>
                  {actividadesRespMaterial.length === 0 ? (
                    <Card bg="gray.50" borderLeft="4px solid" borderColor="cyan.500">
                      <CardBody textAlign="center">
                        <Text>No eres responsable de material</Text>
                      </CardBody>
                    </Card>
                  ) : (
                    <Box>
                      {actividadesRespMaterial.map(renderActividadCard)}
                    </Box>
                  )}
                </TabPanel>
                <TabPanel p={0}>
                  {actividadesParticipante.length === 0 ? (
                    <Card bg="gray.50" borderLeft="4px solid" borderColor="green.500">
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