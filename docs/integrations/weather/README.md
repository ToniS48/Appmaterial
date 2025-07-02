# 🌤️ Servicio Meteorológico - Documentación

Documentación específica para la integración con el servicio meteorológico AEMET.

## 📊 Estado Actual: ✅ **COMPLETADO Y FUNCIONAL**

### ✅ **Implementado**
- Integración con API AEMET
- Configuración de variables
- Interfaz de usuario
- Scripts de diagnóstico

### ✅ **Operativo**
- Consulta de condiciones meteorológicas
- Integración en planificación de actividades
- Sistema de configuración habilitado
- Mecanismo de respaldo con Open-Meteo cuando AEMET no está disponible

---

## 📝 **Notas Importantes (Julio 2025)**

⚠️ **Limitación en Desarrollo Local:** En entornos de desarrollo local (localhost), la API de AEMET presenta problemas de CORS. Se ha implementado una solución automática que utiliza Open-Meteo como alternativa en desarrollo. Ver [`SOLUCION-PROBLEMA-CORS-AEMET.md`](./SOLUCION-PROBLEMA-CORS-AEMET.md) para más detalles.

---

## 📁 **Documentos Disponibles**

### 🎯 **Documentos Principales**

#### `SOLUCION-PROBLEMA-CORS-AEMET.md` (NUEVO)
**Solución al problema CORS de AEMET en desarrollo local**
- **Uso**: Cuando hay errores de CORS con AEMET en localhost
- **Contenido**: Detalles sobre la solución implementada y alternativas
- **Estado**: Solucionado usando Open-Meteo como respaldo en desarrollo local

#### `SOLUCION-SERVICIO-METEOROLOGICO.md`
**Solución de problemas más comunes**
- **Uso**: Cuando el servicio aparece como "deshabilitado"
- **Contenido**: Scripts de corrección automática
- **Solución rápida**: Código para consola del navegador

#### `TAREA-COMPLETADA-INTEGRACION-METEOROLOGICA.md`
**Estado de implementación y completado**
- **Uso**: Verificar que la integración está terminada
- **Contenido**: Resumen de tareas realizadas
- **Estado**: Confirmación de funcionalidad

---

## 🚀 **Solución Rápida - Servicio Deshabilitado**

Si aparece el mensaje "Servicio meteorológico deshabilitado":

### ⚡ **Solución Automática** (Recomendada)

1. **Abrir consola del navegador** (F12 → Console)
2. **Copiar y pegar**:

```javascript
// Script de corrección automática
(async () => {
  try {
    console.log('🔧 SOLUCIONANDO PROBLEMA METEOROLÓGICO...');
    
    const { getFirestore, doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./src/config/firebase');
    
    await setDoc(doc(db, 'configuracion', 'weather'), {
      weatherEnabled: true,
      aemetEnabled: true,
      aemetUseForSpain: true,
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      precipitationUnit: 'mm',
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('✅ PROBLEMA SOLUCIONADO');
    console.log('💡 RECARGA LA PÁGINA para ver los cambios');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('💡 Usar la opción manual en Configuración → Clima');
  }
})();
```

3. **Recargar la página**

### 🔧 **Solución Manual**

1. Ir a **Configuración → Clima**
2. Activar **"Habilitar servicio meteorológico"**
3. Activar **"Usar AEMET para España"**
4. Guardar configuración

---

## 🛠️ **Scripts de Diagnóstico**

### En la aplicación:
- `scripts/core/weather/debug-weather-config.js` - Diagnóstico completo
- `scripts/core/weather/test-weather-method.js` - Pruebas de métodos
- `scripts/core/weather/reparar-servicio-meteorologico.js` - Reparación automática

### Uso:
```bash
# Diagnóstico completo
node scripts/core/weather/debug-weather-config.js

# Probar métodos específicos
node scripts/core/weather/test-weather-method.js

# Reparar configuración
node scripts/core/weather/reparar-servicio-meteorologico.js
```

---

## 🌡️ **Configuración del Servicio**

### Variables de configuración (Firestore):
```javascript
// Colección: configuracion
// Documento: weather
{
  weatherEnabled: true,          // ← Habilitar servicio
  aemetEnabled: true,           // ← Usar AEMET
  aemetUseForSpain: true,       // ← Específico para España
  temperatureUnit: 'celsius',    // ← Unidad de temperatura
  windSpeedUnit: 'kmh',         // ← Unidad de velocidad del viento
  precipitationUnit: 'mm',      // ← Unidad de precipitación
  updatedAt: '2025-07-02T...'   // ← Fecha de actualización
}
```

### API utilizada:
- **Proveedor**: AEMET (Agencia Estatal de Meteorología)
- **Endpoint**: `https://opendata.aemet.es/opendata/api`
- **Autenticación**: API Key
- **Datos**: Temperatura, precipitación, viento, estado general

---

## 🔍 **Diagnóstico de Problemas**

### ✅ **Signos de funcionamiento correcto**:
- `weatherEnabled: true` en logs
- `aemetEnabled: true` en logs
- Datos meteorológicos visibles en actividades
- Sin errores en consola relacionados con AEMET

### ❌ **Signos de problemas**:
- `weatherEnabled: false` en logs
- "Servicio meteorológico deshabilitado" en UI
- Errores de API AEMET en consola
- Sin datos meteorológicos en actividades

### 🔧 **Soluciones**:
1. **Script automático**: Usar el código JavaScript de arriba
2. **Configuración manual**: Ir a Configuración → Clima
3. **Scripts de diagnóstico**: Ejecutar los scripts de la carpeta weather
4. **Verificar API Key**: Comprobar configuración de AEMET

---

## 🎯 **Funcionalidades Implementadas**

- ✅ **Consulta de condiciones actuales**
- ✅ **Predicción para fechas de actividades**
- ✅ **Integración en formularios de actividad**
- ✅ **Configuración desde interfaz de usuario**
- ✅ **Diagnóstico y reparación automática**
- ✅ **Logs detallados para debugging**

---

## 📞 **Soporte**

- **Documentación detallada**: `SOLUCION-SERVICIO-METEOROLOGICO.md`
- **Scripts de diagnóstico**: `scripts/core/weather/`
- **API oficial**: https://opendata.aemet.es/

---

*Para el resumen consolidado de todas las integraciones, ver: `../00-RESUMEN-CONSOLIDADO-INTEGRACIONES.md`*
