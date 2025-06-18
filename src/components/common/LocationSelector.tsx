import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
  Text,
  VStack,
  HStack,
  Input,
  FormControl,
  FormLabel,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  Center
} from '@chakra-ui/react';
import { FiMapPin, FiCheck, FiSearch } from 'react-icons/fi';

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    address: string;
    lat: number;
    lon: number;
  }) => void;
  currentLocation?: string;
}

interface Location {
  address: string;
  lat: number;
  lon: number;
}

/**
 * Componente para seleccionar ubicación usando Google Maps embed
 */
const LocationSelector: React.FC<LocationSelectorProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  currentLocation = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(currentLocation);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapUrl, setMapUrl] = useState('');
  const toast = useToast();

  // Sincronizar con la ubicación actual
  useEffect(() => {
    if (currentLocation) {
      setSearchQuery(currentLocation);
      if (currentLocation.trim()) {
        searchLocation(currentLocation);
      }
    }
  }, [currentLocation]);

  /**
   * Busca una ubicación usando Nominatim (OpenStreetMap)
   */
  const searchLocation = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1&addressdetails=1&extratags=1`
      );

      if (!response.ok) {
        throw new Error('Error en la búsqueda de ubicación');
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const location: Location = {
          address: result.display_name || query,
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon)
        };

        setSelectedLocation(location);
        updateMapUrl(location.lat, location.lon, location.address);
      } else {
        // Si no encuentra resultados exactos, crear URL de búsqueda general
        const googleSearchUrl = `https://www.google.com/maps/embed/v1/search?key=${getGoogleMapsApiKey()}&q=${encodedQuery}&zoom=12`;
        setMapUrl(googleSearchUrl);
        setSelectedLocation({
          address: query,
          lat: 0,
          lon: 0
        });
      }
    } catch (error) {
      console.error('Error buscando ubicación:', error);
      toast({
        title: 'Error de búsqueda',
        description: 'No se pudo buscar la ubicación. Inténtalo de nuevo.',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      
      // Fallback: crear URL de búsqueda de Google Maps
      const encodedQuery = encodeURIComponent(query.trim());
      const googleSearchUrl = `https://www.google.com/maps/embed/v1/search?key=${getGoogleMapsApiKey()}&q=${encodedQuery}&zoom=12`;
      setMapUrl(googleSearchUrl);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Actualiza la URL del mapa con las coordenadas específicas
   */
  const updateMapUrl = (lat: number, lon: number, address: string) => {
    const apiKey = getGoogleMapsApiKey();
    if (apiKey) {
      // URL con marcador en coordenadas específicas
      const url = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lon}&zoom=15`;
      setMapUrl(url);
    } else {
      // Fallback sin API key - usar iframe básico de OpenStreetMap
      const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lon}`;
      setMapUrl(osmUrl);
    }
  };

  /**
   * Obtiene la API key de Google Maps (configurable)
   */
  const getGoogleMapsApiKey = (): string => {
    // En un entorno real, esto vendría de variables de entorno o configuración
    // Para este ejemplo, usaremos un placeholder
    return process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
  };

  /**
   * Maneja la búsqueda al presionar Enter o hacer clic en buscar
   */
  const handleSearch = () => {
    searchLocation(searchQuery);
  };

  /**
   * Maneja la selección de la ubicación
   */
  const handleSelectLocation = () => {
    if (!selectedLocation) {
      toast({
        title: 'Ubicación requerida',
        description: 'Por favor busca y selecciona una ubicación primero.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      return;
    }

    // Si no tenemos coordenadas exactas, usar la dirección como está
    const locationToSelect = selectedLocation.lat === 0 && selectedLocation.lon === 0
      ? { ...selectedLocation, address: searchQuery }
      : selectedLocation;

    onLocationSelect(locationToSelect);
    toast({
      title: 'Ubicación seleccionada',
      description: `Ubicación: ${locationToSelect.address}`,
      status: 'success',
      duration: 2000,
      isClosable: true
    });
    onClose();
  };

  /**
   * Maneja el evento de Enter en el campo de búsqueda
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxW="90vw" h="80vh">
        <ModalHeader>
          <HStack>
            <FiMapPin />
            <Text>Seleccionar ubicación</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} h="full">
            {/* Campo de búsqueda */}
            <FormControl>
              <FormLabel>Buscar ubicación</FormLabel>
              <HStack>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ej: Montanejos, Castellón, España"
                  size="lg"
                />
                <Button
                  onClick={handleSearch}
                  isLoading={isLoading}
                  leftIcon={<FiSearch />}
                  colorScheme="blue"
                  size="lg"
                >
                  Buscar
                </Button>
              </HStack>
            </FormControl>

            {/* Información de ubicación seleccionada */}
            {selectedLocation && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  <strong>Ubicación encontrada:</strong> {selectedLocation.address}
                  {selectedLocation.lat !== 0 && (
                    <Text fontSize="sm" color="gray.600">
                      Coordenadas: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lon.toFixed(6)}
                    </Text>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Mapa embebido */}
            <Box w="full" h="full" borderRadius="md" overflow="hidden" border="1px solid" borderColor="gray.200">
              {isLoading ? (
                <Center h="full">
                  <VStack>
                    <Spinner size="xl" />
                    <Text>Buscando ubicación...</Text>
                  </VStack>
                </Center>
              ) : mapUrl ? (
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa de ubicación"
                />
              ) : (
                <Center h="full" color="gray.500">
                  <VStack>
                    <FiMapPin size={48} />
                    <Text>Busca una ubicación para ver el mapa</Text>
                  </VStack>
                </Center>
              )}
            </Box>

            {/* Nota sobre Google Maps API */}
            {!getGoogleMapsApiKey() && (
              <Alert status="warning" size="sm">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  <strong>Nota:</strong> Para una mejor experiencia con Google Maps, 
                  configura una API key de Google Maps en las variables de entorno.
                </AlertDescription>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSelectLocation}
              leftIcon={<FiCheck />}
              isDisabled={!selectedLocation}
            >
              Seleccionar ubicación
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default LocationSelector;
