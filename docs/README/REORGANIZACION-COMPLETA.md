# 🧪 Estructura de Tests y Debug - Reorganizada

Esta es la nueva estructura organizacional para todos los archivos de testing, debugging y scripts de desarrollo después de la limpieza completa.

## 📁 Estructura de carpetas

### `tests/core/` - Tests de lógica de negocio
- Tests principales de funcionalidad
- **`prestamos/`** - Tests específicos de préstamos de materiales

### `tests/debug/` - Scripts de debugging 
- Scripts de debug específicos para componentes
- Scripts de diagnóstico completo
- Herramientas de troubleshooting

### `tests/browser-tests/` - Tests que ejecutan en navegador
- Archivos HTML para testing manual
- Scripts que requieren DOM y APIs del navegador

### `tests/scripts/` - Scripts de automatización
- Archivos .bat y .ps1 
- Scripts de deploy y validación
- Utilidades de línea de comandos

### `tests/utils/` - Utilidades de testing
- Funciones helper para tests
- Scripts de preparación de datos
- Utilidades de validación

### `tests/unit/` - Tests unitarios
- Tests aislados de componentes específicos

### `tests/docs/` - Documentación de testing
- Guías y documentación relacionada con tests

## 🏗️ Archivos organizados

### ✅ Movidos desde `public/` (COMPLETADO)
- 14 scripts de debug y test movidos a `tests/debug/`
- Carpeta `public/` ahora limpia y solo con archivos estáticos

### ✅ Eliminados de `build/` (COMPLETADO)  
- 14 archivos de debug eliminados de la carpeta de producción
- Build ahora limpio para deployment

### ✅ Reorganizado `tests/utils/` (COMPLETADO)
- Archivos HTML → `tests/browser-tests/`
- Archivos .bat/.ps1 → `tests/scripts/`
- Scripts debug → `tests/debug/`
- Scripts de préstamos → `tests/core/prestamos/`

### ✅ Eliminados duplicados (COMPLETADO)
- `debug-simple.js` vacío eliminado
- Archivos duplicados consolidados

## 📋 Estado actual de carpetas

### `tests/debug/` contiene:
- Scripts debug-*.js originales de public/
- Scripts de diagnóstico movidos de utils/
- Nuevos scripts debug consolidados de utils/
- **Total: ~25 archivos de debugging**

### `tests/core/prestamos/` contiene:
- Tests específicos de lógica de préstamos
- Scripts de consola para testing de préstamos
- **Total: ~12 archivos relacionados con préstamos**

### `tests/browser-tests/` contiene:
- Archivos HTML para testing manual
- Scripts que requieren ejecutarse en navegador
- **Total: ~6 archivos HTML + scripts**

### `tests/scripts/` contiene:
- Scripts .bat para automatización
- Scripts .ps1 de PowerShell
- Utilidades de deployment
- **Total: ~10 scripts de automatización**

## 🎯 Beneficios de la reorganización

1. **Separación clara de responsabilidades**
2. **Carpetas de producción limpias** (`public/`, `build/`)
3. **Scripts agrupados por función**
4. **Fácil localización de herramientas**
5. **Estructura profesional y mantenible**

## 🔧 Próximos pasos recomendados

1. Actualizar referencias a scripts movidos en documentación
2. Crear scripts de acceso rápido para herramientas comunes
3. Revisar y consolidar scripts duplicados o obsoletos
4. Agregar documentación específica en cada subcarpeta

---
*Reorganización completada el 9 de junio de 2025*
