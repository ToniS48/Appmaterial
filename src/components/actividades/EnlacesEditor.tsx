import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  Box, Button, Text, Stack, Heading, Tabs, TabList, Tab,
  TabPanels, TabPanel, Input, Checkbox, Flex, Badge,
  useToast, Link, useColorModeValue
} from '@chakra-ui/react';
import { FiFolder, FiExternalLink, FiSave } from 'react-icons/fi';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Actividad } from '../../types/actividad';
import { obtenerConfiguracionDrive } from '../../services/configuracionService';
import { Timestamp } from 'firebase/firestore';

interface EnlacesEditorProps {
  actividad: Actividad;
  onSave: (enlaces: Partial<Actividad>) => void;
  onCancel: () => void;
  esNuevo?: boolean;
  mostrarBotones?: boolean; // Añadida propiedad opcional
}

const EnlacesEditor = forwardRef<
  { submitForm: () => void },
  EnlacesEditorProps
>(({ actividad, onSave, onCancel, mostrarBotones = true, esNuevo = false }, ref) => {
  // Estados para cada tipo de enlace
  const [enlacesWikiloc, setEnlacesWikiloc] = useState(actividad.enlacesWikiloc || []);
  const [enlacesTopografias, setEnlacesTopografias] = useState(actividad.enlacesTopografias || []);
  const [enlacesDrive, setEnlacesDrive] = useState(actividad.enlacesDrive || []);
  const [enlacesWeb, setEnlacesWeb] = useState(actividad.enlacesWeb || []);
  
  // Estado para el formulario
  const [nuevoEnlaceWikiloc, setNuevoEnlaceWikiloc] = useState({ url: '', esEmbed: false });
  const [nuevoEnlaceTopografia, setNuevoEnlaceTopografia] = useState('');
  const [nuevoEnlaceDrive, setNuevoEnlaceDrive] = useState('');
  const [nuevoEnlaceWeb, setNuevoEnlaceWeb] = useState('');

  // Configuración de Google Drive
  const [configDrive, setConfigDrive] = useState<{ googleDriveUrl: string }>({ googleDriveUrl: '' });
  
  const toast = useToast();

  // Variables para el modo de color
  const inputBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const boxBg = useColorModeValue("gray.50", "gray.800");

  useEffect(() => {
    const cargarConfiguracionDrive = async () => {
      try {
        const config = await obtenerConfiguracionDrive();
        setConfigDrive(config);
      } catch (error) {
        console.error("Error al cargar configuración de Drive:", error);
      }
    };
    
    cargarConfiguracionDrive();
  }, []);

  const isDriveUrl = (url: string) => {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  };  // Función genérica para eliminar enlaces de string[]
  const crearEliminadorEnlace = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    return (index: number) => {
      setter(prevEnlaces => {
        const nuevosEnlaces = [...prevEnlaces];
        nuevosEnlaces.splice(index, 1);
        return nuevosEnlaces;
      });
    };
  };

  // Función específica para eliminar enlaces de tipo { url: string; esEmbed: boolean }[]
  const crearEliminadorEnlaceWikiloc = (setter: React.Dispatch<React.SetStateAction<{ url: string; esEmbed: boolean }[]>>) => {
    return (index: number) => {
      setter(prevEnlaces => {
        const nuevosEnlaces = [...prevEnlaces];
        nuevosEnlaces.splice(index, 1);
        return nuevosEnlaces;
      });
    };
  };

  // Funciones específicas usando el patrón genérico
  const eliminarEnlaceWikiloc = crearEliminadorEnlaceWikiloc(setEnlacesWikiloc);
  const eliminarEnlaceTopografia = crearEliminadorEnlace(setEnlacesTopografias);
  const eliminarEnlaceDrive = crearEliminadorEnlace(setEnlacesDrive);
  const eliminarEnlaceWeb = crearEliminadorEnlace(setEnlacesWeb);

  // 3. Exponer el método submitForm usando useImperativeHandle
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      // Recolectar y enviar los datos de los enlaces
      const enlaces = {
        enlacesWikiloc,
        enlacesTopografias,
        enlacesDrive,
        enlacesWeb,
        // Mantener la compatibilidad con el campo enlaces
        enlaces: [
          ...enlacesWikiloc.map(e => e.url),
          ...enlacesTopografias,
          ...enlacesDrive,
          ...enlacesWeb
        ],
        // Usar Timestamp en lugar de Date
        fechaActualizacion: Timestamp.fromDate(new Date())
      };
      onSave(enlaces);
    }
  }));

  const handleSubmit = () => {
    // Reutilizar la misma lógica que ya tienes en useImperativeHandle
    const enlaces = {
      enlacesWikiloc,
      enlacesTopografias,
      enlacesDrive,
      enlacesWeb,
      // Mantener la compatibilidad con el campo enlaces
      enlaces: [
        ...enlacesWikiloc.map(e => e.url),
        ...enlacesTopografias,
        ...enlacesDrive,
        ...enlacesWeb
      ],
      // Usar Timestamp en lugar de Date
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
              <Flex mb={2} alignItems="center">
                <Input
                  placeholder="URL del track de Wikiloc"
                  value={nuevoEnlaceWikiloc.url}
                  onChange={(e) => setNuevoEnlaceWikiloc({...nuevoEnlaceWikiloc, url: e.target.value})}
                  bg={inputBg}
                  borderColor={borderColor}
                  mr={2}
                />
                <Checkbox 
                  isChecked={nuevoEnlaceWikiloc.esEmbed}
                  onChange={(e) => setNuevoEnlaceWikiloc({...nuevoEnlaceWikiloc, esEmbed: e.target.checked})}
                  mr={2}
                >
                  Es código de embebido
                </Checkbox>
                <Button 
                  onClick={() => {
                    if (nuevoEnlaceWikiloc.url.trim()) {
                      setEnlacesWikiloc([...enlacesWikiloc, {...nuevoEnlaceWikiloc}]);
                      setNuevoEnlaceWikiloc({ url: '', esEmbed: false });
                    } else {
                      toast({
                        title: "URL vacía",
                        description: "Por favor introduce una URL para el track de Wikiloc",
                        status: "warning",
                        duration: 3000,
                      });
                    }
                  }} 
                  colorScheme="brand"
                >
                  Añadir
                </Button>
              </Flex>
              
              {enlacesWikiloc.length > 0 && (
                <Box mt={3} p={3} borderWidth="1px" borderRadius="md" bg={boxBg} borderColor={borderColor}>
                  <Heading size="xs" mb={2}>Enlaces guardados</Heading>
                  {enlacesWikiloc.map((enlace, index) => (
                    <Flex key={`wikiloc-${index}`} alignItems="center" mb={2}>
                      <Text flex="1" isTruncated>
                        {enlace.esEmbed ? '🖼️ Embebido: ' : '🔗 URL: '}{enlace.url}
                      </Text>
                      <Button 
                        size="sm" 
                        colorScheme="red" 
                        onClick={() => eliminarEnlaceWikiloc(index)}
                      >
                        Eliminar
                      </Button>
                    </Flex>
                  ))}
                </Box>
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
                <Button 
                  onClick={() => {
                    if (nuevoEnlaceTopografia.trim()) {
                      setEnlacesTopografias([...enlacesTopografias, nuevoEnlaceTopografia.trim()]);
                      setNuevoEnlaceTopografia('');
                    } else {
                      toast({
                        title: "URL vacía",
                        description: "Por favor introduce una URL para la topografía",
                        status: "warning",
                        duration: 3000,
                      });
                    }
                  }} 
                  colorScheme="brand"
                >
                  Añadir
                </Button>
              </Flex>
              
              {enlacesTopografias.length > 0 && (
                <Box mt={3} p={3} borderWidth="1px" borderRadius="md" bg={boxBg} borderColor={borderColor}>
                  <Heading size="xs" mb={2}>Enlaces guardados</Heading>
                  {enlacesTopografias.map((enlace, index) => (
                    <Flex key={`topo-${index}`} alignItems="center" mb={2}>
                      <Text flex="1" isTruncated>🗺️ {enlace}</Text>
                      <Link href={enlace} isExternal ml={2} mr={2}>
                        <ExternalLinkIcon />
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
                </Box>
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
                <Button 
                  onClick={() => {
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
                    } else {
                      toast({
                        title: "URL vacía",
                        description: "Por favor introduce una URL para el documento",
                        status: "warning",
                        duration: 3000,
                      });
                    }
                  }} 
                  colorScheme="brand"
                >
                  Añadir
                </Button>
              </Flex>
              
              {enlacesDrive.length > 0 && (
                <Box mt={3} p={3} borderWidth="1px" borderRadius="md" bg={boxBg} borderColor={borderColor}>
                  <Heading size="xs" mb={2}>Enlaces guardados</Heading>
                  {enlacesDrive.map((enlace, index) => (
                    <Flex key={`drive-${index}`} alignItems="center" mb={2}>
                      <Text flex="1" isTruncated><FiFolder style={{display: 'inline', marginRight: '5px'}} /> {enlace}</Text>
                      <Link href={enlace} isExternal ml={2} mr={2}>
                        <ExternalLinkIcon />
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
                </Box>
              )}
            </Box>
          </TabPanel>
          
          {/* Panel de Enlaces Web */}
          <TabPanel>
            <Box mb={4}>
              <Heading size="sm" mb={3}>Enlaces Web</Heading>
              <Flex mb={2} alignItems="center">
                <Input
                  placeholder="URL del sitio web"
                  value={nuevoEnlaceWeb}
                  onChange={(e) => setNuevoEnlaceWeb(e.target.value)}
                  bg={inputBg}
                  borderColor={borderColor}
                  mr={2}
                />
                <Button 
                  onClick={() => {
                    if (nuevoEnlaceWeb.trim()) {
                      setEnlacesWeb([...enlacesWeb, nuevoEnlaceWeb.trim()]);
                      setNuevoEnlaceWeb('');
                    } else {
                      toast({
                        title: "URL vacía",
                        description: "Por favor introduce una URL para el sitio web",
                        status: "warning",
                        duration: 3000,
                      });
                    }
                  }} 
                  colorScheme="brand"
                >
                  Añadir
                </Button>
              </Flex>
              
              {enlacesWeb.length > 0 && (
                <Box mt={3} p={3} borderWidth="1px" borderRadius="md" bg={boxBg} borderColor={borderColor}>
                  <Heading size="xs" mb={2}>Enlaces guardados</Heading>
                  {enlacesWeb.map((enlace, index) => (
                    <Flex key={`web-${index}`} alignItems="center" mb={2}>
                      <Text flex="1" isTruncated>🌐 {enlace}</Text>
                      <Link href={enlace} isExternal ml={2} mr={2}>
                        <ExternalLinkIcon />
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
                </Box>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {mostrarBotones !== false && (
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
});

// 4. Agregar displayName para debugging
EnlacesEditor.displayName = 'EnlacesEditor';

export default EnlacesEditor;