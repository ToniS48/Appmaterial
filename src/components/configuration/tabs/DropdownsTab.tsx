import React, { useState } from 'react';
import {
  Box,
  VStack,
  Alert,
  AlertIcon,
  Text,
  TabPanel,
  Collapse,
  HStack,
  IconButton,
  Button
} from '@chakra-ui/react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { ConfigSettings } from '../../../types/configuration';
import MaterialDropdownManagerFunctional from '../../admin/MaterialDropdownManagerFunctional';

interface DropdownsTabProps {
  settings: ConfigSettings;
  userRole: 'admin' | 'vocal';
  save: (data: ConfigSettings) => Promise<void>;
}

/**
 * Pestaña de Gestión de Formularios de Material
 * Solo disponible para administradores
 */
const DropdownsTab: React.FC<DropdownsTabProps> = ({
  settings,
  userRole,
  save
}) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(true);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await save(settings);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  if (userRole !== 'admin') {
    return null;
  }

  return (
    <TabPanel>
      <VStack spacing={8} align="stretch">
        <Alert status="info" cursor="pointer" p={0}>
          <Box w="100%">
            <HStack
              px={4} py={2}
              onClick={() => setShowInfo((v) => !v)}
              _hover={{ bg: 'gray.50' }}
              userSelect="none"
            >
              <AlertIcon />
              <Text fontWeight="bold" flex={1}>Gestión de Formularios de Material</Text>
              <IconButton
                aria-label={showInfo ? 'Ocultar info' : 'Mostrar info'}
                icon={showInfo ? <FiChevronDown /> : <FiChevronRight />}
                size="sm"
                variant="ghost"
                tabIndex={-1}
                pointerEvents="none"
              />
            </HStack>
            <Collapse in={showInfo} animateOpacity>
              <Box px={4} pb={3}>
                <Text>
                  Administra las categorías, marcas, estados y otros campos desplegables utilizados en los formularios de material del sistema.
                </Text>
              </Box>
            </Collapse>
          </Box>
        </Alert>

        <MaterialDropdownManagerFunctional />
        {/* Eliminado el botón Guardar duplicado */}
        {error && <Text color="red.500" mt={2}>{error}</Text>}
        {success && <Text color="green.500" mt={2}>¡Guardado correctamente!</Text>}
      </VStack>
    </TabPanel>
  );
};

export default DropdownsTab;
