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

interface ReportsSectionProps {
  settings: ConfigSettings;
  onVariableChange: (key: string, value: any) => void;
}

/**
 * Sección de Configuración de Reportes
 */
const ReportsSection: React.FC<ReportsSectionProps> = ({
  settings,
  onVariableChange
}) => {
  return (
    <Card>
      <CardBody>
        <Heading size="sm" mb={4} color="teal.600">
          📊 Configuración de Reportes
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">Días de historial en reportes</FormLabel>
            <Select
              value={settings.variables.diasHistorialReportes}
              onChange={(e) => onVariableChange('diasHistorialReportes', parseInt(e.target.value))}
            >
              <option value="90">90 días (3 meses)</option>
              <option value="180">180 días (6 meses)</option>
              <option value="365">365 días (1 año)</option>
              <option value="730">730 días (2 años)</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Período de historial incluido en reportes automáticos
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Límite de elementos en exportación</FormLabel>
            <Select
              value={settings.variables.limiteElementosExportacion}
              onChange={(e) => onVariableChange('limiteElementosExportacion', parseInt(e.target.value))}
            >
              <option value="500">500 elementos</option>
              <option value="1000">1000 elementos</option>
              <option value="2000">2000 elementos</option>
              <option value="5000">5000 elementos</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Máximo número de elementos en exportaciones
            </Text>
          </FormControl>
        </SimpleGrid>
      </CardBody>
    </Card>
  );
};

export default ReportsSection;
