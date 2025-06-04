import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  Box, Button, Text, Stack, Heading, Tabs, TabList, Tab,
  TabPanels, TabPanel, Input, Checkbox, Flex, Badge,
  useToast, Link, useColorModeValue
} from '@chakra-ui/react';
import { FiFolder, FiSave } from 'react-icons/fi';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Timestamp } from 'firebase/firestore';
import { obtenerConfiguracionDrive } from '../../services/configuracionService';

interface EnlacesEditorRef {
  submitForm: () => void;
}

interface EnlacesEditorProps {
  data: any;
  onSave: (data: any) => void;
  onCancel?: () => void;
  mostrarBotones?: boolean;
  esNuevo?: boolean;
}

const EnlacesEditor = forwardRef<EnlacesEditorRef, EnlacesEditorProps>(
  ({ data, onSave, onCancel, mostrarBotones = true, esNuevo = false }, ref) => {
    // Estados para cada tipo de enlace
    const [enlacesWikiloc, setEnlacesWikiloc] = useState<Array<{ url: string; esEmbed: boolean }>>(
      data.enlacesWikiloc || []
    );
    const [enlacesTopografias, setEnlacesTopografias] = useState<string[]>(
      data.enlacesTopografias || []
    );
    const [enlacesDrive, setEnlacesDrive] = useState<string[]>(
      data.enlacesDrive || []
    );
    const [enlacesWeb, setEnlacesWeb] = useState<string[]>(
      data.enlacesWeb || []
    );

    // Estados para nuevos enlaces
    const [nuevoEnlaceWikiloc, setNuevoEnlaceWikiloc] = useState('');
    const [nuevoEnlaceTopografia, setNuevoEnlaceTopografia] = useState('');
    const [nuevoEnlaceDrive, setNuevoEnlaceDrive] = useState('');
    const [nuevoEnlaceWeb, setNuevoEnlaceWeb] = useState('');
    const [esEmbedWikiloc, setEsEmbedWikiloc] = useState(false);
    
    // Configuración Drive
    const [carpetaDrive, setCarpetaDrive] = useState<string | null>(null);
    
    const toast = useToast();
    const inputBg = useColorModeValue("white", "gray.700");
    const borderColor = useColorModeValue("gray.200", "gray.600");
      // Cargar configuración Drive
    useEffect(() => {
      const fetchConfig = async () => {
        try {
          const config = await obtenerConfiguracionDrive();
          if (config) {
            setCarpetaDrive(config);
          }
        } catch (error) {
          console.error("Error al obtener configuración de Drive:", error);
        }
      };
      
      fetchConfig();
    }, []);

    // Validadores de URL
    const isValidUrl = (urlString: string): boolean => {
      try {
        new URL(urlString);
        return true;
      } catch (e) {
        return false;
      }
    };
    
    const isDriveUrl = (urlString: string): boolean => {
      if (!isValidUrl(urlString)) return false;
      return urlString.includes('drive.google.com');
    };

    // Manejadores para Wikiloc
    const handleAgregarEnlaceWikiloc = () => {
      if (nuevoEnlaceWikiloc.trim()) {
        if (!isValidUrl(nuevoEnlaceWikiloc) && !esEmbedWikiloc) {
          toast({
            title: "URL no válida",
            description: "Por favor introduce una URL válida",
            status: "warning",
            duration: 3000,
          });
          return;
        }
        setEnlacesWikiloc([...enlacesWikiloc, { url: nuevoEnlaceWikiloc.trim(), esEmbed: esEmbedWikiloc }]);
        setNuevoEnlaceWikiloc('');
        setEsEmbedWikiloc(false);
      }
    };
    
    const eliminarEnlaceWikiloc = (index: number) => {
      const nuevosEnlaces = [...enlacesWikiloc];
      nuevosEnlaces.splice(index, 1);
      setEnlacesWikiloc(nuevosEnlaces);
    };

    // Manejadores para Topografías
    const handleAgregarEnlaceTopografia = () => {
      if (nuevoEnlaceTopografia.trim()) {
        if (!isValidUrl(nuevoEnlaceTopografia)) {
          toast({
            title: "URL no válida",
            description: "Por favor introduce una URL válida",
            status: "warning",
            duration: 3000,
          });
          return;
        }
        setEnlacesTopografias([...enlacesTopografias, nuevoEnlaceTopografia.trim()]);
        setNuevoEnlaceTopografia('');
      }
    };
    
    const eliminarEnlaceTopografia = (index: number) => {
      const nuevosEnlaces = [...enlacesTopografias];
      nuevosEnlaces.splice(index, 1);
      setEnlacesTopografias(nuevosEnlaces);
    };

    // Manejadores para Drive
    const handleAgregarEnlaceDrive = () => {
      if (nuevoEnlaceDrive.trim()) {
        if (!isDriveUrl(nuevoEnlaceDrive)) {
          toast({
            title: "URL no válida",
            description: "Por favor introduce una URL válida de Google Drive",
            status: "warning",
            duration: 3000,
          });
          return;
        }
        setEnlacesDrive([...enlacesDrive, nuevoEnlaceDrive.trim()]);
        setNuevoEnlaceDrive('');
      }
    };
    
    const eliminarEnlaceDrive = (index: number) => {
      const nuevosEnlaces = [...enlacesDrive];
      nuevosEnlaces.splice(index, 1);
      setEnlacesDrive(nuevosEnlaces);
    };

    // Manejadores para Web
    const handleAgregarEnlaceWeb = () => {
      if (nuevoEnlaceWeb.trim()) {
        if (!isValidUrl(nuevoEnlaceWeb)) {
          toast({
            title: "URL no válida",
            description: "Por favor introduce una URL válida",
            status: "warning",
            duration: 3000,
          });
          return;
        }
        setEnlacesWeb([...enlacesWeb, nuevoEnlaceWeb.trim()]);
        setNuevoEnlaceWeb('');
      }
    };
    
    const eliminarEnlaceWeb = (index: number) => {
      const nuevosEnlaces = [...enlacesWeb];
      nuevosEnlaces.splice(index, 1);
      setEnlacesWeb(nuevosEnlaces);
    };

    // Exponer el método submitForm usando useImperativeHandle
    useImperativeHandle(ref, () => ({
      submitForm: () => {
        const enlaces = {
          enlacesWikiloc,
          enlacesTopografias,
          enlacesDrive,
          enlacesWeb,
          enlaces: [
            ...enlacesWikiloc.map(e => e.url),
            ...enlacesTopografias,
            ...enlacesDrive,
            ...enlacesWeb
          ],
          fechaActualizacion: Timestamp.fromDate(new Date())
        };
        onSave(enlaces);
      }
    }));

    const handleSubmit = () => {
      const enlaces = {
        enlacesWikiloc,
        enlacesTopografias,
        enlacesDrive,
        enlacesWeb,
        enlaces: [
          ...enlacesWikiloc.map(e => e.url),
          ...enlacesTopografias,
          ...enlacesDrive,
          ...enlacesWeb
        ],
        fechaActualizacion: Timestamp.fromDate(new Date())
      };
      onSave(enlaces);
    };

    return (
      <Box>
        <Tabs variant="enclosed" colorScheme="brand" isLazy>
          <TabList>
            <Tab>Wikiloc</Tab>
            <Tab>Topografías</Tab>
            <Tab>Google Drive</Tab>
            <Tab>Enlaces Web</Tab>
          </TabList>
          <TabPanels>
            {/* Panel de Wikiloc */}
            <TabPanel>
              <Box mb={4}>
                <Heading size="sm" mb={3}>Enlaces a Wikiloc</Heading>
                <Flex mb={2} alignItems="center" flexDir={{ base: 'column', md: 'row' }}>
                  <Input
                    placeholder={esEmbedWikiloc ? "Código embebido de Wikiloc" : "URL de Wikiloc"}
                    value={nuevoEnlaceWikiloc}
                    onChange={(e) => setNuevoEnlaceWikiloc(e.target.value)}
                    bg={inputBg}
                    borderColor={borderColor}
                    mr={{ base: 0, md: 2 }}
                    mb={{ base: 2, md: 0 }}
                  />
                  <Checkbox 
                    isChecked={esEmbedWikiloc} 
                    onChange={(e) => setEsEmbedWikiloc(e.target.checked)}
                    mr={{ base: 0, md: 2 }}
                    mb={{ base: 2, md: 0 }}
                  >
                    Es código embebido
                  </Checkbox>
                  <Button 
                    onClick={handleAgregarEnlaceWikiloc}
                    flexShrink={0}
                  >
                    Agregar
                  </Button>
                </Flex>
                
                {enlacesWikiloc.length > 0 ? (
                  <Box mt={4} p={2} borderWidth="1px" borderRadius="md">
                    <Stack spacing={2}>
                      {enlacesWikiloc.map((enlace, index) => (
                        <Flex key={index} justify="space-between" align="center" p={2}>
                          <Box>
                            <Badge colorScheme={enlace.esEmbed ? "purple" : "blue"} mr={2}>
                              {enlace.esEmbed ? "Embebido" : "URL"}
                            </Badge>
                            {enlace.esEmbed ? (
                              <Text fontSize="sm" noOfLines={2}>Código embebido</Text>
                            ) : (
                              <Link href={enlace.url} isExternal color="blue.500" fontSize="sm">
                                {enlace.url} <ExternalLinkIcon mx="2px" />
                              </Link>
                            )}
                          </Box>
                          <Button 
                            size="sm" 
                            colorScheme="red" 
                            onClick={() => eliminarEnlaceWikiloc(index)}
                          >
                            Eliminar
                          </Button>
                        </Flex>
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Text color="gray.500" mt={2}>No hay enlaces de Wikiloc agregados.</Text>
                )}
              </Box>
            </TabPanel>
            
            {/* Panel de Topografías */}
            <TabPanel>
              <Box mb={4}>
                <Heading size="sm" mb={3}>Enlaces a Topografías</Heading>
                <Flex mb={2} alignItems="center">
                  <Input
                    placeholder="URL de la topografía"
                    value={nuevoEnlaceTopografia}
                    onChange={(e) => setNuevoEnlaceTopografia(e.target.value)}
                    bg={inputBg}
                    borderColor={borderColor}
                    mr={2}
                  />
                  <Button onClick={handleAgregarEnlaceTopografia}>
                    Agregar
                  </Button>
                </Flex>
                
                {enlacesTopografias.length > 0 ? (
                  <Box mt={4} p={2} borderWidth="1px" borderRadius="md">
                    <Stack spacing={2}>
                      {enlacesTopografias.map((enlace, index) => (
                        <Flex key={index} justify="space-between" align="center" p={2}>
                          <Link href={enlace} isExternal color="blue.500">
                            {enlace} <ExternalLinkIcon mx="2px" />
                          </Link>
                          <Button 
                            size="sm" 
                            colorScheme="red" 
                            onClick={() => eliminarEnlaceTopografia(index)}
                          >
                            Eliminar
                          </Button>
                        </Flex>
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Text color="gray.500" mt={2}>No hay enlaces a topografías agregados.</Text>
                )}
              </Box>
            </TabPanel>
            
            {/* Panel de Google Drive */}
            <TabPanel>
              <Box mb={4}>
                <Heading size="sm" mb={3}>Enlaces a Google Drive</Heading>
                <Flex mb={2} alignItems="center">
                  <Input
                    placeholder="URL del documento en Google Drive"
                    value={nuevoEnlaceDrive}
                    onChange={(e) => setNuevoEnlaceDrive(e.target.value)}
                    bg={inputBg}
                    borderColor={borderColor}
                    mr={2}
                  />
                  <Button onClick={handleAgregarEnlaceDrive}>
                    Agregar
                  </Button>
                </Flex>
                
                {carpetaDrive && (
                  <Flex mb={4} p={2} bg="gray.50" borderRadius="md" alignItems="center">
                    <FiFolder style={{ marginRight: '8px' }} />
                    <Text fontSize="sm" mr={2}>Carpeta de la actividad:</Text>
                    <Link 
                      href={`https://drive.google.com/drive/folders/${carpetaDrive}`} 
                      isExternal 
                      color="blue.500"
                      fontSize="sm"
                    >
                      Ver en Google Drive <ExternalLinkIcon mx="2px" />
                    </Link>
                  </Flex>
                )}
                
                {enlacesDrive.length > 0 ? (
                  <Box mt={4} p={2} borderWidth="1px" borderRadius="md">
                    <Stack spacing={2}>
                      {enlacesDrive.map((enlace, index) => (
                        <Flex key={index} justify="space-between" align="center" p={2}>
                          <Link href={enlace} isExternal color="blue.500">
                            {enlace} <ExternalLinkIcon mx="2px" />
                          </Link>
                          <Button 
                            size="sm" 
                            colorScheme="red" 
                            onClick={() => eliminarEnlaceDrive(index)}
                          >
                            Eliminar
                          </Button>
                        </Flex>
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Text color="gray.500" mt={2}>No hay enlaces de Google Drive agregados.</Text>
                )}
              </Box>
            </TabPanel>
            
            {/* Panel de Enlaces Web */}
            <TabPanel>
              <Box mb={4}>
                <Heading size="sm" mb={3}>Enlaces Web</Heading>
                <Flex mb={2} alignItems="center">
                  <Input
                    placeholder="URL de la página web"
                    value={nuevoEnlaceWeb}
                    onChange={(e) => setNuevoEnlaceWeb(e.target.value)}
                    bg={inputBg}
                    borderColor={borderColor}
                    mr={2}
                  />
                  <Button onClick={handleAgregarEnlaceWeb}>
                    Agregar
                  </Button>
                </Flex>
                
                {enlacesWeb.length > 0 ? (
                  <Box mt={4} p={2} borderWidth="1px" borderRadius="md">
                    <Stack spacing={2}>
                      {enlacesWeb.map((enlace, index) => (
                        <Flex key={index} justify="space-between" align="center" p={2}>
                          <Link href={enlace} isExternal color="blue.500">
                            {enlace} <ExternalLinkIcon mx="2px" />
                          </Link>
                          <Button 
                            size="sm" 
                            colorScheme="red" 
                            onClick={() => eliminarEnlaceWeb(index)}
                          >
                            Eliminar
                          </Button>
                        </Flex>
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Text color="gray.500" mt={2}>No hay enlaces web agregados.</Text>
                )}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        {mostrarBotones && (
          <Stack direction="row" spacing={4} mt={6} justify="flex-end">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button colorScheme="brand" onClick={handleSubmit} size="lg" leftIcon={<FiSave />}>
              {esNuevo ? 'Crear Actividad' : 'Guardar Actividad'}
            </Button>
          </Stack>
        )}
      </Box>
    );
  }
);

EnlacesEditor.displayName = 'EnlacesEditor';

export default EnlacesEditor;