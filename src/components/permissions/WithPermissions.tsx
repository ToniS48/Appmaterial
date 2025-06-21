import React from 'react';
import {
  Box,
  Alert,
  AlertIcon,
  Text,
  Badge
} from '@chakra-ui/react';
import { usePermissions } from '../../hooks/permissions/usePermissions';
import { PermissionLevel } from '../../types/permissions';

interface WithPermissionsProps {
  section: string;
  subsection?: string;
  requiredLevel?: PermissionLevel;
  userRole: 'admin' | 'vocal' | 'usuario';
  children: React.ReactNode;
  fallbackMessage?: string;
  showReadOnlyBadge?: boolean;
}

/**
 * HOC que envuelve componentes con verificación de permisos
 */
const WithPermissions: React.FC<WithPermissionsProps> = ({
  section,
  subsection,
  requiredLevel = 'read',
  userRole,
  children,
  fallbackMessage,
  showReadOnlyBadge = true
}) => {
  const { hasPermission, canEdit } = usePermissions(userRole);

  // Verificar si tiene el permiso requerido
  const hasRequiredPermission = hasPermission(section, subsection, requiredLevel);
  
  // Verificar si puede editar (para mostrar badge de solo lectura)
  const canEditSection = canEdit(section, subsection);

  if (!hasRequiredPermission) {
    return (
      <Alert status="warning" variant="left-accent">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Acceso Restringido</Text>
          <Text fontSize="sm">
            {fallbackMessage || 
             `No tienes permisos para acceder a esta sección${subsection ? ` (${subsection})` : ''}.`}
          </Text>
        </Box>
      </Alert>
    );
  }

  return (
    <Box position="relative">
      {showReadOnlyBadge && !canEditSection && requiredLevel !== 'read' && (
        <Badge
          position="absolute"
          top="-8px"
          right="0"
          colorScheme="orange"
          variant="solid"
          fontSize="xs"
          zIndex={1}
        >
          Solo Lectura
        </Badge>
      )}
      {children}
    </Box>
  );
};

export default WithPermissions;
