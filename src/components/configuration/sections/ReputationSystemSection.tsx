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

interface ReputationSystemSectionProps {
  settings: ConfigSettings;
  onVariableChange: (key: string, value: any) => void;
}

/**
 * Sección del Sistema de Puntuación y Reputación
 */
const ReputationSystemSection: React.FC<ReputationSystemSectionProps> = ({
  settings,
  onVariableChange
}) => {
  return (
    <Card>
      <CardBody>
        <Heading size="sm" mb={4} color="orange.600">
          ⭐ Sistema de Puntuación y Reputación
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">Penalización por retraso</FormLabel>
            <Select
              value={settings.variables.penalizacionRetraso}
              onChange={(e) => onVariableChange('penalizacionRetraso', parseInt(e.target.value))}
            >
              <option value="1">1 punto</option>
              <option value="3">3 puntos</option>
              <option value="5">5 puntos</option>
              <option value="10">10 puntos</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Puntos a descontar por cada retraso
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Bonificación por devolución temprana</FormLabel>
            <Select
              value={settings.variables.bonificacionDevolucionTemprana}
              onChange={(e) => onVariableChange('bonificacionDevolucionTemprana', parseInt(e.target.value))}
            >
              <option value="1">1 punto</option>
              <option value="2">2 puntos</option>
              <option value="3">3 puntos</option>
              <option value="5">5 puntos</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Puntos extra por devolución antes del plazo
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Umbral de inactividad de usuario</FormLabel>
            <Select
              value={settings.variables.umbraLinactividadUsuario}
              onChange={(e) => onVariableChange('umbraLinactividadUsuario', parseInt(e.target.value))}
            >
              <option value="180">180 días (6 meses)</option>
              <option value="365">365 días (1 año)</option>
              <option value="730">730 días (2 años)</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días sin actividad para marcar usuario como inactivo
            </Text>
          </FormControl>
        </SimpleGrid>
      </CardBody>
    </Card>
  );
};

export default ReputationSystemSection;
