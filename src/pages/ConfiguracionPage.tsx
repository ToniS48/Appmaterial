import React from 'react';
import { Box } from '@chakra-ui/react';
import ConfiguracionContent from './admin/ConfiguracionPage';

/**
 * Página de configuración - redirige al componente existente
 */
const ConfiguracionPage: React.FC = () => {
  return (
    <Box>
      <ConfiguracionContent />
    </Box>
  );
};

export default ConfiguracionPage;
