/**
 * Ejemplo de uso del componente EstadisticasActividadesCard
 * 
 * Este archivo muestra diferentes formas de usar la card de estadísticas
 * de actividades en tu aplicación.
 */
import React from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  Heading,
  Text
} from '@chakra-ui/react';
import EstadisticasActividadesCard from './EstadisticasActividadesCard';

const EjemploUsoEstadisticasCard: React.FC = () => {
  return (
    <VStack spacing={8} p={6}>
      <Heading>Ejemplos de Uso - Estadísticas de Actividades</Heading>
      
      {/* Ejemplo 1: Card completa en dashboard */}
      <Box w="100%">
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          1. Card completa para dashboard principal
        </Text>
        <Box maxW="500px">
          <EstadisticasActividadesCard
            añoSeleccionado={2024}
            compacto={false}
            mostrarTendencias={true}
          />
        </Box>
      </Box>

      {/* Ejemplo 2: Versión compacta */}
      <Box w="100%">
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          2. Versión compacta para sidebar o espacios reducidos
        </Text>
        <Box maxW="300px">
          <EstadisticasActividadesCard
            añoSeleccionado={2024}
            compacto={true}
            mostrarTendencias={false}
          />
        </Box>
      </Box>

      {/* Ejemplo 3: Múltiples cards en grid */}
      <Box w="100%">
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          3. Múltiples años en grid para comparación
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          <EstadisticasActividadesCard
            añoSeleccionado={2024}
            compacto={true}
            mostrarTendencias={true}
          />
          <EstadisticasActividadesCard
            añoSeleccionado={2023}
            compacto={true}
            mostrarTendencias={true}
          />
          <EstadisticasActividadesCard
            añoSeleccionado={2022}
            compacto={true}
            mostrarTendencias={true}
          />
        </SimpleGrid>
      </Box>

      {/* Instrucciones de integración */}
      <Box w="100%" bg="gray.50" p={4} borderRadius="md">
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          Cómo integrar en tu aplicación:
        </Text>
        <VStack align="start" spacing={2}>
          <Text fontSize="sm">
            <strong>1. Dashboard principal:</strong> Usa la versión completa con tendencias
          </Text>
          <Text fontSize="sm">
            <strong>2. Sidebar o widgets:</strong> Usa la versión compacta
          </Text>
          <Text fontSize="sm">
            <strong>3. Páginas de estadísticas:</strong> Combina múltiples cards para comparar años
          </Text>
          <Text fontSize="sm">
            <strong>4. Modal detallado:</strong> La card incluye un botón "Ver detalles" que abre las estadísticas completas
          </Text>
        </VStack>
      </Box>
    </VStack>
  );
};

export default EjemploUsoEstadisticasCard;
