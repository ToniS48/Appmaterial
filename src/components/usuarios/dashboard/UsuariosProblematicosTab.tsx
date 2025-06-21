/**
 * UsuariosProblematicosTab - Componente para mostrar usuarios con problemas
 */
import React from 'react';
import {
  Box,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Alert,
  AlertIcon,
  VStack,
  Button,
  useToast,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { FiAlertTriangle, FiEye } from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { UsuarioProblematico } from '../../../types/usuarioHistorial';

interface UsuariosProblematicosTabProps {
  usuarios: UsuarioProblematico[];
  cargando: boolean;
  onVerDetalle?: (usuario: UsuarioProblematico) => void;
  onCorregir?: (usuario: UsuarioProblematico) => void;
}

const UsuariosProblematicosTab: React.FC<UsuariosProblematicosTabProps> = ({
  usuarios,
  cargando,
  onVerDetalle,
  onCorregir
}) => {
  const toast = useToast();

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critico':
        return 'red';
      case 'alto':
        return 'orange';
      case 'medio':
        return 'yellow';
      case 'bajo':
        return 'green';
      default:
        return 'gray';
    }
  };

  const formatearFecha = (timestamp: any) => {
    if (!timestamp) return 'Sin fecha';
    try {
      const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(fecha, 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const handleCorregir = async (usuario: UsuarioProblematico) => {
    try {
      if (onCorregir) {
        await onCorregir(usuario);
        toast({
          title: "Corrección aplicada",
          description: `Se aplicó la corrección para ${usuario.nombreUsuario}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error en corrección",
        description: "No se pudo aplicar la corrección",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (cargando) {
    return (
      <Box textAlign="center" py={8}>
        <Text>Cargando usuarios problemáticos...</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="lg" fontWeight="bold">
        Usuarios Problemáticos
      </Text>
      
      {usuarios.length === 0 ? (
        <Alert status="success">
          <AlertIcon />
          No se encontraron usuarios con problemas
        </Alert>
      ) : (
        <>
          <Alert status="warning">
            <AlertIcon />
            Se encontraron {usuarios.length} usuarios con problemas que requieren atención
          </Alert>
          
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Usuario</Th>
                  <Th>Problema</Th>
                  <Th>Severidad</Th>
                  <Th>Última Actividad</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {usuarios.map((usuario, index) => (
                  <Tr key={usuario.usuarioId || index}>
                    <Td>
                      <Box>                        <Text fontWeight="medium">{usuario.nombreUsuario}</Text>
                        <Text fontSize="sm" color="gray.500">{usuario.emailUsuario}</Text>
                      </Box>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {Object.keys(usuario.tiposEventos).map(tipo => `${tipo}: ${usuario.tiposEventos[tipo as keyof typeof usuario.tiposEventos]}`).join(', ')}
                      </Text>
                    </Td>
                    <Td>
                      <Badge                        colorScheme={getSeverityColor(usuario.gravedad)}
                      >
                        {usuario.gravedad || 'No especificada'}
                      </Badge>
                    </Td>
                    <Td>{formatearFecha(usuario.ultimoEvento)}</Td>
                    <Td>
                      <Box display="flex" gap={2}>
                        {onVerDetalle && (
                          <Tooltip label="Ver detalles">
                            <IconButton
                              aria-label="Ver detalles"
                              icon={<FiEye />}
                              size="sm"
                              variant="outline"
                              onClick={() => onVerDetalle(usuario)}
                            />
                          </Tooltip>
                        )}
                        {onCorregir && (
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleCorregir(usuario)}
                          >
                            Corregir
                          </Button>
                        )}
                      </Box>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </>
      )}
    </VStack>
  );
};

export default UsuariosProblematicosTab;
