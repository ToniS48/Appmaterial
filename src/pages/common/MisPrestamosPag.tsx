import React, { useState, useEffect } from 'react';
import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td, 
  Button, Badge, useToast, AlertDialog,
  AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
  AlertDialogContent, AlertDialogOverlay, useDisclosure
} from '@chakra-ui/react';
import { FiCheckSquare } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { listarPrestamos, registrarDevolucion } from '../../services/prestamoService';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { Prestamo } from '../../types/prestamo';
import messages from '../../constants/messages';

const MisPrestamosPag: React.FC = () => {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<Prestamo | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const { userProfile } = useAuth();

  // Cargar préstamos del usuario actual
  useEffect(() => {
    const cargarMisPrestamos = async () => {
      if (!userProfile) return;
      
      try {
        setIsLoading(true);
        // Filtrar por préstamos del usuario actual que estén activos
        const misPrestamosEnUso = await listarPrestamos({ 
          usuarioId: userProfile.uid,
          estados: ['en_uso', 'pendiente']  // Cambiamos 'estado' por 'estados' para el servicio
        });
        setPrestamos(misPrestamosEnUso);
      } catch (error) {
        console.error('Error al cargar préstamos:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar tus préstamos',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    cargarMisPrestamos();
  }, [userProfile]);

  // Manejar la solicitud de devolución
  const handleSolicitarDevolucion = (prestamo: Prestamo) => {
    setPrestamoSeleccionado(prestamo);
    onOpen();
  };

  // Confirmar devolución
  const confirmarDevolucion = async () => {
    if (!prestamoSeleccionado) return;
    
    try {
      await registrarDevolucion(prestamoSeleccionado.id as string);
      
      toast({
        title: messages.prestamos.devolucionRegistrada,
        description: `Has registrado la devolución de ${prestamoSeleccionado.nombreMaterial}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Actualizar lista de préstamos
      setPrestamos(prestamos.filter(p => p.id !== prestamoSeleccionado.id));
      onClose();
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

  // Renderizar estado del préstamo
  const renderEstado = (estado: string) => {
    let colorScheme = '';
    switch (estado) {
      case 'en_uso': colorScheme = 'blue'; break;
      case 'pendiente': colorScheme = 'orange'; break;
      default: colorScheme = 'gray';
    }
    return <Badge colorScheme={colorScheme}>{estado.replace('_', ' ')}</Badge>;
  };

  return (
    <DashboardLayout title="Mis Préstamos">
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white">
        <Heading size="md" mb={4}>Material que tengo en préstamo</Heading>
        
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Material</Th>
              <Th>Fecha préstamo</Th>
              <Th>Fecha devolución prevista</Th>
              <Th>Estado</Th>
              <Th>Cantidad</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {prestamos.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center">No tienes préstamos activos</Td>
              </Tr>
            ) : (
              prestamos.map(prestamo => (
                <Tr key={prestamo.id}>
                  <Td>{prestamo.nombreMaterial}</Td>
                  <Td>{prestamo.fechaPrestamo instanceof Date ? 
                        prestamo.fechaPrestamo.toLocaleDateString() : 
                        prestamo.fechaPrestamo.toDate().toLocaleDateString()}</Td>
                  <Td>{prestamo.fechaDevolucionPrevista instanceof Date ? 
                        prestamo.fechaDevolucionPrevista.toLocaleDateString() : 
                        prestamo.fechaDevolucionPrevista.toDate().toLocaleDateString()}</Td>
                  <Td>{renderEstado(prestamo.estado)}</Td>
                  <Td>{prestamo.cantidadPrestada}</Td>
                  <Td>
                    <Button
                      size="xs"
                      colorScheme="green"
                      leftIcon={<FiCheckSquare />}
                      onClick={() => handleSolicitarDevolucion(prestamo)}
                    >
                      Devolver
                    </Button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Diálogo de confirmación */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmar devolución
            </AlertDialogHeader>

            <AlertDialogBody>
              ¿Estás seguro de que quieres registrar la devolución de este material? 
              Esta acción notificará a los responsables para que revisen el material.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancelar
              </Button>
              <Button colorScheme="green" onClick={confirmarDevolucion} ml={3}>
                Confirmar devolución
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default MisPrestamosPag;