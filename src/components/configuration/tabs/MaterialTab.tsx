import React from 'react';
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
  SimpleGrid
} from '@chakra-ui/react';
import { ConfigSettings } from '../../../types/configuration';

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
  return (
    <TabPanel>
      <VStack spacing={8} align="stretch">
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Configuración de Material</Text>
            <Text>
              Gestiona los parámetros específicos para el material del club, 
              incluyendo stock mínimo, revisiones periódicas y tiempo entre préstamos.
            </Text>
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

        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Información adicional</Text>
            <Text fontSize="sm">
              Las configuraciones detalladas de formularios de material están disponibles 
              en la pestaña "Formularios Material" (solo para administradores).
            </Text>
          </Box>
        </Alert>
      </VStack>
    </TabPanel>
  );
};

export default MaterialTab;
