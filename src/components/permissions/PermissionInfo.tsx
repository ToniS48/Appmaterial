import React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  Text,
  Badge,
  HStack,
  List,
  ListItem,
  ListIcon,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { CheckCircleIcon, InfoIcon, LockIcon } from '@chakra-ui/icons';

interface PermissionInfoProps {
  userRole: 'admin' | 'vocal' | 'usuario';
}

/**
 * Componente informativo sobre el sistema de permisos
 */
const PermissionInfo: React.FC<PermissionInfoProps> = ({ userRole }) => {
  const roleInfo = {
    admin: {
      label: 'Administrador',
      color: 'purple',
      description: 'Acceso completo a todas las configuraciones del sistema.',
      permissions: [
        'Gestión completa de variables del sistema',
        'Configuración de APIs y servicios externos',
        'Gestión de seguridad y backups',
        'Administración de permisos de vocales',
        'Acceso al visor del sistema',
        'Gestión de formularios de material'
      ]
    },
    vocal: {
      label: 'Vocal',
      color: 'blue',
      description: 'Acceso limitado según configuración de permisos.',
      permissions: [
        'Edición de variables básicas del sistema',
        'Configuración de material y stock',
        'Lectura de configuraciones de reportes',
        'Enlaces de Google Drive (si permitido)',
        'Configuraciones de actividades'
      ]
    },
    usuario: {
      label: 'Usuario',
      color: 'gray',
      description: 'Sin acceso a configuraciones del sistema.',
      permissions: [
        'Solo acceso a funciones de usuario básico',
        'Sin permisos de configuración'
      ]
    }
  };

  const info = roleInfo[userRole];

  return (
    <Card variant="outline">
      <CardHeader>
        <HStack>
          <LockIcon color={`${info.color}.500`} />
          <Heading size="sm">Sistema de Permisos</Heading>
          <Badge colorScheme={info.color}>{info.label}</Badge>
        </HStack>
      </CardHeader>
      
      <CardBody>
        <VStack spacing={4} align="stretch">
          <Text fontSize="sm" color="gray.600">
            {info.description}
          </Text>

          <Alert status="info" size="sm">
            <AlertIcon />
            <Text fontSize="sm">
              Los permisos pueden ser personalizados por los administradores 
              para cada sección específica.
            </Text>
          </Alert>

          <VStack align="stretch" spacing={2}>
            <Text fontWeight="semibold" fontSize="sm">
              Permisos disponibles para tu rol:
            </Text>
            <List spacing={1}>
              {info.permissions.map((permission, index) => (
                <ListItem key={index} fontSize="sm">
                  <ListIcon as={CheckCircleIcon} color={`${info.color}.500`} />
                  {permission}
                </ListItem>
              ))}
            </List>
          </VStack>

          {userRole === 'vocal' && (
            <Alert status="info" size="sm">
              <InfoIcon />
              <Text fontSize="sm">
                Si necesitas acceso adicional a alguna sección, contacta con un administrador.
              </Text>
            </Alert>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default PermissionInfo;
