import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Flex,
  Spinner,
  Text,
  Select,
  Input,
  FormControl,
  FormLabel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast
} from '@chakra-ui/react';
import { FiEdit, FiCheck, FiPlus, FiSearch } from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { listarPrestamos, registrarDevolucion } from '../../services/prestamoService';
import { Prestamo, EstadoPrestamo } from '../../types/prestamo';
import { RolUsuario } from '../../types/usuario';
import PrestamoForm from './PrestamoForm';
import DashboardLayout from '../layouts/DashboardLayout';
import messages from '../../constants/messages';

interface PrestamosDashboardProps {
  rol: RolUsuario; // 'admin' o 'vocal'
  titulo?: string;
}

const PrestamosDashboard: React.FC<PrestamosDashboardProps> = ({ rol, titulo }) => {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<Prestamo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const toast = useToast();

  // Modales y diálogos
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDevolucionOpen, onOpen: onDevolucionOpen, onClose: onDevolucionClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Cargar préstamos
  const cargarPrestamos = async () => {
    setIsLoading(true);
    try {
      const filtros: any = {};
      if (filtroEstado) filtros.estado = filtroEstado;
      
      const data = await listarPrestamos(filtros);
      
      // Filtrar por texto de búsqueda si hay algo
      let prestamosFiltrados = data;
      if (filtroBusqueda.trim()) {
        const busqueda = filtroBusqueda.toLowerCase();
        prestamosFiltrados = data.filter(
          p => p.nombreMaterial.toLowerCase().includes(busqueda) || 
               p.nombreUsuario.toLowerCase().includes(busqueda) ||
               (p.nombreActividad && p.nombreActividad.toLowerCase().includes(busqueda))
        );
      }
      
      setPrestamos(prestamosFiltrados);
    } catch (error) {
      console.error('Error al cargar préstamos:', error);
      toast({
        title: messages.errors.general,
        description: messages.prestamos.errorCargar,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Agrupar préstamos por actividad
  const agruparPrestamosPorActividad = (prestamos: Prestamo[]) => {
    const grupos: { [key: string]: { actividad: string | null; prestamos: Prestamo[] } } = {};
    
    prestamos.forEach(prestamo => {
      const actividadId = prestamo.actividadId || 'sin_actividad';
      const nombreActividad = prestamo.nombreActividad || 'Sin actividad asociada';
      
      if (!grupos[actividadId]) {
        grupos[actividadId] = {
          actividad: nombreActividad,
          prestamos: []
        };
      }
      
      grupos[actividadId].prestamos.push(prestamo);
    });
    
    return Object.values(grupos);
  };

  // Efectos para cargar datos
  useEffect(() => {
    cargarPrestamos();
  }, [filtroEstado]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      cargarPrestamos();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [filtroBusqueda]);

  // Manejar registro de devolución
  const handleDevolucion = async () => {
    if (!prestamoSeleccionado) return;
    
    try {
      await registrarDevolucion(prestamoSeleccionado.id as string);
      onDevolucionClose();
      toast({
        title: messages.prestamos.devolucionRegistrada,
        description: messages.prestamos.devolucionRegistradaDesc.replace('{nombre}', prestamoSeleccionado.nombreMaterial),
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      cargarPrestamos();
    } catch (error) {
      console.error('Error al registrar devolución:', error);
      toast({
        title: messages.prestamos.errorDevolucion,
        description: messages.prestamos.errorDevolucionDesc,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Renderizar el estado del préstamo con un Badge colorido
  const renderEstadoBadge = (estado: EstadoPrestamo) => {
    let color = '';
    switch (estado) {
      case 'en_uso':
        color = 'blue';
        break;
      case 'devuelto':
        color = 'green';
        break;
      case 'pendiente':
        color = 'orange';
        break;
      case 'perdido':
        color = 'red';
        break;
      case 'estropeado':
        color = 'purple';
        break;
      default:
        color = 'gray';
    }
    
    return <Badge colorScheme={color}>{estado.replace('_', ' ')}</Badge>;
  };

  // Formatear fecha para mostrar
  const formatFecha = (fecha: Date | any) => {
    if (!fecha) return 'N/A';
    
    const fechaObj = fecha instanceof Date ? fecha : fecha.toDate();
    return format(fechaObj, 'dd/MM/yyyy', { locale: es });
  };
  return (
    <DashboardLayout title={titulo || messages.prestamos.tituloPagina}>      <Box py={5} px={3}>
        <Flex justify="flex-end" align="center" mb={6}>
          <Button 
            leftIcon={<FiPlus />} 
            colorScheme={rol === 'admin' ? 'brand' : 'blue'}
            onClick={() => {
              setPrestamoSeleccionado(null);
              onFormOpen();
            }}
          >
            {messages.prestamos.nuevoPrestamo}
          </Button>
        </Flex>

        {/* Filtros */}
        <Flex 
          mb={6} 
          direction={{ base: 'column', md: 'row' }} 
          gap={4}
          align={{ base: 'stretch', md: 'flex-end' }}
        >
          <FormControl maxW={{ base: '100%', md: '200px' }}>
            <FormLabel>{messages.prestamos.filtroPorEstado}</FormLabel>
            <Select 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)}
              placeholder={messages.prestamos.estadosTodos}
            >
              <option value="en_uso">En uso</option>
              <option value="pendiente">Pendiente</option>
              <option value="devuelto">Devuelto</option>
              <option value="perdido">Perdido</option>
              <option value="estropeado">Estropeado</option>
            </Select>
          </FormControl>

          <FormControl maxW={{ base: '100%', md: '300px' }}>
            <FormLabel>{messages.prestamos.buscar}</FormLabel>
            <Flex>
              <Input 
                placeholder="Buscar por material, usuario..." 
                value={filtroBusqueda} 
                onChange={(e) => setFiltroBusqueda(e.target.value)}
              />
              <IconButton 
                ml={2}
                aria-label={messages.prestamos.buscar}
                icon={<FiSearch />} 
                onClick={() => cargarPrestamos()}
              />
            </Flex>
          </FormControl>
        </Flex>

        {/* Tabla de préstamos */}
        {isLoading ? (
          <Flex justify="center" align="center" height="200px">
            <Spinner size="xl" />
          </Flex>
        ) : prestamos.length === 0 ? (
          <Box textAlign="center" p={10}>
            <Text fontSize="lg">{messages.prestamos.sinResultados}</Text>
          </Box>
        ) : (
          <Box>
            {agruparPrestamosPorActividad(prestamos).map((grupo, index) => (
              <Box key={index} mb={8}>
                <Heading size="md" mb={2} p={2} bg="gray.50" borderRadius="md">
                  {grupo.actividad}
                </Heading>
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          Material
                        </Th>
                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          Usuario
                        </Th>
                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          F. Préstamo
                        </Th>
                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          F. Devolución
                        </Th>
                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          Estado
                        </Th>
                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          Cantidad
                        </Th>
                        <Th 
                          bg={rol === 'admin' ? 'brand.50' : 'blue.50'} 
                          color={rol === 'admin' ? 'brand.700' : 'blue.700'}
                          fontWeight="bold"
                        >
                          Acciones
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {grupo.prestamos.map((prestamo) => (
                        <Tr key={prestamo.id}>
                          <Td>{prestamo.nombreMaterial}</Td>
                          <Td>{prestamo.nombreUsuario}</Td>
                          <Td>{formatFecha(prestamo.fechaPrestamo)}</Td>
                          <Td>{prestamo.fechaDevolucion ? formatFecha(prestamo.fechaDevolucion) : formatFecha(prestamo.fechaDevolucionPrevista) + ' (prevista)'}</Td>
                          <Td>{renderEstadoBadge(prestamo.estado)}</Td>
                          <Td>{prestamo.cantidadPrestada}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                size="sm"
                                aria-label={messages.prestamos.editar}
                                icon={<FiEdit />}
                                onClick={() => {
                                  setPrestamoSeleccionado(prestamo);
                                  onFormOpen();
                                }}
                              />
                              {prestamo.estado !== 'devuelto' && (
                                <IconButton
                                  size="sm"
                                  colorScheme="green"
                                  aria-label={messages.prestamos.registrarDevolucion}
                                  icon={<FiCheck />}
                                  onClick={() => {
                                    setPrestamoSeleccionado(prestamo);
                                    onDevolucionOpen();
                                  }}
                                />
                              )}
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Modal para crear/editar préstamo */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {prestamoSeleccionado ? messages.prestamos.editar : messages.prestamos.nuevo}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <PrestamoForm
              prestamo={prestamoSeleccionado || undefined}
              onSuccess={() => {
                onFormClose();
                cargarPrestamos();
              }}
              onCancel={onFormClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Diálogo de confirmación para devolución */}
      <AlertDialog
        isOpen={isDevolucionOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDevolucionClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {messages.prestamos.registrarDevolucion}
            </AlertDialogHeader>

            <AlertDialogBody>
              {messages.prestamos.confirmarDevolucion}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDevolucionClose}>
                {messages.prestamos.cancelar}
              </Button>
              <Button colorScheme="green" onClick={handleDevolucion} ml={3}>
                {messages.prestamos.confirmar}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default PrestamosDashboard;