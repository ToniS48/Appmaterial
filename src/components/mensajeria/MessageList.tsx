import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  VStack,
  Spinner,
  Center,
  Text,
  Divider,
  useColorModeValue,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { format, isSameDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import MessageBubble from './MessageBubble';
import { Mensaje } from '../../types/mensaje';
import { useMensajeria } from '../../contexts/MensajeriaContext';

interface MessageListProps {
  conversacionId: string;
  height?: string;
  onResponderMensaje?: (mensaje: Mensaje) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  conversacionId,
  height = "400px",
  onResponderMensaje
}) => {
  const { mensajes, cargandoMensajes, error } = useMensajeria();
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Referencias
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
    // Colores del tema
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const dividerColor = useColorModeValue('gray.300', 'gray.600');
  const dateColor = useColorModeValue('gray.600', 'gray.400');
  const scrollbarThumbColor = useColorModeValue('#CBD5E0', '#4A5568');
  const scrollbarThumbHoverColor = useColorModeValue('#A0AEC0', '#2D3748');

  // Función para agrupar mensajes por fecha
  const agruparMensajesPorFecha = (mensajes: Mensaje[]) => {
    const grupos: { [fecha: string]: Mensaje[] } = {};
    
    mensajes.forEach(mensaje => {
      const fecha = startOfDay(mensaje.fechaEnvio instanceof Date ? mensaje.fechaEnvio : mensaje.fechaEnvio.toDate()).toISOString();
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(mensaje);
    });
    
    return grupos;
  };  // Función para determinar si dos mensajes son consecutivos
  const sonMensajesConsecutivos = (mensajeAnterior: Mensaje | null, mensajeActual: Mensaje): boolean => {
    if (!mensajeAnterior) return false;
    
    const tiempoAnterior = (mensajeAnterior.fechaEnvio instanceof Date ? mensajeAnterior.fechaEnvio : mensajeAnterior.fechaEnvio.toDate()).getTime();
    const tiempoActual = (mensajeActual.fechaEnvio instanceof Date ? mensajeActual.fechaEnvio : mensajeActual.fechaEnvio.toDate()).getTime();
    const diferencia = tiempoActual - tiempoAnterior;
    
    // Consideramos consecutivos si son del mismo autor y hay menos de 5 minutos de diferencia
    return mensajeAnterior.remitenteId === mensajeActual.remitenteId && diferencia < 5 * 60 * 1000;
  };

  // Función para hacer scroll al final
  const scrollToBottom = () => {
    if (bottomRef.current && autoScroll) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Manejar scroll del usuario
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setAutoScroll(isNearBottom);
  };

  // Hacer scroll al recibir mensajes nuevos
  useEffect(() => {
    if (mensajes.length > 0) {
      scrollToBottom();
    }
  }, [mensajes, autoScroll]);

  // Formatear fecha para los divisores
  const formatearFechaDivisor = (fecha: Date) => {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    
    if (isSameDay(fecha, hoy)) {
      return 'Hoy';
    } else if (isSameDay(fecha, ayer)) {
      return 'Ayer';
    } else {
      return format(fecha, "EEEE, d 'de' MMMM", { locale: es });
    }
  };

  if (cargandoMensajes) {
    return (
      <Center height={height} bg={bgColor}>
        <VStack spacing={3}>
          <Spinner size="lg" color="brand.500" />
          <Text color="gray.500">Cargando mensajes...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center height={height} bg={bgColor} p={4}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Center>
    );
  }

  if (mensajes.length === 0) {
    return (
      <Center height={height} bg={bgColor}>
        <VStack spacing={3}>
          <Text color="gray.500" fontSize="lg">
            No hay mensajes aún
          </Text>
          <Text color="gray.400" fontSize="sm" textAlign="center">
            Sé el primero en enviar un mensaje en esta conversación
          </Text>
        </VStack>
      </Center>
    );
  }

  const gruposPorFecha = agruparMensajesPorFecha(mensajes);

  return (
    <Box
      height={height}
      bg={bgColor}
      position="relative"
      overflow="hidden"
    >
      <Box
        ref={scrollRef}
        height="100%"
        overflowY="auto"
        onScroll={handleScroll}        css={{
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: scrollbarThumbColor,
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: scrollbarThumbHoverColor,
          },
        }}
      >
        <VStack spacing={0} align="stretch" pb={4}>
          {Object.entries(gruposPorFecha)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([fechaISO, mensajesDia]) => {
              const fecha = new Date(fechaISO);
              
              return (
                <Box key={fechaISO}>
                  {/* Divisor de fecha */}
                  <Box position="relative" my={4}>
                    <Divider borderColor={dividerColor} />
                    <Box
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      bg={bgColor}
                      px={3}
                      py={1}
                      borderRadius="full"
                      border="1px solid"
                      borderColor={dividerColor}
                    >
                      <Text
                        fontSize="xs"
                        color={dateColor}
                        fontWeight="medium"
                        textTransform="capitalize"
                      >
                        {formatearFechaDivisor(fecha)}
                      </Text>
                    </Box>
                  </Box>

                  {/* Mensajes del día */}
                  {mensajesDia.map((mensaje, index) => {
                    const mensajeAnterior = index > 0 ? mensajesDia[index - 1] : null;
                    const esConsecutivo = sonMensajesConsecutivos(mensajeAnterior, mensaje);
                    
                    return (
                      <MessageBubble
                        key={mensaje.id}
                        mensaje={mensaje}
                        mostrarAvatar={!esConsecutivo}
                        mostrarFecha={!esConsecutivo}
                        esConsecutivo={esConsecutivo}
                        onResponder={onResponderMensaje}
                      />
                    );
                  })}
                </Box>
              );
            })}
          
          {/* Elemento para hacer scroll al final */}
          <div ref={bottomRef} />
        </VStack>
      </Box>

      {/* Botón flotante para ir al final (cuando no hay auto-scroll) */}
      {!autoScroll && (
        <Box
          position="absolute"
          bottom={4}
          right={4}
          bg="brand.500"
          color="white"
          borderRadius="full"
          p={2}
          cursor="pointer"
          boxShadow="lg"
          onClick={() => {
            setAutoScroll(true);
            scrollToBottom();
          }}
          _hover={{ bg: 'brand.600' }}
        >
          <Text fontSize="xs">↓</Text>
        </Box>
      )}
    </Box>
  );
};

export default MessageList;
