import React from 'react';
import { Box, IconButton, Badge, ResponsiveValue } from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';

// Actualizamos la interfaz para incluir iconSize
interface NotificacionBadgeProps {
  onClick?: () => void;
  count?: number;
  iconSize?: ResponsiveValue<string>; // Nueva propiedad para controlar el tamaño del icono
}

const NotificacionBadge: React.FC<NotificacionBadgeProps> = ({ 
  onClick, 
  count = 0,
  iconSize = { base: "20px", md: "20px" } // Valor predeterminado
}) => {  const hasNotifications = count > 0;

  return (
    <Box position="relative" display="inline-block">
      <IconButton
        aria-label="Notificaciones"
        icon={<BellIcon boxSize={iconSize} />}
        onClick={onClick}
        variant="ghost"
        size={{ base: "lg", md: "md" }}
      />
      {hasNotifications && (
        <Badge
          position="absolute"
          top="0"
          right="0"
          transform="translate(25%, -25%)"
          borderRadius="full"
          colorScheme="red"
          fontSize="0.8em"
        >
          {count > 9 ? '9+' : count}
        </Badge>
      )}
    </Box>
  );
};

export default NotificacionBadge;
