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
}

// Componente AccessCard optimizado
export const AccessCard: React.FC<AccessCardProps> = React.memo(({ 
  title, 
  icon, 
  to, 
  description, 
  colorScheme = "brand" 
}) => {
  try {
    return (
      <RouterLink to={to} style={{ textDecoration: 'none' }}>
        <Card
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          transition="all 0.2s"
          height="100%"
          _hover={{
            transform: 'translateY(-5px)',
            boxShadow: 'lg',
            borderColor: `${colorScheme}.500`,
            cursor: 'pointer'
          }}
        >
          <CardBody>
            <Flex direction="column" alignItems="flex-start" h="100%">              <Box
                p={2}
                borderRadius="md"
                bg={`${colorScheme}.100`}
                color={`${colorScheme}.700`}
                mb={3}
              >
                <Icon as={icon as React.ElementType} boxSize={6} />
              </Box>
              <Heading size="md" mb={2}>
                {title}
              </Heading>
              <Text color="gray.600" fontSize="sm">
                {description}
              </Text>
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
  colorScheme: string = "brand"
): JSX.Element {
  return (
    <AccessCard 
      title={title}
      icon={icon}
      to={to}
      description={description}
      colorScheme={colorScheme}
    />
  );
}
