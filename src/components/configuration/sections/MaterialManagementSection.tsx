import React from 'react';
import {
  Card,
  CardBody,
  Heading,
  FormControl,
  FormLabel,
  Select,
  Text,
  SimpleGrid
} from '@chakra-ui/react';
import { ConfigSettings } from '../../../types/configuration';

interface MaterialManagementSectionProps {
  settings: ConfigSettings;
  onVariableChange: (key: string, value: any) => void;
}

/**
 * Sección de Gestión de Material
 */
const MaterialManagementSection: React.FC<MaterialManagementSectionProps> = ({
  settings,
  onVariableChange
}) => {
  return (
    <Card>
      <CardBody>
        <Heading size="sm" mb={4} color="cyan.600">
          🎯 Gestión de Material
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
        </SimpleGrid>
      </CardBody>
    </Card>
  );
};

export default MaterialManagementSection;
