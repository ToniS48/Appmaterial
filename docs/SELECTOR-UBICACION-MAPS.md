# 🗺️ Selector de Ubicación con Google Maps

## 📖 Descripción

Nueva funcionalidad que permite seleccionar la ubicación de una actividad usando un mapa interactivo integrado en el formulario de creación/edición de actividades. La ubicación seleccionada se utiliza automáticamente para obtener datos meteorológicos más precisos.

## ✨ Características

### 🎯 **Integración en Formulario**
- **Icono en campo lugar**: Botón junto al campo de ubicación para abrir el selector
- **Autocompletado**: Sincroniza con el texto introducido manualmente
- **Búsqueda inteligente**: Usa OpenStreetMap Nominatim para geocodificación
- **Coordenadas precisas**: Guarda lat/lon para uso meteorológico

### 🗺️ **Mapa Interactivo**
- **Google Maps Embed**: Mapa completo e interactivo (si hay API key)
- **Fallback OpenStreetMap**: Funciona sin API key para ubicaciones básicas
- **Búsqueda en tiempo real**: Encuentra ubicaciones mientras escribes
- **Visualización clara**: Marcador en la ubicación exacta

### 🌤️ **Integración Meteorológica**
- **Coordenadas exactas**: Usa lat/lon en lugar de geocodificación repetida
- **Mayor precisión**: Datos meteorológicos para la ubicación exacta
- **Optimización**: Evita llamadas de geocodificación innecesarias
- **Compatibilidad**: Funciona con AEMET y Open-Meteo

## 🚀 Uso

### 1. **Crear/Editar Actividad**
1. En el formulario, en el campo "Lugar"
2. Hacer clic en el icono 📍 junto al campo
3. Se abre el modal de selección de ubicación

### 2. **Seleccionar Ubicación**
1. Escribir la ubicación en el campo de búsqueda
2. Hacer clic en "Buscar" o presionar Enter
3. Ver el mapa con la ubicación encontrada
4. Hacer clic en "Seleccionar ubicación" para confirmar

### 3. **Resultado**
- El campo "Lugar" se rellena automáticamente
- Las coordenadas se guardan invisiblemente
- Los datos meteorológicos usan la ubicación exacta

## 🔧 Configuración

### 🗝️ **Google Maps API Key (Opcional)**
Para mejor experiencia con Google Maps:

1. **Obtener API Key**:
   - Ir a [Google Cloud Console](https://console.cloud.google.com/)
   - Activar Maps Embed API
   - Crear API key

2. **Configurar**:
   ```bash
   # En .env o variables de entorno
   REACT_APP_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
   ```

3. **Sin API Key**:
   - Funciona con OpenStreetMap como fallback
   - Menos funcionalidades pero completamente operativo

## 📋 Componentes Implementados

### 🎯 **LocationSelector.tsx**
- Modal completo para selección de ubicación
- Búsqueda con Nominatim (OpenStreetMap)
- Integración con Google Maps Embed
- Manejo de errores y fallbacks

### 🔄 **ActividadInfoForm.tsx** (Modificado)
- Icono 📍 junto al campo lugar
- Tooltip explicativo
- Integración con LocationSelector
- Campos ocultos para coordenadas

### ⚡ **weatherService.ts** (Extendido)
- Nuevo método `getWeatherForActivityWithCoordinates()`
- Uso directo de coordenadas sin geocodificación
- Optimización de rendimiento

### 🔗 **useWeather.ts** (Actualizado)
- Detección automática de coordenadas en actividad
- Prioridad: coordenadas > geocodificación
- Compatible con versiones anteriores

## 💻 Ejemplos de Código

### **Uso del LocationSelector**
```tsx
import LocationSelector from '../common/LocationSelector';

const MiComponente = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [ubicacion, setUbicacion] = useState('');

  const handleLocationSelect = (location) => {
    setUbicacion(location.address);
    console.log('Coordenadas:', location.lat, location.lon);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Seleccionar ubicación
      </Button>
      
      <LocationSelector
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={ubicacion}
      />
    </>
  );
};
```

### **Datos meteorológicos con coordenadas**
```typescript
// Automático en useWeather si la actividad tiene coordenadas
const actividad = {
  // ...otros campos...
  lugar: 'Montanejos, Castellón',
  ubicacionLat: 40.0242,
  ubicacionLon: -0.4845
};

// El hook detecta automáticamente y usa coordenadas
const { weatherData } = useWeather(actividad);
```

## 🎨 Interfaz de Usuario

### 💡 **Campo Lugar con Selector**
```
┌─────────────────────────────────────────┐
│ Lugar *                            📍   │
├─────────────────────────────────────────┤
│ Montanejos, Castellón              📍   │
└─────────────────────────────────────────┘
```

### 🗺️ **Modal de Selección**
```
┌──── 📍 Seleccionar ubicación ────────────┐
│                                     ✕    │
├─────────────────────────────────────────┤
│ Buscar ubicación                         │
│ ┌─────────────────────────────┐ [Buscar] │
│ │ Montanejos, Castellón       │          │
│ └─────────────────────────────┘          │
├─────────────────────────────────────────┤
│ ℹ️ Ubicación encontrada:                  │
│ Montanejos, Provincia de Castellón, CV   │
│ Coordenadas: 40.024200, -0.484500       │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │           🗺️ MAPA                  │ │
│ │                                     │ │
│ │         [Marcador]                  │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│                    [Cancelar] [✓ Sel.]  │
└─────────────────────────────────────────┘
```

## 🔍 Resolución de Problemas

### ❓ **Problemas Comunes**

#### "El mapa no se muestra"
```bash
✅ Verificar API key de Google Maps (opcional)
✅ Comprobar conexión a internet
✅ Revisar consola de navegador por errores
```

#### "No encuentra la ubicación"
```bash
✅ Usar formato completo: "Ciudad, Provincia, País"
✅ Probar nombres alternativos
✅ Verificar ortografía
```

#### "Datos meteorológicos imprecisos"
```bash
✅ Usar el selector de mapa para ubicación exacta
✅ Verificar que se guardaron las coordenadas
✅ Comprobar configuración meteorológica
```

## 🔮 Beneficios

### ✅ **Para Usuarios**
- **Fácil selección**: Interfaz visual e intuitiva
- **Precisión**: Ubicación exacta en el mapa
- **Rapidez**: Búsqueda instantánea de lugares
- **Confianza**: Ver exactamente dónde está la actividad

### ✅ **Para el Sistema**
- **Datos precisos**: Coordenadas exactas guardadas
- **Rendimiento**: Menos geocodificación repetida
- **Calidad meteorológica**: Datos climáticos más precisos
- **Escalabilidad**: Base para futuras funcionalidades geográficas

---

**Estado**: ✅ Implementado y funcional  
**Fecha**: Junio 2025  
**Versión**: 1.0.0
