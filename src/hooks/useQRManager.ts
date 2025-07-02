import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { obtenerMaterial } from 'src/services/MaterialService';
import { Material } from '../types/material';

interface UseQRManagerReturn {
  isScanning: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  handleQRScan: (qrData: string) => Promise<Material | null>;
  extractMaterialIdFromQR: (qrData: string) => string | null;
}

export const useQRManager = (): UseQRManagerReturn => {
  const [isScanning, setIsScanning] = useState(false);
  const toast = useToast();

  const openScanner = useCallback(() => {
    setIsScanning(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsScanning(false);
  }, []);

  // Extraer ID del material del código QR
  const extractMaterialIdFromQR = useCallback((qrData: string): string | null => {
    try {
      // Caso 1: URL completa del tipo "https://domain.com/material/detalle/ID"
      const urlMatch = qrData.match(/\/material\/detalle\/([^/?]+)/);
      if (urlMatch) {
        return urlMatch[1];
      }

      // Caso 2: Código corto del tipo "CUE-abc123" o similar
      const codeMatch = qrData.match(/^[A-Z]{3}-([a-zA-Z0-9]{6,})$/);
      if (codeMatch) {
        // El código corto contiene parte del ID del material
        return codeMatch[1];
      }

      // Caso 3: Solo el ID del material
      if (qrData.match(/^[a-zA-Z0-9]{6,}$/)) {
        return qrData;
      }

      return null;
    } catch (error) {
      console.error('Error al extraer ID del QR:', error);
      return null;
    }
  }, []);

  // Procesar el código QR escaneado
  const handleQRScan = useCallback(async (qrData: string): Promise<Material | null> => {
    try {
      console.log('Procesando QR:', qrData);
      
      // Extraer el ID del material
      const materialId = extractMaterialIdFromQR(qrData);
      
      if (!materialId) {
        toast({
          title: "Código QR no válido",
          description: "El código escaneado no corresponde a un material del sistema",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
        return null;
      }      // Buscar el material en la base de datos
      const material = await obtenerMaterial(materialId);
      
      if (!material) {
        toast({
          title: "Material no encontrado",
          description: `No se encontró un material con el ID: ${materialId}`,
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return null;
      }

      // Éxito
      toast({
        title: "¡Material encontrado!",
        description: `${material.nombre} - ${material.tipo}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      return material;

    } catch (error) {
      console.error('Error al procesar QR:', error);
      toast({
        title: "Error al procesar el código QR",
        description: "Hubo un problema al buscar el material. Inténtalo de nuevo.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return null;
    }
  }, [extractMaterialIdFromQR, toast]);

  return {
    isScanning,
    openScanner,
    closeScanner,
    handleQRScan,
    extractMaterialIdFromQR,
  };
};

export default useQRManager;
