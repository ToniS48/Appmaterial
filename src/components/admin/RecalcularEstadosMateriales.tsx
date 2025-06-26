import React, { useState } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  Alert,
  AlertIcon,
  Badge,
  useToast,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Card,
  CardBody
} from '@chakra-ui/react';
import { listarMateriales, actualizarMaterial } from '../../services/MaterialService';
import { Material } from '../../types/material';
import { Timestamp } from 'firebase/firestore';

// Helper function para convertir fechas
const convertirADate = (fecha: Date | Timestamp | string | undefined): Date | null => {
  if (!fecha) return null;
  if (fecha instanceof Date) return fecha;
  if (fecha instanceof Timestamp) return fecha.toDate();
  if (typeof fecha === 'string') return new Date(fecha);
  return null;
};

const RecalcularEstadosMateriales: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<{
    total: number;
    procesados: number;
    actualizados: number;
    errores: number;
  } | null>(null);
  const toast = useToast();

  const recalcularEstados = async () => {
    setIsLoading(true);
    setResultado(null);
    
    try {
      console.log('🔄 Iniciando recálculo de estados de materiales...');
      
      const materiales = await listarMateriales();
      console.log(`📊 Total de materiales a procesar: ${materiales.length}`);
      
      let procesados = 0;
      let actualizados = 0;
      let errores = 0;
      
      for (const material of materiales) {
        try {
          let actualizado = false;
          const cambios: Partial<Material> = {};
          
          // Normalizar nombre
          if (material.nombre && material.nombre !== material.nombre.trim()) {
            cambios.nombre = material.nombre.trim();
            actualizado = true;
          }
            // Validar y corregir estado
          const estadosValidos = ['disponible', 'prestado', 'mantenimiento', 'baja', 'perdido', 'revision', 'retirado'];
          if (!material.estado || !estadosValidos.includes(material.estado)) {
            cambios.estado = 'disponible'; // Estado por defecto
            actualizado = true;
          }
          
          // Validar tipo
          const tiposValidos = ['cuerda', 'anclaje', 'varios'];
          if (!material.tipo || !tiposValidos.includes(material.tipo)) {
            cambios.tipo = 'varios'; // Tipo por defecto
            actualizado = true;
          }
            // Establecer fecha de adquisición si no existe
          if (!material.fechaAdquisicion) {
            cambios.fechaAdquisicion = new Date();
            actualizado = true;
          }
          
          // Actualizar material si hay cambios
          if (actualizado && Object.keys(cambios).length > 0) {
            await actualizarMaterial(material.id, cambios);
            actualizados++;
            console.log(`✅ Material ${material.id} actualizado:`, cambios);
          }
          
          procesados++;
          
        } catch (error) {
          console.error(`❌ Error procesando material ${material.id}:`, error);
          errores++;
        }
      }
      
      const resultadoFinal = {
        total: materiales.length,
        procesados,
        actualizados,
        errores
      };
      
      setResultado(resultadoFinal);
      
      // Señal para que otros componentes se actualicen
      localStorage.setItem('recalculo_materiales_completado', Date.now().toString());
      
      console.log('✅ Recálculo de estados de materiales completado:', resultadoFinal);
      
      toast({
        title: "Recálculo completado",
        description: `${actualizados} materiales actualizados de ${procesados} procesados`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('❌ Error en recálculo de estados de materiales:', error);
      toast({
        title: "Error en recálculo",
        description: "No se pudo completar el recálculo de estados",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Text fontSize="md" fontWeight="bold" mb={2}>
          Recalcular Estados de Materiales
        </Text>
        <Text fontSize="sm" color="gray.600">
          Normaliza y corrige los estados y datos de todos los materiales
        </Text>
      </Box>

      <Alert status="info" fontSize="sm">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">¿Qué hace esta herramienta?</Text>
          <Text>
            • Normaliza nombres (elimina espacios extra)<br/>
            • Corrige estados inválidos<br/>
            • Valida tipos de material<br/>
            • Establece fechas de adquisición faltantes
          </Text>
        </Box>
      </Alert>

      <Button
        colorScheme="orange"
        onClick={recalcularEstados}
        isLoading={isLoading}
        loadingText="Recalculando..."
      >
        Ejecutar Recálculo
      </Button>

      {isLoading && (
        <Box>
          <Text fontSize="sm" mb={2}>Procesando materiales...</Text>
          <Progress size="sm" isIndeterminate />
        </Box>
      )}

      {resultado && (
        <Card>
          <CardBody>
            <Text fontWeight="bold" mb={3}>Resultado del Recálculo</Text>
            <StatGroup>
              <Stat>
                <StatLabel>Total Materiales</StatLabel>
                <StatNumber>{resultado.total}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Procesados</StatLabel>
                <StatNumber color="blue.500">{resultado.procesados}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Actualizados</StatLabel>
                <StatNumber color="green.500">{resultado.actualizados}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Errores</StatLabel>
                <StatNumber color="red.500">{resultado.errores}</StatNumber>
              </Stat>
            </StatGroup>
            
            {resultado.actualizados > 0 && (
              <Alert status="success" mt={4}>
                <AlertIcon />
                <Text>
                  Se actualizaron {resultado.actualizados} materiales correctamente.
                </Text>
              </Alert>
            )}
            
            {resultado.errores > 0 && (
              <Alert status="warning" mt={4}>
                <AlertIcon />
                <Text>
                  Se produjeron {resultado.errores} errores durante el proceso.
                </Text>
              </Alert>
            )}
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

export default RecalcularEstadosMateriales;
