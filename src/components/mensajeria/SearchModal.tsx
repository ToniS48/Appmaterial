import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  VStack,
  Text,
  Box,
  HStack,
  Badge,
  IconButton,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { useMensajeria } from '../../contexts/MensajeriaContext';
import { Mensaje, Conversacion } from '../../types/mensaje';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageSelect: (mensaje: Mensaje, conversacion: Conversacion) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onMessageSelect,
}) => {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<{
    mensaje: Mensaje;
    conversacion: Conversacion;
  }[]>([]);
  const [loading, setLoading] = useState(false);

  const { buscarEnMensajes, conversaciones } = useMensajeria();
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  const handleSearch = async () => {
    if (!query.trim()) return;    setLoading(true);
    try {
      const mensajes = await buscarEnMensajes({
        busqueda: query,
        conversacionId: undefined, // Sin filtro de conversación por ahora
        tipo: undefined, // Sin filtro de tipo por ahora
        fechaDesde: undefined,
        fechaHasta: undefined
      });
      const resultadosConConversacion = mensajes
        .map((mensaje: Mensaje) => {
          const conversacion = conversaciones.find(c => c.id === mensaje.conversacionId);
          return conversacion ? { mensaje, conversacion } : null;
        })
        .filter(Boolean) as { mensaje: Mensaje; conversacion: Conversacion }[];
      
      setResultados(resultadosConConversacion);
    } catch (error) {
      console.error('Error buscando mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const resetSearch = () => {
    setQuery('');
    setResultados([]);
  };

  const handleClose = () => {
    resetSearch();
    onClose();
  };

  const handleMessageClick = (mensaje: Mensaje, conversacion: Conversacion) => {
    onMessageSelect(mensaje, conversacion);
    handleClose();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <Text as="span" key={index} bg="yellow.200" color="black">
          {part}
        </Text>
      ) : (
        part
      )
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="80vh">
        <ModalHeader>Buscar Mensajes</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <HStack>
              <Input
                placeholder="Buscar en mensajes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <IconButton
                aria-label="Buscar"
                icon={<SearchIcon />}
                onClick={handleSearch}
                isLoading={loading}
                colorScheme="blue"
              />
              {query && (
                <IconButton
                  aria-label="Limpiar"
                  icon={<CloseIcon />}
                  onClick={resetSearch}
                  size="sm"
                />
              )}
            </HStack>

            {loading && (
              <Box textAlign="center" py={4}>
                <Spinner />
                <Text mt={2}>Buscando...</Text>
              </Box>
            )}

            {!loading && resultados.length === 0 && query && (
              <Box textAlign="center" py={4}>
                <Text color="gray.500">No se encontraron mensajes</Text>
              </Box>
            )}

            {!loading && resultados.length > 0 && (
              <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
                {resultados.map(({ mensaje, conversacion }, index) => (
                  <Box
                    key={`${mensaje.id}-${index}`}
                    p={3}
                    bg={bgColor}
                    borderRadius="md"
                    border="1px"
                    borderColor="gray.200"
                    cursor="pointer"
                    _hover={{ bg: hoverBgColor }}
                    onClick={() => handleMessageClick(mensaje, conversacion)}
                  >
                    <VStack align="start" spacing={2}>
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="medium" fontSize="sm">
                          {conversacion.nombre}
                        </Text>
                        <Badge
                          colorScheme={
                            conversacion.tipo === 'privada' ? 'blue' :
                            conversacion.tipo === 'grupo' ? 'green' :
                            conversacion.tipo === 'actividad' ? 'orange' : 'purple'
                          }
                          size="sm"
                        >
                          {conversacion.tipo}
                        </Badge>
                      </HStack>
                      
                      <Text fontSize="sm" noOfLines={2}>
                        {mensaje.tipo === 'texto' && highlightText(
                          truncateText(mensaje.contenido, 100),
                          query
                        )}
                        {mensaje.tipo === 'archivo' && (
                          <Text as="span" fontStyle="italic">
                            📎 {mensaje.archivoNombre}
                          </Text>
                        )}
                        {mensaje.tipo === 'imagen' && (
                          <Text as="span" fontStyle="italic">
                            🖼️ Imagen: {mensaje.archivoNombre}
                          </Text>
                        )}
                        {mensaje.tipo === 'enlace' && (
                          <Text as="span" fontStyle="italic">
                            🔗 Enlace
                          </Text>
                        )}
                      </Text>
                      
                      <HStack justify="space-between" w="full">
                        <Text fontSize="xs" color="gray.500">
                          Por: {mensaje.remitenteNombre}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {formatDistanceToNow(mensaje.fechaEnvio instanceof Date ? mensaje.fechaEnvio : mensaje.fechaEnvio.toDate(), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={handleClose}>Cerrar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
