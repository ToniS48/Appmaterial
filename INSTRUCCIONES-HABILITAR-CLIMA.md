# 🌤️ GUÍA PARA HABILITAR Y VERIFICAR LA INFORMACIÓN METEOROLÓGICA

## 📋 Problema Identificado y Solucionado
- ✅ **Error 400 de Open-Meteo COMPLETAMENTE CORREGIDO**
  - ❌ Parámetro `forecast_days` inválido eliminado  
  - ❌ Nombres de campos incorrectos corregidos (`relativehumidity_2m` → `relative_humidity_2m`)
- ✅ **Servicio meteorológico completamente funcional** 
- ⚠️ **Requiere habilitación manual** en la configuración de la app

## ✅ SOLUCIÓN PASO A PASO

### 1. 🔧 Habilitar el Servicio Meteorológico

1. **Navegar a Configuración:**
   - Ir a la aplicación en http://localhost:3000
   - Hacer clic en el menú hamburguesa (☰) o usar la navegación
   - Ir a **"Configuración"**

2. **Acceder a la Pestaña de Clima:**
   - En la página de configuración, hacer clic en la pestaña **"Clima"**
   - Esta es la última pestaña en la lista

3. **Configurar el Servicio:**
   - Activar el switch **"Habilitar pronóstico meteorológico"**
   - Configurar la ubicación por defecto (Madrid está preconfigurado)
   - **¡IMPORTANTE!** Hacer clic en **"Guardar configuración"**

### 2. 🧪 Verificar que Funciona

1. **Panel de Debug (en desarrollo):**
   - Si estás en modo desarrollo, aparecerá un panel en la esquina inferior derecha
   - El panel mostrará el estado del servicio meteorológico   - **Logs esperados después de la corrección FINAL:**
     ```
     🌦️ Petición a Open-Meteo: [URL corregida sin forecast_days y con campos válidos]
     🌦️ Respuesta de Open-Meteo exitosa: [datos JSON]
     🌦️ Pronóstico procesado exitosamente: [forecast]
     ```

2. **Crear una Actividad de Prueba:**
   - Crear una nueva actividad
   - Fecha de inicio: **mañana** o en los próximos días (máximo 15 días)
   - Estado: **"planificada"** o **"en_curso"**
   - Añadir una ubicación en el campo "Lugar"

3. **Verificar en las Cards:**
   - Ir a la página de actividades
   - Las actividades futuras deberían mostrar información meteorológica compacta
   - Formato: [Icono] Descripción | Min°-Max°C

4. **Verificar en Detalle:**
   - Hacer clic en "Ver detalles" de una actividad
   - Debería aparecer información meteorológica más completa

### 3. 🔍 Debugging Manual (en consola del navegador)

Si necesitas verificar manualmente:

```javascript
// Verificar que el servicio está habilitado
console.log('Servicio habilitado:', window.weatherService?.isEnabled());

// Verificar configuración
console.log('Configuración:', window.weatherService?.getConfig());

// Probar obtener datos
window.weatherService?.getWeatherForecast(undefined, 1)
  .then(data => console.log('Datos meteorológicos:', data))
  .catch(err => console.error('Error:', err));
```

## 📝 CRITERIOS PARA QUE APAREZCA EL CLIMA

La información meteorológica solo aparece en actividades que cumplan **TODOS** estos criterios:

1. ✅ **Servicio habilitado** en configuración
2. ✅ **Actividad futura** (próximos 15 días)
3. ✅ **Estado activo** (planificada o en_curso)
4. ✅ **Fecha válida** (no cancelada, no finalizada)

## 🌍 FUENTES DE DATOS METEOROLÓGICOS

### Open-Meteo (Principal)
- **Gratuito**: Sin necesidad de API key
- **Global**: Funciona en todo el mundo
- **Confiable**: Servicio de código abierto

### AEMET (Opcional - Solo España)
- **Para España**: Más preciso en territorio español
- **Requiere API key**: Obtener en opendata.aemet.es
- **Fallback automático**: Si falla, usa Open-Meteo

## 🎯 UBICACIONES SOPORTADAS

- **Con coordenadas específicas**: Si la actividad tiene lat/lon
- **Por nombre de lugar**: Geocodificación automática
- **Ubicación por defecto**: Si no se especifica lugar

## 🔧 CONFIGURACIÓN AVANZADA (Opcional)

### Para habilitar AEMET (España):
1. Obtener API key gratuita en https://opendata.aemet.es
2. En la configuración de clima, habilitar AEMET
3. Introducir la API key
4. Activar "Usar AEMET para ubicaciones en España"

### Personalizar unidades:
- Temperatura: Celsius/Fahrenheit
- Viento: km/h, m/s, mph
- Precipitación: mm, pulgadas

## 🐛 PROBLEMAS COMUNES

### "No aparece información meteorológica"
- ✅ Verificar que el servicio está habilitado
- ✅ Comprobar que la actividad es futura (máximo 15 días)
- ✅ Verificar el estado de la actividad (debe ser activa)
- ✅ Comprobar conexión a internet

### "Error de conexión"
- ✅ Verificar conexión a internet
- ✅ El servicio Open-Meteo es gratuito y no requiere autenticación
- ✅ Si es España, verificar API key de AEMET

### "Datos no actualizados"
- ✅ Los datos se actualizan cada 10 minutos automáticamente
- ✅ Refrescar la página si es necesario

## 📞 SOPORTE

Si el problema persiste después de seguir estos pasos:
1. Abrir DevTools (F12)
2. Revisar la consola por errores
3. Ejecutar los comandos de debugging anteriores
4. Verificar que el panel de debug muestra el servicio como habilitado
