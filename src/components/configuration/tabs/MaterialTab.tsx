import React, { useState } from 'react';
import {
  Box,
  VStack,
  Alert,
  AlertIcon,
  Text,
  TabPanel,
  Card,
  CardBody,
  Heading,
  Divider,
  Collapse,
  HStack,  IconButton,
  Spinner
} from '@chakra-ui/react';
import { FiChevronDown, FiChevronRight, FiFileText } from 'react-icons/fi';
import { useUnifiedConfig } from '../../../hooks/configuration/useUnifiedConfig';
import { guardarConfiguracionGeneral } from '../../../services/configuracionService';
import { ConfigSettings } from '../../../types/configuration';
import MaterialManagementSection from '../sections/Material/MaterialManagementSection';
import DropdownsTab from './DropdownsTab';

interface MaterialTabProps {
  userRole: 'admin' | 'vocal';
}

// Asegúrate de que el objeto de configuración de MaterialTab tenga la estructura de ConfigSettings
const defaultMaterialConfig = {
  porcentajeStockMinimo: 10,
  diasRevisionPeriodica: 90,
  tiempoMinimoEntrePrestamos: 0,
  diasAntelacionRevision: 15,
  diasGraciaDevolucion: 0,
  diasMaximoRetraso: 0,
  diasBloqueoPorRetraso: 0,
  diasMinimoAntelacionCreacion: 0,
  diasMaximoModificacion: 0,
  limiteParticipantesPorDefecto: 0,
  penalizacionRetraso: 0,
  bonificacionDevolucionTemprana: 0,
  umbraLinactividadUsuario: 0,
  diasHistorialReportes: 0,
  limiteElementosExportacion: 0
};

/**
 * Pestaña de Gestión de Material
 * Contiene configuraciones específicas para el manejo de material del club
 */
const MaterialTab: React.FC<MaterialTabProps> = ({ userRole }) => {
  const { data: material, setData: setMaterial, loading, save } = useUnifiedConfig('material', defaultMaterialConfig);
  const [showInfo, setShowInfo] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  // Función wrapper para compatibilidad de tipos
  const saveWrapper = async (data: any) => {
    await save(data);
  };

  const handleVariableChange = (key: string, value: any) => {
    setMaterial((prev: any) => ({
      ...prev,
      variables: {
        ...prev.variables,
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    await save(material);
  };

  if (loading) {
    return (
      <VStack spacing={4} p={6} align="center">
        <Spinner size="lg" color="blue.500" />
        <Text color="gray.600">Cargando configuración de material...</Text>
      </VStack>
    );
  }

  return (
    <TabPanel>
      <VStack spacing={8} align="stretch">
        {/* Banner informativo general colapsable */}
        <Alert status="info" cursor="pointer" p={0}>
          <Box w="100%">
            <HStack px={4} py={2} userSelect="none">
              <AlertIcon />
              <Text fontWeight="bold" flex={1} onClick={() => setShowInfo((v) => !v)} _hover={{ textDecoration: 'underline' }}>
                Configuración de Material
              </Text>
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
                  Gestiona los parámetros específicos para el material del club, incluyendo stock mínimo, revisiones periódicas y tiempo entre préstamos. Las configuraciones detalladas de formularios de material están disponibles en la sección inferior (solo para administradores).
                </Text>
              </Box>
            </Collapse>
          </Box>
        </Alert>

        {/* Configuración de Stock y Mantenimiento */}
        <MaterialManagementSection config={material} setConfig={setMaterial} save={saveWrapper} />

        {/* Formularios Material - Solo para administradores */}
        {userRole === 'admin' && (
          <>
            <Divider />
            <Card>
              <CardBody>
                <Heading size="sm" mb={4} color="orange.600" display="flex" alignItems="center">
                  <FiFileText style={{ marginRight: 8 }} />
                  Formularios Material
                </Heading>
                {/* Banner de advertencia colapsable solo para admins */}
                <Alert status="warning" cursor="pointer" p={0}>
                  <Box w="100%">
                    <HStack px={4} py={2} userSelect="none">
                      <AlertIcon />
                      <Text fontWeight="bold" flex={1} onClick={() => setShowWarning((v) => !v)} _hover={{ textDecoration: 'underline' }}>
                        Atención: Solo administradores
                      </Text>
                      <IconButton
                        aria-label={showWarning ? 'Ocultar advertencia' : 'Mostrar advertencia'}
                        icon={showWarning ? <FiChevronDown /> : <FiChevronRight />}
                        size="sm"
                        variant="ghost"
                        tabIndex={-1}
                        pointerEvents="none"
                      />
                    </HStack>
                    <Collapse in={showWarning} animateOpacity>
                      <Box px={4} pb={3}>
                        <Text fontSize="sm">
                          Esta sección permite configurar los formularios dinámicos para la gestión de material. Solo los administradores pueden modificar estos parámetros.
                        </Text>
                      </Box>
                    </Collapse>
                  </Box>
                </Alert>
                {/* Integrar el componente DropdownsTab aquí */}
                <DropdownsTab userRole={userRole} />
              </CardBody>
            </Card>
          </>
        )}
      </VStack>
    </TabPanel>
  );
};

export default MaterialTab;
