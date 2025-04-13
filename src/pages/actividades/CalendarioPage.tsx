import React, { useState } from 'react';
import {
  Box,
  Heading,
  Flex,
  Button,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import CalendarioSimple from '../../components/actividades/CalendarioSimple'; // Usar el componente simplificado

const CalendarioPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

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
          justify="space-between" 
          align={{ base: "flex-start", md: "center" }}
          mb={5}
          direction={{ base: "column", md: "row" }}
          gap={3}
        >
          <Heading size="lg">Calendario de Actividades</Heading>
          <Button 
            leftIcon={<AddIcon />} 
            colorScheme="brand" 
            onClick={() => navigate('/activities/create')}
            width={{ base: "100%", md: "auto" }}
          >
            Nueva Actividad
          </Button>
        </Flex>

        <CalendarioSimple mes={selectedMonth} />
      </Box>
    </DashboardLayout>
  );
};

export default CalendarioPage;