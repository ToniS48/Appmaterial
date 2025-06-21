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

interface LoanManagementSectionProps {
  settings: ConfigSettings;
  userRole: 'admin' | 'vocal';
  onVariableChange: (key: string, value: any) => void;
}

/**
 * Sección de Gestión de Préstamos y Devoluciones
 */
const LoanManagementSection: React.FC<LoanManagementSectionProps> = ({
  settings,
  userRole,
  onVariableChange
}) => {
  return (
    <Card>
      <CardBody>
        <Heading size="sm" mb={4} color="blue.600">
          📦 Gestión de Préstamos y Devoluciones
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">Días de gracia para devolución</FormLabel>
            <Select
              value={settings.variables.diasGraciaDevolucion}
              onChange={(e) => onVariableChange('diasGraciaDevolucion', parseInt(e.target.value))}
            >
              <option value="1">1 día</option>
              <option value="2">2 días</option>
              <option value="3">3 días</option>
              <option value="5">5 días</option>
              <option value="7">7 días</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días adicionales después del fin de actividad para devolver material
            </Text>
          </FormControl>

          {/* ...existing code... */}
          <FormControl>
            <FormLabel fontSize="sm">Días máximos de retraso</FormLabel>
            <Select
              value={settings.variables.diasMaximoRetraso}
              onChange={(e) => onVariableChange('diasMaximoRetraso', parseInt(e.target.value))}
            >
              <option value="7">7 días</option>
              <option value="15">15 días</option>
              <option value="30">30 días</option>
              <option value="45">45 días</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días máximos de retraso antes de aplicar penalizaciones
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Días de bloqueo por retraso grave</FormLabel>
            <Select
              value={settings.variables.diasBloqueoPorRetraso}
              onChange={(e) => onVariableChange('diasBloqueoPorRetraso', parseInt(e.target.value))}
            >
              <option value="15">15 días</option>
              <option value="30">30 días</option>
              <option value="60">60 días</option>
              <option value="90">90 días</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días de bloqueo automático por retrasos graves
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
        </SimpleGrid>
      </CardBody>
    </Card>
  );
};

export default LoanManagementSection;
