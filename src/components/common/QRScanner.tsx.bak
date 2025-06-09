import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
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
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const toast = useToast();
  // Función para inicializar la cámara y el escáner
  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Crear instancia del escáner ZXing
      if (!scannerRef.current) {
        scannerRef.current = new BrowserMultiFormatReader();
      }

      // Obtener dispositivos de video disponibles
      const videoInputDevices = await scannerRef.current.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No se encontraron cámaras disponibles');
      }

      // Preferir cámara trasera si está disponible
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      const selectedDeviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;

      // Iniciar el escaneo
      await scannerRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            handleScanSuccess(result.getText());
          }
          if (error && !(error instanceof NotFoundException)) {
            console.warn('Error de escaneo (no crítico):', error);
          }
        }
      );

      setHasPermission(true);
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setError('No se pudo acceder a la cámara. Asegúrate de dar permisos y que no esté siendo usada por otra aplicación.');
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };
  // Función para detener la cámara
  const stopCamera = () => {
    if (scannerRef.current) {
      scannerRef.current.reset();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };
  // Manejar escaneo exitoso
  const handleScanSuccess = (data: string) => {
    console.log('Código QR detectado:', data);
    
    // Verificar si es un código QR válido de material
    if (data.includes('/material/detalle/') || 
        data.match(/^[A-Z]{3}-[a-zA-Z0-9]{6}$/) ||
        data.match(/^[a-zA-Z0-9]{6,}$/)) {
      
      stopCamera();
      onScan(data);
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
    }
  };
  // Efectos
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Función para escaneo manual (fallback)
  const handleManualScan = () => {
    const mockData = prompt("Ingresa el código QR manualmente (para pruebas):");
    if (mockData) {
      handleScanSuccess(mockData);
    }
  };

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

            {hasPermission && !isLoading && (
              <Box>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: 'auto',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0'
                  }}
                />
                
                {/* Overlay de escaneo */}
                <Box
                  position="relative"
                  mt={-4}
                  mx="auto"
                  width="200px"
                  height="200px"
                  border="2px solid"
                  borderColor="brand.500"
                  borderRadius="md"
                  bg="transparent"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    bottom: '-2px',
                    border: '20px solid',
                    borderColor: 'transparent',
                    borderTopColor: 'brand.500',
                    borderLeftColor: 'brand.500',
                    borderRadius: 'md',
                  }}
                  _after={{
                    content: '""',
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    bottom: '-2px',
                    border: '20px solid',
                    borderColor: 'transparent',
                    borderBottomColor: 'brand.500',
                    borderRightColor: 'brand.500',
                    borderRadius: 'md',
                  }}
                />

                <Text textAlign="center" mt={4} fontSize="sm" color="gray.600">
                  Mantén el código QR dentro del marco
                </Text>
              </Box>
            )}

            {hasPermission === false && !isLoading && (
              <VStack spacing={4}>
                <Alert status="warning">
                  <AlertIcon />
                  Se necesita acceso a la cámara para escanear códigos QR
                </Alert>
                <Button colorScheme="brand" onClick={startCamera}>
                  Intentar de nuevo
                </Button>
              </VStack>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>          <Button variant="outline" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          {hasPermission && (
            <Button colorScheme="brand" onClick={handleManualScan} size="sm">
              Ingreso Manual
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default QRScanner;
