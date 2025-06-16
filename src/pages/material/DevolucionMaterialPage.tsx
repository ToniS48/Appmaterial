import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Container,
  Divider,
  List,
  ListItem,
  IconButton,
  HStack,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { ArrowBackIcon, ViewIcon } from '@chakra-ui/icons';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { obtenerPrestamosUsuario } from '../../services/prestamoService';
import { Prestamo } from '../../types/prestamo';
import DevolucionAvanzadaForm from '../../components/prestamos/DevolucionAvanzadaForm';
import { useAuth } from '../../contexts/AuthContext';
import messages from '../../constants/messages';

const DevolucionMaterialPage: React.FC = () => {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [selectedPrestamo, setSelectedPrestamo] = useState<Prestamo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { userProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    const fetchPrestamos = async () => {
      if (!userProfile) {
        console.log("🔍 DevolucionMaterialPage - No hay userProfile");
        return;
      }
      
      try {
        console.log("🔍 DevolucionMaterialPage - Iniciando carga de préstamos para usuario:", userProfile.uid);
        setLoading(true);
        setError(null);
        
        // Obtener préstamos activos del usuario actual
        const data = await obtenerPrestamosUsuario(userProfile.uid);
        console.log("🔍 DevolucionMaterialPage - Préstamos obtenidos:", data.length);
        
        // Filtrar solo los préstamos activos (no devueltos)
        const prestamosActivos = data.filter(prestamo => 
          prestamo.estado !== 'devuelto' && prestamo.estado !== 'cancelado'
        );
        console.log("🔍 DevolucionMaterialPage - Préstamos activos:", prestamosActivos.length);
        setPrestamos(prestamosActivos);
      } catch (err) {
        console.error("❌ DevolucionMaterialPage - Error al cargar préstamos:", err);
        setError(messages.prestamos.errorCargar);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrestamos();
  }, [userProfile]);

  const handleOpenDevolucion = (prestamo: Prestamo) => {
    setSelectedPrestamo(prestamo);
    onOpen();
  };
    const handleDevolucionSuccess = () => {
    if (!selectedPrestamo) return;
    
    onClose();
    // Actualizar la lista de préstamos
    setPrestamos(prestamos.filter(p => p.id !== selectedPrestamo?.id));
    setSelectedPrestamo(null);
    toast({
      title: messages.material.devoluciones.devolucionRegistrada,
      description: messages.material.devoluciones.materialDevuelto,
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  const formatearFecha = (fecha: Date | any): string => {
    if (fecha instanceof Date) {
      return fecha.toLocaleDateString();
    } else if (fecha && typeof fecha.toDate === 'function') {
      return fecha.toDate().toLocaleDateString();
    }
    return messages.prestamos.errorCargar;
  };

  return (
    <DashboardLayout title={messages.material.devoluciones.titulo}>
      <Container maxW="1200px" py={6}>
        <HStack mb={6} spacing={4}>
          <IconButton
            icon={<ArrowBackIcon />}
            aria-label={messages.actions.back}
            onClick={() => navigate(-1)}
          />
        </HStack>
        
        <Divider mb={6} />
        
        {loading ? (
          <Center py={10}>
            <Spinner size="xl" color="brand.500" />
          </Center>
        ) : error ? (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        ) : prestamos.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            {messages.material.devoluciones.sinPendientes}
          </Alert>
        ) : (
          <Box>
            <Text mb={4}>
              {messages.material.devoluciones.seleccionaMaterial}
            </Text>
            
            <List spacing={3}>
              {prestamos.map(prestamo => (
                <ListItem
                  key={prestamo.id}
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  _hover={{ bg: "gray.50" }}
                >
                  <HStack justify="space-between">
                    <Box>
                      <HStack>
                        <Heading size="sm">{prestamo.nombreMaterial}</Heading>
                        <Badge colorScheme="blue">{prestamo.cantidadPrestada} unidad(es)</Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        {messages.formularios.prestamo?.fechaPrestamo || "Préstamo"}: {formatearFecha(prestamo.fechaPrestamo)}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {messages.formularios.prestamo?.fechaDevolucionPrevista || "Devolución prevista"}: {formatearFecha(prestamo.fechaDevolucionPrevista)}
                      </Text>
                      {prestamo.nombreActividad ? (
                        <Text fontSize="sm">Actividad: {prestamo.nombreActividad}</Text>
                      ) : (
                        <Text fontSize="sm">{messages.formularios.prestamo.sinActividad}</Text>
                      )}
                    </Box>
                    <IconButton
                      icon={<ViewIcon />}
                      aria-label={messages.material.devoluciones.registrar}
                      colorScheme="brand"
                      onClick={() => handleOpenDevolucion(prestamo)}
                    />
                  </HStack>
                </ListItem>
              ))}
            </List>
          </Box>
        )}      </Container>
      
      {/* Modal de devolución avanzada */}
      {selectedPrestamo && (
        <DevolucionAvanzadaForm
          isOpen={isOpen}
          onClose={onClose}
          prestamo={selectedPrestamo}
          onSuccess={handleDevolucionSuccess}
        />
      )}
    </DashboardLayout>
  );
};

export default DevolucionMaterialPage;