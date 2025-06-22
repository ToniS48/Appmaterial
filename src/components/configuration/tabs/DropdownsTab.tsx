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
  IconButton
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { ConfigSettings } from '../../../types/configuration';
import MaterialDropdownManagerFunctional from '../../admin/MaterialDropdownManagerFunctional';

interface DropdownsTabProps {
  settings: ConfigSettings;
  userRole: 'admin' | 'vocal';
}

/**
 * Pestaña de Gestión de Formularios de Material
 * Solo disponible para administradores
 */
const DropdownsTab: React.FC<DropdownsTabProps> = ({
  settings,
  userRole
}) => {
  // El hook debe ir siempre antes de cualquier return o condicional
  const [showInfo, setShowInfo] = useState(true);

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
                icon={showInfo ? <ChevronDownIcon /> : <ChevronRightIcon />}
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
      </VStack>
    </TabPanel>
  );
};

export default DropdownsTab;
