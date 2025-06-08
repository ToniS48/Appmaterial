import React from 'react';
import { Card, CardBody, Flex, Box, Heading, Text, Icon } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { IconType } from 'react-icons';
import { safeLog } from './performanceUtils';

// Props interface para el componente AccessCard
interface AccessCardProps {
  title: string;
  icon: IconType;
  to: string;
  description: string;
  colorScheme?: string;
  statValue?: string | number;
  statLabel?: string;
}

// Componente AccessCard optimizado
export const AccessCard: React.FC<AccessCardProps> = React.memo(({ 
  title, 
  icon, 
  to, 
  description, 
  colorScheme = "brand",
  statValue,
  statLabel
}) => {
  try {
    return (      <RouterLink to={to} style={{ textDecoration: 'none' }}>
        <Card
          borderWidth="1px"
          borderRadius="xl"
          overflow="hidden"
          transition="all 0.3s ease"
          height="100%"
          shadow="md"
          bg="white"
          _hover={{
            transform: 'translateY(-8px)',
            shadow: '2xl',
            borderColor: `${colorScheme}.400`,
            cursor: 'pointer',
            bg: `${colorScheme}.50`
          }}>          <CardBody>
            <Flex 
              direction="column" 
              h="100%" 
              justifyContent="space-between"
            >
              {/* Sección superior: Icono + Título + Descripción */}              <Flex alignItems="flex-start" mb={3} w="100%">
                <Box
                  p={2}
                  borderRadius="md"
                  color={`${colorScheme}.700`}
                  mr={3}
                  flexShrink={0}
                >
                  <Icon as={icon as React.ElementType} boxSize={8} />
                </Box>
                <Box flex="1">
                  <Heading size="md" mb={1} lineHeight="1.2">
                    {title}
                  </Heading>
                  <Text color="gray.600" fontSize="sm" lineHeight="1.3">
                    {description}
                  </Text>
                </Box>
              </Flex>
              
              {/* Sección inferior: Estadísticas */}
              {statValue !== undefined && (
                <Box textAlign="center" w="100%" mt="auto">
                  <Text fontSize="2xl" fontWeight="bold" color={`${colorScheme}.600`}>
                    {statValue}
                  </Text>
                  {statLabel && (
                    <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                      {statLabel}
                    </Text>
                  )}
                </Box>
              )}
            </Flex>
          </CardBody>
        </Card>
      </RouterLink>
    );
  } catch (err) {
    safeLog(`Error al renderizar tarjeta ${title}:`, err);
    return (
      <Card borderWidth="1px" borderRadius="lg" borderColor="red.300" height="100%">
        <CardBody>
          <Text color="red.500">Error al cargar {title}</Text>
        </CardBody>
      </Card>
    );
  }
});

AccessCard.displayName = 'AccessCard';

// Función helper que devuelve JSX directamente
export function renderAccessCard(
  title: string, 
  icon: IconType, 
  to: string, 
  description: string, 
  colorScheme: string = "brand",
  statValue?: string | number,
  statLabel?: string
): JSX.Element {
  return (
    <AccessCard 
      title={title}
      icon={icon}
      to={to}
      description={description}
      colorScheme={colorScheme}
      statValue={statValue}
      statLabel={statLabel}
    />
  );
}
