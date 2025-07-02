# 🌤️ Solución Rápida: Servicio Meteorológico Deshabilitado

## 🚨 Problema Detectado

Los logs muestran que el servicio meteorológico está deshabilitado:
```
aemetEnabled: false
weatherEnabled: false
⚠️ Servicio meteorológico deshabilitado - ir a Configuración → Clima para habilitarlo
```

## 🔧 Solución Inmediata (Recomendada)

### Opción 1: Corrección Automática desde Consola

1. **Abrir la consola del navegador** (F12 → Console)
2. **Copiar y pegar** el siguiente código:

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
    console.log('💡 Prueba la Opción 2 (interfaz manual)');
  }
})();
```

3. **Presionar Enter** y **recargar la página**

### Opción 2: Script de Diagnóstico Completo

Si la Opción 1 no funciona, usa el script completo:

1. **Copiar y pegar** el código del archivo `scripts/diagnostico-meteorologico-consola.js`
2. **Ejecutar**: `await solucionarProblema()`
3. **Recargar la página**

## 🖥️ Solución Manual (Alternativa)

Si los scripts no funcionan:

### Paso 1: Verificar en Firebase Console
1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar proyecto "fichamaterial"
3. Ir a Firestore Database
4. Buscar colección `configuracion` → documento `weather`
5. Editar el documento y cambiar:
   - `weatherEnabled: true`
   - `aemetEnabled: true`
   - `aemetUseForSpain: true`

### Paso 2: Recargar la Aplicación
- Hacer hard refresh (Ctrl+F5)
- Verificar logs de la consola

## 🔍 Verificación de la Solución

Después de aplicar cualquiera de las soluciones, deberías ver en los logs:

```
✅ Servicio meteorológico habilitado
FirestoreConverters.ts: WeatherConfig desde Firestore: {
  aemetEnabled: true,
  weatherEnabled: true,
  aemetUseForSpain: true,
  ...
}
```

En lugar de:
```
❌ Servicio meteorológico deshabilitado
```

## 📋 Configuración de API Key

Una vez habilitado el servicio, asegúrate de tener configurada la API key de AEMET:

1. **Ir a Configuración → APIs**
2. **Configurar API key de AEMET**
3. **Guardar configuración**

## 🆘 Si Aún No Funciona

### Diagnóstico Avanzado en Consola

```javascript
// Pegar en consola para diagnóstico completo
(async () => {
  console.log('🔍 DIAGNÓSTICO AVANZADO');
  
  const { getFirestore, doc, getDoc } = await import('firebase/firestore');
  const { db } = await import('./src/config/firebase');
  
  // Verificar configuración weather
  const weatherRef = doc(db, 'configuracion', 'weather');
  const weatherSnap = await getDoc(weatherRef);
  console.log('Weather config:', weatherSnap.exists() ? weatherSnap.data() : 'NO EXISTE');
  
  // Verificar configuración apis
  const apisRef = doc(db, 'configuracion', 'apis');
  const apisSnap = await getDoc(apisRef);
  console.log('APIs config:', apisSnap.exists() ? apisSnap.data() : 'NO EXISTE');
  
  // Verificar servicio en memoria
  console.log('weatherService:', window.weatherService ? 'DISPONIBLE' : 'NO DISPONIBLE');
})();
```

### Crear Configuración desde Cero

Si no existe ninguna configuración:

```javascript
// Crear configuración completa desde cero
(async () => {
  const { getFirestore, doc, setDoc } = await import('firebase/firestore');
  const { db } = await import('./src/config/firebase');
  
  // Configuración meteorológica
  await setDoc(doc(db, 'configuracion', 'weather'), {
    weatherEnabled: true,
    aemetEnabled: true,
    aemetUseForSpain: true,
    temperatureUnit: 'celsius',
    windSpeedUnit: 'kmh',
    precipitationUnit: 'mm',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  // Configuración de APIs (si no existe)
  await setDoc(doc(db, 'configuracion', 'apis'), {
    aemetApiKey: '', // Configurar después en la interfaz
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, { merge: true });
  
  console.log('✅ Configuración creada desde cero');
  console.log('💡 Recarga la página y ve a Configuración → APIs para configurar la API key');
})();
```

## 📞 Soporte

Si ninguna solución funciona:

1. **Revisar permisos de Firestore** - Usuario debe tener permisos de escritura
2. **Verificar reglas de Firestore** - Debe permitir escribir en `configuracion/*`
3. **Comprobar estado de Firebase** - Proyecto debe estar activo
4. **Revisar logs de errores** - Buscar errores específicos en consola

## ✅ Resultado Esperado

Después de la corrección:
- ✅ Servicio meteorológico habilitado
- ✅ AEMET habilitado para España
- ✅ Configuración persistente en Firestore
- ✅ Interfaz de usuario muestra servicios activos
- ✅ Datos meteorológicos disponibles (con API key configurada)
