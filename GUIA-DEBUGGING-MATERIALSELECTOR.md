# 🔧 GUÍA DE DEBUGGING - MATERIALSELECTOR

## RESUMEN DE CAMBIOS REALIZADOS

### ✅ Cambios Implementados:

1. **MaterialSelector.tsx**:
   - ✅ Añadido logging detallado en el proceso de carga de materiales
   - ✅ Exposición del MaterialRepository globalmente para debugging (solo en desarrollo)
   - ✅ Captura de errores mejorada con stack traces completos
   - ✅ Panel de debug UI (solo en desarrollo) que muestra estado de carga

2. **BaseRepository.ts**:
   - ✅ Añadido método `debugConnection()` para verificar conexión Firebase
   - ✅ Logging detallado en método `find()` con información paso a paso
   - ✅ Trazabilidad completa de las operaciones de base de datos

3. **Scripts de Debugging**:
   - ✅ `diagnostico-completo-material.js` - Script completo de diagnóstico
   - ✅ `verify-firebase-connection.js` - Verificación de conexión Firebase
   - ✅ `test-material-repository-advanced.js` - Pruebas avanzadas del repositorio

## 🚀 PASOS PARA PROBAR

### 1. Iniciar la Aplicación
Ejecuta en PowerShell:
```powershell
cd "c:\Users\Sonia\Documents\Espemo\Apps\AppMaterial"
.\start-app.ps1
```

O manualmente:
```powershell
cd "c:\Users\Sonia\Documents\Espemo\Apps\AppMaterial"
npm start
```

### 2. Navegar al MaterialSelector
1. Abre la aplicación en el navegador (normalmente http://localhost:3000)
2. Navega a la página de "Crear Actividad" o donde esté el MaterialSelector
3. Abre las DevTools del navegador (F12)
4. Ve a la pestaña "Console"

### 3. Observar el Debugging Automático
Al cargar el MaterialSelector, deberías ver logs como:
```
🔍 MaterialSelector - Iniciando carga de materiales...
🔧 MaterialSelector - Repositorio: MaterialRepository {...}
📡 MaterialSelector - Llamando findMaterialesDisponibles()...
🔍 [DEBUG] material_deportivo - Iniciando find con opciones: {...}
```

### 4. Ejecutar Diagnóstico Completo
En la consola del navegador, ejecuta:
```javascript
// Cargar el script de diagnóstico
const script = document.createElement('script');
script.src = './diagnostico-completo-material.js';
document.head.appendChild(script);

// O ejecutar directamente si ya está cargado:
diagnosticoCompleto();
```

### 5. Si No Hay Materiales - Crear Datos de Prueba
Si la colección está vacía, ejecuta en la consola:
```javascript
await crearMaterialesPrueba();
```

## 🔍 QUÉ BUSCAR

### ✅ Signos de Funcionamiento Correcto:
- Logs de "MaterialSelector - Iniciando carga de materiales..."
- "MaterialRepository expuesto globalmente para debugging"
- Números > 0 en "Materiales obtenidos"
- Sin errores en la consola

### ❌ Signos de Problemas:
- "Error cargando materiales" en los logs
- "QuerySnapshot obtenido: { size: 0, empty: true }"
- Errores de Firebase/Firestore
- "MaterialRepository no está disponible"

## 🛠️ SOLUCIONES COMUNES

### Problema: No se cargan materiales
**Solución 1**: Verificar que Firebase esté conectado
```javascript
console.log('Firebase DB:', window.db);
```

**Solución 2**: Crear materiales de prueba
```javascript
await crearMaterialesPrueba();
```

**Solución 3**: Verificar permisos de Firestore
- Revisar firestore.rules
- Confirmar que el usuario esté autenticado

### Problema: MaterialRepository no disponible
**Solución**: Asegurar que el MaterialSelector se haya renderizado:
1. Navegar a la página que contiene el MaterialSelector
2. Esperar a que aparezca el componente
3. Verificar en consola: `window.materialRepository`

### Problema: Errores de permisos
**Solución**: Verificar reglas de Firestore en `firestore.rules`

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] La aplicación inicia sin errores
- [ ] Se puede navegar al MaterialSelector
- [ ] Aparecen logs de debugging en la consola
- [ ] `window.materialRepository` está disponible
- [ ] `diagnosticoCompleto()` se ejecuta sin errores
- [ ] Se pueden ver materiales o se pueden crear materiales de prueba

## 📞 PRÓXIMOS PASOS

Una vez completado el debugging:
1. **Si los materiales se cargan**: El problema estaba en el logging/visibility
2. **Si no se cargan**: Investigar la conexión Firebase o permisos
3. **Si hay errores**: Analizar el stack trace específico

---

## 🎯 OBJETIVO ACTUAL

**Determinar por qué `MaterialRepository.findMaterialesDisponibles()` no retorna materiales** y resolver el problema de carga en el MaterialSelector.

El debugging implementado nos dará visibilidad completa del proceso para identificar exactamente dónde está fallando.
