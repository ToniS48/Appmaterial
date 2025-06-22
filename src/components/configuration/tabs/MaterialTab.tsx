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
  FormControl,
  FormLabel,
  Select,
  SimpleGrid,
  Divider,
  Collapse,
  HStack,
  IconButton
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { ConfigSettings } from '../../../types/configuration';
import DropdownsTab from './DropdownsTab';

interface MaterialTabProps {
  settings: ConfigSettings;
  userRole: 'admin' | 'vocal';
  onVariableChange: (key: string, value: any) => void;
}

/**
 * Pestaña de Gestión de Material
 * Contiene configuraciones específicas para el manejo de material del club
 */
const MaterialTab: React.FC<MaterialTabProps> = ({
  settings,
  userRole,
  onVariableChange
}) => {
  // Estado para mostrar/ocultar los banners
  const [showInfo, setShowInfo] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

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
                  Gestiona los parámetros específicos para el material del club, incluyendo stock mínimo, revisiones periódicas y tiempo entre préstamos. Las configuraciones detalladas de formularios de material están disponibles en la sección inferior (solo para administradores).
                </Text>
              </Box>
            </Collapse>
          </Box>
        </Alert>

        {/* Configuración de Stock y Mantenimiento */}
        <Card>
          <CardBody>
            <Heading size="sm" mb={4} color="blue.600">
              📦 Gestión de Stock y Mantenimiento
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Porcentaje mínimo de stock</FormLabel>
                <Select
                  value={settings.variables.porcentajeStockMinimo}
                  onChange={(e) => onVariableChange('porcentajeStockMinimo', parseInt(e.target.value))}
                >
                  <option value="10">10%</option>
                  <option value="15">15%</option>
                  <option value="20">20%</option>
                  <option value="25">25%</option>
                  <option value="30">30%</option>
                </Select>
                <Text fontSize="xs" color="gray.600" mt={1}>
                  Porcentaje mínimo de stock antes de alerta
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Días de revisión periódica</FormLabel>
                <Select
                  value={settings.variables.diasRevisionPeriodica}
                  onChange={(e) => onVariableChange('diasRevisionPeriodica', parseInt(e.target.value))}
                >
                  <option value="90">90 días (3 meses)</option>
                  <option value="180">180 días (6 meses)</option>
                  <option value="365">365 días (1 año)</option>
                </Select>
                <Text fontSize="xs" color="gray.600" mt={1}>
                  Frecuencia de revisión periódica del material
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Tiempo mínimo entre préstamos</FormLabel>
                <Select
                  value={settings.variables.tiempoMinimoEntrePrestamos}
                  onChange={(e) => onVariableChange('tiempoMinimoEntrePrestamos', parseInt(e.target.value))}
                >
                  <option value="0">Sin restricción</option>
                  <option value="1">1 día</option>
                  <option value="2">2 días</option>
                  <option value="7">7 días</option>
                </Select>
                <Text fontSize="xs" color="gray.600" mt={1}>
                  Tiempo mínimo entre préstamos del mismo material
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Días de antelación para revisión</FormLabel>
                <Select
                  value={settings.variables.diasAntelacionRevision}
                  onChange={(e) => onVariableChange('diasAntelacionRevision', parseInt(e.target.value))}
                >
                  <option value="15">15 días antes</option>
                  <option value="30">30 días antes</option>
                  <option value="60">60 días antes</option>
                  <option value="90">90 días antes</option>
                </Select>
                <Text fontSize="xs" color="gray.600" mt={1}>
                  Días de antelación para recordar revisión de material
                </Text>
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Formularios Material - Solo para administradores */}
        {userRole === 'admin' && (
          <>
            <Divider />
            <Card>
              <CardBody>
                <Heading size="sm" mb={4} color="orange.600">
                  📋 Formularios Material
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
                        icon={showWarning ? <ChevronDownIcon /> : <ChevronRightIcon />}
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
                <DropdownsTab settings={settings} userRole={userRole} />
              </CardBody>
            </Card>
          </>
        )}
      </VStack>
    </TabPanel>
  );
};

export default MaterialTab;
