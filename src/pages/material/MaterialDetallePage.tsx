import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import {
  Box,
  Heading,
  Text,
  Badge,
  SimpleGrid,
  Divider,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Stack,
  VStack,
  Button
} from '@chakra-ui/react';
import { obtenerMaterial } from '../../services/materialService';
import DashboardLayout from '../../components/layouts/DashboardLayout';

const MaterialDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const cargarMaterial = async () => {
      try {
        if (!id) {
          setError('ID de material no proporcionado');
          setLoading(false);
          return;
        }
        
        const materialData = await obtenerMaterial(id);
        setMaterial(materialData);
      } catch (error) {
        console.error('Error al cargar el material:', error);
        setError('No se pudo cargar la información del material');
      } finally {
        setLoading(false);
      }
    };
    
    cargarMaterial();
  }, [id]);
  
  const getEstadoColor = (estado: string) => {
    const estadosColores: Record<string, string> = {
      'disponible': 'green',
      'prestado': 'orange',
      'mantenimiento': 'blue',
      'baja': 'gray',
      'perdido': 'red'
    };
    
    return estadosColores[estado] || 'gray';
  };
  
  return (
    <DashboardLayout title="Detalle del Material">
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white">
        {loading ? (
          <Center p={10}>
            <Spinner size="xl" color="brand.500" />
          </Center>
        ) : error ? (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        ) : material ? (
          <VStack align="stretch" spacing={6}>
            <Box>
              <Heading size="lg" mb={2}>{material.nombre}</Heading>
              <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                <Badge colorScheme={material.tipo === 'cuerda' ? 'blue' : 
                        material.tipo === 'anclaje' ? 'orange' : 'purple'} p={1} fontSize="sm">
                  {material.tipo === 'cuerda' ? 'Cuerda' : 
                   material.tipo === 'anclaje' ? 'Anclaje' : 'Material Varios'}
                </Badge>
                <Badge colorScheme={getEstadoColor(material.estado)} p={1} fontSize="sm">
                  {material.estado.charAt(0).toUpperCase() + material.estado.slice(1)}
                </Badge>
                <Badge variant="outline" p={1} fontSize="sm">{material.codigo || 'Sin código'}</Badge>
              </Stack>
            </Box>
            
            <Divider />
            
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontWeight="bold">Fecha de adquisición:</Text>
                <Text>{material.fechaAdquisicion instanceof Timestamp ? new Date(material.fechaAdquisicion.toDate()).toLocaleDateString() : new Date(material.fechaAdquisicion).toLocaleDateString()}</Text>
              </Box>
              
              <Box>
                <Text fontWeight="bold">Última revisión:</Text>
                <Text>{material.fechaUltimaRevision instanceof Timestamp ? new Date(material.fechaUltimaRevision.toDate()).toLocaleDateString() : new Date(material.fechaUltimaRevision).toLocaleDateString()}</Text>
              </Box>
              
              <Box>
                <Text fontWeight="bold">Próxima revisión:</Text>
                <Text>{material.proximaRevision instanceof Timestamp ? new Date(material.proximaRevision.toDate()).toLocaleDateString() : new Date(material.proximaRevision).toLocaleDateString()}</Text>
              </Box>
              
              {material.tipo === 'cuerda' && (
                <>
                  <Box>
                    <Text fontWeight="bold">Longitud:</Text>
                    <Text>{material.longitud} metros</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">Diámetro:</Text>
                    <Text>{material.diametro} mm</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">Tipo de cuerda:</Text>
                    <Text>{material.tipoCuerda}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold">Número de usos:</Text>
                    <Text>{material.usos || 0}</Text>
                  </Box>
                </>
              )}
            </SimpleGrid>
            
            {material.observaciones && (
              <>
                <Divider />
                <Box>
                  <Text fontWeight="bold">Observaciones:</Text>
                  <Text>{material.observaciones}</Text>
                </Box>
              </>
            )}
            
            <Divider />
            
            <Box pt={2}>
              <Button colorScheme="brand" size="sm">
                Registrar uso
              </Button>
            </Box>
          </VStack>
        ) : (
          <Alert status="warning">
            <AlertIcon />
            No se encontró información para este material
          </Alert>
        )}
      </Box>
    </DashboardLayout>
  );
};

export default MaterialDetallePage;