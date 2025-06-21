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

interface NotificationSectionProps {
  settings: ConfigSettings;
  onVariableChange: (key: string, value: any) => void;
}

/**
 * Sección de Notificaciones Automáticas
 */
const NotificationSection: React.FC<NotificationSectionProps> = ({
  settings,
  onVariableChange
}) => {
  return (
    <Card>
      <CardBody>
        <Heading size="sm" mb={4} color="green.600">
          🔔 Notificaciones Automáticas
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">Recordatorio pre-actividad</FormLabel>
            <Select
              value={settings.variables.recordatorioPreActividad}
              onChange={(e) => onVariableChange('recordatorioPreActividad', parseInt(e.target.value))}
            >
              <option value="1">1 día antes</option>
              <option value="3">3 días antes</option>
              <option value="7">7 días antes</option>
              <option value="14">14 días antes</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días de antelación para recordar actividades próximas
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Recordatorio de devolución</FormLabel>
            <Select
              value={settings.variables.recordatorioDevolucion}
              onChange={(e) => onVariableChange('recordatorioDevolucion', parseInt(e.target.value))}
            >
              <option value="1">1 día antes</option>
              <option value="2">2 días antes</option>
              <option value="3">3 días antes</option>
              <option value="5">5 días antes</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días antes del vencimiento para recordar devolución
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Notificación por retraso</FormLabel>
            <Select
              value={settings.variables.notificacionRetrasoDevolucion}
              onChange={(e) => onVariableChange('notificacionRetrasoDevolucion', parseInt(e.target.value))}
            >
              <option value="1">Al día siguiente</option>
              <option value="3">3 días después</option>
              <option value="7">7 días después</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días de retraso para notificar automáticamente
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Recordatorio de revisión de material</FormLabel>
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
  );
};

export default NotificationSection;
