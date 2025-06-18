# 🌤️ Complemento de Integración Meteorológica - OpenWeatherMap

## 📋 Descripción

Este complemento integra información meteorológica en tiempo real en las actividades del sistema, utilizando la API One Call 3.0 de OpenWeatherMap para proporcionar pronósticos precisos para actividades planificadas y en curso.

## ✨ Características Principales

### 🎯 **Funcionalidades**

1. **Pronóstico en Cards de Actividades**
   - Información meteorológica compacta en las tarjetas de actividades
   - Icono visual según condiciones climáticas
   - Temperatura mínima y máxima
   - Indicador de precipitación

2. **Vista Detallada del Clima**
   - Pronóstico completo en la vista de detalle de actividades
   - Información por días (hasta 7 días)
   - Datos de humedad, viento y precipitación
   - Iconografía intuitiva y descripción textual

3. **Configuración Administrativa**
   - Panel de configuración en administración
   - Gestión de API key de OpenWeatherMap
   - Configuración de ubicación por defecto
   - Habilitación/deshabilitación del servicio

### 🔧 **Integración Inteligente**

- **Solo para actividades relevantes**: Se muestra información solo para actividades futuras (hasta 7 días)
- **Cache inteligente**: Los datos se actualizan cada 10 minutos para optimizar el uso de la API
- **Ubicación automática**: Usa la ubicación de la actividad o una por defecto
- **Estados de actividad**: Solo se muestra para actividades planificadas o en curso

## 🚀 Instalación y Configuración

### 1. **Obtener API Key**

1. Regístrate en [OpenWeatherMap](https://openweathermap.org/api/one-call-3)
2. Obtén una API key gratuita (incluye 1,000 llamadas/día)
3. Guarda la API key para la configuración

### 2. **Configuración en el Sistema**

1. Accede al **Panel de Administración**
2. Ve a **Configuración → Clima**
3. Configura los siguientes parámetros:

```typescript
{
  enabled: true,           // Habilitar el servicio
  apiKey: "tu-api-key",   // Tu API key de OpenWeatherMap
  defaultLocation: {
    lat: 40.4168,          // Latitud por defecto (Madrid)
    lon: -3.7038,          // Longitud por defecto
    name: "Madrid, España" // Nombre de la ubicación
  }
}
```

4. **Prueba la conexión** usando el botón "Probar conexión"
5. **Guarda la configuración**

## 📁 Estructura de Archivos

```
src/
├── services/
│   └── weatherService.ts              # Servicio principal de OpenWeatherMap
├── components/
│   ├── weather/
│   │   └── WeatherCard.tsx           # Componente de visualización del clima
│   └── admin/
│       └── WeatherConfiguration.tsx  # Panel de configuración
├── hooks/
│   └── useWeather.ts                 # Hook personalizado para datos meteorológicos
└── types/
    └── weather.ts                    # Tipos TypeScript (incluidos en weatherService.ts)
```

## 🔌 Integración en Componentes

### **ActividadCard.tsx**

```tsx
import WeatherCard from '../weather/WeatherCard';
import { useWeather } from '../../hooks/useWeather';

// En el componente:
const { weatherData, loading } = useWeather(actividad, {
  enabled: shouldShowWeather,
  location: actividad.lugar 
});

// En el JSX:
{shouldShowWeather && weatherData.length > 0 && !loading && (
  <Box mt={2}>
    <WeatherCard 
      weatherData={weatherData} 
      compact={true}
      showDates={false}
    />
  </Box>
)}
```

### **ActividadDetalle.tsx**

```tsx
// Hook para datos meteorológicos
const { weatherData, loading, error } = useWeather(actividad, {
  enabled: actividad.estado !== 'finalizada' && actividad.estado !== 'cancelada',
  location: actividad.lugar
});

// En el JSX:
{weatherData.length > 0 && !loading && !error && (
  <Box mb={4}>
    <WeatherCard 
      weatherData={weatherData} 
      compact={false}
      showDates={true}
    />
  </Box>
)}
```

## 🎨 Componentes Principales

### **WeatherCard**

Componente principal para mostrar información meteorológica:

**Props:**
- `weatherData`: Array de datos meteorológicos
- `compact`: Modo compacto para cards (boolean)
- `showDates`: Mostrar fechas en el pronóstico (boolean)

**Modos:**
- **Compacto**: Para cards de actividades
- **Completo**: Para vista detallada

### **WeatherConfiguration**

Panel de administración para configurar el servicio:

**Características:**
- Configuración de API key
- Ubicación por defecto
- Habilitación del servicio
- Prueba de conexión
- Estado en tiempo real

## 📊 API y Datos

### **Estructura de Datos**

```typescript
interface WeatherData {
  date: string;
  temperature: {
    min: number;
    max: number;
    current?: number;
  };
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  precipitation?: number;
  condition: 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | 'mist' | 'unknown';
}
```

### **Métodos del Servicio**

```typescript
// Obtener pronóstico general
weatherService.getWeatherForecast(location?, days?)

// Pronóstico para actividad específica
weatherService.getWeatherForActivity(startDate, endDate?, location?)

// Configurar el servicio
weatherService.configure(config)

// Verificar si está habilitado
weatherService.isEnabled()
```

## 🔒 Seguridad y Privacidad

- **API Key segura**: Se almacena de forma segura en Firebase
- **Cache local**: Reduce llamadas a la API
- **Límites de uso**: Respeta los límites de la API gratuita
- **Sin datos personales**: Solo se usan ubicaciones de actividades

## 📈 Límites y Consideraciones

### **API Gratuita de OpenWeatherMap**
- **1,000 llamadas/día** (plan gratuito)
- **Pronóstico hasta 8 días**
- **Cache de 10 minutos** para optimizar uso

### **Limitaciones del Sistema**
- Solo actividades futuras (próximos 7 días)
- Solo actividades planificadas o en curso
- Requiere conexión a internet

## 🐛 Solución de Problemas

### **El clima no se muestra**

1. ✅ Verificar que el servicio esté habilitado en configuración
2. ✅ Comprobar que la API key sea válida
3. ✅ Confirmar que la actividad esté en los próximos 7 días
4. ✅ Verificar que la actividad no esté finalizada o cancelada

### **Error de API**

1. ✅ Comprobar conexión a internet
2. ✅ Verificar límites de uso de la API
3. ✅ Revisar formato de la API key
4. ✅ Usar "Probar conexión" en configuración

### **Datos incorrectos**

1. ✅ Verificar ubicación de la actividad
2. ✅ Comprobar configuración de ubicación por defecto
3. ✅ Limpiar cache del navegador

## 🔄 Actualizaciones y Mantenimiento

### **Cache del Sistema**
- Se limpia automáticamente cada 10 minutos
- Puede limpiarse manualmente desde configuración

### **Monitoreo**
- Estado del servicio visible en panel de administración
- Errores registrados en consola del navegador
- Botón de prueba de conexión disponible

## 📞 Soporte

Para problemas o mejoras del complemento meteorológico:

1. **Verificar configuración** en Panel de Administración
2. **Revisar logs** en consola del navegador
3. **Probar conexión** con OpenWeatherMap
4. **Consultar documentación** de OpenWeatherMap API

---

## 🎉 ¡Disfruta del Pronóstico en tus Actividades!

Este complemento mejora la experiencia de planificación de actividades al proporcionar información meteorológica relevante y actualizada, ayudando a tomar mejores decisiones sobre las actividades programadas.
