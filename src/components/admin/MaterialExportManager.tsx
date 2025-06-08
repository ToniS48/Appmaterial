import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  Switch,
  Input,
  Divider,
  Icon,
  Alert,
  AlertIcon,
  Progress,
} from '@chakra-ui/react';
import { FiDownload, FiFileText, FiFile } from 'react-icons/fi';
import { Material } from '../../types/material';
import { materialExportService, ExportFormat } from '../../services/MaterialExportService';

interface MaterialExportManagerProps {
  materials: Material[];
  isOpen: boolean;
  onClose: () => void;
}

const MaterialExportManager: React.FC<MaterialExportManagerProps> = ({
  materials,
  isOpen,
  onClose,
}) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [includeSpecificFields, setIncludeSpecificFields] = useState(true);
  const [customFilename, setCustomFilename] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      await materialExportService.exportMaterials(materials, {
        format: exportFormat,
        includeMetadata,
        includeSpecificFields,
        filename: customFilename || undefined,
      });

      toast({
        title: 'Exportación exitosa',
        description: `Se han exportado ${materials.length} materiales en formato ${exportFormat.toUpperCase()}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error en la exportación',
        description: error instanceof Error ? error.message : 'Error desconocido',
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateTemplate = async () => {
    try {
      setIsExporting(true);
      
      await materialExportService.generateImportTemplate();
      
      toast({
        title: 'Plantilla generada',
        description: 'Se ha descargado la plantilla para importación de materiales',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error al generar plantilla',
        description: error instanceof Error ? error.message : 'Error desconocido',
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'excel':
        return FiFile;
      case 'csv':
        return FiFileText;
      case 'json':
        return FiFileText;
      default:
        return FiFileText;
    }
  };

  const getFormatDescription = (format: ExportFormat) => {
    switch (format) {
      case 'excel':
        return 'Archivo Excel (.xlsx) - Compatible con Microsoft Excel y Google Sheets';
      case 'csv':
        return 'Archivo CSV (.csv) - Compatible con cualquier hoja de cálculo';
      case 'json':
        return 'Archivo JSON (.json) - Formato de datos estructurado para desarrolladores';
      default:
        return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={FiDownload} />
            <Text>Exportar Materiales</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">
                  Se exportarán {materials.length} materiales
                </Text>
                <Text fontSize="sm">
                  Los archivos exportados pueden ser utilizados como respaldo o importados en otras herramientas
                </Text>
              </Box>
            </Alert>

            <FormControl>
              <FormLabel>Formato de exportación</FormLabel>
              <Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="json">JSON (.json)</option>
              </Select>
              <Text fontSize="sm" color="gray.600" mt={2}>
                <Icon as={getFormatIcon(exportFormat)} mr={2} />
                {getFormatDescription(exportFormat)}
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>Nombre del archivo (opcional)</FormLabel>
              <Input
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                placeholder="Ejemplo: inventario_enero_2024"
              />
              <Text fontSize="sm" color="gray.600" mt={1}>
                Si se deja vacío, se generará automáticamente con la fecha actual
              </Text>
            </FormControl>

            <VStack spacing={4} align="stretch">
              <Text fontWeight="semibold">Opciones de exportación</Text>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="include-specific" mb="0" flex="1">
                  Incluir campos específicos por tipo
                </FormLabel>
                <Switch
                  id="include-specific"
                  isChecked={includeSpecificFields}
                  onChange={(e) => setIncludeSpecificFields(e.target.checked)}
                />
              </FormControl>
              <Text fontSize="sm" color="gray.600" ml={4}>
                Incluye campos como longitud y diámetro para cuerdas, tipo de anclaje, etc.
              </Text>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="include-metadata" mb="0" flex="1">
                  Incluir metadatos
                </FormLabel>
                <Switch
                  id="include-metadata"
                  isChecked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                />
              </FormControl>
              <Text fontSize="sm" color="gray.600" ml={4}>
                Incluye fechas de creación y actualización de registros
              </Text>
            </VStack>

            <Divider />

            <Box>
              <Text fontWeight="semibold" mb={3}>
                Plantilla de importación
              </Text>
              <Text fontSize="sm" color="gray.600" mb={3}>
                Descarga una plantilla CSV con ejemplos para facilitar la importación de nuevos materiales
              </Text>
              <Button
                variant="outline"
                colorScheme="blue"
                onClick={handleGenerateTemplate}
                isLoading={isExporting}
                leftIcon={<Icon as={FiFileText} />}
                size="sm"
              >
                Descargar plantilla CSV
              </Button>
            </Box>

            {isExporting && (
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Procesando exportación...
                </Text>
                <Progress size="sm" isIndeterminate colorScheme="blue" />
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose} isDisabled={isExporting}>
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleExport}
              isLoading={isExporting}
              loadingText="Exportando..."
              leftIcon={<Icon as={FiDownload} />}
            >
              Exportar
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MaterialExportManager;
