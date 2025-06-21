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

interface ActivityManagementSectionProps {
  settings: ConfigSettings;
  onVariableChange: (key: string, value: any) => void;
}

/**
 * Sección de Gestión de Actividades
 */
const ActivityManagementSection: React.FC<ActivityManagementSectionProps> = ({
  settings,
  onVariableChange
}) => {
  return (
    <Card>
      <CardBody>
        <Heading size="sm" mb={4} color="purple.600">
          🗓️ Gestión de Actividades
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">Antelación mínima para crear actividad</FormLabel>
            <Select
              value={settings.variables.diasMinimoAntelacionCreacion}
              onChange={(e) => onVariableChange('diasMinimoAntelacionCreacion', parseInt(e.target.value))}
            >
              <option value="1">1 día</option>
              <option value="3">3 días</option>
              <option value="7">7 días</option>
              <option value="14">14 días</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días mínimos de antelación para crear una actividad
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Límite para modificar actividad</FormLabel>
            <Select
              value={settings.variables.diasMaximoModificacion}
              onChange={(e) => onVariableChange('diasMaximoModificacion', parseInt(e.target.value))}
            >
              <option value="1">1 día antes</option>
              <option value="2">2 días antes</option>
              <option value="3">3 días antes</option>
              <option value="7">7 días antes</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Días antes de actividad donde ya no se puede modificar
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm">Límite de participantes por defecto</FormLabel>
            <Select
              value={settings.variables.limiteParticipantesPorDefecto}
              onChange={(e) => onVariableChange('limiteParticipantesPorDefecto', parseInt(e.target.value))}
            >
              <option value="10">10 participantes</option>
              <option value="15">15 participantes</option>
              <option value="20">20 participantes</option>
              <option value="25">25 participantes</option>
              <option value="30">30 participantes</option>
            </Select>
            <Text fontSize="xs" color="gray.600" mt={1}>
              Límite por defecto de participantes en nuevas actividades
            </Text>
          </FormControl>
        </SimpleGrid>
      </CardBody>
    </Card>
  );
};

export default ActivityManagementSection;
