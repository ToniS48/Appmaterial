import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  CardBody,
  Text,
  Box,
  Badge,
  Divider,
  Flex,
  Button,
  IconButton
} from '@chakra-ui/react';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { MaterialItem } from './types';

interface MaterialCardProps {
  material: MaterialItem;
  disponibilidadReal: number;
  handleAddMaterial: (id: string, qty: number) => void;
  cardBg?: string;
  borderColor?: string;
  messages: any; // Mensajes i18n
}

/**
 * Componente de tarjeta para mostrar información de un material
 * Optimizado para minimizar re-renders
 */
const MaterialCard = React.memo(({ 
  material, 
  disponibilidadReal, 
  handleAddMaterial, 
  cardBg, 
  borderColor,
  messages 
}: MaterialCardProps) => {
  // Usar React.useRef para trackear la disponibilidad anterior y detectar cambios
  const prevDisponibilidadRef = useRef(disponibilidadReal);
  
  // Inicializar con cantidad 1, siempre que haya al menos 1 disponible
  const [qty, setQty] = useState(disponibilidadReal > 0 ? 1 : 0);
  
  // Ajustar automáticamente la cantidad cuando cambia la disponibilidad
  useEffect(() => {
    // Solo actuar si la disponibilidad ha cambiado desde el último render
    if (prevDisponibilidadRef.current !== disponibilidadReal) {
      // console.log(`Disponibilidad de ${material.nombre} cambió: ${prevDisponibilidadRef.current} -> ${disponibilidadReal}`);
      
      if (disponibilidadReal === 0) {
        // Si no hay disponibles, forzar a 0
        setQty(0);
      } else if (qty > disponibilidadReal) {
        // Si hay menos disponibles que la cantidad seleccionada, ajustar
        setQty(disponibilidadReal);
      } else if (qty === 0 && disponibilidadReal > 0) {
        // Si había 0 seleccionado pero ahora hay disponibles, seleccionar 1
        setQty(1);
      }
      
      // Actualizar la referencia para el próximo render
      prevDisponibilidadRef.current = disponibilidadReal;
    }
  }, [disponibilidadReal, qty, material.nombre]);
  // Optimizar handlers para evitar violaciones de tiempo
  const handleDecrease = useCallback(() => {
    requestAnimationFrame(() => {
      setQty(prev => Math.max(1, prev - 1));
    });
  }, []);
  
  const handleIncrease = useCallback(() => {
    requestAnimationFrame(() => {
      setQty(prev => Math.min(disponibilidadReal, prev + 1));
    });
  }, [disponibilidadReal]);
  
  const handleAdd = useCallback(() => {
    // Usar setTimeout para evitar bloquear el hilo principal
    setTimeout(() => {
      handleAddMaterial(material.id, qty);
    }, 0);
  }, [material.id, qty, handleAddMaterial]);
  
  return (
    <Card 
      variant="outline" 
      size="sm" 
      borderWidth="1px" 
      borderRadius="md" 
      _hover={{ borderColor: "brand.300", shadow: "sm" }}
      bg={disponibilidadReal === 0 ? "gray.50" : cardBg || "white"}
      borderColor={borderColor}
    >
      <CardBody p={3}>
        <Flex direction="column" justify="space-between" height="100%">
          <Box mb={2}>
            <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{material.nombre}</Text>
            {material.codigo && (
              <Text fontSize="xs" color="gray.500">Código: {material.codigo}</Text>
            )}
          </Box>
          
          <Flex justify="space-between" align="center" mt={2}>
            <Badge 
              colorScheme={
                material.tipo === 'cuerda' ? 'blue' : 
                material.tipo === 'anclaje' ? 'orange' : 'purple'
              }
              fontSize="xs"
            >
              {material.tipo === 'cuerda' ? 'Cuerda' : 
               material.tipo === 'anclaje' ? 'Anclaje' : 'Varios'}
            </Badge>
            <Text 
              fontSize="xs" 
              fontWeight="medium"
              color={disponibilidadReal === 0 ? "red.600" : 
                    disponibilidadReal < 5 ? "orange.600" : "green.600"}
            >
              {disponibilidadReal} {disponibilidadReal === 1 ? 
                messages.material.selector.disponible : 
                messages.material.selector.disponibles}
            </Text>
          </Flex>
          
          <Divider my={2} />
          
          <Flex justify="space-between" align="center" mt={2}>
            <Flex align="center">
              <IconButton 
                aria-label="Decrementar" 
                icon={<FiMinus />} 
                size="xs"
                variant="outline"
                isDisabled={qty <= 1}
                onClick={handleDecrease}
              />
              <Text mx={2} fontSize="sm" fontWeight="bold">{qty}</Text>
              <IconButton 
                aria-label="Incrementar" 
                icon={<FiPlus />} 
                size="xs"
                variant="outline"
                isDisabled={qty >= disponibilidadReal}
                onClick={handleIncrease}
              />
            </Flex>
            <Button 
              size="sm"
              colorScheme="brand"
              isDisabled={disponibilidadReal <= 0 || qty <= 0}
              onClick={handleAdd}
            >
              {messages.material.selector.botonAnadir}
            </Button>
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
});

// Agregar displayName para debugging
MaterialCard.displayName = 'MaterialCard';

export default MaterialCard;
