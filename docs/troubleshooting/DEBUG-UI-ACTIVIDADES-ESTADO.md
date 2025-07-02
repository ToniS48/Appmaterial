# 🔍 DEBUG: UI de Actividades - Información Meteorológica

## Estado Actual

### ✅ Backend Funcionando Correctamente
- El servicio meteorológico está habilitado y configurado
- La API key de AEMET está correctamente desencriptada
- Los datos meteorológicos se obtienen sin errores desde la consola
- Scripts de diagnóstico confirman que todo funciona en backend

### 🎯 Problema Identificado
Las **tarjetas de actividades en la UI NO muestran la información meteorológica** aunque el backend funcione.

### 🔧 Cambios Realizados para Debug
1. **Logs añadidos** en `ActividadCard.tsx` y `use7DayWeather.ts`
2. **Modo debug temporal** en `shouldShowWeather` (criterios simplificados)
3. **Scripts de debug** creados para testing desde consola

## 📋 Scripts de Debug Disponibles

### 1. Debug Rápido (Consola del Navegador)
**Archivo:** `scripts/debug-rapido-consola.js`
```javascript
// Copiar contenido completo en la consola del navegador
```

### 2. Debug de Fechas de Actividades
**Archivo:** `scripts/debug-fechas-actividades.js`
```javascript
// Verificar qué actividades cumplen criterios de fecha
await debugActividadesFechas()
await crearActividadPrueba() // Crear actividad de prueba para mañana
```

### 3. Debug Meteorológico General
**Archivo:** `scripts/diagnostico-meteorologico-consola.js`
```javascript
await diagnosticoMeteorologico()
await solucionarProblema()
```

## 🚀 Próximos Pasos de Debug

### Paso 1: Acceder a la Aplicación
1. La aplicación está ejecutándose en `http://localhost:3000`
2. Iniciar sesión en la aplicación
3. Navegar a una página con listado de actividades

### Paso 2: Ejecutar Debug desde Consola
1. Abrir DevTools (F12)
2. Ir a la pestaña "Console"
3. Copiar y pegar el contenido de `scripts/debug-rapido-consola.js`
4. Revisar los logs que aparecen con prefijos `[ActividadCard]` y `[use7DayWeather]`

### Paso 3: Analizar Resultados
- **Si ves logs `[ActividadCard]`**: El componente se está renderizando
- **Si ves logs `[use7DayWeather]`**: El hook se está ejecutando
- **Si NO ves logs**: Puede que no haya actividades que cumplan criterios

### Paso 4: Prueba Visual
```javascript
// En la consola del navegador
testWeatherInCard()
```
Esto añadirá un componente weather de prueba a la primera tarjeta.

### Paso 5: Verificar Actividades
```javascript
// Si no hay actividades que cumplan criterios, crear una de prueba
await crearActividadPrueba()
```

## 🔍 Posibles Causas del Problema

1. **Criterios de fecha muy restrictivos**: Actividades demasiado antiguas/futuras
2. **Falta de ubicación**: Actividades sin campo `lugar` definido
3. **Error en el renderizado**: Componente `WeatherCompactPreview` no se renderiza
4. **CSS/Estilo**: Componente se renderiza pero no es visible
5. **React hooks**: Error en el ciclo de vida del hook

## 🛠️ Archivos Modificados para Debug

- `src/components/actividades/ActividadCard.tsx` - Logs añadidos
- `src/hooks/use7DayWeather.ts` - Logs y modo debug añadidos
- `scripts/debug-*.js` - Scripts de debug creados

## 📱 Estado de la Aplicación

- ✅ Aplicación compilada sin errores
- ✅ Ejecutándose en `http://localhost:3000`
- ✅ Backend meteorológico funcionando
- ❓ UI pendiente de debug

---

**Siguiente acción recomendada:** Ejecutar el debug desde la consola del navegador siguiendo los pasos anteriores.
