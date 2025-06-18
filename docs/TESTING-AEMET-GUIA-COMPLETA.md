# 🇪🇸 GUÍA PARA PROBAR AEMET (Agencia Estatal de Meteorología)

## 📋 Objetivo
Probar la integración con AEMET para verificar que funciona correctamente como fuente principal de datos meteorológicos para España.

## 🔑 Prerrequisitos

### 1. Obtener API Key de AEMET (Obligatorio)

1. **Registrarse en AEMET OpenData:**
   - Ir a: https://opendata.aemet.es/centrodedescargas/inicio
   - Crear una cuenta gratuita
   - Verificar el email

2. **Obtener la API Key:**
   - Entrar al panel de usuario
   - Solicitar API Key (gratuita)
   - Copiar la clave proporcionada

### 2. Configurar AEMET en la Aplicación

1. **Ir a Configuración:**
   ```
   http://localhost:3000/admin/settings
   → Pestaña "Clima"
   ```

2. **Habilitar AEMET:**
   - ✅ Activar "Habilitar pronóstico meteorológico"
   - ✅ Activar "Habilitar AEMET para España"
   - 📝 Ingresar la API Key de AEMET
   - ✅ Activar "Usar AEMET para ubicaciones en España"
   - 💾 **Guardar configuración**

## 🧪 Testing Paso a Paso

### 1. Test Básico desde el Panel de Debug

1. **Acceder al Panel de Debug:**
   - En modo desarrollo, aparece en la esquina inferior derecha
   - Hacer clic en "🌤️ Estado del Clima"

2. **Realizar Test de AEMET:**
   - Hacer clic en **"Test AEMET"**
   - El sistema probará automáticamente:
     - Madrid
     - Barcelona
     - Valencia
     - Sevilla

3. **Verificar Resultados:**
   - ✅ Logs exitosos en consola
   - ✅ Resultados por ciudad en el panel
   - ✅ Badge "AEMET" visible

### 2. Test Manual por Ciudades

#### Ciudades de Prueba Recomendadas:
```javascript
// En consola del navegador:
const testCities = [
  { name: 'Madrid', lat: 40.4168, lon: -3.7038 },
  { name: 'Barcelona', lat: 41.3851, lon: 2.1734 },
  { name: 'Valencia', lat: 39.4699, lon: -0.3763 },
  { name: 'Sevilla', lat: 37.3891, lon: -5.9845 },
  { name: 'Bilbao', lat: 43.2627, lon: -2.9253 },
  { name: 'Zaragoza', lat: 41.6488, lon: -0.8891 },
  { name: 'Málaga', lat: 36.7213, lon: -4.4217 },
  { name: 'Las Palmas', lat: 28.1, lon: -15.4167 }
];

// Probar cada ciudad:
for (const city of testCities) {
  const forecast = await window.weatherService.getWeatherForecast(city, 3);
  console.log(`${city.name}:`, forecast ? '✅ OK' : '❌ FAIL');
}
```

### 3. Test en Actividades

1. **Crear Actividad con Ubicación Española:**
   ```
   Nombre: "Test AEMET"
   Lugar: "Madrid" (o cualquier ciudad española)
   Fecha: Mañana
   Estado: Planificada
   ```

2. **Verificar Información Meteorológica:**
   - En la card de la actividad debe aparecer clima
   - En los detalles debe mostrar pronóstico completo
   - Los datos deben venir de AEMET (ver logs)

## 🔍 Logs Esperados

### Logs de Éxito AEMET:
```
🇪🇸 Iniciando test específico de AEMET...
🌍 Probando AEMET para Madrid...
🌦️ Usando AEMET para ubicación en España
🇪🇸 Resultados del test de AEMET: [array con resultados]
```

### Logs de Fallback a Open-Meteo:
```
🌦️ Usando AEMET para ubicación en España
❌ AEMET falló, usando Open-Meteo como respaldo
🌦️ Petición a Open-Meteo: [URL de Open-Meteo]
```

## ⚠️ Problemas Comunes

### 1. Error de CORS (Expected)
```
Access to fetch at 'https://opendata.aemet.es/...' blocked by CORS policy
```
**Solución**: Normal en localhost, se resuelve en producción o con proxy

### 2. API Key Inválida
```
Error AEMET API: 401
```
**Solución**: Verificar que la API key esté correcta

### 3. Sin Datos de AEMET
```
AEMET: No se obtuvieron datos
```
**Solución**: AEMET puede estar temporalmente inactivo, usará Open-Meteo

### 4. Límites de Peticiones
```
Error AEMET API: 429
```
**Solución**: AEMET tiene límites, esperar un momento

## ✅ Criterios de Éxito

### AEMET Funcionando:
- [ ] Badge "AEMET" visible en panel de debug
- [ ] Test de AEMET devuelve resultados exitosos
- [ ] Logs muestran "Usando AEMET para ubicación en España"
- [ ] Actividades en España muestran datos meteorológicos
- [ ] No hay errores 400/401 persistentes

### Fallback Funcionando:
- [ ] Si AEMET falla, usa Open-Meteo automáticamente
- [ ] Logs muestran "AEMET falló, usando Open-Meteo como respaldo"
- [ ] Las actividades siguen mostrando clima (de Open-Meteo)

## 🌍 Casos de Prueba Específicos

### Caso 1: Península Ibérica
```
Madrid, Barcelona, Valencia, Sevilla
Resultado esperado: AEMET → Datos españoles oficiales
```

### Caso 2: Islas Baleares
```
Palma de Mallorca: lat: 39.5696, lon: 2.6502
Resultado esperado: AEMET → Datos insulares
```

### Caso 3: Islas Canarias
```
Las Palmas: lat: 28.1, lon: -15.4167
Resultado esperado: AEMET → Datos canarios
```

### Caso 4: Fuera de España
```
París: lat: 48.8566, lon: 2.3522
Resultado esperado: Open-Meteo → Sin AEMET
```

## 📊 Métricas de Rendimiento

### Tiempos Esperados:
- **AEMET**: 2-5 segundos por petición
- **Fallback**: +1-2 segundos adicionales
- **Cache**: <100ms (peticiones repetidas)

### Límites de API:
- **AEMET**: ~5000 peticiones/mes (gratuito)
- **Open-Meteo**: Sin límites conocidos

## 🚀 Próximos Pasos

Una vez verificado que AEMET funciona:

1. **Documentar rendimiento** real vs Open-Meteo
2. **Optimizar cache** para AEMET (datos menos frecuentes)
3. **Configurar alertas** meteorológicas específicas de España
4. **Integrar datos adicionales** (alertas, fenómenos adversos)

---

**Fecha**: 2025-06-18  
**Estado**: Listo para testing  
**Requiere**: API Key de AEMET válida
