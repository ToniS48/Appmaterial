import React, { useEffect, useState } from 'react';
import {
  Box,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
} from '@chakra-ui/react';
import { MessagingInterface } from '../components/mensajeria/MessagingInterface';
import { MensajeriaProvider } from '../contexts/MensajeriaContext';
import { useAuth } from '../contexts/AuthContext';
import { Usuario } from '../types/usuario';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import DashboardLayout from '../components/layouts/DashboardLayout';

const MensajeriaPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { currentUser, userProfile } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const cargarUsuarios = async () => {
      if (!currentUser || !userProfile) return;

      try {
        setLoading(true);
        let usuariosQuery;        // Filtrar usuarios según el rol (filtros menos restrictivos)
        switch (userProfile.rol) {
          case 'admin':
            // Admin puede ver todos los usuarios activos
            usuariosQuery = query(collection(db, 'usuarios'));
            break;
          case 'vocal':
            // Vocal puede ver todos los usuarios
            usuariosQuery = query(collection(db, 'usuarios'));
            break;
          case 'socio':
            // Socio puede ver TODOS los usuarios (incluyendo invitados)
            usuariosQuery = query(collection(db, 'usuarios'));
            break;
          case 'invitado':
            // Invitado puede ver a todos excepto otros invitados
            usuariosQuery = query(
              collection(db, 'usuarios'),
              where('rol', 'in', ['admin', 'vocal', 'socio'])
            );
            break;
          default:
            // Por defecto, mostrar todos los usuarios
            usuariosQuery = query(collection(db, 'usuarios'));
        }        const snapshot = await getDocs(usuariosQuery);
        const todosLosUsuarios = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as Usuario));
        
        const usuariosData = todosLosUsuarios.filter(usuario => {
          // Filtrar usuarios eliminados y el usuario actual
          return usuario.uid !== currentUser.uid && !usuario.eliminado;
        });        console.log('✅ Mensajería cargada:', usuariosData.length, 'usuarios disponibles');
        
        if (usuariosData.length === 0) {
          console.log('⚠️ NO HAY USUARIOS DISPONIBLES - Posibles causas:');
          console.log('   1. No hay usuarios en la base de datos');
          console.log('   2. Todos los usuarios están marcados como eliminados');
          console.log('   3. El filtro de roles es demasiado restrictivo');
        }

        setUsuarios(usuariosData);
      } catch (err) {
        console.error('Error cargando usuarios:', err);
        setError('Error al cargar la lista de usuarios');
        toast({
          title: 'Error',
          description: 'No se pudo cargar la lista de usuarios',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    cargarUsuarios();
  }, [currentUser, userProfile, toast]);
  if (!currentUser) {
    return (
      <DashboardLayout title="Mensajería">
        <Box p={8} textAlign="center">
          <Alert status="warning">
            <AlertIcon />
            <AlertTitle>Acceso Requerido</AlertTitle>
            <AlertDescription>
              Necesitas iniciar sesión para acceder a la mensajería.
            </AlertDescription>
          </Alert>
        </Box>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout title="Mensajería">
        <Box
          h="60vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="xl" />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Mensajería">
        <Box p={8}>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Mensajería">
      <MensajeriaProvider>
        <MessagingInterface usuarios={usuarios} />
      </MensajeriaProvider>
    </DashboardLayout>
  );
};

export default MensajeriaPage;
