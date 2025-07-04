import React, { useState } from 'react';
import { Box, Heading, Flex, HStack } from '@chakra-ui/react';
import { FiCalendar } from 'react-icons/fi'; // Importar FiCalendar
import DashboardLayout from '../../components/layouts/DashboardLayout';
import CalendarioSimple from '../../components/actividades/CalendarioSimple'; // Usar el componente simplificado

const CalendarioPage: React.FC = () => {
    const [selectedMonth] = useState(new Date());

  return (
    <DashboardLayout title="Calendario de Actividades">
      <Box 
        p={{ base: 3, md: 5 }} 
        shadow="md" 
        borderWidth="1px" 
        borderRadius="md" 
        bg="white"
        maxW="1400px"
        mx="auto"
      >
        <Flex 
          justify="center" // Centrar el contenido del Flex
          align="center" // Alinear verticalmente al centro
          mb={5}
          direction={{ base: "column", md: "row" }}
          gap={3}
        >
          <HStack> {/* Usar HStack para el icono y el título */}
            <FiCalendar size="28px" /> {/* Añadir icono */}
            <Heading size="lg">Calendario de Actividades</Heading>
          </HStack>
          {/* Botón de Nueva Actividad eliminado */}
        </Flex>

        <CalendarioSimple mes={selectedMonth} />
      </Box>
    </DashboardLayout>
  );
};

export default CalendarioPage;
