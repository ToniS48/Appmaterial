import React from 'react';
import { Alert, Center, Spinner } from '@chakra-ui/react';
import DashboardLayout from '../layouts/DashboardLayout';

interface ActividadFormStatusProps {
  loading?: boolean;
  error?: string | null;
  successMessage?: string | null;
  title: string;
  children?: React.ReactNode;
}

export const ActividadFormStatus: React.FC<ActividadFormStatusProps> = ({
  loading,
  error,
  successMessage,
  title,
  children
}) => {
  if (loading) {
    return (
      <DashboardLayout title={title}>
        <Center>
          <Spinner size="lg" />
        </Center>
      </DashboardLayout>
    );
  }

  if (error && !children) {
    return (
      <DashboardLayout title={title}>
        <Alert status="error">{error}</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={title}>
      {children}
      {error && <Alert status="error" mt={4}>{error}</Alert>}
      {successMessage && <Alert status="success" mt={4}>{successMessage}</Alert>}
    </DashboardLayout>
  );
};
