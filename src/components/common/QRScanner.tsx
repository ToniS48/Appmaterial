import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  Box,
  Button,
  VStack,
  Text,
  Alert,
  AlertIcon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Spinner,
  Center,
} from '@chakra-ui/react';
import './QRScanner.css';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
  title?: string;
  description?: string;
}

const QRScanner: React.FC<QRScannerProps> = ({
  isOpen,
  onClose,
  onScan,
  title = "Escanear Código QR",
  description = "Apunta la cámara hacia el código QR del material"
}) => {  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const toast = useToast();
  // Verificar permisos de cámara
  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      stream.getTracks().forEach(track => track.stop()); // Liberar inmediatamente
      return true;
    } catch (err: any) {
      console.error('Permisos de cámara denegados:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('Se necesitan permisos de cámara para escanear códigos QR. Por favor, permite el acceso a la cámara en tu navegador.');
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró ninguna cámara en este dispositivo.');
      } else {
        setError('Error al acceder a la cámara. Verifica que no esté siendo usada por otra aplicación.');
      }
      return false;
    }
  };

  // Función para manejar escaneo exitoso
  const handleScanSuccess = (decodedText: string, decodedResult?: any) => {
    console.log('Código QR detectado:', decodedText);
    
    // Detener el escáner inmediatamente
    stopScanner();
    
    // Verificar si es un código QR válido de material
    if (decodedText.includes('/material/detalle/') || 
        decodedText.match(/^[A-Z]{3}-[a-zA-Z0-9]{6}$/) ||
        decodedText.match(/^[a-zA-Z0-9]{6,}$/)) {
      
      onScan(decodedText);
      onClose();
      
      toast({
        title: "¡Código QR detectado!",
        description: "Procesando información del material...",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Código QR no válido",
        description: "Este código no corresponde a un material del sistema",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      
      // Reiniciar escáner para seguir intentando
      setTimeout(() => {
        initializeScanner();
      }, 1000);
    }
  };
  // Función para manejar errores de escaneo
  const handleScanError = (errorMessage: string) => {
    // Solo logear errores críticos, ignorar errores normales de escaneo
    if (errorMessage.includes('NotAllowedError') || 
        errorMessage.includes('Permission denied') ||
        errorMessage.includes('NotFoundError')) {
      console.error('Error crítico del escáner:', errorMessage);
      setError('Error al acceder a la cámara. Verifica los permisos.');
      setIsScanning(false);
    }
  };

  // Inicializar escáner usando Html5QrcodeScanner (método principal y más confiable)
  const startScanner = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Limpiar cualquier escáner previo
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          console.log('Scanner ya estaba limpio');
        }
      }

      // Configuración optimizada para localhost y navegadores de escritorio
      const config = {
        fps: 10,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
        disableFlip: false,
        // Configuraciones adicionales para mejor compatibilidad
        supportedScanTypes: [], // Permitir todos los tipos
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: false
        }
      };

      // Crear y renderizar el escáner
      scannerRef.current = new Html5QrcodeScanner(
        "qr-scanner-container",
        config,
        false // verbose = false para menos logs
      );

      scannerRef.current.render(handleScanSuccess, handleScanError);
      setIsScanning(true);
      
      console.log('Escáner QR inicializado correctamente');
      
    } catch (err: any) {
      console.error('Error al inicializar el escáner:', err);
      setError(`No se pudo inicializar el escáner: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Detener escáner
  const stopScanner = () => {
    try {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
          scannerRef.current = null;
        } catch (err) {
          console.error('Error al limpiar escáner:', err);
        }
      }
      
      setIsScanning(false);
      console.log('Escáner detenido');
    } catch (err) {
      console.error('Error al detener el escáner:', err);
    }
  };

  // Inicializar escáner principal
  const initializeScanner = async () => {
    try {
      // Primero verificar permisos
      const hasPermission = await checkCameraPermission();
      
      if (hasPermission) {
        await startScanner();
      }
    } catch (err: any) {
      console.error('Error al inicializar:', err);
      setError(`Error de inicialización: ${err.message || 'Error desconocido'}`);
      setIsLoading(false);
    }
  };
  // Función para reintentar
  const handleRetry = async () => {
    setError(null);
    await initializeScanner();
  };

  // Función para escaneo manual (fallback)
  const handleManualScan = () => {
    const mockData = prompt("Ingresa el código QR manualmente (ejemplo: ABC-123456):");
    if (mockData && mockData.trim()) {
      handleScanSuccess(mockData.trim());
    }
  };
  // Efectos
  useEffect(() => {
    if (isOpen && !isScanning) {
      // Delay para permitir que el modal se renderice
      const timer = setTimeout(() => {
        initializeScanner();
      }, 500);
      return () => clearTimeout(timer);
    } else if (!isOpen && isScanning) {
      stopScanner();
    }
  }, [isOpen]); // Solo depende de isOpen

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            {description && (
              <Text textAlign="center" color="gray.600">
                {description}
              </Text>
            )}

            {isLoading && (
              <Center p={8}>
                <VStack>
                  <Spinner size="lg" color="brand.500" />
                  <Text>Iniciando cámara...</Text>
                </VStack>
              </Center>
            )}

            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {/* Contenedor del escáner */}
            <Box
              id="qr-scanner-container"
              width="100%"
              maxWidth="400px"
              mx="auto"
              borderRadius="md"
              overflow="hidden"
              minHeight={isScanning ? "300px" : "auto"}
            />

            {/* Instrucciones de uso */}
            {isScanning && !error && (
              <Text textAlign="center" fontSize="sm" color="gray.600">
                Mantén el código QR dentro del marco de la cámara
              </Text>
            )}

            {/* Botones de ayuda */}
            {error && (
              <VStack spacing={3}>
                <Button colorScheme="brand" onClick={handleRetry} size="md">
                  Reintentar
                </Button>
                <Button variant="outline" onClick={handleManualScan} size="sm">
                  Ingresar código manualmente
                </Button>
              </VStack>
            )}

            {/* Consejos de troubleshooting */}
            {error && (
              <Box p={3} bg="gray.50" borderRadius="md" fontSize="sm">
                <Text fontWeight="semibold" mb={2}>Consejos para solucionar problemas:</Text>
                <VStack align="start" spacing={1} fontSize="xs">
                  <Text>• Verifica que el navegador tenga permisos de cámara</Text>
                  <Text>• Cierra otras aplicaciones que puedan estar usando la cámara</Text>
                  <Text>• Intenta refrescar la página (F5)</Text>
                  <Text>• Usa el modo manual si persisten los problemas</Text>
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button colorScheme="gray" onClick={handleManualScan} size="sm">
              Modo Manual (Debug)
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default QRScanner;
