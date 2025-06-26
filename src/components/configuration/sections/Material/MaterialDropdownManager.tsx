import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  IconButton,
  useToast,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  Flex,
  Spacer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Select,
  Spinner
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiRefreshCw } from 'react-icons/fi';
import { 
  getMaterialDropdownConfig, 
  updateMaterialDropdownConfig,
  MaterialDropdownConfig,
  DropdownOption 
} from '../../../../services/materialDropdownService';

interface FormData {
  value: string;
  label: string;
  color?: string;
}

const MaterialDropdownManagerFunctional: React.FC = () => {
  const [config, setConfig] = useState<MaterialDropdownConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('estados');
  const [editingItem, setEditingItem] = useState<DropdownOption | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    setValue 
  } = useForm<FormData>();

  // Cargar configuración inicial
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMaterialDropdownConfig();
      setConfig(data);
    } catch (err) {
      console.error('Error cargando configuración:', err);
      setError('Error al cargar la configuración');
      toast({
        title: 'Error',
        description: 'No se pudo cargar la configuración de dropdowns',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (newConfig: MaterialDropdownConfig) => {
    try {
      setIsSaving(true);
      await updateMaterialDropdownConfig(newConfig);
      setConfig(newConfig);
      toast({
        title: 'Configuración guardada',
        description: 'Los cambios se han guardado exitosamente',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (err) {
      console.error('Error guardando configuración:', err);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setIsAdding(true);
    reset({ value: '', label: '', color: '' });
    onOpen();
  };

  const handleEdit = (item: DropdownOption) => {
    setEditingItem(item);
    setIsAdding(false);
    reset({
      value: item.value,
      label: item.label,
      color: item.color || ''
    });
    onOpen();
  };

  const handleDelete = async (section: string, value: string) => {
    if (!config) return;

    const newConfig = { ...config };
    
    switch (section) {
      case 'estados':
        newConfig.estados = newConfig.estados.filter((item: DropdownOption) => item.value !== value);
        break;
      case 'tiposCuerda':
        newConfig.tiposCuerda = newConfig.tiposCuerda.filter((item: DropdownOption) => item.value !== value);
        break;      case 'tiposAnclaje':
        newConfig.tiposAnclaje = newConfig.tiposAnclaje.filter((item: DropdownOption) => item.value !== value);
        // También eliminar subcategorías relacionadas
        delete newConfig.subcategoriasAnclaje[value];
        break;
      case 'categoriasVarios':
        newConfig.categoriasVarios = newConfig.categoriasVarios.filter((item: DropdownOption) => item.value !== value);
        // También eliminar subcategorías relacionadas
        delete newConfig.subcategoriasVarios[value];
        break;
    }

    await saveConfig(newConfig);
  };

  const handleDeleteSubcategoria = async (tipoAnclaje: string, subcategoriaValue: string) => {
    if (!config) return;

    const newConfig = { ...config };
    if (newConfig.subcategoriasAnclaje[tipoAnclaje]) {
      newConfig.subcategoriasAnclaje[tipoAnclaje] = newConfig.subcategoriasAnclaje[tipoAnclaje].filter(
        (item: DropdownOption) => item.value !== subcategoriaValue
      );
    }

    await saveConfig(newConfig);
  };

  const handleAddSubcategoria = (tipoAnclaje: string) => {
    setEditingItem(null);
    setIsAdding(true);
    setActiveSection(`subcategoria-${tipoAnclaje}`); // Marcar que estamos agregando para un tipo específico
    reset({ value: '', label: '', color: '' });
    onOpen();
  };

  const handleDeleteSubcategoriaVarios = async (categoria: string, subcategoriaValue: string) => {
    if (!config) return;

    const newConfig = { ...config };
    if (newConfig.subcategoriasVarios[categoria]) {
      newConfig.subcategoriasVarios[categoria] = newConfig.subcategoriasVarios[categoria].filter(
        (item: DropdownOption) => item.value !== subcategoriaValue
      );
    }

    await saveConfig(newConfig);
  };

  const handleAddSubcategoriaVarios = (categoria: string) => {
    setEditingItem(null);
    setIsAdding(true);
    setActiveSection(`subcategoria-varios-${categoria}`); // Marcar que estamos agregando para una categoría específica
    reset({ value: '', label: '', color: '' });
    onOpen();
  };

  const onSubmit = async (data: FormData) => {
    if (!config) return;

    const newConfig = { ...config };
    const newItem: DropdownOption = {
      value: data.value,
      label: data.label,
      ...(data.color && { color: data.color })
    };    if (isAdding) {
      // Verificar si estamos agregando una subcategoría
      if (activeSection.startsWith('subcategoria-varios-')) {
        const categoria = activeSection.replace('subcategoria-varios-', '');
        if (!newConfig.subcategoriasVarios[categoria]) {
          newConfig.subcategoriasVarios[categoria] = [];
        }
        newConfig.subcategoriasVarios[categoria].push(newItem);
      } else if (activeSection.startsWith('subcategoria-')) {
        const tipoAnclaje = activeSection.replace('subcategoria-', '');
        if (!newConfig.subcategoriasAnclaje[tipoAnclaje]) {
          newConfig.subcategoriasAnclaje[tipoAnclaje] = [];
        }
        newConfig.subcategoriasAnclaje[tipoAnclaje].push(newItem);
      } else {
        // Agregar nuevo item normal
        switch (activeSection) {
          case 'estados':
            newConfig.estados.push(newItem);
            break;
          case 'tiposCuerda':
            newConfig.tiposCuerda.push(newItem);
            break;
          case 'tiposAnclaje':
            newConfig.tiposAnclaje.push(newItem);
            // Inicializar subcategorías vacías para nuevo tipo de anclaje
            newConfig.subcategoriasAnclaje[data.value] = [];
            break;
          case 'categoriasVarios':
            newConfig.categoriasVarios.push(newItem);
            // Inicializar subcategorías vacías para nueva categoría
            newConfig.subcategoriasVarios[data.value] = [];
            break;
        }
      }
    } else if (editingItem) {
      // Editar item existente
      switch (activeSection) {
        case 'estados':
          const estadoIndex = newConfig.estados.findIndex((item: DropdownOption) => item.value === editingItem.value);
          if (estadoIndex !== -1) {
            newConfig.estados[estadoIndex] = newItem;
          }
          break;
        case 'tiposCuerda':
          const cuerdaIndex = newConfig.tiposCuerda.findIndex((item: DropdownOption) => item.value === editingItem.value);
          if (cuerdaIndex !== -1) {
            newConfig.tiposCuerda[cuerdaIndex] = newItem;
          }
          break;        case 'tiposAnclaje':
          const anclajeIndex = newConfig.tiposAnclaje.findIndex((item: DropdownOption) => item.value === editingItem.value);
          if (anclajeIndex !== -1) {
            newConfig.tiposAnclaje[anclajeIndex] = newItem;
            // Si cambió el valor, actualizar la clave en subcategorías
            if (editingItem.value !== data.value) {
              newConfig.subcategoriasAnclaje[data.value] = newConfig.subcategoriasAnclaje[editingItem.value] || [];
              delete newConfig.subcategoriasAnclaje[editingItem.value];
            }
          }
          break;
        case 'categoriasVarios':
          const categoriaIndex = newConfig.categoriasVarios.findIndex((item: DropdownOption) => item.value === editingItem.value);
          if (categoriaIndex !== -1) {
            newConfig.categoriasVarios[categoriaIndex] = newItem;
            // Si cambió el valor, actualizar la clave en subcategorías
            if (editingItem.value !== data.value) {
              newConfig.subcategoriasVarios[data.value] = newConfig.subcategoriasVarios[editingItem.value] || [];
              delete newConfig.subcategoriasVarios[editingItem.value];
            }
          }
          break;
      }
    }

    await saveConfig(newConfig);
    onClose();
  };

  const getCurrentSectionData = () => {
    if (!config) return [];
    
    switch (activeSection) {
      case 'estados':
        return config.estados;
      case 'tiposCuerda':
        return config.tiposCuerda;
      case 'tiposAnclaje':
        return config.tiposAnclaje;
      case 'categoriasVarios':
        return config.categoriasVarios;
      default:
        return [];
    }
  };  const getSectionTitle = () => {
    switch (activeSection) {
      case 'estados':
        return 'Estados de Material';
      case 'tiposCuerda':
        return 'Tipos de Cuerda';
      case 'tiposAnclaje':
        return 'Tipos de Anclaje';
      case 'categoriasVarios':
        return 'Categorías de Varios';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="lg" />
        <Text mt={4}>Cargando configuración...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
        <Spacer />
        <Button colorScheme="red" variant="outline" onClick={loadConfig}>
          Reintentar
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Selector de sección */}
        <Card>
          <CardBody>
            <Heading size="md" mb={4}>
              Seleccionar Sección a Editar
            </Heading>            <HStack spacing={4} wrap="wrap">
              <Button 
                colorScheme={activeSection === 'estados' ? 'blue' : 'gray'}
                onClick={() => setActiveSection('estados')}
              >
                Estados
              </Button>
              <Button 
                colorScheme={activeSection === 'tiposCuerda' ? 'blue' : 'gray'}
                onClick={() => setActiveSection('tiposCuerda')}
              >
                Tipos de Cuerda
              </Button>
              <Button 
                colorScheme={activeSection === 'tiposAnclaje' ? 'blue' : 'gray'}
                onClick={() => setActiveSection('tiposAnclaje')}
              >
                Tipos de Anclaje
              </Button>
              <Button 
                colorScheme={activeSection === 'categoriasVarios' ? 'blue' : 'gray'}
                onClick={() => setActiveSection('categoriasVarios')}
              >
                Categorías de Varios
              </Button>
            </HStack>
          </CardBody>
        </Card>        {/* Sección activa */}
        <Card>
            <CardBody>
              <Flex align="center" mb={4}>
                <Heading size="md">
                  {getSectionTitle()}
                </Heading>
                <Spacer />
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="green"
                  onClick={handleAdd}
                  isDisabled={isSaving}
                >
                  Agregar
                </Button>
              </Flex>

              <VStack spacing={3} align="stretch">
                {getCurrentSectionData().map((item: DropdownOption) => (
                  <Box key={item.value}>
                    {/* Elemento principal */}
                    <Box p={4} bg="gray.50" borderRadius="md">
                      <Flex align="center">
                        <VStack align="start" flex={1} spacing={1}>
                          <HStack>
                            <Text fontWeight="medium">{item.label}</Text>
                            {item.color && (
                              <Badge colorScheme={item.color}>{item.color}</Badge>
                            )}
                          </HStack>
                          <Text fontSize="sm" color="gray.600">
                            Valor: {item.value}
                          </Text>
                        </VStack>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Editar"
                            icon={<FiEdit2 />}
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            isDisabled={isSaving}
                          />
                          <IconButton
                            aria-label="Eliminar"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => handleDelete(activeSection, item.value)}
                            isDisabled={isSaving}
                          />
                        </HStack>
                      </Flex>
                    </Box>                    {/* Subcategorías para tipos de anclaje */}
                    {activeSection === 'tiposAnclaje' && (
                      <Box ml={6} mt={2} p={3} bg="blue.50" borderRadius="md" borderLeft="3px solid" borderColor="blue.200">
                        <VStack spacing={2} align="stretch">
                          <HStack>
                            <Text fontSize="sm" fontWeight="medium" color="blue.700">
                              Subcategorías de {item.label}
                            </Text>
                            <Spacer />
                            <Button
                              size="xs"
                              colorScheme="blue"
                              variant="outline"
                              leftIcon={<FiPlus />}
                              onClick={() => handleAddSubcategoria(item.value)}
                              isDisabled={isSaving}
                            >
                              Agregar
                            </Button>
                          </HStack>
                          
                          {config?.subcategoriasAnclaje[item.value]?.map((subcat: DropdownOption) => (
                            <Box key={subcat.value} p={2} bg="white" borderRadius="sm">
                              <Flex align="center">
                                <VStack align="start" flex={1} spacing={0}>
                                  <Text fontSize="sm" fontWeight="medium">{subcat.label}</Text>
                                  <Text fontSize="xs" color="gray.600">
                                    Valor: {subcat.value}
                                  </Text>
                                </VStack>
                                <IconButton
                                  aria-label="Eliminar subcategoría"
                                  icon={<FiTrash2 />}
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleDeleteSubcategoria(item.value, subcat.value)}
                                  isDisabled={isSaving}
                                />
                              </Flex>
                            </Box>
                          ))}
                          
                          {(!config?.subcategoriasAnclaje[item.value] || config.subcategoriasAnclaje[item.value].length === 0) && (
                            <Text fontSize="xs" color="gray.500" textAlign="center" py={1}>
                              No hay subcategorías para este tipo de anclaje
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    )}

                    {/* Subcategorías para categorías de varios */}
                    {activeSection === 'categoriasVarios' && (
                      <Box ml={6} mt={2} p={3} bg="green.50" borderRadius="md" borderLeft="3px solid" borderColor="green.200">
                        <VStack spacing={2} align="stretch">
                          <HStack>
                            <Text fontSize="sm" fontWeight="medium" color="green.700">
                              Subcategorías de {item.label}
                            </Text>
                            <Spacer />
                            <Button
                              size="xs"
                              colorScheme="green"
                              variant="outline"
                              leftIcon={<FiPlus />}
                              onClick={() => handleAddSubcategoriaVarios(item.value)}
                              isDisabled={isSaving}
                            >
                              Agregar
                            </Button>
                          </HStack>
                          
                          {config?.subcategoriasVarios[item.value]?.map((subcat: DropdownOption) => (
                            <Box key={subcat.value} p={2} bg="white" borderRadius="sm">
                              <Flex align="center">
                                <VStack align="start" flex={1} spacing={0}>
                                  <Text fontSize="sm" fontWeight="medium">{subcat.label}</Text>
                                  <Text fontSize="xs" color="gray.600">
                                    Valor: {subcat.value}
                                  </Text>
                                </VStack>
                                <IconButton
                                  aria-label="Eliminar subcategoría"
                                  icon={<FiTrash2 />}
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleDeleteSubcategoriaVarios(item.value, subcat.value)}
                                  isDisabled={isSaving}
                                />
                              </Flex>
                            </Box>
                          ))}
                          
                          {(!config?.subcategoriasVarios[item.value] || config.subcategoriasVarios[item.value].length === 0) && (
                            <Text fontSize="xs" color="gray.500" textAlign="center" py={1}>
                              No hay subcategorías para esta categoría
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    )}
                  </Box>
                ))}
              </VStack>

              {getCurrentSectionData().length === 0 && (
                <Text color="gray.500" textAlign="center" py={4}>
                  No hay elementos configurados en esta sección
                </Text>
              )}            </CardBody>
        </Card>

        {/* Botones de acción alineados a la derecha */}
        <Flex justify="flex-end" gap={2} mt={4}>
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={loadConfig}
            isDisabled={isSaving}
            variant="outline"
            colorScheme="gray"
          >
            Recargar
          </Button>
          <Button
            colorScheme="blue"
            onClick={() => saveConfig(config!)}
            isLoading={isSaving}
          >
            Guardar
          </Button>
        </Flex>
        {/* Fin botones de acción */}
      </VStack>

      {/* Modal para agregar/editar */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {isAdding ? 'Agregar' : 'Editar'} elemento en {getSectionTitle()}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired isInvalid={!!errors.value}>
                  <FormLabel>Valor</FormLabel>
                  <Input
                    {...register('value', { 
                      required: 'El valor es obligatorio',
                      pattern: {
                        value: /^[a-zA-Z0-9_-]+$/,
                        message: 'Solo se permiten letras, números, guiones y guiones bajos'
                      }
                    })}
                    placeholder="ej: disponible"
                  />
                  <FormErrorMessage>
                    {errors.value && errors.value.message}
                  </FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.label}>
                  <FormLabel>Etiqueta</FormLabel>
                  <Input
                    {...register('label', { 
                      required: 'La etiqueta es obligatoria' 
                    })}
                    placeholder="ej: Disponible"
                  />
                  <FormErrorMessage>
                    {errors.label && errors.label.message}
                  </FormErrorMessage>
                </FormControl>

                {activeSection === 'estados' && (
                  <FormControl>
                    <FormLabel>Color (opcional)</FormLabel>
                    <Select {...register('color')} placeholder="Seleccionar color">
                      <option value="green">Verde</option>
                      <option value="orange">Naranja</option>
                      <option value="blue">Azul</option>
                      <option value="red">Rojo</option>
                      <option value="gray">Gris</option>
                      <option value="purple">Morado</option>
                      <option value="yellow">Amarillo</option>
                    </Select>
                  </FormControl>
                )}
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                colorScheme="blue" 
                type="submit"
                isLoading={isSaving}
                loadingText="Guardando..."
              >
                {isAdding ? 'Agregar' : 'Guardar'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MaterialDropdownManagerFunctional;
