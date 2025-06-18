# ☁️ Integración Meteorológica con Open-Meteo y AEMET

## 📖 Descripción

Este complemento integra información meteorológica en las actividades usando múltiples fuentes de datos meteorológicos:
- **Open-Meteo**: API meteorológica gratuita y de código abierto para cobertura global
- **AEMET**: Datos oficiales de la Agencia Estatal de Meteorología para ubicaciones en España

Los datos del clima se muestran automáticamente en las cards de actividades planificadas y en curso, usando la mejor fuente disponible según la ubicación.

## ✨ Características

### 🌤️ **Fuentes de Datos Meteorológicos**

#### **Open-Meteo (Global)**
- **API gratuita**: Sin necesidad de registro
- **Sin límites**: Sin restricciones de llamadas por día
- **Código abierto**: Transparente y confiable
- **Cobertura global**: Datos de alta calidad para todo el mundo

#### **AEMET (España)**
- **Datos oficiales**: Agencia Estatal de Meteorología española
- **Alta precisión**: Datos específicos para territorio español
- **API key requerida**: Registro gratuito en opendata.aemet.es
- **Respaldo automático**: Si falla, usa Open-Meteo automáticamente

#### **Selección Inteligente**
- **España**: Usa AEMET si está configurado, sino Open-Meteo
- **Resto del mundo**: Usa Open-Meteo
- **Fallback**: Si la fuente principal falla, usa la alternativa

### 📱 **Integración en la Aplicación**
- **Cards compactas**: Información meteorológica resumida en las cards de actividades
- **Vista detallada**: Pronóstico completo en la vista de detalle de actividades  
- **Automática**: Se muestra solo para actividades futuras (próximos 15 días)
- **Inteligente**: Usa la ubicación de la actividad o la ubicación por defecto

### ⚙️ **Configuración Flexible**
- **Panel de administración**: Configuración desde el panel de admin
- **Ubicación por defecto**: Configurable para cuando no se especifica lugar
- **Unidades personalizables**: Celsius/Fahrenheit, km/h/m/s/mph, mm/inch
- **Cache inteligente**: Datos actualizados cada 10 minutos

## 🚀 Instalación y Configuración

### 1. **Activar el Servicio**
1. Ir a **Configuración** → **Clima**
2. Activar el switch "Habilitar pronóstico meteorológico"
3. Configurar la ubicación por defecto
4. Seleccionar las unidades preferidas

### 2. **Configurar AEMET (Opcional - para España)**
1. Obtener API key gratuita en [opendata.aemet.es](https://opendata.aemet.es/centrodedescargas/inicio)
2. En la configuración, activar "Habilitar AEMET para España"
3. Introducir la API key obtenida
4. Activar "Usar AEMET para ubicaciones en España"

### 3. **Guardar y Probar**
1. Guardar configuración
2. Hacer clic en "Probar conexión" para verificar que funciona
3. El sistema confirmará si puede obtener datos meteorológicos

## 🇪🇸 Integración AEMET (España)

### 📋 **¿Qué es AEMET?**
AEMET (Agencia Estatal de Meteorología) es el organismo oficial español encargado del desarrollo, implantación y prestación de los servicios meteorológicos de competencia del Estado. Proporciona datos meteorológicos oficiales y de alta precisión para todo el territorio español.

### 🔑 **Configuración de AEMET**

#### **1. Obtener API Key**
1. Ir a [opendata.aemet.es](https://opendata.aemet.es/centrodedescargas/inicio)
2. Crear cuenta gratuita
3. Solicitar API key para "opendata"
4. Copiar la key generada

#### **2. Configurar en la Aplicación**
1. Ir a **Configuración** → **Clima**
2. En la sección "Configuración AEMET (España)":
   - Activar "Habilitar AEMET para España"
   - Introducir la API key obtenida
   - Activar "Usar AEMET para ubicaciones en España"
3. Guardar configuración

### 🎯 **Lógica de Funcionamiento**

#### **Detección Automática de España**
```typescript
// El sistema detecta automáticamente si una ubicación está en España
// basándose en coordenadas geográficas:
const isSpain = lat >= 36.0 && lat <= 43.8 && lon >= -9.3 && lon <= 3.3;
```

#### **Proceso de Obtención de Datos**
1. **Verificar ubicación**: Si la actividad está en España
2. **Buscar municipio**: Encontrar el municipio AEMET más cercano
3. **Obtener pronóstico**: Usar API de AEMET para el municipio
4. **Mapear datos**: Convertir formato AEMET a formato interno
5. **Fallback**: Si algo falla, usar Open-Meteo automáticamente

### 📊 **Ventajas de AEMET**

#### **✅ Datos Oficiales**
- **Precisión**: Datos oficiales del gobierno español
- **Cobertura**: Específico para territorio español
- **Actualización**: Datos actualizados regularmente
- **Confiabilidad**: Fuente oficial y verificada

#### **✅ Integración Inteligente**
- **Automático**: Selección automática según ubicación
- **Respaldo**: Open-Meteo como fallback
- **Configuración**: Fácil activación/desactivación
- **Transparente**: El usuario no nota el cambio de fuente

### 🔧 **Códigos de Estado AEMET**

#### **Mapeo de Condiciones**
```typescript
// Códigos de estado del cielo AEMET
'11': 'Despejado'          → ☀️ clear
'12': 'Poco nuboso'        → ⛅ clouds
'13': 'Intervalos nubosos' → ☁️ clouds
'33': 'Lluvia'             → 🌧️ rain
'51': 'Tormenta'           → ⛈️ thunderstorm
'43': 'Nieve'              → ❄️ snow
```

### ⚠️ **Limitaciones y Consideraciones**

#### **🚫 Limitaciones**
- **Solo España**: AEMET solo cubre territorio español
- **API Key**: Requiere registro (aunque gratuito)
- **Complejidad**: Datos más complejos que Open-Meteo
- **Municipios**: Basado en códigos de municipio, no coordenadas exactas

#### **✅ Soluciones Implementadas**
- **Fallback automático**: Si AEMET falla, usa Open-Meteo
- **Detección inteligente**: Solo usa AEMET en España
- **Cache compartido**: Misma estrategia de cache que Open-Meteo
- **Mapeo consistente**: Misma interfaz para ambas fuentes

## 📋 Componentes Incluidos

### 🎯 **Servicios**
- **`weatherService.ts`**: Servicio principal para obtener datos meteorológicos
- **`configuracionService.ts`**: Gestión de configuración meteorológica

### 🧩 **Componentes**
- **`WeatherCard.tsx`**: Componente para mostrar información meteorológica
- **`WeatherConfiguration.tsx`**: Panel de configuración en admin

### 🔧 **Hooks**
- **`useWeather.ts`**: Hook para gestionar datos meteorológicos y configuración

### 🔄 **Integraciones**
- **`ActividadCard.tsx`**: Muestra clima compacto en cards de actividades
- **`ActividadDetalle.tsx`**: Muestra pronóstico completo en vista detallada

## 📊 Datos Meteorológicos Disponibles

### 🌡️ **Información Mostrada**
- **Temperatura**: Mínima y máxima diaria
- **Condición**: Descripción del clima (despejado, nublado, lluvia, etc.)
- **Humedad**: Porcentaje de humedad relativa
- **Viento**: Velocidad del viento
- **Precipitación**: Cantidad de lluvia/nieve esperada
- **Iconos**: Representación visual de las condiciones

### 📅 **Cobertura Temporal**
- **Pronóstico**: Hasta 15 días en el futuro
- **Actualización**: Cada 10 minutos automáticamente
- **Cache**: Datos almacenados temporalmente para mejor rendimiento

## 🎨 Interfaz de Usuario

### 💡 **Modo Compacto (Cards de Actividades)**
```
🌤️ 18°-25°C 💧 (si hay precipitación)
```

### 📄 **Modo Completo (Vista Detallada)**
```
📅 Pronóstico del tiempo
┌─────────────────────────────────────┐
│ 🌤️ Hoy          🌡️ 18° / 25°C      │
│   Parcialmente   💧 65%  💨 12 km/h │
│   nublado                           │
├─────────────────────────────────────┤
│ ☁️ Mañana       🌡️ 16° / 22°C      │
│   Nublado       💧 80%  💨 15 km/h  │
│                 💧 2.5mm            │
└─────────────────────────────────────┘
```

## 🔧 Configuración Técnica

### 🌍 **APIs de Datos Meteorológicos**

#### **Open-Meteo**
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Geocoding**: `https://nominatim.openstreetmap.org/search` (OpenStreetMap)
- **Parámetros**: Temperatura, precipitación, humedad, viento, códigos meteorológicos
- **Autenticación**: No requerida

#### **AEMET**
- **Endpoint base**: `https://opendata.aemet.es/opendata/api`
- **Municipios**: `/maestro/municipios`
- **Pronóstico**: `/prediccion/especifica/municipio/diario/{codigo}`
- **Autenticación**: API key en header `api_key`

#### **Lógica de Selección**
```typescript
// Para ubicaciones en España
if (isSpain && aemetEnabled) {
  try {
    return await getAemetForecast();
  } catch {
    return await getOpenMeteoForecast(); // Fallback
  }
}
// Para resto del mundo
return await getOpenMeteoForecast();
```

### ⚡ **Optimizaciones**
- **Cache**: Los datos se cachean por 10 minutos
- **Lazy loading**: Los componentes se cargan solo cuando es necesario
- **Filtrado inteligente**: Solo se muestran datos para actividades relevantes

### 🗃️ **Almacenamiento**
- **Configuración**: Guardada en Firestore (`configuracion/global`)
- **Cache temporal**: En memoria del navegador
- **No tracking**: No se almacenan datos meteorológicos permanentemente

## 🎯 Casos de Uso

### ✅ **Actividad Planificada con Ubicación**
```typescript
actividad = {
  nombre: "Escalada en Roca",
  lugar: "Montserrat, Barcelona",
  fechaInicio: "2025-06-20",
  estado: "planificada"
}
// ✅ Muestra pronóstico para Montserrat
```

### ✅ **Actividad Sin Ubicación Específica**
```typescript
actividad = {
  nombre: "Reunión del Club",
  lugar: "", // Vacío
  fechaInicio: "2025-06-18",
  estado: "planificada"
}
// ✅ Muestra pronóstico para ubicación por defecto (Madrid)
```

### ❌ **Actividad Lejana en el Tiempo**
```typescript
actividad = {
  nombre: "Expedición de Verano",
  fechaInicio: "2025-08-15", // Más de 15 días
  estado: "planificada"
}
// ❌ No muestra pronóstico (muy lejana)
```

### ❌ **Actividad Finalizada**
```typescript
actividad = {
  nombre: "Espeleología Cueva",
  fechaInicio: "2025-06-10",
  estado: "finalizada"
}
// ❌ No muestra pronóstico (ya terminada)
```

## 🛠️ Administración

### 🔑 **Acceso de Configuración**
- **Administradores**: Acceso completo a configuración
- **Vocales**: Pueden ver configuración (según permisos existentes)
- **Socios**: Solo ven los datos meteorológicos

### 📊 **Panel de Control**
- **Estado del servicio**: Activo/Inactivo
- **Ubicación por defecto**: Configurable
- **Unidades de medida**: Personalizables
- **Prueba de conexión**: Verificación en tiempo real

## 🔄 Migración desde OpenWeatherMap

### ✅ **Ventajas de Open-Meteo**
- **✅ Gratuito**: Sin costo ni límites
- **✅ Sin registro**: No requiere API key
- **✅ Más días**: 15 días vs 7 días de pronóstico gratuito
- **✅ Código abierto**: Transparente y confiable
- **✅ Mejor precisión**: Datos de múltiples fuentes

### 🔄 **Cambios Realizados**
- **❌ Eliminada**: Configuración de API key
- **✅ Añadidas**: Opciones de unidades de medida
- **✅ Actualizado**: Rango de pronóstico a 15 días
- **✅ Simplificado**: Configuración más fácil

## 🐛 Resolución de Problemas

### ❓ **Problemas Comunes**

#### "No se muestran datos meteorológicos"
```bash
✅ Verificar que el servicio esté habilitado
✅ Comprobar que la actividad esté en los próximos 15 días
✅ Verificar que la actividad no esté finalizada/cancelada
✅ Probar la conexión desde el panel de configuración
```

#### "Error de ubicación"
```bash
✅ Verificar que la ubicación esté bien escrita
✅ Usar formato: "Ciudad, País" (ej: "Barcelona, España")
✅ Comprobar la ubicación por defecto en configuración
```

#### "Datos obsoletos"
```bash
✅ Los datos se actualizan cada 10 minutos automáticamente
✅ Refrescar la página si es necesario
✅ Verificar conexión a internet
```

## 📚 API Reference

### 🔌 **Servicio Principal**
```typescript
import { weatherService } from '../services/weatherService';

// Configurar servicio
await weatherService.configure({
  enabled: true,
  defaultLocation: { lat: 40.4168, lon: -3.7038, name: 'Madrid' }
});

// Obtener pronóstico
const forecast = await weatherService.getWeatherForecast('Barcelona', 5);

// Obtener para actividad específica
const activityWeather = await weatherService.getWeatherForActivity(
  new Date('2025-06-20'),
  new Date('2025-06-21'),
  'Montserrat'
);
```

### 🎣 **Hook de React**
```typescript
import { useWeather } from '../hooks/useWeather';

const { weatherData, loading, error, refresh } = useWeather(actividad, {
  enabled: true,
  location: 'Barcelona'
});
```

### 🧩 **Componente**
```tsx
import WeatherCard from '../components/weather/WeatherCard';

<WeatherCard 
  weatherData={weatherData}
  compact={false}
  showDates={true}
/>
```

## 🎉 Beneficios

### 👥 **Para los Usuarios**
- **📋 Información útil**: Datos meteorológicos relevantes para planificar
- **🎯 Contexto automático**: Se muestra automáticamente cuando es relevante
- **📱 Interfaz clara**: Información fácil de entender de un vistazo
- **⚡ Rápido**: Datos siempre actualizados y accesibles

### 🏢 **Para la Organización**
- **💰 Sin costos**: Completamente gratuito
- **🔧 Fácil administración**: Configuración simple desde el panel admin
- **📊 Mejor planificación**: Ayuda a tomar decisiones informadas sobre actividades
- **🌍 Profesional**: Funcionalidad avanzada sin complicaciones técnicas

---

## 📝 Notas Técnicas

- **Compatibilidad**: Funciona con todas las actividades existentes
- **Rendimiento**: Optimizado con cache y lazy loading  
- **Escalabilidad**: Preparado para múltiples ubicaciones y usuarios
- **Mantenimiento**: Sin necesidad de gestionar API keys o pagos

¡La integración meteorológica está lista para mejorar la experiencia de planificación de actividades! 🌤️
