import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Heading, Text, Spinner, Center, Alert, AlertIcon,
  Button, Stack, Card, CardBody, SimpleGrid, Flex,
  Badge, Container, Divider, IconButton, Tooltip,
  useToast
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { obtenerActividad } from '../../services/actividadService';
import { Actividad } from '../../types/actividad';
import PrestamoForm from '../../components/prestamos/PrestamoForm';

const ActividadMaterialPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
    
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!id) {
        setError('Identificador de actividad no válido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const actividadData = await obtenerActividad(id);
        setActividad(actividadData);
      } catch (error) {
        console.error('Error al cargar la actividad:', error);
        setError('No se pudo cargar la información de la actividad');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id]);

  const handlePrestamoSuccess = () => {
    toast({
      title: "Préstamo creado",
      description: "El material ha sido correctamente asignado a la actividad",
      status: "success",
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <DashboardLayout title="Gestión de Material">
      <Container maxW="1200px" py={6}>
        {loading ? (
          <Center py={10}>
            <Spinner size="xl" color="brand.500" />
          </Center>
        ) : error ? (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        ) : actividad ? (
          <Box>
            <Flex mb={6} align="center">
              <IconButton
                icon={<ArrowBackIcon />}
                aria-label="Volver"
                mr={4}
                onClick={() => navigate(`/activities/${id}`)}
              />
              <Box>
                <Heading size="lg">{actividad.nombre}</Heading>
                <Text color="gray.600">Gestión de material para esta actividad</Text>
              </Box>
            </Flex>

            <Divider mb={6} />

            <PrestamoForm
              preselectedActividadId={id}
              onSuccess={handlePrestamoSuccess}
              onCancel={() => navigate(`/activities/${id}`)}
            />
          </Box>
        ) : (
          <Alert status="error">
            <AlertIcon />
            No se encontró la actividad
          </Alert>
        )}
      </Container>
    </DashboardLayout>
  );
};

export default ActividadMaterialPage;