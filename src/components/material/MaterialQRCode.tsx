import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Box, Button, Text, Flex, useToast, VStack, HStack, Icon } from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';
import { useReactToPrint } from 'react-to-print';
import messages from '../../constants/messages';

// Icono personalizado de impresora
const PrinterIcon = (props: any) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"
    />
  </Icon>
);

interface MaterialQRCodeProps {
  material: {
    id: string;
    nombre: string;
    tipo: string;
    codigo?: string;
  };
  compact?: boolean; // Nueva propiedad para modo compacto
}

const MaterialQRCode: React.FC<MaterialQRCodeProps> = ({ material, compact = false }) => {
  const toast = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  
  // URL para acceder directamente al detalle del material
  const qrValue = `${window.location.origin}/material/detalle/${material.id}`;
  
  // Código mostrado debajo del QR
  const displayCode = material.codigo || 
    `${material.tipo.substring(0, 3).toUpperCase()}-${material.id.substring(0, 6)}`;
  
  // Función para imprimir el QR individual
  const handlePrintFn = useReactToPrint({
    documentTitle: `QR_${material.nombre}_${displayCode}`,
    contentRef: qrRef,
    onAfterPrint: () => {
      toast({
        title: "QR listo para imprimir",
        description: "Se ha enviado el código QR a la impresora.",
        status: "success",
        duration: 3000,
      });
    },
  });
  
  // Wrapper de la función para manejar el evento onClick
  const handlePrint = (e: React.MouseEvent<HTMLButtonElement>) => {
    handlePrintFn();
  };
  
  // Función para descargar el QR como SVG
  const downloadQR = () => {
    try {
      const svgElement = qrRef.current?.querySelector('svg');
      if (!svgElement) return;
      
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = `QR_${material.nombre}_${displayCode}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: messages.material.qrDescargado,
        description: messages.material.qrDescargadoDesc,
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error al descargar QR:", error);
      toast({
        title: messages.material.qrError,
        description: messages.material.qrErrorDesc,
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box>
      <VStack ref={qrRef} spacing={compact ? 2 : 3} p={compact ? 3 : 4} bg="white" borderRadius="md" borderWidth="1px">
        <Text fontWeight="bold" fontSize={compact ? "sm" : "lg"} noOfLines={1}>{material.nombre}</Text>
        <QRCodeSVG 
          value={qrValue} 
          size={compact ? 120 : 200}
          level="H"
          includeMargin={true}
        />
        <Text fontSize={compact ? "xs" : "md"} fontFamily="monospace" fontWeight="bold">
          {displayCode}
        </Text>
        <Text fontSize={compact ? "xs" : "sm"} color="gray.500">
          {material.tipo === 'cuerda' ? 'Cuerda' : 
           material.tipo === 'anclaje' ? 'Anclaje' : 'Material Varios'}
        </Text>
      </VStack>
      
      {/* Solo mostrar botones si no está en modo compacto */}
      {!compact && (
        <HStack mt={4} spacing={3} justify="center">
          <Button 
            leftIcon={<PrinterIcon />}
            colorScheme="brand" 
            onClick={handlePrint}
            size="sm"
          >
            Imprimir QR
          </Button>
          <Button 
            leftIcon={<DownloadIcon />} 
            variant="outline" 
            colorScheme="brand"
            onClick={downloadQR}
            size="sm"
          >
            Descargar QR
          </Button>
        </HStack>
      )}
    </Box>
  );
};

export default MaterialQRCode;