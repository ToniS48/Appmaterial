# 🧪 Testing & Quality Assurance - README

Esta es la documentación unificada sobre testing, debugging y validación para la aplicación AppMaterial.

## 📁 Estructura de Testing

### `tests/core/` - Tests Principales
Tests de funcionalidades críticas y lógica de negocio:

#### `tests/core/prestamos/` - Tests de Préstamos
- **Tests de lógica de préstamos**
- **Validación de flujos de devolución** 
- **Tests de integración con Firebase**
- **Verificación de estados de material**

#### Tests de Componentes Core
- **MaterialEditor**: Validación de edición de materiales
- **ActividadPage**: Tests de navegación y funcionalidad
- **Sistema de notificaciones**: Tests unitarios

### `tests/debug/` - Scripts de Debugging
Scripts especializados para troubleshooting:

#### Scripts de Debug por Componente
- **MaterialSelector**: Debug de selección y filtrado
- **Navegación**: Debug de React Router y rutas
- **Permisos**: Validación de roles y accesos
- **Estados**: Debug de estados de actividades

#### Herramientas de Diagnóstico
- **Diagnóstico completo**: Script integral de validación
- **Scripts de solución**: Herramientas para resolver issues específicos

### `tests/browser-tests/` - Tests de Navegador
- **Tests HTML manuales**
- **Scripts que requieren DOM**
- **Validación de UI interactiva**

### `tests/scripts/` - Scripts de Automatización
- **Scripts de deploy** (.bat, .ps1)
- **Utilidades de validación**
- **Herramientas de CI/CD**

### `tests/utils/` - Utilidades de Testing
- **Helpers para tests**
- **Scripts de preparación de datos**
- **Utilidades de validación**

## 🛠️ Herramientas de Testing

### Para Desarrolladores
```bash
# Ejecutar todos los tests
npm test

# Tests específicos de componente
npm run test:component

# Scripts de debugging (ejecutar en consola del navegador)
# Ver scripts en tests/debug/
```

### Para QA
```bash
# Validación completa del sistema
.\tests\scripts\validate-simple.ps1

# Tests de materiales
.\tests\scripts\test-materiales-disponibles.bat

# Verificación de Firebase
.\tests\scripts\check-index.bat
```

## 📊 Tipos de Testing

### 1. Tests Unitarios
- Componentes aislados
- Servicios de dominio
- Utilidades y helpers

### 2. Tests de Integración
- Flujos completos de usuario
- Integración con Firebase
- Tests de API

### 3. Tests de Sistema
- Navegación completa
- Roles y permisos
- Performance y optimizaciones

### 4. Debug y Troubleshooting
- Scripts de diagnóstico
- Herramientas de debugging
- Resolución de problemas

## 🔧 Configuración

### Requisitos
- Node.js 16+
- Firebase CLI
- PowerShell (para scripts Windows)

### Variables de Entorno
```bash
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
# ... otras variables Firebase
```

## 📚 Documentación Relacionada

### En `docs/guides/`
- **GUIA-DEBUGGING-MATERIALSELECTOR.md** - Guía específica de debugging
- **date-handling.md** - Manejo de fechas en tests

### En `docs/reports/`
- **LIMPIEZA-SCRIPTS-DEBUG-COMPLETADA.md** - Reporte de reorganización
- **RESUMEN-DEBUGGING-IMPLEMENTADO.md** - Resumen de herramientas implementadas

### En `docs/solutions/`
- **DEBUG-TAB-NAVIGATION-SOLUCION.md** - Solución específica de navegación
- Otros documentos de soluciones específicas

## 🚀 Próximos Pasos

1. **Automatización completa** de tests en CI/CD
2. **Coverage reporting** integrado
3. **Tests E2E** con Cypress/Playwright
4. **Performance testing** automatizado

---
*Documentación actualizada: Junio 2025*
