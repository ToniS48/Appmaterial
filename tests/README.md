# 🧪 Tests - AppMaterial

Esta carpeta contiene todos los tests, scripts de debugging y herramientas de validación del proyecto AppMaterial.

## 📚 Documentación Completa

Para información detallada sobre testing y debugging, consulte:

**[📋 Documentación de Testing](../docs/README/testing/README-TESTING.md)**
- Estructura completa de testing
- Herramientas por categoría  
- Guías de uso y configuración

**[🔍 Documentación de Debugging](../docs/README/debugging/README-DEBUGGING.md)**
- Scripts de debugging por componente
- Metodologías de troubleshooting
- Solución de problemas comunes

## 📁 Estructura Organizada

```
tests/
├── core/                    # Tests principales de lógica de negocio
│   └── prestamos/          # Tests específicos de préstamos
├── debug/                  # Scripts de debugging consolidados
├── browser-tests/          # Tests HTML que requieren navegador
├── scripts/               # Scripts de automatización (.bat, .ps1)
├── utils/                 # Utilidades y helpers de testing
└── unit/                  # Tests unitarios
```

## 🚀 Uso Rápido

### Tests Principales
```bash
npm test                   # Ejecutar todos los tests
```

### Scripts de Debug (en consola del navegador)
```javascript
// Debug rápido de MaterialSelector
window.debugMaterialSelector();

// Diagnóstico completo del sistema  
window.diagnosticoCompleto();
```

### Validación del Sistema
```bash
# Windows
.\tests\scripts\validate-simple.ps1

# Verificar materiales
.\tests\scripts\test-materiales-disponibles.bat
```

## 📋 Estado Post-Reorganización

✅ **Scripts consolidados** - Todos los scripts de debug organizados en `debug/`  
✅ **Tests organizados** - Tests por categoría en carpetas específicas  
✅ **Duplicados eliminados** - Sin archivos redundantes  
✅ **Documentación unificada** - READMEs temáticos en `docs/README/`

---
*Para documentación completa, ver [docs/README/INDEX-MAESTRO.md](../docs/README/INDEX-MAESTRO.md)*
├── guides/                                  # Guías y tutoriales
│   ├── date-handling.md                     # Guía manejo fechas
│   └── GUIA-DEBUGGING-MATERIALSELECTOR.md   # Guía debug MaterialSelector
├── reports/                                 # Reportes y resúmenes
│   ├── ANALISIS-LIMPIEZA-ARCHIVOS.md        # Análisis de limpieza
│   ├── MATERIAL-EDITOR-IMPLEMENTATION-COMPLETED.md
│   ├── MEJORAS_PARTICIPANTES_COMPLETADAS.md
│   ├── OPTIMIZACIONES-COMPLETADAS.md
│   ├── RESUMEN_SOLUCION_FINAL.md
│   └── [otros reportes]
└── solutions/                               # Soluciones implementadas
    ├── CORRECCION_ESTRUCTURA_PARTICIPANTES.md
    ├── SOLUCION-PRESTAMOS-ACTIVIDADES-COMPLETADA.md
    ├── SOLUCION-MATERIALES-FILTRADO-CORREGIDA.md
    └── [otras soluciones]
```

## 🎯 BENEFICIOS DE LA ORGANIZACIÓN

### ✅ DIRECTORIO RAÍZ LIMPIO
- **Antes**: ~80 archivos sueltos de test/debug
- **Después**: Solo archivos esenciales del proyecto
- **Beneficio**: Navegación clara y profesional

### 📁 ESTRUCTURA LÓGICA
- **`tests/core/`**: Tests críticos y validaciones principales
- **`tests/utils/`**: Scripts auxiliares y herramientas
- **`tests/docs/`**: Documentación específica de tests
- **`docs/guides/`**: Guías y tutoriales
- **`docs/reports/`**: Reportes de estado y resúmenes
- **`docs/solutions/`**: Documentación de soluciones

### 🔧 ARCHIVOS MANTENIDOS (ÚTILES)
- ✅ Tests funcionales de préstamos y devoluciones
- ✅ Scripts de validación del sistema
- ✅ Herramientas de deploy Firebase
- ✅ Documentación de correcciones importantes
- ✅ Guías de debugging y desarrollo

### 🗑️ ARCHIVOS ELIMINADOS (OBSOLETOS)
- ❌ ~60 archivos debug temporales
- ❌ Scripts de test redundantes
- ❌ Documentación obsoleta
- ❌ Archivos de verificación temporales

## 🚀 SCRIPTS PRINCIPALES DISPONIBLES

### 🧪 Tests Críticos
```bash
# Test de préstamos automáticos
node tests/core/test-prestamos.js

# Test de devoluciones
node tests/core/test-devoluciones.js

# Validación sistema
node tests/core/validacion-sistema.js
```

### 🔧 Utilidades
```bash
# Inicio tests préstamos
./tests/utils/inicio-prestamos.bat

# Deploy índices Firebase
./tests/utils/deploy-firebase-indexes.bat

# Iniciar aplicación
./tests/utils/start-app.ps1
```

### 📊 Validaciones
```bash
# Verificar conexión Firebase
node tests/core/verify-firebase-connection.js

# Verificar fixes aplicados
node tests/core/verify-fix.js

# Validar Material Editor
node tests/core/validate-material-editor-implementation.js
```

## 📈 ESTADÍSTICAS DE LIMPIEZA

| Categoría | Antes | Después | Eliminados |
|-----------|-------|---------|------------|
| **Archivos .js** | ~68 | 15 | ~53 |
| **Archivos .md** | ~34 | 25 | ~9 |
| **Scripts .ps1** | ~13 | 7 | ~6 |
| **Scripts .bat** | ~4 | 4 | 0 |
| **Archivos HTML** | ~9 | 6 | ~3 |
| **TOTAL** | **~128** | **57** | **~71** |

## 🎊 RESULTADO FINAL

✅ **Directorio raíz limpio y profesional**  
✅ **Estructura lógica y organizada**  
✅ **Tests funcionales mantenidos**  
✅ **Documentación categorizada**  
✅ **Herramientas útiles disponibles**  
✅ **~71 archivos obsoletos eliminados**  

## 📝 PRÓXIMOS PASOS RECOMENDADOS

1. **🧪 Ejecutar tests principales** para validar funcionalidad
2. **📚 Revisar documentación** en `docs/` para contexto
3. **🔧 Usar herramientas** en `tests/utils/` según necesidad
4. **🚀 Continuar desarrollo** con estructura limpia

---
*Limpieza completada: 8 de junio de 2025*  
*Archivos organizados: 57 | Archivos eliminados: ~71*
