# Scripts de Debug y Testing

Esta carpeta contiene scripts de debugging y testing para la aplicación AppMaterial que fueron movidos desde la carpeta `public` donde estaban incorrectamente ubicados.

## 📂 Archivos organizados por categoría

### 🧪 Scripts de Testing Principal
- **`test-material.js`** - Test completo para verificar la página de material y navegación
- **`test-material-selector.js`** - Test específico para el componente MaterialSelector
- **`test-quick.js`** - Test rápido para MaterialSelector con verificaciones básicas
- **`test-dashboard-fix.js`** - Test para correcciones del dashboard
- **`test-material-logs.js`** - Test para logs y monitoreo de materiales

### 🔍 Scripts de Debug Específicos
- **`debug-material-page.js`** - Debug para la página de gestión de materiales
- **`debug-navigation.js`** - Debug para problemas de navegación en React Router
- **`debug-permissions.js`** - Debug para verificación de permisos de usuario
- **`debug-actividad-estado.js`** - Debug para estados de actividades
- **`debug-responsable-tab.js`** - Debug para pestañas de responsables
- **`debug-simple.js`** - Script de debug básico y rápido

### 🚀 Scripts de Solución
- **`diagnostico-completo.js`** - Diagnóstico completo con múltiples verificaciones
- **`solucion-final.js`** - Script definitivo para resolver problemas de navegación
- **`navegacion-simple.js`** - Navegación simplificada para testing

## 🛠️ Cómo usar estos scripts

### En el navegador:
1. Abrir las herramientas de desarrollador (F12)
2. Ir a la pestaña Console
3. Copiar y pegar el contenido del script deseado
4. Ejecutar con Enter

### Para scripts específicos:
```javascript
// Para test rápido de MaterialSelector
// Copiar contenido de test-quick.js y ejecutar

// Para diagnóstico completo
// Copiar contenido de diagnostico-completo.js y ejecutar
```

## 📋 Notas importantes

- Estos scripts están diseñados para ejecutarse en la consola del navegador con la aplicación cargada
- Algunos requieren que el usuario esté autenticado y tenga permisos apropiados
- Los scripts de debugging proporcionan información detallada en la consola
- Los scripts de testing verifican funcionalidad específica y reportan resultados

## 🔧 Mantenimiento

Estos scripts se mantienen aquí como herramientas de desarrollo y debugging. Si algún script ya no es útil o está obsoleto, puede ser eliminado. Para agregar nuevos scripts de debugging, seguir el patrón de nomenclatura existente:

- `test-*.js` para scripts de testing
- `debug-*.js` para scripts de debugging específico
- `*.js` descriptivo para scripts de solución general
