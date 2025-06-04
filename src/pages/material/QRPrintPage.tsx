import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Button,
  Select,
  Flex,
  Spinner,
  Center,
  Text,
  useToast,
  Alert,
  AlertIcon,
  Stack,
  Divider
} from '@chakra-ui/react';
import { useReactToPrint } from 'react-to-print';
import { FiPrinter } from 'react-icons/fi';
import MaterialQRCode from '../../components/material/MaterialQRCode';
import { listarMateriales } from '../../services/materialService';
import DashboardLayout from '../../components/layouts/DashboardLayout';

const QRPrintPage: React.FC = () => {
  const [materiales, setMateriales] = useState<any[]>([]);
  const [filteredMateriales, setFilteredMateriales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [ordenarPor, setOrdenarPor] = useState('nombre');
  const [printLoading, setPrintLoading] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Cargar materiales
  const cargarMateriales = async () => {
    try {
      setLoading(true);
      const materialesData = await listarMateriales();
      setMateriales(materialesData);
      aplicarFiltros(materialesData, filtroTipo, ordenarPor);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar materiales:', error);
      setError('No se pudieron cargar los materiales. Inténtalo de nuevo más tarde.');
      setLoading(false);
    }
  };

  // Aplicar filtros y ordenación
  const aplicarFiltros = (items: any[], tipo: string, orden: string) => {
    let filtered = [...items];
    
    // Aplicar filtro por tipo
    if (tipo !== 'todos') {
      filtered = filtered.filter(item => item.tipo === tipo);
    }
    
    // Aplicar ordenación
    filtered.sort((a, b) => {
      if (orden === 'nombre') {
        return a.nombre.localeCompare(b.nombre);
      } else if (orden === 'tipo') {
        return a.tipo.localeCompare(b.tipo) || a.nombre.localeCompare(b.nombre);
      } else if (orden === 'codigo') {
        const codA = a.codigo || '';
        const codB = b.codigo || '';
        return codA.localeCompare(codB);
      }
      return 0;
    });
    
    setFilteredMateriales(filtered);
  };

  // Efectos
  useEffect(() => {
    cargarMateriales();
  }, []);

  useEffect(() => {
    if (materiales.length > 0) {
      aplicarFiltros(materiales, filtroTipo, ordenarPor);
    }
  }, [filtroTipo, ordenarPor]);

  // Agrupar materiales por tipo
  const materialesPorTipo = {
    cuerda: filteredMateriales.filter(m => m.tipo === 'cuerda'),
    anclaje: filteredMateriales.filter(m => m.tipo === 'anclaje'),
    varios: filteredMateriales.filter(m => m.tipo === 'varios')
  };

  // Configurar impresión principal
  const handlePrintFn = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Material_QRCodes_ESPEMO',
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .page-break {
          page-break-before: always;
        }
      }
    `,
    onBeforePrint: async () => {
      setPrintLoading(true);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setPrintLoading(false);
      toast({
        title: "Impresión enviada",
        description: "Los códigos QR han sido enviados a la impresora",
        status: "success",
        duration: 3000,
      });
    },
  });

  // Función para imprimir
  const handlePrint = (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      setPrintLoading(true);
      // Dar tiempo para que los QR se renderizen completamente
      setTimeout(() => {
        Promise.resolve().then(() => {
          handlePrintFn();
          // Como fallback, asegurarse de que el indicador de carga se desactive
          setTimeout(() => {
            setPrintLoading(false);
          }, 3000);
        });
      }, 1000);
    } catch (error) {
      console.error("Error al imprimir:", error);
      setPrintLoading(false);
      toast({
        title: "Error de impresión",
        description: "No se pudo iniciar la impresión",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Renderizar una sección de tipo de material
  const renderSeccionTipo = (tipo: string, materiales: any[], titulo: string) => {
    if (materiales.length === 0) return null;
    
    return (
      <Box mb={8} className={tipo !== 'cuerda' ? 'page-break' : ''}>
        <Heading size="md" mb={4} textAlign="center" color={
          tipo === 'cuerda' ? 'blue.600' : 
          tipo === 'anclaje' ? 'orange.600' : 'purple.600'
        }>
          {titulo} ({materiales.length})
        </Heading>
        <Divider mb={4} />
        <SimpleGrid columns={3} spacing={6}>
          {materiales.map(material => (
            <Box key={material.id} p={2}>
              <MaterialQRCode material={material} compact={true} />
            </Box>
          ))}
        </SimpleGrid>
      </Box>
    );
  };

  return (
    <DashboardLayout title="Impresión de Códigos QR">
      <Box mb={6} p={5} shadow="md" borderWidth="1px" borderRadius="md" bg="white">
        <Heading size="md" mb={4}>Generador de QR para inventario</Heading>
        <Text mb={4}>
          Genera e imprime códigos QR para todo el material deportivo. Los materiales se imprimirán organizados por tipo.
        </Text>

        {/* Controles de filtrado y ordenación */}
        <Flex direction={{ base: "column", md: "row" }} mb={6} gap={4}>
          <Select 
            value={filtroTipo} 
            onChange={e => setFiltroTipo(e.target.value)}
            maxW={{ base: "100%", md: "200px" }}
          >
            <option value="todos">Todos los tipos</option>
            <option value="cuerda">Cuerdas</option>
            <option value="anclaje">Anclajes</option>
            <option value="varios">Material varios</option>
          </Select>
          
          <Select 
            value={ordenarPor} 
            onChange={e => setOrdenarPor(e.target.value)}
            maxW={{ base: "100%", md: "200px" }}
          >
            <option value="nombre">Ordenar por nombre</option>
            <option value="tipo">Ordenar por tipo</option>
            <option value="codigo">Ordenar por código</option>
          </Select>

          <Button 
            leftIcon={<FiPrinter />}
            colorScheme="brand" 
            onClick={handlePrint}
            ml="auto"
            isLoading={printLoading}
            loadingText="Preparando..."
            isDisabled={loading || filteredMateriales.length === 0}
          >
            Imprimir todos ({filteredMateriales.length})
          </Button>
        </Flex>

        {loading ? (
          <Center p={8}>
            <Spinner size="xl" color="brand.500" />
          </Center>
        ) : error ? (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        ) : filteredMateriales.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            No se encontraron materiales con los filtros seleccionados.
          </Alert>
        ) : (
          <Box>
            <Text mb={4}>
              Se encontraron {filteredMateriales.length} materiales. Al imprimir, se organizarán por tipo para facilitar su gestión.
            </Text>
            
            {/* Vista previa (limitada) */}
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} mb={4}>
              {filteredMateriales.slice(0, 6).map(material => (
                <Box key={material.id} p={2}>
                  <MaterialQRCode material={material} compact={true} />
                </Box>
              ))}
              {filteredMateriales.length > 6 && (
                <Center p={4} borderWidth="1px" borderRadius="md" borderStyle="dashed">
                  <Text color="gray.500">
                    +{filteredMateriales.length - 6} más...
                  </Text>
                </Center>
              )}
            </SimpleGrid>
          </Box>
        )}
      </Box>

      {/* Contenedor para impresión - organizado por tipos */}
      <Box 
        ref={printRef} 
        position="fixed"
        left="-9999px" 
        top="0"
        width="210mm" 
        height="auto"
        bg="white"
        aria-hidden="true"
        sx={{
          '@media print': {
            position: 'relative',
            left: 'auto',
            top: 'auto',
          }
        }}
      >
        <Box p={4}>
          <Heading size="md" mb={6} textAlign="center">
            Inventario de Material Deportivo - ESPEMO
          </Heading>
          
          {/* Renderizar cuerdas */}
          {renderSeccionTipo('cuerda', materialesPorTipo.cuerda, 'Cuerdas')}
          
          {/* Renderizar anclajes */}
          {renderSeccionTipo('anclaje', materialesPorTipo.anclaje, 'Anclajes')}
          
          {/* Renderizar material varios */}
          {renderSeccionTipo('varios', materialesPorTipo.varios, 'Material Varios')}
        </Box>
      </Box>
    </DashboardLayout>
  );
};

export default QRPrintPage;