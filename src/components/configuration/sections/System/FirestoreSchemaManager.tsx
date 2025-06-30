/**
 * Componente para administrar esquemas dinámicos de Firestore
 * Permite añadir/eliminar campos de colecciones de forma segura
 */

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  FormControl,
  FormLabel,
  Switch,
  NumberInput,
  NumberInputField,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
  Grid,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Wrap,
  WrapItem,
  Flex,
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tag,
  TagLabel,
  TagLeftIcon,
  Icon
} from '@chakra-ui/react';
import {
  FiPlus as AddIcon,
  FiTrash2 as DeleteIcon,
  FiInfo as InfoIcon,
  FiCheckCircle as CheckCircleIcon,
  FiDatabase as DatabaseIcon,
  FiSettings as SettingsIcon,
  FiUser as UserIcon,
  FiLayers as LayersIcon,
  FiRefreshCw as RepeatIcon,
  FiAlertTriangle as WarningIcon
} from 'react-icons/fi';
import { 
  firestoreDynamicService, 
  SchemaField, 
  FieldDefinition,
  NormalizationOptions,
  NormalizationResult,
  DocumentNormalizationNeeds
} from '../../../../services/firestore/FirestoreDynamicService';
import { useFirestoreSchemaManager } from '../../../../hooks/business/useFirestoreSchemaManager';

interface ScanResult {
  mode: 'quick' | 'smart' | 'deep';
  fields: SchemaField[];
  timestamp: Date;
  documentsAnalyzed: number;
  collectionName: string;
}

interface FieldsSummaryProps {
  schema: any;
  outdatedDocumentsCount: number;
  isAnalyzingOutdated: boolean;
  onNormalizeClick: () => void;
}

/**
 * Componente para normalización de documentos
 */
interface DocumentNormalizationSectionProps {
  outdatedDocumentsCount: number;
  isNormalizing: boolean;
  handleNormalizeWithConfirmation: () => void;
}

const DocumentNormalizationSection: React.FC<DocumentNormalizationSectionProps> = ({
  outdatedDocumentsCount,
  isNormalizing,
  handleNormalizeWithConfirmation
}) => {
  const {
    selectedCollection,
    schema,
    loading,
    analyzeNormalizationNeeds,
    normalizeDocuments
  } = useFirestoreSchemaManager();
  
  const [normalizationNeeds, setNormalizationNeeds] = useState<DocumentNormalizationNeeds[]>([]);
  const [normalizationResult, setNormalizationResult] = useState<NormalizationResult | null>(null);
  const [normalizationOptions, setNormalizationOptions] = useState<NormalizationOptions>({
    strategy: {
      addMissingFields: true,
      useDefaultValues: true,
      removeUnknownFields: false,
      updateExistingFields: false
    },
    batchSize: 50,
    dryRun: true,
    backupBeforeChange: true
  });
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showNormalizationModal, setShowNormalizationModal] = useState(false);
  const toast = useToast();

  const handleAnalyzeNeeds = async () => {
    try {
      const needs = await analyzeNormalizationNeeds(100);
      setNormalizationNeeds(needs);
      setShowAnalysisModal(true);
    } catch (error) {
      toast({
        title: 'Error en análisis',
        description: error instanceof Error ? error.message : 'Error desconocido',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  const handleNormalizeDocuments = async () => {
    try {
      const result = await normalizeDocuments(normalizationOptions);
      setNormalizationResult(result);
      setShowNormalizationModal(true);
      
      toast({
        title: normalizationOptions.dryRun ? 'Simulación completada' : 'Normalización completada',
        description: `${result.documentsUpdated}/${result.totalDocuments} documentos procesados`,
        status: 'success',
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Error en normalización',
        description: error instanceof Error ? error.message : 'Error desconocido',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    }
  };

  if (!selectedCollection || !schema) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <Heading size="md">
          <HStack>
            <Icon as={SettingsIcon} />
            <Text>Normalización de Documentos</Text>
          </HStack>
        </Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={6} align="stretch">
          <Alert status="info">
            <AlertIcon />
            <Box>
              <AlertTitle>¿Qué es la normalización?</AlertTitle>
              <AlertDescription>
                La normalización actualiza todos los documentos para que tengan la misma estructura,
                añadiendo campos faltantes y corrigiendo tipos de datos inconsistentes.
              </AlertDescription>
            </Box>
          </Alert>

          {/* Opciones de normalización */}
          <Box>
            <Heading size="sm" mb={4}>Opciones de Normalización</Heading>
            <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
              <FormControl>
                <HStack>
                  <Switch
                    isChecked={normalizationOptions.strategy.addMissingFields}
                    onChange={(e) => setNormalizationOptions(prev => ({
                      ...prev,
                      strategy: { ...prev.strategy, addMissingFields: e.target.checked }
                    }))}
                  />
                  <Text>Añadir campos faltantes</Text>
                </HStack>
              </FormControl>

              <FormControl>
                <HStack>
                  <Switch
                    isChecked={normalizationOptions.strategy.useDefaultValues}
                    onChange={(e) => setNormalizationOptions(prev => ({
                      ...prev,
                      strategy: { ...prev.strategy, useDefaultValues: e.target.checked }
                    }))}
                  />
                  <Text>Usar valores por defecto</Text>
                </HStack>
              </FormControl>

              <FormControl>
                <HStack>
                  <Switch
                    isChecked={normalizationOptions.strategy.removeUnknownFields}
                    onChange={(e) => setNormalizationOptions(prev => ({
                      ...prev,
                      strategy: { ...prev.strategy, removeUnknownFields: e.target.checked }
                    }))}
                  />
                  <Text>Eliminar campos desconocidos</Text>
                </HStack>
              </FormControl>

              <FormControl>
                <HStack>
                  <Switch
                    isChecked={normalizationOptions.strategy.updateExistingFields}
                    onChange={(e) => setNormalizationOptions(prev => ({
                      ...prev,
                      strategy: { ...prev.strategy, updateExistingFields: e.target.checked }
                    }))}
                  />
                  <Text>Actualizar tipos de campos</Text>
                </HStack>
              </FormControl>

              <FormControl>
                <HStack>
                  <Switch
                    isChecked={normalizationOptions.dryRun}
                    onChange={(e) => setNormalizationOptions(prev => ({
                      ...prev,
                      dryRun: e.target.checked
                    }))}
                  />
                  <Text>Solo simular (no aplicar cambios)</Text>
                </HStack>
              </FormControl>

              <FormControl>
                <HStack>
                  <Switch
                    isChecked={normalizationOptions.backupBeforeChange}
                    onChange={(e) => setNormalizationOptions(prev => ({
                      ...prev,
                      backupBeforeChange: e.target.checked
                    }))}
                  />
                  <Text>Crear backup antes de cambios</Text>
                </HStack>
              </FormControl>
            </Grid>
          </Box>

          {/* Acciones */}
          <HStack spacing={4}>
            <Button
              leftIcon={<InfoIcon />}
              onClick={handleAnalyzeNeeds}
              isLoading={loading}
              colorScheme="blue"
              variant="outline"
            >
              Analizar Necesidades
            </Button>
            
            <Button
              leftIcon={<SettingsIcon />}
              onClick={handleNormalizeDocuments}
              isLoading={loading}
              colorScheme={normalizationOptions.dryRun ? "green" : "orange"}
              isDisabled={!selectedCollection}
            >
              {normalizationOptions.dryRun ? 'Simular Normalización' : 'Normalizar Documentos'}
            </Button>
          </HStack>

          {/* Resumen de necesidades */}
          {normalizationNeeds.length > 0 && (
            <Box>
              <Heading size="sm" mb={3}>Resumen de Análisis</Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Stat>
                  <StatLabel>Documentos que necesitan actualización</StatLabel>
                  <StatNumber>{normalizationNeeds.length}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Campos faltantes más comunes</StatLabel>
                  <StatNumber>
                    {normalizationNeeds.reduce((acc, doc) => acc + doc.missingFields.length, 0)}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Campos desconocidos encontrados</StatLabel>
                  <StatNumber>
                    {normalizationNeeds.reduce((acc, doc) => acc + doc.unknownFields.length, 0)}
                  </StatNumber>
                </Stat>
              </SimpleGrid>
            </Box>
          )}
        </VStack>

        {/* Modal de análisis detallado */}
        <Modal 
          isOpen={showAnalysisModal} 
          onClose={() => setShowAnalysisModal(false)}
          size="xl"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Análisis de Normalización Detallado</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                {normalizationNeeds.slice(0, 10).map((need) => (
                  <Box key={need.documentId} p={4} borderWidth={1} borderRadius="md">
                    <Text fontWeight="bold">Documento: {need.documentId}</Text>
                    
                    {need.missingFields.length > 0 && (
                      <Box mt={2}>
                        <Text fontSize="sm" fontWeight="medium">Campos faltantes:</Text>
                        <Wrap>
                          {need.missingFields.map(field => (
                            <WrapItem key={field}>
                              <Tag size="sm" colorScheme="red">
                                <TagLabel>{field}</TagLabel>
                              </Tag>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Box>
                    )}
                    
                    {need.unknownFields.length > 0 && (
                      <Box mt={2}>
                        <Text fontSize="sm" fontWeight="medium">Campos desconocidos:</Text>
                        <Wrap>
                          {need.unknownFields.map(field => (
                            <WrapItem key={field}>
                              <Tag size="sm" colorScheme="orange">
                                <TagLabel>{field}</TagLabel>
                              </Tag>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </Box>
                    )}
                  </Box>
                ))}
                
                {normalizationNeeds.length > 10 && (
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    ... y {normalizationNeeds.length - 10} documentos más
                  </Text>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setShowAnalysisModal(false)}>Cerrar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal de resultados de normalización */}
        <Modal 
          isOpen={showNormalizationModal} 
          onClose={() => setShowNormalizationModal(false)}
          size="lg"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {normalizationResult?.backupId ? 'Normalización Completada' : 'Simulación Completada'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {normalizationResult && (
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={2} spacing={4}>
                    <Stat>
                      <StatLabel>Total de documentos</StatLabel>
                      <StatNumber>{normalizationResult.totalDocuments}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Documentos actualizados</StatLabel>
                      <StatNumber>{normalizationResult.documentsUpdated}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Documentos procesados</StatLabel>
                      <StatNumber>{normalizationResult.documentsProcessed}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Errores</StatLabel>
                      <StatNumber color={normalizationResult.errors.length > 0 ? 'red.500' : 'green.500'}>
                        {normalizationResult.errors.length}
                      </StatNumber>
                    </Stat>
                  </SimpleGrid>

                  {normalizationResult.backupId && (
                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Backup creado</AlertTitle>
                        <AlertDescription>
                          ID del backup: {normalizationResult.backupId}
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}

                  {normalizationResult.errors.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" color="red.500">Errores encontrados:</Text>
                      <VStack spacing={2} align="stretch">
                        {normalizationResult.errors.slice(0, 5).map((error, index) => (
                          <Text key={index} fontSize="sm" color="red.600">
                            {error.documentId}: {error.error}
                          </Text>
                        ))}
                        {normalizationResult.errors.length > 5 && (
                          <Text fontSize="sm" color="gray.500">
                            ... y {normalizationResult.errors.length - 5} errores más
                          </Text>
                        )}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setShowNormalizationModal(false)}>Cerrar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </CardBody>
    </Card>
  );
};

const FieldsSummary: React.FC<FieldsSummaryProps> = ({ 
  schema, 
  outdatedDocumentsCount, 
  isAnalyzingOutdated, 
  onNormalizeClick 
}) => {
  const baseFieldsCount = schema?.baseFields?.length || 0;
  const customFieldsCount = schema?.customFields?.length || 0;
  const detectedFieldsCount = schema?.detectedFields?.length || 0;
  const totalFields = baseFieldsCount + customFieldsCount + detectedFieldsCount;

  return (
    <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4} mb={6}>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>
              <HStack>
                <Icon as={DatabaseIcon} color="blue.500" />
                <Text>Total de Campos</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="blue.600">{totalFields}</StatNumber>
          </Stat>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>
              <HStack>
                <Icon as={SettingsIcon} color="gray.500" />
                <Text>Campos Esenciales</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="gray.600">{baseFieldsCount}</StatNumber>
          </Stat>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>
              <HStack>
                <Icon as={UserIcon} color="green.500" />
                <Text>Campos Personalizados</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="green.600">{customFieldsCount}</StatNumber>
          </Stat>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>
              <HStack>
                <Icon as={InfoIcon} color="orange.500" />
                <Text>Campos Detectados</Text>
              </HStack>
            </StatLabel>
            <StatNumber color="orange.600">{detectedFieldsCount}</StatNumber>
          </Stat>
        </CardBody>
      </Card>
      {/* Nueva card para documentos desactualizados */}
      <Card 
        borderColor={outdatedDocumentsCount > 0 ? "red.200" : "green.200"} 
        borderWidth={2}
        bg={outdatedDocumentsCount > 0 ? "red.50" : "green.50"}
      >
        <CardBody>
          <Stat>
            <StatLabel>
              <HStack>
                <Icon 
                  as={outdatedDocumentsCount > 0 ? WarningIcon : CheckCircleIcon} 
                  color={outdatedDocumentsCount > 0 ? "red.500" : "green.500"} 
                />
                <Text>Docs. Desactualizados</Text>
              </HStack>
            </StatLabel>
            <StatNumber color={outdatedDocumentsCount > 0 ? "red.600" : "green.600"}>
              {isAnalyzingOutdated ? (
                <Spinner size="sm" />
              ) : (
                outdatedDocumentsCount
              )}
            </StatNumber>
            {outdatedDocumentsCount > 0 && (
              <StatHelpText>
                <Button
                  size="xs"
                  colorScheme="red"
                  variant="outline"
                  onClick={onNormalizeClick}
                  leftIcon={<SettingsIcon />}
                >
                  Normalizar
                </Button>
              </StatHelpText>
            )}
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  );
};

interface ExistingFieldsDisplayProps {
  schema: any;
  onRemoveField: (fieldName: string) => void;
  loading: boolean;
  selectedCollection: string;
  onAddField: () => void;
}

const ExistingFieldsDisplay: React.FC<ExistingFieldsDisplayProps> = ({ 
  schema, 
  onRemoveField, 
  loading,
  selectedCollection,
  onAddField
}) => {
  if (!schema) return null;

  const renderFieldTag = (field: any, fieldType: 'base' | 'custom' | 'detected') => {
    const getTypeColor = (type: string) => {
      switch (type) {
        case 'string': return 'blue';
        case 'number': return 'orange';
        case 'boolean': return 'purple';
        case 'array': return 'teal';
        case 'object': return 'cyan';
        case 'date': return 'pink';
        default: return 'gray';
      }
    };

    const getFieldTypeColor = (type: 'base' | 'custom' | 'detected') => {
      switch (type) {
        case 'base': return 'gray';
        case 'custom': return 'green';
        case 'detected': return 'orange';
        default: return 'gray';
      }
    };

    const getFieldIcon = (type: 'base' | 'custom' | 'detected') => {
      switch (type) {
        case 'base': return SettingsIcon;
        case 'custom': return UserIcon;
        case 'detected': return InfoIcon;
        default: return SettingsIcon;
      }
    };

    return (
      <Tag
        key={field.name}
        size="lg"
        colorScheme={getFieldTypeColor(fieldType)}
        variant={fieldType === 'base' ? 'solid' : 'outline'}
        borderWidth={fieldType === 'base' ? 0 : 2}
        p={2}
      >
        <TagLeftIcon 
          as={getFieldIcon(fieldType)} 
          boxSize="12px" 
        />
        <TagLabel>
          <VStack spacing={0} align="start">
            <Text fontSize="sm" fontWeight="bold">
              {field.name}
            </Text>
            <HStack spacing={1}>
              <Badge size="xs" colorScheme={getTypeColor(field.definition.type)}>
                {field.definition.type}
              </Badge>
              {field.definition.required && (
                <Badge size="xs" colorScheme="red" variant="outline">
                  requerido
                </Badge>
              )}
              {fieldType === 'detected' && (
                <Badge size="xs" colorScheme="orange" variant="outline">
                  detectado
                </Badge>
              )}
            </HStack>
            {field.definition.description && (
              <Text fontSize="xs" color="gray.600" maxW="200px" isTruncated>
                {field.definition.description}
              </Text>
            )}
          </VStack>
        </TagLabel>
        {fieldType === 'custom' && (
          <IconButton
            size="xs"
            icon={<DeleteIcon />}
            colorScheme="red"
            variant="ghost"
            onClick={() => onRemoveField(field.name)}
            isDisabled={loading}
            ml={2}
            aria-label={`Eliminar campo ${field.name}`}
          />
        )}
      </Tag>
    );
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Campos Base (Esenciales) */}
      {schema.baseFields.length > 0 && (
        <Box>
          <HStack mb={3}>
            <Icon as={SettingsIcon} color="gray.500" />
            <Text fontSize="lg" fontWeight="bold" color="gray.700">
              Campos Esenciales ({schema.baseFields.length})
            </Text>
          </HStack>
          <Text fontSize="sm" color="gray.600" mb={3}>
            Campos fundamentales del esquema que no pueden ser eliminados.
          </Text>
          <Wrap spacing={3}>
            {schema.baseFields.map((field: any) => renderFieldTag(field, 'base'))}
          </Wrap>
        </Box>
      )}

      {/* Campos Personalizados */}
      {schema.customFields.length > 0 && (
        <Box>
          <HStack mb={3} justifyContent="space-between">
            <HStack>
              <Icon as={UserIcon} color="green.500" />
              <Text fontSize="lg" fontWeight="bold" color="green.700">
                Campos Personalizados ({schema.customFields.length})
              </Text>
            </HStack>
            <Button
              colorScheme="blue"
              leftIcon={<AddIcon />}
              onClick={onAddField}
              isDisabled={!selectedCollection || loading}
              size="sm"
            >
              Añadir Campo
            </Button>
          </HStack>
          <Text fontSize="sm" color="gray.600" mb={3}>
            Campos añadidos manualmente que se pueden gestionar y eliminar.
          </Text>
          <Wrap spacing={3}>
            {schema.customFields.map((field: any) => renderFieldTag(field, 'custom'))}
          </Wrap>
        </Box>
      )}

      {/* Sección para añadir campos personalizados cuando no hay ninguno */}
      {schema.customFields.length === 0 && (
        <Box>
          <HStack mb={3} justifyContent="space-between">
            <HStack>
              <Icon as={UserIcon} color="green.500" />
              <Text fontSize="lg" fontWeight="bold" color="green.700">
                Campos Personalizados (0)
              </Text>
            </HStack>
            <Button
              colorScheme="blue"
              leftIcon={<AddIcon />}
              onClick={onAddField}
              isDisabled={!selectedCollection || loading}
              size="sm"
            >
              Añadir Campo
            </Button>
          </HStack>
          <Text fontSize="sm" color="gray.600" mb={3}>
            No hay campos personalizados. Añade campos adicionales que necesite tu aplicación.
          </Text>
        </Box>
      )}

      {/* Campos Detectados */}
      {schema.detectedFields.length > 0 && (
        <Box>
          <HStack mb={3} justifyContent="space-between">
            <HStack>
              <Icon as={InfoIcon} color="orange.500" />
              <Text fontSize="lg" fontWeight="bold" color="orange.700">
                Campos Detectados Automáticamente ({schema.detectedFields.length})
              </Text>
            </HStack>
            <Button
              colorScheme="blue"
              leftIcon={<AddIcon />}
              onClick={onAddField}
              isDisabled={!selectedCollection || loading}
              size="sm"
            >
              Añadir Campo
            </Button>
          </HStack>
          <Alert status="info" mb={3}>
            <AlertIcon />
            <Box>
              <AlertTitle fontSize="sm">Campos encontrados en documentos existentes</AlertTitle>
              <AlertDescription fontSize="xs">
                Estos campos se detectaron automáticamente en sus documentos pero no están oficialmente en el esquema. 
                Puede convertirlos a campos personalizados para gestionarlos.
              </AlertDescription>
            </Box>
          </Alert>
          <Wrap spacing={3}>
            {schema.detectedFields.map((field: any) => renderFieldTag(field, 'detected'))}
          </Wrap>
        </Box>
      )}

      {/* Mensaje si no hay campos */}
      {schema.baseFields.length === 0 && schema.customFields.length === 0 && schema.detectedFields.length === 0 && (
        <Box textAlign="center" py={8}>
          <Icon as={LayersIcon} boxSize={12} color="gray.400" mb={4} />
          <Text fontSize="lg" color="gray.500" mb={2}>
            No se encontraron campos en esta colección
          </Text>
          <Text fontSize="sm" color="gray.400" mb={4}>
            Use el análisis inteligente para detectar campos automáticamente o añada campos manualmente
          </Text>
          <Button
            colorScheme="blue"
            leftIcon={<AddIcon />}
            onClick={onAddField}
            isDisabled={!selectedCollection || loading}
            size="md"
          >
            Añadir Campo
          </Button>
        </Box>
      )}
    </VStack>
  );
};

interface AddFieldDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (fieldName: string, definition: FieldDefinition) => void;
  existingFields: string[];
  validateFieldName: (name: string) => { isValid: boolean; error?: string };
  validateFieldDefinition: (def: FieldDefinition) => { isValid: boolean; errors: string[] };
}

const AddFieldDialog: React.FC<AddFieldDialogProps> = ({ 
  open, 
  onClose, 
  onConfirm, 
  existingFields,
  validateFieldName,
  validateFieldDefinition
}) => {
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<FieldDefinition['type']>('string');
  const [defaultValue, setDefaultValue] = useState('');
  const [required, setRequired] = useState(false);
  const [description, setDescription] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [enumValues, setEnumValues] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const fieldTypes = firestoreDynamicService.getAvailableFieldTypes();

  // Verificar si el campo ya existe cuando cambia el nombre
  const checkFieldExistence = (name: string) => {
    if (!name.trim()) {
      setWarnings([]);
      return;
    }

    const newWarnings: string[] = [];
    
    if (existingFields.includes(name)) {
      newWarnings.push(`El campo "${name}" ya existe en esta colección.`);
    }

    // Verificar nombres similares para evitar confusión
    const similarFields = existingFields.filter(field => 
      field.toLowerCase().includes(name.toLowerCase()) && field !== name
    );
    
    if (similarFields.length > 0) {
      newWarnings.push(`Campos similares encontrados: ${similarFields.join(', ')}`);
    }

    setWarnings(newWarnings);
  };

  // Actualizar advertencias cuando cambia el nombre del campo
  React.useEffect(() => {
    checkFieldExistence(fieldName);
  }, [fieldName, existingFields]);

  const handleConfirm = () => {
    const validationErrors: string[] = [];

    // Validar nombre del campo usando la lógica de negocio
    const nameValidation = validateFieldName(fieldName);
    if (!nameValidation.isValid) {
      validationErrors.push(nameValidation.error || 'Nombre de campo inválido');
    }

    // Crear definición del campo
    const definition: FieldDefinition = {
      type: fieldType,
      required
    };
    
    // Solo añadir descripción si tiene contenido
    if (description.trim()) {
      definition.description = description.trim();
    }

    // Procesar valor por defecto
    if (defaultValue.trim()) {
      try {
        switch (fieldType) {
          case 'number':
            definition.default = parseFloat(defaultValue);
            if (isNaN(definition.default)) {
              validationErrors.push('El valor por defecto debe ser un número válido');
            }
            break;
          case 'boolean':
            definition.default = defaultValue.toLowerCase() === 'true';
            break;
          case 'array':
          case 'object':
            definition.default = JSON.parse(defaultValue);
            break;
          default:
            definition.default = defaultValue;
        }
      } catch (error) {
        validationErrors.push('Valor por defecto inválido para el tipo seleccionado');
      }
    }

    // Validar rangos numéricos
    if (fieldType === 'number') {
      if (minValue.trim()) {
        definition.min = parseFloat(minValue);
        if (isNaN(definition.min)) {
          validationErrors.push('El valor mínimo debe ser un número válido');
        }
      }
      if (maxValue.trim()) {
        definition.max = parseFloat(maxValue);
        if (isNaN(definition.max)) {
          validationErrors.push('El valor máximo debe ser un número válido');
        }
      }
      if (definition.min !== undefined && definition.max !== undefined && definition.min > definition.max) {
        validationErrors.push('El valor mínimo no puede ser mayor que el máximo');
      }
    }

    // Procesar enum
    if (enumValues.trim()) {
      try {
        definition.enum = enumValues.split(',').map(v => v.trim()).filter(v => v);
        if (definition.enum.length === 0) {
          validationErrors.push('Debe proporcionar al menos un valor para la lista');
        }
      } catch (error) {
        validationErrors.push('Lista de valores inválida');
      }
    }

    // Validar definición usando la lógica de negocio
    const definitionValidation = validateFieldDefinition(definition);
    if (!definitionValidation.isValid) {
      validationErrors.push(...definitionValidation.errors);
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onConfirm(fieldName, definition);
    handleClose();
  };

  const handleClose = () => {
    setFieldName('');
    setFieldType('string');
    setDefaultValue('');
    setRequired(false);
    setDescription('');
    setMinValue('');
    setMaxValue('');
    setEnumValues('');
    setErrors([]);
    setWarnings([]);
    onClose();
  };

  const renderTypeSpecificFields = () => {
    switch (fieldType) {
      case 'number':
        return (
          <VStack spacing={3}>
            <FormControl>
              <FormLabel>Valor mínimo (opcional)</FormLabel>
              <NumberInput value={minValue} onChange={(value) => setMinValue(value)}>
                <NumberInputField />
              </NumberInput>
            </FormControl>
            <FormControl>
              <FormLabel>Valor máximo (opcional)</FormLabel>
              <NumberInput value={maxValue} onChange={(value) => setMaxValue(value)}>
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </VStack>
        );
      case 'string':
        return (
          <FormControl>
            <FormLabel>Valores permitidos (separados por comas, opcional)</FormLabel>
            <Input
              value={enumValues}
              onChange={(e) => setEnumValues(e.target.value)}
              placeholder="valor1, valor2, valor3"
            />
            <Text fontSize="sm" color="gray.500" mt={1}>
              Deje vacío para permitir cualquier texto
            </Text>
          </FormControl>
        );
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Añadir Campo Personalizado</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            {/* Errores de validación */}
            {errors.length > 0 && (
              <Alert status="error">
                <AlertIcon />
                <Box>
                  <AlertTitle>Errores de validación:</AlertTitle>
                  <AlertDescription>
                    <ul>
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {/* Advertencias */}
            {warnings.length > 0 && (
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle>Advertencias:</AlertTitle>
                  <AlertDescription>
                    <ul>
                      {warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} w="100%">
              <FormControl isRequired>
                <FormLabel>Nombre del campo</FormLabel>
                <Input
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="nombreCampo"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Tipo de dato</FormLabel>
                <Select value={fieldType} onChange={(e) => setFieldType(e.target.value as FieldDefinition['type'])}>
                  {fieldTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <FormControl>
              <FormLabel>Descripción (opcional)</FormLabel>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe para qué sirve este campo"
              />
            </FormControl>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} w="100%" alignItems="center">
              <FormControl>
                <FormLabel>Valor por defecto (opcional)</FormLabel>
                <Input
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  placeholder={`Valor por defecto para ${fieldType}`}
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="required-switch" mb="0">
                  Campo requerido
                </FormLabel>
                <Switch
                  id="required-switch"
                  isChecked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                />
              </FormControl>
            </Grid>

            {/* Campos específicos por tipo */}
            {renderTypeSpecificFields()}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleConfirm}
            isDisabled={!fieldName.trim()}
          >
            Añadir Campo
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const FirestoreSchemaManager: React.FC = () => {
  const {
    selectedCollection,
    schema,
    documents,
    loading,
    error,
    success,
    setSelectedCollection,
    loadCollectionData,
    addCustomField,
    removeCustomField,
    clearMessages,
    getAvailableCollections,
    getExistingFieldNames,
    validateFieldName,
    validateFieldDefinition,
    loadAvailableCollections,
    analyzeNormalizationNeeds,
    normalizeDocuments
  } = useFirestoreSchemaManager();

  const [addFieldDialogOpen, setAddFieldDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [scanMode, setScanMode] = useState<'quick' | 'smart' | 'deep'>('smart');
  const [scanResults, setScanResults] = useState<ScanResult | null>(null);
  const [isAdvancedScanning, setIsAdvancedScanning] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [isApplyingDetected, setIsApplyingDetected] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [outdatedDocumentsCount, setOutdatedDocumentsCount] = useState<number>(0);
  const [isAnalyzingOutdated, setIsAnalyzingOutdated] = useState(false);
  const [showNormalizationConfirmModal, setShowNormalizationConfirmModal] = useState(false);

  const toast = useToast();
  const availableCollections = getAvailableCollections();

  // Función para analizar documentos desactualizados
  const analyzeOutdatedDocuments = async () => {
    if (!selectedCollection) return;
    
    setIsAnalyzingOutdated(true);
    try {
      const needs = await analyzeNormalizationNeeds(100); // Analizar hasta 100 documentos
      setOutdatedDocumentsCount(needs.length);
    } catch (error) {
      console.error('Error analizando documentos desactualizados:', error);
      setOutdatedDocumentsCount(0);
    } finally {
      setIsAnalyzingOutdated(false);
    }
  };

  // Función para normalizar documentos con confirmación
  const handleNormalizeWithConfirmation = async () => {
    if (!selectedCollection) return;
    
    setIsNormalizing(true);
    try {
      const normalizationOptions: NormalizationOptions = {
        strategy: {
          addMissingFields: true,
          useDefaultValues: true,
          removeUnknownFields: false,
          updateExistingFields: false
        },
        batchSize: 50,
        dryRun: false, // Aplicar cambios reales
        backupBeforeChange: true
      };

      const result = await normalizeDocuments(normalizationOptions);
      
      toast({
        title: 'Normalización completada',
        description: `${result.documentsUpdated}/${result.totalDocuments} documentos actualizados correctamente`,
        status: 'success',
        duration: 8000,
        isClosable: true
      });
      
      // Reanalizar después de normalizar
      await analyzeOutdatedDocuments();
      setShowNormalizationConfirmModal(false);
      
    } catch (error) {
      toast({
        title: 'Error en normalización',
        description: error instanceof Error ? error.message : 'Error desconocido',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsNormalizing(false);
    }
  };

  // Función para refrescar colecciones con indicador de carga
  const handleRefreshCollections = async () => {
    try {
      setIsLoadingCollections(true);
      await loadAvailableCollections();
      toast({
        title: 'Colecciones actualizadas',
        description: `Se detectaron ${availableCollections.length} colecciones disponibles`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Error actualizando colecciones',
        description: error instanceof Error ? error.message : 'Error desconocido',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoadingCollections(false);
    }
  };

  React.useEffect(() => {
    if (selectedCollection) {
      loadCollectionData();
      // Analizar documentos desactualizados cuando se selecciona una colección
      analyzeOutdatedDocuments();
    }
  }, [selectedCollection, loadCollectionData]);

  React.useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        clearMessages();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success, clearMessages]);

  const handleAddField = async (fieldName: string, definition: FieldDefinition) => {
    await addCustomField(fieldName, definition);
  };

  const handleRemoveField = async (fieldName: string) => {
    if (window.confirm(`¿Está seguro de que desea eliminar el campo "${fieldName}"?`)) {
      await removeCustomField(fieldName);
    }
  };

  const performAdvancedScan = async () => {
    if (!selectedCollection) {
      toast({
        title: 'Error',
        description: 'Selecciona una colección primero',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsAdvancedScanning(true);
    try {
      console.log(`[ADVANCED-SCAN] Iniciando análisis ${scanMode} en ${selectedCollection}...`);
      
      let detectedFields: any[];
      let documentsAnalyzed = 0;
      
      switch (scanMode) {
        case 'smart':
          detectedFields = await firestoreDynamicService.smartSampleAnalysis(selectedCollection as any, 50);
          documentsAnalyzed = 50;
          break;
        case 'quick':
          // Para quick, usar el método tradicional pero más rápido
          const quickFields = await firestoreDynamicService.detectExistingFields(selectedCollection as any);
          detectedFields = quickFields.map(name => ({
            name,
            definition: { type: 'string' as const, required: false, description: 'Campo detectado (método rápido)' },
            isCustom: false
          }));
          documentsAnalyzed = 10;
          break;
        case 'deep':
          detectedFields = await firestoreDynamicService.smartSampleAnalysis(selectedCollection as any, 200);
          documentsAnalyzed = 200;
          break;
        default:
          detectedFields = await firestoreDynamicService.detectExistingFields(selectedCollection as any);
          documentsAnalyzed = 10;
      }
      
      const results: ScanResult = {
        mode: scanMode,
        fields: Array.isArray(detectedFields) ? 
          (typeof detectedFields[0] === 'string' ? 
            detectedFields.map(name => ({
              name,
              definition: { type: 'string' as const, required: false, description: 'Campo detectado' },
              isCustom: false
            })) : 
            detectedFields
          ) : [],
        timestamp: new Date(),
        documentsAnalyzed,
        collectionName: selectedCollection
      };
      
      setScanResults(results);
      
      toast({
        title: 'Análisis completado',
        description: `Se detectaron ${results.fields.length} campos únicos usando análisis ${scanMode}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      console.log(`[ADVANCED-SCAN] Análisis completado:`, results);
      
      // Recargar los datos de la colección para mostrar campos detectados
      await loadCollectionData(selectedCollection, true);
      
    } catch (error) {
      console.error('[ADVANCED-SCAN] Error en análisis:', error);
      toast({
        title: 'Error en análisis',
        description: `Error analizando ${selectedCollection}: ${error}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAdvancedScanning(false);
    }
  };

  const applyDetectedFieldsToSchema = async () => {
    if (!scanResults || scanResults.fields.length === 0) {
      toast({
        title: 'Error',
        description: 'No hay campos detectados para aplicar',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsApplyingDetected(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const field of scanResults.fields) {
        try {
          await firestoreDynamicService.addCustomField(
            selectedCollection as any,
            field.name,
            field.definition
          );
          successCount++;
        } catch (error) {
          console.error(`Error añadiendo campo ${field.name}:`, error);
          errorCount++;
        }
      }

      toast({
        title: 'Campos aplicados',
        description: `${successCount} campos añadidos correctamente. ${errorCount > 0 ? `${errorCount} errores.` : ''}`,
        status: errorCount > 0 ? 'warning' : 'success',
        duration: 5000,
        isClosable: true,
      });

      // Limpiar resultados del análisis y recargar datos
      setScanResults(null);
      await loadCollectionData(selectedCollection, true);

    } catch (error) {
      console.error('Error aplicando campos detectados:', error);
      toast({
        title: 'Error',
        description: `Error aplicando campos: ${error}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsApplyingDetected(false);
    }
  };

  const runQuickAnalysisForAllCollections = async () => {
    setIsAdvancedScanning(true);
    try {
      console.log('[BULK-SCAN] Iniciando análisis masivo...');
      
      const results = await firestoreDynamicService.bulkSmartAnalysis(undefined, 30);
      const collections = Object.keys(results);
      
      // Procesar resultados para mostrar
      const summary = collections.map(collection => ({
        collection,
        fieldsCount: results[collection].length,
        fields: results[collection].slice(0, 3).map(f => `${f.name}(${f.definition.type})`),
        status: 'success'
      }));

      const totalFields = collections.reduce((sum, col) => sum + results[col].length, 0);
      const collectionsWithFields = collections.filter(col => results[col].length > 0).length;

      toast({
        title: 'Análisis masivo completado',
        description: `${collectionsWithFields}/${collections.length} colecciones con campos detectados. ${totalFields} campos únicos totales.`,
        status: 'success',
        duration: 8000,
        isClosable: true,
      });

      console.log('[BULK-SCAN] Resultados completos:', summary);
      
      // Mostrar detalles en consola
      collections.forEach(collection => {
        if (results[collection].length > 0) {
          console.log(`[BULK-SCAN] ${collection}: ${results[collection].length} campos -`, 
            results[collection].map(f => `${f.name}(${f.definition.type})`).join(', '));
        }
      });

    } catch (error) {
      console.error('[BULK-SCAN] Error en análisis masivo:', error);
      toast({
        title: 'Error en análisis masivo',
        description: `Error: ${error}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAdvancedScanning(false);
    }
  };

  return (
    <Box p={6}>
      <Text fontSize="2xl" fontWeight="bold" mb={2}>
        Administrador de Esquemas de Firestore
      </Text>

      <Text fontSize="md" color="gray.600" mb={4}>
        Gestione los esquemas de las colecciones de Firestore añadiendo o eliminando campos de forma segura.
        Los campos personalizados se añaden dinámicamente manteniendo compatibilidad con datos existentes.
      </Text>
      
      {/* Indicador de colecciones detectadas */}
      <Flex alignItems="center" mb={6}>
        <Text fontSize="sm" color="gray.500" mr={2}>
          Colecciones detectadas:
        </Text>
        <Badge colorScheme="blue" variant="subtle">
          {availableCollections.length}
        </Badge>
        {isLoadingCollections && (
          <Text fontSize="xs" color="blue.500" ml={2}>
            Actualizando...
          </Text>
        )}
      </Flex>

      {(error || success) && (
        <Alert 
          status={error ? 'error' : 'success'}
          mb={6}
        >
          <AlertIcon />
          <Box>
            <AlertTitle>{error ? 'Error' : 'Éxito'}</AlertTitle>
            <AlertDescription>{error || success}</AlertDescription>
          </Box>
        </Alert>
      )}

      <Box borderWidth={1} borderRadius="lg" p={4} mb={6}>
        <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={4} alignItems="end">
          <HStack spacing={3}>
            <FormControl flex={1}>
              <FormLabel>Seleccionar Colección</FormLabel>
              <Select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                placeholder="Selecciona una colección"
                isDisabled={loading}
              >
                {availableCollections.map((collection) => (
                  <option key={collection} value={collection}>
                    {collection}
                  </option>
                ))}
              </Select>
            </FormControl>
            <Button
              leftIcon={<RepeatIcon />}
              onClick={handleRefreshCollections}
              isLoading={isLoadingCollections}
              isDisabled={loading}
              variant="outline"
              colorScheme="gray"
              size="sm"
              mt={6} // Para alinear con el select
              title="Refrescar lista de colecciones"
            >
              {isLoadingCollections ? 'Actualizando...' : 'Refrescar'}
            </Button>
          </HStack>
        </Grid>
        {testResult && (
          <Alert status="info" mt={4}>
            <AlertIcon />
            <Text fontSize="sm">{testResult}</Text>
          </Alert>
        )}
      </Box>

      {/* Análisis Inteligente de Campos - Card separada */}
      <Card mb={6} borderColor="purple.200" borderWidth={2}>
        <CardHeader>
          <Flex justifyContent="space-between" alignItems="center">
            <Heading size="sm">🔍 Análisis Inteligente de Campos</Heading>
            <Button
              size="xs"
              colorScheme="blue"
              variant="outline"
              onClick={runQuickAnalysisForAllCollections}
              isLoading={isAdvancedScanning}
              isDisabled={isAdvancedScanning}
            >
              Analizar Todas las Colecciones
            </Button>
          </Flex>
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} w="100%">
              <FormControl>
                <FormLabel>Modo de análisis</FormLabel>
                <Select value={scanMode} onChange={(e) => setScanMode(e.target.value as any)}>
                  <option value="quick">⚡ Rápido (10 documentos)</option>
                  <option value="smart">🧠 Inteligente (muestreo estratégico)</option>
                  <option value="deep">🔍 Profundo (200+ documentos)</option>
                </Select>
                <Text fontSize="xs" color="gray.600" mt={1}>
                  {scanMode === 'quick' && 'Análisis rápido de pocos documentos para pruebas'}
                  {scanMode === 'smart' && 'Muestreo inteligente con múltiples estrategias (recomendado)'}
                  {scanMode === 'deep' && 'Análisis exhaustivo de muchos documentos (puede tardar varios minutos)'}
                </Text>
              </FormControl>
              
              <VStack spacing={2}>
                <Button
                  onClick={performAdvancedScan}
                  isLoading={isAdvancedScanning}
                  loadingText={`Analizando (${scanMode})...`}
                  colorScheme="purple"
                  leftIcon={<InfoIcon />}
                  isDisabled={loading || !selectedCollection}
                  size="md"
                  w="100%"
                >
                  Analizar {selectedCollection || 'Colección'}
                </Button>
                
                {scanResults && scanResults.fields.length > 0 && (
                  <Button
                    onClick={applyDetectedFieldsToSchema}
                    isLoading={isApplyingDetected}
                    loadingText="Aplicando campos..."
                    colorScheme="green"
                    variant="solid"
                    size="sm"
                    w="100%"
                    leftIcon={<CheckCircleIcon />}
                  >
                    Aplicar {scanResults.fields.length} Campos al Esquema
                  </Button>
                )}
                
                {/* Botón para normalizar documentos desactualizados */}
                {outdatedDocumentsCount > 0 && (
                  <Button
                    onClick={() => setShowNormalizationConfirmModal(true)}
                    isLoading={isNormalizing}
                    loadingText="Normalizando..."
                    colorScheme="red"
                    variant="outline"
                    size="sm"
                    w="100%"
                    leftIcon={<WarningIcon />}
                  >
                    🔧 Normalizar {outdatedDocumentsCount} Docs. Desactualizados
                  </Button>
                )}
              </VStack>
            </Grid>
            
            {/* Resultados del análisis */}
            {scanResults && (
              <Box w="100%" p={4} bg="purple.50" borderRadius="md" borderWidth={1} borderColor="purple.200">
                <VStack spacing={3} align="start">
                  <Flex justifyContent="space-between" w="100%">
                    <HStack>
                      <Badge colorScheme="purple" variant="solid">{scanResults.mode.toUpperCase()}</Badge>
                      <Text fontSize="sm" fontWeight="bold">
                        {scanResults.fields.length} campos únicos detectados
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      {scanResults.timestamp.toLocaleString()}
                    </Text>
                  </Flex>
                  
                  <Text fontSize="xs" color="gray.600">
                    📊 Análisis de {scanResults.documentsAnalyzed} documentos en <strong>{scanResults.collectionName}</strong>
                  </Text>
                  
                  {scanResults.fields.length > 0 && (
                    <Box w="100%">
                      <Text fontSize="xs" fontWeight="semibold" mb={2}>
                        🏷️ Campos detectados:
                      </Text>
                      <Wrap spacing={2}>
                        {scanResults.fields.map(field => {
                          const getTypeIcon = (type: string) => {
                            switch (type) {
                              case 'string': return '📝';
                              case 'number': return '🔢';
                              case 'boolean': return '☑️';
                              case 'array': return '📋';
                              case 'object': return '📦';
                              case 'date': return '📅';
                              default: return '❓';
                            }
                          };
                          
                          return (
                            <WrapItem key={field.name}>
                              <Badge 
                                size="sm" 
                                colorScheme="purple" 
                                variant="outline"
                                px={2}
                                py={1}
                              >
                                {getTypeIcon(field.definition.type)} {field.name}
                                <Text as="span" fontSize="xs" color="gray.500" ml={1}>
                                  ({field.definition.type})
                                </Text>
                              </Badge>
                            </WrapItem>
                          );
                        })}
                      </Wrap>
                      
                      {scanResults.fields.length > 0 && (
                        <Text fontSize="xs" color="purple.600" mt={2} fontStyle="italic">
                          💡 Estos campos se detectaron automáticamente en documentos existentes. 
                          Puedes aplicarlos al esquema para gestionarlos oficialmente.
                        </Text>
                      )}
                    </Box>
                  )}
                  
                  {scanResults.fields.length === 0 && (
                    <Box w="100%" textAlign="center" py={4}>
                      <Text fontSize="sm" color="gray.600">
                        ✅ No se detectaron campos adicionales. 
                        Todos los campos en los documentos ya están en el esquema.
                      </Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>

      {schema && (
        <Box>
          <FieldsSummary 
            schema={schema} 
            outdatedDocumentsCount={outdatedDocumentsCount}
            isAnalyzingOutdated={isAnalyzingOutdated}
            onNormalizeClick={() => setShowNormalizationConfirmModal(true)}
          />
          <ExistingFieldsDisplay 
            schema={schema} 
            onRemoveField={handleRemoveField}
            loading={loading}
            selectedCollection={selectedCollection}
            onAddField={() => setAddFieldDialogOpen(true)}
          />
          
          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <HStack>
                  <Icon as={DatabaseIcon} color="blue.500" />
                  <Text fontSize="lg" fontWeight="bold">
                    Vista Previa de Documentos ({documents.length})
                  </Text>
                </HStack>
              </CardHeader>
              <CardBody>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Documentos de ejemplo de la colección. Los campos personalizados 
                  se añadirán automáticamente con valores por defecto en futuras operaciones.
                </Text>
                
                <TableContainer overflowX="auto" maxH="400px">
                  <Table variant="simple" size="sm">
                    <Thead position="sticky" top={0} bg="white">
                      <Tr>
                        <Th>ID</Th>
                        {getExistingFieldNames().slice(0, 5).map((fieldName: string) => (
                          <Th key={fieldName}>{fieldName}</Th>
                        ))}
                        <Th>...</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {documents.map((doc: any) => (
                        <Tr key={doc.id}>
                          <Td>
                            <Text fontSize="xs" fontFamily="mono">
                              {doc.id.substring(0, 8)}...
                            </Text>
                          </Td>
                          {getExistingFieldNames().slice(0, 5).map((fieldName: string) => (
                            <Td key={fieldName}>
                              <Text fontSize="sm" isTruncated maxW="150px">
                                {doc[fieldName] !== undefined ? 
                                  String(doc[fieldName]).substring(0, 30) : '-'}
                              </Text>
                            </Td>
                          ))}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          )}
        </Box>
      )}

      {/* Sección de Normalización de Documentos */}
      {selectedCollection && schema && (
        <DocumentNormalizationSection 
          outdatedDocumentsCount={outdatedDocumentsCount}
          isNormalizing={isNormalizing}
          handleNormalizeWithConfirmation={handleNormalizeWithConfirmation}
        />
      )}

      {/* Modal de confirmación para normalización */}
      <Modal 
        isOpen={showNormalizationConfirmModal} 
        onClose={() => setShowNormalizationConfirmModal(false)}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={WarningIcon} color="orange.500" />
              <Text>Confirmar Normalización de Documentos</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle>⚠️ Acción Importante</AlertTitle>
                  <AlertDescription>
                    Esta operación modificará <strong>{outdatedDocumentsCount} documentos</strong> en la colección 
                    <strong> {selectedCollection}</strong> para aplicar la estructura del esquema actual.
                  </AlertDescription>
                </Box>
              </Alert>

              <Box p={4} bg="blue.50" borderRadius="md" borderWidth={1} borderColor="blue.200">
                <Text fontSize="sm" fontWeight="bold" mb={2} color="blue.700">
                  📋 ¿Qué hará esta normalización?
                </Text>
                <VStack spacing={2} align="start">
                  <HStack>
                    <Icon as={CheckCircleIcon} color="green.500" boxSize={4} />
                    <Text fontSize="sm">Añadir campos faltantes con valores por defecto</Text>
                  </HStack>
                  <HStack>
                    <Icon as={CheckCircleIcon} color="green.500" boxSize={4} />
                    <Text fontSize="sm">Crear backup automático antes de los cambios</Text>
                  </HStack>
                  <HStack>
                    <Icon as={CheckCircleIcon} color="green.500" boxSize={4} />
                    <Text fontSize="sm">Mantener todos los datos existentes intactos</Text>
                  </HStack>
                  <HStack>
                    <Icon as={InfoIcon} color="blue.500" boxSize={4} />
                    <Text fontSize="sm">Procesar documentos en lotes de 50 para seguridad</Text>
                  </HStack>
                </VStack>
              </Box>

              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>💡 Recomendación</AlertTitle>
                  <AlertDescription>
                    Se creará un backup automático antes de realizar cambios. 
                    Esta operación es segura y reversible.
                  </AlertDescription>
                </Box>
              </Alert>

              {outdatedDocumentsCount > 50 && (
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>⏱️ Tiempo de procesamiento</AlertTitle>
                    <AlertDescription>
                      Con {outdatedDocumentsCount} documentos, esta operación puede tardar varios minutos. 
                      No cierre la ventana durante el proceso.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button 
                variant="ghost" 
                onClick={() => setShowNormalizationConfirmModal(false)}
                isDisabled={isNormalizing}
              >
                Cancelar
              </Button>
              <Button 
                colorScheme="orange" 
                onClick={handleNormalizeWithConfirmation}
                isLoading={isNormalizing}
                loadingText="Normalizando..."
                leftIcon={<SettingsIcon />}
              >
                Sí, Normalizar {outdatedDocumentsCount} Documentos
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Dialog para añadir campo personalizado */}
      <AddFieldDialog
        open={addFieldDialogOpen}
        onClose={() => setAddFieldDialogOpen(false)}
        onConfirm={handleAddField}
        existingFields={getExistingFieldNames()}
        validateFieldName={validateFieldName}
        validateFieldDefinition={validateFieldDefinition}
      />
    </Box>
  );
};

export default FirestoreSchemaManager;
