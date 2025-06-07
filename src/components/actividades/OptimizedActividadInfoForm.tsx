import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Box, Spinner, Center } from '@chakra-ui/react';

// Lazy load del formulario para reducir el bundle inicial
const ActividadInfoForm = lazy(() => 
  import('./ActividadInfoForm').then(module => ({ default: module.ActividadInfoForm }))
);

interface OptimizedActividadInfoFormProps {
  onCancel?: () => void;
  isActive?: boolean;
}

export const OptimizedActividadInfoForm: React.FC<OptimizedActividadInfoFormProps> = ({ 
  onCancel, 
  isActive = true 
}) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Diferir el renderizado del formulario hasta después del primer render
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, 50); // Pequeño delay para permitir que la UI se estabilice

      return () => clearTimeout(timer);
    } else {
      setShouldRender(false);
    }
  }, [isActive]);

  if (!shouldRender) {
    return (
      <Center minH="200px">
        <Spinner size="lg" color="brand.500" />
      </Center>
    );
  }

  return (
    <Suspense 
      fallback={
        <Center minH="200px">
          <Spinner size="lg" color="brand.500" />
        </Center>
      }
    >
      <ActividadInfoForm onCancel={onCancel} />
    </Suspense>
  );
};

export default OptimizedActividadInfoForm;
