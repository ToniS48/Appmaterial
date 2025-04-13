import React, { useState, useEffect } from 'react';
import {
  Box, Button, Text, Stack, Heading, Tabs, TabList, Tab,
  TabPanels, TabPanel, Input, Checkbox, Flex, Badge,
  useToast, Link
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
  esNuevo?: boolean; // <- Nueva propiedad
}

const EnlacesEditor: React.FC<EnlacesEditorProps> = ({ 
  actividad, 
  onSave, 
  onCancel,
  esNuevo = false 
}) => {
  // Estados para cada tipo de enlace
  const [enlacesWikiloc, setEnlacesWikiloc] = useState(actividad.enlacesWikiloc || []);
  const [enlacesTopografias, setEnlacesTopografias] = useState(actividad.enlacesTopografias || []);
  const [enlacesDrive, setEnlacesDrive] = useState(actividad.enlacesDrive || []);
  const [enlacesWeb, setEnlacesWeb] = useState(actividad.enlacesWeb || []);
  
  // Estados para nuevos enlaces
  const [nuevoEnlaceWikiloc, setNuevoEnlaceWikiloc] = useState({ url: '', esEmbed: false });
  const [nuevoEnlaceTopografia, setNuevoEnlaceTopografia] = useState('');
  const [nuevoEnlaceDrive, setNuevoEnlaceDrive] = useState('');
  const [nuevoEnlaceWeb, setNuevoEnlaceWeb] = useState('');
  
  // Configuración de Google Drive
  const [driveConfig, setDriveConfig] = useState({
    googleDriveUrl: '',
    googleDriveTopoFolder: '',
    googleDriveDocFolder: ''
  });
  
  const toast = useToast();
  
  useEffect(() => {
    const cargarConfiguracionDrive = async () => {
      try {
        const config = await obtenerConfiguracionDrive();
        setDriveConfig(config);
      } catch (error) {
        console.error("Error al cargar configuración de Drive:", error);
      }
    };
    
    cargarConfiguracionDrive();
  }, []);
  
  const isDriveUrl = (url: string) => {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  };
  
  const handleSubmit = () => {
    onSave({
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
    });
  };
  
  // Función para eliminar enlaces de Wikiloc
  const eliminarEnlaceWikiloc = (index: number) => {
    const nuevosEnlaces = [...enlacesWikiloc];
    nuevosEnlaces.splice(index, 1);
    setEnlacesWikiloc(nuevosEnlaces);
  };
  
  // Función para eliminar enlaces de Topografía
  const eliminarEnlaceTopografia = (index: number) => {
    const nuevosEnlaces = [...enlacesTopografias];
    nuevosEnlaces.splice(index, 1);
    setEnlacesTopografias(nuevosEnlaces);
  };
  
  // Función para eliminar enlaces de Drive
  const eliminarEnlaceDrive = (index: number) => {
    const nuevosEnlaces = [...enlacesDrive];
    nuevosEnlaces.splice(index, 1);
    setEnlacesDrive(nuevosEnlaces);
  };
  
  // Función para eliminar enlaces Web
  const eliminarEnlaceWeb = (index: number) => {
    const nuevosEnlaces = [...enlacesWeb];
    nuevosEnlaces.splice(index, 1);
    setEnlacesWeb(nuevosEnlaces);
  };
  
  return (
    <Box>
      <Tabs variant="enclosed" colorScheme="brand">
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
                <Box mt={3} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
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
                <Box mt={3} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
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
                <Box mt={3} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
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
                <Box mt={3} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
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
      
      <Stack direction="row" spacing={4} mt={6} justify="flex-end">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button colorScheme="brand" onClick={handleSubmit} size="lg" leftIcon={<FiSave />}>
          {esNuevo ? 'Crear Actividad' : 'Guardar Actividad'}
        </Button>
      </Stack>
    </Box>
  );
};

export default EnlacesEditor;