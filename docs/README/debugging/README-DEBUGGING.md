# 🔍 Debugging & Troubleshooting - README

Documentación completa de herramientas y metodologías de debugging para AppMaterial.

## 🎯 Filosofía de Debugging

AppMaterial implementa un sistema de debugging multinivel que permite diagnosticar problemas desde simples errores de UI hasta problemas complejos de arquitectura.

## 🛠️ Herramientas de Debugging

### 1. Scripts de Debug Inmediato (`tests/debug/`)

#### 🚀 Scripts Rápidos
- **`debug-simple.js`** - Debug básico y verificaciones rápidas
- **`test-quick.js`** - Test rápido de MaterialSelector

#### 🎯 Scripts por Componente
- **`debug-material-page.js`** - Debug específico de página de materiales
- **`debug-material-selector.js`** - Debug del selector de materiales avanzado
- **`debug-navigation.js`** - Debug de navegación React Router
- **`debug-permissions.js`** - Debug de sistema de permisos
- **`debug-actividad-estado.js`** - Debug de estados de actividades
- **`debug-responsable-tab.js`** - Debug de pestañas de responsables

#### 🔬 Scripts de Diagnóstico Profundo
- **`diagnostico-completo.js`** - Diagnóstico integral del sistema
- **`solucion-final.js`** - Script definitivo para problemas complejos
- **`diagnostico-materiales-no-disponibles.js`** - Debug específico de disponibilidad

### 2. Tests de Browser (`tests/browser-tests/`)

#### Tests HTML Interactivos
- **`debug-tab-navigation.html`** - Test de navegación por pestañas
- **`test-dificultad-botones.html`** - Test de botones de dificultad
- **`test-selector-dificultad.html`** - Test del selector de dificultad
- **`test-optimizaciones.html`** - Test de optimizaciones aplicadas
- **`test-prestamos-navegador.html`** - Test completo de préstamos

### 3. Scripts de Consola de Navegador

#### Cómo Usar Scripts de Debug
```javascript
// 1. Abrir DevTools (F12)
// 2. Ir a la pestaña Console
// 3. Copiar y pegar el script
// 4. Ejecutar con Enter

// Ejemplo: Debug rápido de MaterialSelector
window.debugMaterialSelector();

// Ejemplo: Diagnóstico completo
window.diagnosticoCompleto();
```

## 🔧 Metodologías de Debugging

### 1. Debugging Progresivo

#### Nivel 1: Verificación Básica
```javascript
// Verificar estado básico
console.log('Usuario:', window.currentUser);
console.log('Rol:', window.userProfile?.rol);
console.log('URL:', window.location.pathname);
```

#### Nivel 2: Debug de Componente
```javascript
// Debug específico de MaterialSelector
window.debugMaterialSelector();
// Analiza: materiales disponibles, filtros, estado
```

#### Nivel 3: Diagnóstico Profundo
```javascript
// Diagnóstico completo del sistema
window.diagnosticoCompleto();
// Analiza: Firebase, autenticación, navegación, datos
```

### 2. Debugging por Categoría

#### 🔐 Autenticación y Permisos
- **Script**: `debug-permissions.js`
- **Verifica**: Roles, tokens, accesos
- **Común**: Problemas de acceso a páginas

#### 🧭 Navegación
- **Script**: `debug-navigation.js`
- **Verifica**: React Router, rutas, estado de navegación
- **Común**: Páginas en blanco, redirecciones

#### 📦 Gestión de Materiales
- **Script**: `debug-material-selector.js`
- **Verifica**: Disponibilidad, filtros, estados
- **Común**: Materiales no aparecen, filtros no funcionan

#### 🏃‍♂️ Estados de Actividades
- **Script**: `debug-actividad-estado.js`
- **Verifica**: Estados, transiciones, validaciones
- **Común**: Estados inconsistentes

## 📊 Debugging de Performance

### Herramientas de Performance
```javascript
// Monitor de rendimiento
window.performanceMonitor.start();

// Detectar violaciones del scheduler
window.performanceMonitor.getViolationSummary();

// Test de performance específico
// Usar: src/utils/testPerformance.js
```

### Optimizaciones Implementadas
- **Event debouncing** en formularios
- **React.memo** en componentes pesados
- **useMemo/useCallback** para cálculos costosos
- **Lazy loading** de rutas y componentes

## 🚨 Solución de Problemas Comunes

### 1. Página de Material en Blanco
```javascript
// Ejecutar en consola
window.testMaterialPage();
// Diagnóstica: permisos, navegación, carga de datos
```

### 2. MaterialSelector No Funciona
```javascript
// Debug completo del selector
window.debugMaterialSelector();
// Verifica: repositorio, materiales, filtros
```

### 3. Navegación Rota
```javascript
// Debug de navegación
window.verificarNavegacionMaterial();
// Analiza: React Router, autenticación, permisos
```

### 4. Firebase Connectivity Issues
```javascript
// Verificar conexión Firebase
window.verificarFirebase();
// Tests: conexión, autenticación, permisos Firestore
```

## 📚 Documentación de Referencia

### Guías Específicas
- **`docs/guides/GUIA-DEBUGGING-MATERIALSELECTOR.md`** - Debugging del MaterialSelector
- **`docs/guides/date-handling.md`** - Debug de manejo de fechas

### Reportes de Soluciones
- **`docs/solutions/DEBUG-TAB-NAVIGATION-SOLUCION.md`** - Solución navegación tabs
- **`docs/reports/RESUMEN-DEBUGGING-IMPLEMENTADO.md`** - Resumen herramientas

### Scripts de Validación
- **`tests/scripts/validate-optimizations.ps1`** - Validar optimizaciones
- **`tests/scripts/verificacion.ps1`** - Verificación general

## 🔄 Flujo de Debugging Recomendado

### Para Desarrolladores
1. **Reproducir el problema** en desarrollo
2. **Ejecutar script de debug básico** (`debug-simple.js`)
3. **Usar script específico** del componente afectado
4. **Aplicar diagnóstico profundo** si es necesario
5. **Documentar la solución** en `docs/solutions/`

### Para QA/Testing
1. **Usar tests HTML** en `tests/browser-tests/`
2. **Ejecutar scripts de validación** en `tests/scripts/`
3. **Reportar problemas** con logs de debug adjuntos
4. **Verificar fixes** con scripts de verificación

## 🚀 Herramientas Futuras

### En Desarrollo
- **Debug automatizado** en CI/CD
- **Logging centralizado** con niveles
- **Dashboard de debugging** en tiempo real
- **Tests de regresión** automatizados

---
*Guía actualizada: Junio 2025*
