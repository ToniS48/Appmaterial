import React, { useEffect, useState } from 'react';
import { Box, Text, Heading, Badge, Code, VStack, IconButton } from '@chakra-ui/react';
import { FiX } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

// Extender la interfaz Performance para incluir la propiedad memory (específica de Chrome)
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: MemoryInfo;
}

declare global {
  interface Window {
    performance: ExtendedPerformance;
  }
}

// Este componente se puede agregar temporalmente para diagnóstico
const DebugHelper: React.FC = () => {
  const { userProfile, loading: authLoading } = useAuth();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [renderCount, setRenderCount] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState<string>('No disponible');
  
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    
    // Actualizar el uso de memoria de manera segura
    try {
      if (window.performance && window.performance.memory) {
        const usedMB = Math.round(window.performance.memory.usedJSHeapSize / 1048576);
        setMemoryUsage(`${usedMB} MB`);
      }
    } catch (e) {
      console.log('Métricas de memoria no disponibles');
    }
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <Box
      position="fixed"
      bottom="20px"
      right="20px"
      bg="gray.800"
      color="white"
      p={3}
      borderRadius="md"
      boxShadow="lg"
      maxW="300px"
      zIndex={9999}
    >
      <IconButton
        icon={<FiX />}
        aria-label="Cerrar"
        size="xs"
        colorScheme="red"
        position="absolute"
        top={2}
        right={2}
        onClick={() => setIsVisible(false)}
      />
      <Heading size="xs" mb={2}>Debug Info</Heading>
      <VStack align="start" spacing={1} fontSize="xs">
        <Text>Ruta: <Badge>{location.pathname}</Badge></Text>
        <Text>Rol: <Badge colorScheme="green">{userProfile?.rol || 'sin rol'}</Badge></Text>
        <Text>Auth cargando: <Badge>{authLoading ? 'Sí' : 'No'}</Badge></Text>
        <Text>Renderizados: <Badge>{renderCount}</Badge></Text>
        <Text>Memory: <Badge>{memoryUsage}</Badge></Text>
      </VStack>
    </Box>
  );
};

export default DebugHelper;