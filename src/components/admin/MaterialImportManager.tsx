import React, { useState, useCallback } from 'react';
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
  Switch,
  Input,
  Alert,
  AlertIcon,
  Progress,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
  Divider,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { 
  FiUpload, 
  FiFile, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiXCircle,
  FiInfo,
  FiEye,
} from 'react-icons/fi';
import { Material } from '../../types/material';
import { 
  materialImportService, 
  ImportResult, 
  ImportOptions,
  ImportError,
  ImportWarning,
  ImportDuplicate
} from '../../services/MaterialImportService';

interface MaterialImportManagerProps {
  materials: Material[];
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (materials: Omit<Material, 'id'>[]) => Promise<void>;
}

const MaterialImportManager: React.FC<MaterialImportManagerProps> = ({
  materials,
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    updateDuplicates: false,
    validateOnly: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<Omit<Material, 'id'>[]>([]);
  const [currentStep, setCurrentStep] = useState<'select' | 'preview' | 'result'>('select');
  
  const toast = useToast();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
      setPreviewData([]);
      setCurrentStep('select');
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      
      const result = await materialImportService.importFromFile(
        selectedFile,
        materials,
        { ...importOptions, validateOnly: true }
      );
      
      setImportResult(result);
      
      if (result.success || result.importedCount > 0) {
        // Obtener datos para preview
        const materialsToImport = await materialImportService.getMaterialsFromResult(
          await parseFileForPreview(selectedFile),
          materials,
          importOptions
        );
        setPreviewData(materialsToImport);
        setCurrentStep('preview');
      } else {
        setCurrentStep('result');
      }
    } catch (error) {
      toast({
        title: 'Error al procesar archivo',
        description: error instanceof Error ? error.message : 'Error desconocido',
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseFileForPreview = async (file: File): Promise<any[]> => {
    // Esto es una función auxiliar para obtener datos raw para preview
    // En una implementación real, podrías extraer esta lógica del servicio
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Simplificado para el ejemplo
        resolve([]);
      };
      reader.readAsText(file);
    });
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      
      const result = await materialImportService.importFromFile(
        selectedFile,
        materials,
        importOptions
      );
      
      setImportResult(result);
      setCurrentStep('result');

      if (result.success && result.importedCount > 0) {
        // Obtener los materiales válidos para importar
        const materialsToImport = await materialImportService.getMaterialsFromResult(
          await parseFileForPreview(selectedFile),
          materials,
          importOptions
        );
        
        // Llamar a la función de importación exitosa
        await onImportSuccess(materialsToImport);
        
        toast({
          title: 'Importación exitosa',
          description: `Se han importado ${result.importedCount} materiales`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else if (result.errors.length > 0) {
        toast({
          title: 'Error en la importación',
          description: `Se encontraron ${result.errors.length} errores`,
          status: 'error',
          duration: 7000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error en la importación',
        description: error instanceof Error ? error.message : 'Error desconocido',
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportResult(null);
    setPreviewData([]);
    setCurrentStep('select');
  };

  const renderFileSelection = () => (
    <VStack spacing={6} align="stretch">
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">
            Importar materiales desde archivo
          </Text>
          <Text fontSize="sm">
            Soporta archivos CSV y Excel (.xlsx, .xls). Descarga la plantilla para ver el formato requerido.
          </Text>
        </Box>
      </Alert>

      <FormControl>
        <FormLabel>Seleccionar archivo</FormLabel>
        <Input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          p={1}
        />
        {selectedFile && (
          <HStack mt={2} spacing={2}>
            <Icon as={FiFile} color="blue.500" />
            <Text fontSize="sm" color="gray.600">
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </Text>
          </HStack>
        )}
      </FormControl>

      <VStack spacing={4} align="stretch">
        <Text fontWeight="semibold">Opciones de importación</Text>
        
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="skip-duplicates" mb="0" flex="1">
            Omitir duplicados
          </FormLabel>
          <Switch
            id="skip-duplicates"
            isChecked={importOptions.skipDuplicates}
            onChange={(e) => setImportOptions(prev => ({
              ...prev,
              skipDuplicates: e.target.checked,
              updateDuplicates: e.target.checked ? false : prev.updateDuplicates
            }))}
          />
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="update-duplicates" mb="0" flex="1">
            Actualizar duplicados
          </FormLabel>
          <Switch
            id="update-duplicates"
            isChecked={importOptions.updateDuplicates}
            onChange={(e) => setImportOptions(prev => ({
              ...prev,
              updateDuplicates: e.target.checked,
              skipDuplicates: e.target.checked ? false : prev.skipDuplicates
            }))}
          />
        </FormControl>
        
        <Text fontSize="sm" color="gray.600">
          Los duplicados se identifican por nombre o código de material
        </Text>
      </VStack>
    </VStack>
  );

  const renderPreview = () => (
    <VStack spacing={4} align="stretch">
      <Alert status="success" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">
            Vista previa de importación
          </Text>
          <Text fontSize="sm">
            Se importarán {previewData.length} materiales. Revisa los datos antes de confirmar.
          </Text>
        </Box>
      </Alert>

      {importResult && (
        <Accordion allowToggle>
          {importResult.warnings.length > 0 && (
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Icon as={FiAlertTriangle} color="orange.500" />
                      <Text>Advertencias ({importResult.warnings.length})</Text>
                    </HStack>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <List spacing={2}>
                  {importResult.warnings.map((warning, index) => (
                    <ListItem key={index}>
                      <ListIcon as={FiAlertTriangle} color="orange.500" />
                      <Text fontSize="sm">
                        Fila {warning.row}: {warning.message}
                      </Text>
                    </ListItem>
                  ))}
                </List>
              </AccordionPanel>
            </AccordionItem>
          )}

          {importResult.duplicates.length > 0 && (
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <HStack>
                      <Icon as={FiInfo} color="blue.500" />
                      <Text>Duplicados encontrados ({importResult.duplicates.length})</Text>
                    </HStack>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <List spacing={2}>
                  {importResult.duplicates.map((duplicate, index) => (
                    <ListItem key={index}>
                      <ListIcon as={FiInfo} color="blue.500" />
                      <Text fontSize="sm">
                        Fila {duplicate.row}: {duplicate.name} 
                        {duplicate.codigo && ` (${duplicate.codigo})`}
                      </Text>
                    </ListItem>
                  ))}
                </List>
              </AccordionPanel>
            </AccordionItem>
          )}
        </Accordion>
      )}

      <Button
        variant="outline"
        colorScheme="blue"
        onClick={onPreviewOpen}
        leftIcon={<Icon as={FiEye} />}
        size="sm"
      >
        Ver detalles de materiales ({previewData.length})
      </Button>
    </VStack>
  );

  const renderResult = () => (
    <VStack spacing={4} align="stretch">
      {importResult && (
        <>
          <Alert status={importResult.success ? "success" : "error"} borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">
                {importResult.success ? 'Importación completada' : 'Error en la importación'}
              </Text>
              <Text fontSize="sm">
                {importResult.success 
                  ? `Se importaron ${importResult.importedCount} materiales exitosamente`
                  : `Se encontraron ${importResult.errors.length} errores`
                }
              </Text>
            </Box>
          </Alert>

          <Tabs>
            <TabList>
              {importResult.errors.length > 0 && (
                <Tab>
                  <HStack>
                    <Icon as={FiXCircle} color="red.500" />
                    <Text>Errores ({importResult.errors.length})</Text>
                  </HStack>
                </Tab>
              )}
              {importResult.warnings.length > 0 && (
                <Tab>
                  <HStack>
                    <Icon as={FiAlertTriangle} color="orange.500" />
                    <Text>Advertencias ({importResult.warnings.length})</Text>
                  </HStack>
                </Tab>
              )}
              {importResult.duplicates.length > 0 && (
                <Tab>
                  <HStack>
                    <Icon as={FiInfo} color="blue.500" />
                    <Text>Duplicados ({importResult.duplicates.length})</Text>
                  </HStack>
                </Tab>
              )}
            </TabList>

            <TabPanels>
              {importResult.errors.length > 0 && (
                <TabPanel>
                  <List spacing={2}>
                    {importResult.errors.map((error, index) => (
                      <ListItem key={index}>
                        <ListIcon as={FiXCircle} color="red.500" />
                        <Text fontSize="sm">
                          Fila {error.row}: {error.message}
                          {error.field && ` (Campo: ${error.field})`}
                        </Text>
                      </ListItem>
                    ))}
                  </List>
                </TabPanel>
              )}
              
              {importResult.warnings.length > 0 && (
                <TabPanel>
                  <List spacing={2}>
                    {importResult.warnings.map((warning, index) => (
                      <ListItem key={index}>
                        <ListIcon as={FiAlertTriangle} color="orange.500" />
                        <Text fontSize="sm">
                          Fila {warning.row}: {warning.message}
                          {warning.field && ` (Campo: ${warning.field})`}
                        </Text>
                      </ListItem>
                    ))}
                  </List>
                </TabPanel>
              )}

              {importResult.duplicates.length > 0 && (
                <TabPanel>
                  <List spacing={2}>
                    {importResult.duplicates.map((duplicate, index) => (
                      <ListItem key={index}>
                        <ListIcon as={FiInfo} color="blue.500" />
                        <Text fontSize="sm">
                          Fila {duplicate.row}: {duplicate.name}
                          {duplicate.codigo && ` (${duplicate.codigo})`}
                        </Text>
                      </ListItem>
                    ))}
                  </List>
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </>
      )}
    </VStack>
  );

  const getStepButtons = () => {
    switch (currentStep) {
      case 'select':
        return (
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose} isDisabled={isProcessing}>
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              onClick={handlePreview}
              isLoading={isProcessing}
              loadingText="Validando..."
              isDisabled={!selectedFile}
              leftIcon={<Icon as={FiEye} />}
            >
              Vista previa
            </Button>
          </HStack>
        );
      
      case 'preview':
        return (
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleReset} isDisabled={isProcessing}>
              Volver
            </Button>
            <Button
              colorScheme="green"
              onClick={handleImport}
              isLoading={isProcessing}
              loadingText="Importando..."
              leftIcon={<Icon as={FiUpload} />}
            >
              Confirmar importación
            </Button>
          </HStack>
        );
      
      case 'result':
        return (
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleReset}>
              Importar otro archivo
            </Button>
            <Button colorScheme="blue" onClick={onClose}>
              Cerrar
            </Button>
          </HStack>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={FiUpload} />
              <Text>Importar Materiales</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {isProcessing && (
              <Box mb={4}>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Procesando archivo...
                </Text>
                <Progress size="sm" isIndeterminate colorScheme="blue" />
              </Box>
            )}

            {currentStep === 'select' && renderFileSelection()}
            {currentStep === 'preview' && renderPreview()}
            {currentStep === 'result' && renderResult()}
          </ModalBody>

          <ModalFooter>
            {getStepButtons()}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de vista previa de datos */}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Vista previa de materiales a importar</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {previewData.length > 0 ? (
              <Box overflowX="auto">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Nombre</Th>
                      <Th>Tipo</Th>
                      <Th>Código</Th>
                      <Th>Estado</Th>
                      <Th>Cantidad</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {previewData.slice(0, 20).map((material, index) => (
                      <Tr key={index}>
                        <Td>{material.nombre}</Td>
                        <Td>
                          <Badge colorScheme={
                            material.tipo === 'cuerda' ? 'blue' : 
                            material.tipo === 'anclaje' ? 'green' : 'purple'
                          }>
                            {material.tipo}
                          </Badge>
                        </Td>
                        <Td>{material.codigo || '-'}</Td>
                        <Td>
                          <Badge colorScheme={
                            material.estado === 'disponible' ? 'green' : 'orange'
                          }>
                            {material.estado}
                          </Badge>
                        </Td>
                        <Td>{material.cantidad}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                {previewData.length > 20 && (
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    Mostrando primeros 20 de {previewData.length} materiales
                  </Text>
                )}
              </Box>
            ) : (
              <Text>No hay datos para mostrar</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onPreviewClose}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default MaterialImportManager;
