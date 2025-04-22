import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Text, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Button, HStack, useToast, Select, Flex,
  Modal, ModalOverlay, ModalContent, ModalHeader, 
  ModalCloseButton, ModalBody, ModalFooter,
  FormControl, FormLabel, Textarea,
  Alert, AlertIcon, Spinner, Tooltip, IconButton
} from '@chakra-ui/react';
import { 
  FiEye, FiCheckCircle, FiAlertCircle, FiHelpCircle,
  FiClock, FiRefreshCw, FiCalendar, FiUser, FiLink
} from 'react-icons/fi';
import { collection, query, orderBy, getDocs, doc, updateDoc, Timestamp, where, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Interfaz para nuestros reportes
interface Reporte {
  id?: string;
  mensaje: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
  ruta: string;
  fechaCreacion: Timestamp;
  estado: 'pendiente' | 'en-proceso' | 'resuelto' | 'cerrado';
  respuesta?: string;
  fechaActualizacion?: Timestamp;
}

const GestionReportes: React.FC = () => {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [reporteSeleccionado, setReporteSeleccionado] = useState<Reporte | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [respuesta, setRespuesta] = useState<string>('');
  const [estadoActualizar, setEstadoActualizar] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  
  const toast = useToast();

  // Cargar reportes
  useEffect(() => {
    cargarReportes();
  }, [filtroEstado]);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let q;
      if (filtroEstado === 'todos') {
        q = query(collection(db, 'reportes_errores'), orderBy('fechaCreacion', 'desc'));
      } else {
        q = query(
          collection(db, 'reportes_errores'), 
          where('estado', '==', filtroEstado),
          orderBy('fechaCreacion', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const reportesList: Reporte[] = [];
      
      querySnapshot.forEach((doc) => {
        reportesList.push({
          id: doc.id,
          ...doc.data() as Omit<Reporte, 'id'>
        });
      });
      
      setReportes(reportesList);
    } catch (err) {
      console.error('Error al cargar reportes:', err);
      setError('No se pudieron cargar los reportes. Inténtalo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Ver detalles de un reporte
  const verDetalles = (reporte: Reporte) => {
    setReporteSeleccionado(reporte);
    setRespuesta(reporte.respuesta || '');
    setEstadoActualizar(reporte.estado);
    setIsModalOpen(true);
  };

  // Actualizar estado y respuesta del reporte
  const actualizarReporte = async () => {
    if (!reporteSeleccionado?.id) return;
    
    try {
      setIsUpdating(true);
      
      const reporteRef = doc(db, 'reportes_errores', reporteSeleccionado.id);
      await updateDoc(reporteRef, {
        estado: estadoActualizar,
        respuesta: respuesta.trim() !== '' ? respuesta : null,
        fechaActualizacion: Timestamp.now()
      });
      
      toast({
        title: 'Reporte actualizado',
        description: 'El reporte ha sido actualizado correctamente',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Actualizar el reporte en la lista local
      setReportes(reportes.map(r => 
        r.id === reporteSeleccionado.id 
          ? {...r, estado: estadoActualizar as any, respuesta, fechaActualizacion: Timestamp.now()} 
          : r
      ));
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error al actualizar reporte:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el reporte',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Eliminar un reporte (solo mostrado para reportes cerrados)
  const eliminarReporte = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este reporte? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'reportes_errores', id));
      setReportes(reportes.filter(r => r.id !== id));
      toast({
        title: 'Reporte eliminado',
        description: 'El reporte ha sido eliminado correctamente',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el reporte',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Obtener color del badge según estado
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'red';
      case 'en-proceso': return 'orange';
      case 'resuelto': return 'green';
      case 'cerrado': return 'gray';
      default: return 'gray';
    }
  };

  // Obtener icono según estado
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente': return FiAlertCircle;
      case 'en-proceso': return FiClock;
      case 'resuelto': return FiCheckCircle;
      case 'cerrado': return FiHelpCircle;
      default: return FiHelpCircle;
    }
  };

  // Formatear fecha
  const formatFecha = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'N/A';
    return format(timestamp.toDate(), 'dd MMM yyyy, HH:mm', { locale: es });
  };

  // Acortar texto para mostrar en la tabla
  const acortarTexto = (texto: string, longitud: number = 50) => {
    if (texto.length <= longitud) return texto;
    return texto.substring(0, longitud) + '...';
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" mb={4}>Reportes de Errores y Sugerencias</Heading>
        <HStack>
          <Select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            width="200px"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="en-proceso">En proceso</option>
            <option value="resuelto">Resueltos</option>
            <option value="cerrado">Cerrados</option>
          </Select>
          <Button 
            leftIcon={<FiRefreshCw />} 
            onClick={cargarReportes}
            isLoading={loading}
          >
            Actualizar
          </Button>
        </HStack>
      </Flex>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {loading ? (
        <Flex justify="center" my={10}>
          <Spinner size="xl" />
        </Flex>
      ) : reportes.length === 0 ? (
        <Alert status="info" mb={4}>
          <AlertIcon />
          No se encontraron reportes {filtroEstado !== 'todos' ? `con estado "${filtroEstado}"` : ''}
        </Alert>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Estado</Th>
                <Th>Mensaje</Th>
                <Th>Usuario</Th>
                <Th>Fecha</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {reportes.map((reporte) => (
                <Tr key={reporte.id}>
                  <Td>
                    <Badge 
                      colorScheme={getEstadoColor(reporte.estado)}
                      display="flex"
                      alignItems="center"
                      px={2}
                      py={1}
                      borderRadius="md"
                      width="fit-content"
                    >
                      <Box as={getEstadoIcon(reporte.estado)} mr={1} />
                      {reporte.estado.charAt(0).toUpperCase() + reporte.estado.slice(1)}
                    </Badge>
                  </Td>
                  <Td maxW="300px" isTruncated>
                    <Tooltip label={reporte.mensaje}>
                      <Text>{acortarTexto(reporte.mensaje)}</Text>
                    </Tooltip>
                  </Td>
                  <Td>
                    <Tooltip label={reporte.usuario.email}>
                      <Text>{reporte.usuario.nombre}</Text>
                    </Tooltip>
                  </Td>
                  <Td>
                    <Tooltip label={formatFecha(reporte.fechaCreacion)}>
                      <Text>{format(reporte.fechaCreacion.toDate(), 'dd/MM/yyyy')}</Text>
                    </Tooltip>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        icon={<FiEye />}
                        aria-label="Ver detalles"
                        size="sm"
                        onClick={() => verDetalles(reporte)}
                      />
                      {reporte.estado === 'cerrado' && (
                        <IconButton
                          icon={<FiRefreshCw />}
                          aria-label="Eliminar reporte"
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => eliminarReporte(reporte.id!)}
                        />
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Modal de detalles del reporte */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detalles del reporte</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {reporteSeleccionado && (
              <>
                <Box mb={4} p={3} bg="gray.50" borderRadius="md">
                  <Text mb={2} fontWeight="bold">Mensaje:</Text>
                  <Text whiteSpace="pre-wrap">{reporteSeleccionado.mensaje}</Text>
                </Box>
                
                <Box mb={4}>
                  <HStack mb={2}>
                    <Box as={FiUser} />
                    <Text fontWeight="bold">Usuario:</Text>
                    <Text>{reporteSeleccionado.usuario.nombre} ({reporteSeleccionado.usuario.email})</Text>
                  </HStack>
                  
                  <HStack mb={2}>
                    <Box as={FiCalendar} />
                    <Text fontWeight="bold">Fecha:</Text>
                    <Text>{formatFecha(reporteSeleccionado.fechaCreacion)}</Text>
                  </HStack>
                  
                  <HStack mb={2}>
                    <Box as={FiLink} />
                    <Text fontWeight="bold">Ruta:</Text>
                    <Text>{reporteSeleccionado.ruta}</Text>
                  </HStack>
                </Box>
                
                <FormControl mb={4}>
                  <FormLabel>Estado:</FormLabel>
                  <Select 
                    value={estadoActualizar} 
                    onChange={(e) => setEstadoActualizar(e.target.value)}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en-proceso">En proceso</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="cerrado">Cerrado</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Respuesta / Notas:</FormLabel>
                  <Textarea
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder="Añade una respuesta o notas internas sobre este reporte..."
                    rows={4}
                  />
                </FormControl>
                
                {reporteSeleccionado.fechaActualizacion && (
                  <Text mt={2} fontSize="sm" color="gray.500">
                    Última actualización: {formatFecha(reporteSeleccionado.fechaActualizacion)}
                  </Text>
                )}
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button 
              colorScheme="brand" 
              mr={3} 
              onClick={actualizarReporte}
              isLoading={isUpdating}
            >
              Guardar cambios
            </Button>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default GestionReportes;