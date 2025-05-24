import React from 'react';
import { HStack, Button, Spacer } from '@chakra-ui/react';
import { FiArrowLeft, FiArrowRight, FiSave, FiX } from 'react-icons/fi';

interface ActividadFormNavigationProps {
  activeTabIndex: number;
  totalTabs: number;
  isSubmitting: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onCancel: () => void;
}

export const ActividadFormNavigation: React.FC<ActividadFormNavigationProps> = ({
  activeTabIndex,
  totalTabs,
  isSubmitting,
  onNext,
  onPrevious,
  onCancel
}) => {
  return (
    <HStack justifyContent="space-between" mt={4}>
      <Button 
        leftIcon={<FiX />}
        variant="outline" 
        colorScheme="red"
        onClick={onCancel}
      >
        Cancelar
      </Button>

      {activeTabIndex > 0 && (
        <Button onClick={onPrevious} leftIcon={<FiArrowLeft />}>
          Anterior
        </Button>
      )}
      
      <Spacer />
      
      {activeTabIndex < totalTabs - 1 ? (
        <Button 
          colorScheme="brand" 
          onClick={onNext}
          rightIcon={<FiArrowRight />}
          isLoading={isSubmitting}
        >
          Siguiente
        </Button>
      ) : (
        <Button 
          colorScheme="green" 
          onClick={onNext}
          isLoading={isSubmitting}
          leftIcon={<FiSave />}
        >
          Guardar Actividad
        </Button>
      )}
    </HStack>
  );
};
