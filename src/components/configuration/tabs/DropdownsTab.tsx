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
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import DropdownsSection from '../sections/Material/DropdownsSection';

interface DropdownsTabProps {
  userRole: 'admin' | 'vocal';
}

/**
 * Tab para gestionar las configuraciones de listas desplegables de material.
 * Ahora utiliza useConfigurationData para centralizar la gestión de configuración.
 */
const DropdownsTab: React.FC<DropdownsTabProps> = ({ userRole }) => {
  const [showInfo, setShowInfo] = useState(true);

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
                  La configuración se gestiona de forma centralizada a través del hook useConfigurationData.
                </Text>
              </Box>
            </Collapse>
          </Box>
        </Alert>

        <DropdownsSection userRole={userRole} />
      </VStack>
    </TabPanel>
  );
};

export default DropdownsTab;
