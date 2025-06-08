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
        let usuariosQuery;        // Filtrar usuarios según el rol
        switch (userProfile.rol) {
          case 'admin':
            // Admin puede ver todos los usuarios
            usuariosQuery = query(collection(db, 'usuarios'));
            break;
          case 'vocal':
            // Vocal puede ver socios y otros vocales
            usuariosQuery = query(
              collection(db, 'usuarios'),
              where('rol', 'in', ['socio', 'vocal', 'admin'])
            );
            break;
          case 'socio':
            // Socio puede ver otros socios y vocales
            usuariosQuery = query(
              collection(db, 'usuarios'),
              where('rol', 'in', ['socio', 'vocal'])
            );
            break;
          case 'invitado':
            // Invitado solo puede ver a quien le da acceso (se maneja en el contexto)
            usuariosQuery = query(
              collection(db, 'usuarios'),
              where('rol', 'in', ['vocal', 'admin'])
            );
            break;
          default:
            usuariosQuery = query(collection(db, 'usuarios'));
        }

        const snapshot = await getDocs(usuariosQuery);
        const usuariosData = snapshot.docs
          .map(doc => ({
            uid: doc.id,
            ...doc.data()
          } as Usuario))
          .filter(usuario => usuario.uid !== currentUser.uid); // Excluir al usuario actual

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
