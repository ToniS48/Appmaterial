import React, { useState, useEffect, useRef } from 'react';
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
  Center,
  Switch,
  Badge
} from '@chakra-ui/react';
import { FiMapPin, FiCheck, FiSearch, FiMap } from 'react-icons/fi';

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
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false); // Switch para alternar mapas
  const [googleMap, setGoogleMap] = useState<any>(null); // Instancia de Google Maps JavaScript API
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Coordenadas del centro de España
  const SPAIN_CENTER = { lat: 40.4637, lon: -3.7492 };
  const SPAIN_ZOOM = 6;
  /**
   * Genera un nombre corto y amigable para mostrar en las tarjetas de actividades
   * A partir del resultado completo de Nominatim
   * 
   * OBJETIVO: Evitar textos muy largos como "Montanejos, El Alto Mijares, Castellón, Comunidad Valenciana, 12448, España"
   * RESULTADO: Textos concisos como "Montanejos, Castellón"
   */
  const generateShortLocationName = (nominatimResult: any): string => {
    // Extraer información relevante del resultado de Nominatim
    const { display_name, address } = nominatimResult;
    
    if (!address) {
      // Si no hay información de dirección estructurada, usar una versión simplificada del display_name
      const parts = display_name.split(',').map((part: string) => part.trim());
      // Tomar solo las 2 primeras partes para evitar texto muy largo
      return parts.slice(0, 2).join(', ');
    }

    // Construir nombre corto basado en la información de dirección estructurada
    const {
      village,       // Pueblo/aldea
      town,          // Ciudad pequeña
      city,          // Ciudad
      municipality,  // Municipio
      county,        // Comarca/condado (ej: "El Alto Mijares")
      state,         // Provincia/estado (ej: "Castellón")
      country        // País
    } = address;

    // Priorizar información más específica a menos específica
    const location = village || town || city || municipality;
    
    // Para España, preferir la provincia (state) sobre la comarca (county)
    // ya que es más reconocible: "Castellón" vs "El Alto Mijares"
    const region = state || county;
    
    if (location && region) {
      // Formato: "Pueblo, Provincia" (ej: "Montanejos, Castellón")
      return `${location}, ${region}`;
    } else if (location) {
      // Solo el lugar si no hay región
      return location;
    } else if (region) {
      // Solo la región si no hay lugar específico
      return region;
    } else {
      // Fallback: usar las 2 primeras partes del display_name
      const parts = display_name.split(',').map((part: string) => part.trim());
      return parts.slice(0, 2).join(', ');
    }
  };

  /**
   * Inicializa el mapa mostrando España completa
   */
  const initializeSpainMap = () => {
    const apiKey = getGoogleMapsApiKey();
    if (apiKey) {
      // Mostrar España con Google Maps
      const spainUrl = `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${SPAIN_CENTER.lat},${SPAIN_CENTER.lon}&zoom=${SPAIN_ZOOM}`;
      setMapUrl(spainUrl);
    } else {
      // Fallback: mapa de España con OpenStreetMap
      const bbox = '-9.3,35.9,3.3,43.8'; // Bounding box de España
      const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
      setMapUrl(osmUrl);
    }
  };

  /**
   * Convierte coordenadas de píxeles del mapa a coordenadas geográficas aproximadas
   */
  const pixelToCoordinates = (x: number, y: number, mapWidth: number, mapHeight: number) => {
    // Aproximación para España (estas coordenadas son aproximadas)
    const spainBounds = {
      north: 43.8,
      south: 35.9,
      east: 3.3,
      west: -9.3
    };
    
    const lat = spainBounds.north - (y / mapHeight) * (spainBounds.north - spainBounds.south);
    const lon = spainBounds.west + (x / mapWidth) * (spainBounds.east - spainBounds.west);
    
    return { lat, lon };
  };

  /**
   * Maneja el clic en el mapa para detectar doble clic (mejorado)
   */
  const handleMapClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    
    // Doble clic detectado (entre 100ms y 600ms para mejor precisión)
    if (timeDiff > 100 && timeDiff < 600 && clickCount === 1) {
      event.preventDefault();
      event.stopPropagation();
      
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const coords = pixelToCoordinates(x, y, rect.width, rect.height);
      
      setIsLoading(true);
      try {
        // Buscar dirección usando coordenadas (geocodificación inversa)
        const address = await reverseGeocode(coords.lat, coords.lon);
        
        const location: Location = {
          address,
          lat: coords.lat,
          lon: coords.lon
        };
        
        setSelectedLocation(location);
        updateMapUrl(coords.lat, coords.lon, address);
        
        toast({
          title: 'Ubicación capturada',
          description: `Ubicación: ${address}`,
          status: 'success',
          duration: 3000,
          isClosable: true
        });
      } catch (error) {
        console.error('Error capturando ubicación:', error);
        toast({
          title: 'Error',
          description: 'No se pudo obtener la dirección de esta ubicación',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      } finally {
        setIsLoading(false);
      }
      
      setClickCount(0);
    } else {
      setClickCount(1);
    }
    
    setLastClickTime(currentTime);
  };

  /**
   * Geocodificación inversa: obtener dirección a partir de coordenadas
   */
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Error en geocodificación inversa');
      }
      
      const data = await response.json();
      return generateShortLocationName(data);
    } catch (error) {
      console.error('Error en geocodificación inversa:', error);
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  };

  // Sincronizar con la ubicación actual e inicializar mapa
  useEffect(() => {
    if (isOpen) {
      if (currentLocation && currentLocation.trim()) {
        setSearchQuery(currentLocation);
        searchLocation(currentLocation);
      } else {
        // Si no hay ubicación inicial, mostrar España completa
        setSearchQuery('');
        setSelectedLocation(null);
        
        if (useGoogleMaps) {
          initializeGoogleMap();
        } else {
          initializeSpainMap();
        }
      }
    }
  }, [currentLocation, isOpen, useGoogleMaps]);

  // Effect para cambiar entre tipos de mapa
  useEffect(() => {
    if (isOpen && !currentLocation?.trim()) {
      if (useGoogleMaps) {
        initializeGoogleMap();
      } else {
        initializeSpainMap();
      }
    }
  }, [useGoogleMaps]);

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
        const shortAddress = generateShortLocationName(result);
        const location: Location = {
          address: shortAddress,
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
   * Carga la API de Google Maps JavaScript dinámicamente
   */
  const loadGoogleMapsAPI = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const apiKey = getGoogleMapsApiKey();
      if (!apiKey) {
        reject(new Error('No se encontró la API key de Google Maps'));
        return;
      }

      // Verificar si ya está cargada
      if ((window as any).google && (window as any).google.maps) {
        resolve();
        return;
      }

      // Crear script para cargar la API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Error cargando Google Maps API'));
      
      document.head.appendChild(script);
    });
  };

  /**
   * Inicializa Google Maps JavaScript API
   */
  const initializeGoogleMap = async () => {
    try {
      await loadGoogleMapsAPI();
      
      if (!googleMapRef.current) return;

      const map = new (window as any).google.maps.Map(googleMapRef.current, {
        center: SPAIN_CENTER,
        zoom: SPAIN_ZOOM,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true
      });

      // Añadir listener para clics en el mapa
      map.addListener('click', (event: any) => {
        const lat = event.latLng.lat();
        const lon = event.latLng.lng();
        
        handleGoogleMapClick(lat, lon, map);
      });

      setGoogleMap(map);
    } catch (error) {
      console.error('Error inicializando Google Maps:', error);
      toast({
        title: 'Error con Google Maps',
        description: 'No se pudo cargar Google Maps. Usando OpenStreetMap.',
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      setUseGoogleMaps(false);
    }
  };

  /**
   * Maneja el clic en Google Maps
   */
  const handleGoogleMapClick = async (lat: number, lon: number, map: any) => {
    setIsLoading(true);
    try {
      // Crear marcador en la posición clickeada
      new (window as any).google.maps.Marker({
        position: { lat, lng: lon },
        map: map,
        title: 'Ubicación seleccionada'
      });

      // Centrar el mapa en la nueva posición
      map.setCenter({ lat, lng: lon });
      map.setZoom(15);

      // Obtener dirección usando geocodificación inversa
      const address = await reverseGeocode(lat, lon);
      
      const location: Location = {
        address,
        lat,
        lon
      };
      
      setSelectedLocation(location);
      
      toast({
        title: 'Ubicación capturada',
        description: `Ubicación: ${address}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error('Error capturando ubicación:', error);
      toast({
        title: 'Error',
        description: 'No se pudo obtener la dirección de esta ubicación',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
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
          <HStack justify="space-between" w="full">
            <HStack>
              <FiMapPin />
              <Text>Seleccionar ubicación</Text>
            </HStack>
            
            {/* Switch para tipo de mapa */}
            <HStack spacing={4}>
              <HStack>
                <Text fontSize="sm">OpenStreetMap</Text>
                <Switch
                  isChecked={useGoogleMaps}
                  onChange={(e) => setUseGoogleMaps(e.target.checked)}
                  colorScheme="blue"
                />
                <Text fontSize="sm">Google Maps</Text>
                {!getGoogleMapsApiKey() && useGoogleMaps && (
                  <Badge colorScheme="orange" fontSize="xs">Sin API Key</Badge>
                )}
              </HStack>
            </HStack>
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

            {/* Indicador de instrucciones - fuera del mapa */}
            <Alert status="info" size="sm" borderRadius="md">
              <AlertIcon />
              <AlertDescription fontSize="sm">
                <strong>💡 Instrucciones:</strong> {' '}
                {useGoogleMaps 
                  ? 'Haz clic una vez en el mapa para seleccionar ubicación'
                  : 'Haz doble clic en el mapa para capturar ubicación'
                }
              </AlertDescription>
            </Alert>

            {/* Información de ubicación seleccionada */}
            {selectedLocation && (
              <Alert status="success" borderRadius="md">
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

            {/* Mapa */}
            <Box 
              w="full" 
              h="full" 
              borderRadius="md" 
              overflow="hidden" 
              border="1px solid" 
              borderColor="gray.200"
              position="relative"
            >
              {isLoading ? (
                <Center h="full">
                  <VStack>
                    <Spinner size="xl" />
                    <Text>Buscando ubicación...</Text>
                  </VStack>
                </Center>
              ) : useGoogleMaps ? (
                /* Google Maps JavaScript API */
                <Box
                  ref={googleMapRef}
                  width="100%"
                  height="100%"
                  bg="gray.100"
                >
                  {!googleMap && (
                    <Center h="full">
                      <VStack>
                        <Spinner />
                        <Text>Cargando Google Maps...</Text>
                      </VStack>
                    </Center>
                  )}
                </Box>
              ) : mapUrl ? (
                /* OpenStreetMap iframe */
                <>
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
                  {/* Capa invisible para capturar doble clic - SIN fondo azul */}
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    width="100%"
                    height="100%"
                    onDoubleClick={handleMapClick}
                    cursor="crosshair"
                    zIndex={1}
                    bg="transparent" // Completamente transparente
                    ref={mapRef}
                  />
                </>
              ) : (
                <Center h="full" color="gray.500">
                  <VStack>
                    <FiMapPin size={48} />
                    <Text>Busca una ubicación para ver el mapa</Text>
                    <Text fontSize="sm" textAlign="center">
                      O usa el selector para ver España
                    </Text>
                  </VStack>
                </Center>
              )}
            </Box>

            {/* Nota sobre Google Maps API */}
            {!getGoogleMapsApiKey() && useGoogleMaps && (
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
