import React from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import PerfilForm from '../../components/usuarios/PerfilForm';
import { Box, Container } from '@chakra-ui/react';
import { useAuth } from '../../contexts/AuthContext';

const PerfilPage: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <DashboardLayout title="Mi Perfil">
      <Container maxW="container.md" py={5}>
        <PerfilForm />
      </Container>
    </DashboardLayout>
  );
};

export default PerfilPage;