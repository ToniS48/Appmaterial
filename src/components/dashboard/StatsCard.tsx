import React from 'react';
import { Box, Stat, StatLabel, StatNumber, Flex, Icon, Text, Tooltip, HStack, VStack } from '@chakra-ui/react';

// Interfaz para cada elemento de estadística individual
interface StatItem {
  value: string | number;
  color: string;
  label: string;  // Para el tooltip
}

interface StatsCardProps {
  title: string;
  icon?: React.ElementType;
  colorScheme?: string;
  stats: StatItem[];
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  icon, 
  stats, 
  colorScheme = "brand" 
}) => {
  return (
    <Box 
      p={6}
      shadow="md" 
      borderWidth="1px" 
      borderRadius="md" 
      bg="white"
      maxW={{ base: "100%", md: "350px", lg: "400px" }}
      mx="auto"
      height="100%"
    >
      <Flex padding={1} paddingRight={5} align="center" justify="space-between">
        {/* Icono a la izquierda, bajado con margen superior */}
        {icon && (
          <Box
            color={`${colorScheme}.500`}
            mr={5}
            alignSelf="flex-start"
            mt={12}
            padding={4}
            paddingRight={8}
          >
            <Icon as={icon} w={10} h={10} />
          </Box>
        )}
        
        {/* Contenido principal */}
        <Box flex="1">
          <Stat>
            <StatLabel fontWeight="medium" fontSize="lg" mb={3}>
              {title}
            </StatLabel>
            
            {/* Estadísticas en columna con menos espaciado */}
            <VStack spacing={1} align="flex-start">
              {stats.map((stat, index) => (
                <Tooltip 
                  key={index} 
                  label={stat.label} 
                  hasArrow 
                  placement="top"
                >
                  <HStack 
                    spacing={3}
                    p={1}
                    borderRadius="md"
                    _hover={{ bg: "gray.50" }}
                    width="100%"
                  >
                    <StatNumber fontSize="lg" fontWeight="bold" color={stat.color} minW="40px">
                      {stat.value}
                    </StatNumber>
                    <Text fontSize="sm" color="gray.600" flex="1">
                      {stat.label}
                    </Text>
                  </HStack>
                </Tooltip>
              ))}
            </VStack>
          </Stat>
        </Box>
      </Flex>
    </Box>
  );
};

// Eliminar el componente App de ejemplo y exportar directamente StatsCard
export default StatsCard;