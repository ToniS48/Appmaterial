# 📁 Guía de Ubicación de Documentos - AppMaterial

Esta guía establece dónde deben guardarse los nuevos documentos según su tipo y propósito.

## 🎯 Convenciones de Ubicación

### 📊 **docs/ (raíz)** - Solo documentos principales
```
docs/
├── RESUMEN-EJECUTIVO.md          # Estado general del proyecto
├── SOLUCIONES-TECNICAS.md        # Soluciones técnicas consolidadas
├── INDICE-SIMPLIFICADO.md        # Navegación principal
└── [SOLO documentos de nivel ejecutivo]
```

### 📋 **docs/reports/** - Reportes de implementaciones y análisis
**Usar para:**
- ✅ Reportes de implementaciones completadas
- ✅ Análisis técnicos de componentes
- ✅ Documentos de resolución de problemas importantes
- ✅ Métricas y evaluaciones de rendimiento

**Patrón de nombres:**
- `IMPLEMENTACION-[COMPONENTE]-COMPLETADA.md`
- `ANALISIS-[TEMA].md`
- `RESOLUCION-[PROBLEMA]-COMPLETA.md`
- `[ACCION]-[TEMA]-COMPLETADA.md`

**Ejemplos:**
```
MATERIAL-EDITOR-IMPLEMENTATION-COMPLETED.md
ANALISIS-COMPONENTES-REUTILIZABLES.md
RESOLUCION-VIOLACIONES-RENDIMIENTO-COMPLETA.md
SIMPLIFICACION-DOCUMENTACION-COMPLETADA.md
```

### 💡 **docs/solutions/** - Soluciones técnicas específicas
**Usar para:**
- ✅ Soluciones a problemas técnicos específicos
- ✅ Correcciones de bugs importantes
- ✅ Implementaciones de nuevas funcionalidades
- ✅ Debugging de problemas complejos

**Patrón de nombres:**
- `SOLUCION-[PROBLEMA].md`
- `CORRECCION-[BUG].md`
- `DEBUG-[COMPONENTE]-SOLUCION.md`

**Ejemplos:**
```
SOLUCION-MATERIALES-FILTRADO-CORREGIDA.md
DEBUG-TAB-NAVIGATION-SOLUCION.md
SOLUCION-PRESTAMOS-ACTIVIDADES-COMPLETADA.md
```

### 📖 **docs/guides/** - Guías técnicas específicas
**Usar para:**
- ✅ Guías de debugging específicas
- ✅ Tutoriales técnicos
- ✅ Documentación de APIs o componentes específicos
- ✅ Referencias técnicas especializadas

**Ejemplos:**
```
GUIA-DEBUGGING-MATERIALSELECTOR.md
date-handling.md
api-reference.md
```

### 📚 **docs/README/** - Documentación estructurada
**Usar para:**
- ✅ Documentación principal por temas
- ✅ READMEs especializados (testing, debugging, architecture)
- ✅ Índices y navegación

**Subcarpetas:**
- `testing/` - Todo relacionado con testing
- `debugging/` - Todo relacionado con debugging  
- `architecture/` - Todo relacionado con arquitectura

## 🚫 **docs/archive/** - NO crear archivos aquí
Esta carpeta es solo para documentos históricos archivados.

## 🤖 Scripts Helper para Ubicación Automática

### Script 1: Crear reporte de implementación
```powershell
# create-implementation-report.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$ComponentName,
    [string]$Description = "Implementación completada"
)

$filename = "IMPLEMENTACION-$ComponentName-COMPLETADA.md"
$filepath = "c:\Users\Sonia\Documents\Espemo\Apps\AppMaterial\docs\reports\$filename"

$content = @"
# ✅ $Description - $ComponentName

## 🎯 Resumen de la Implementación

[Describir qué se implementó]

## 🔧 Cambios Realizados

[Listar cambios principales]

## 🧪 Testing

[Describir tests realizados]

## 📊 Resultados

[Métricas y resultados]

---
*Implementación completada: $(Get-Date -Format 'dd/MM/yyyy')*
"@

Set-Content -Path $filepath -Value $content -Encoding UTF8
Write-Host "✅ Reporte creado en: $filepath"
```

### Script 2: Crear solución técnica
```powershell
# create-solution.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$ProblemName,
    [string]$Description = "Solución técnica"
)

$filename = "SOLUCION-$ProblemName.md"
$filepath = "c:\Users\Sonia\Documents\Espemo\Apps\AppMaterial\docs\solutions\$filename"

$content = @"
# 🔧 $Description - $ProblemName

## 🎯 Problema Identificado

[Describir el problema]

## 💡 Solución Implementada

[Describir la solución]

## 🧪 Verificación

[Cómo verificar que funciona]

## 📋 Archivos Modificados

[Listar archivos cambiados]

---
*Solución implementada: $(Get-Date -Format 'dd/MM/yyyy')*
"@

Set-Content -Path $filepath -Value $content -Encoding UTF8
Write-Host "✅ Solución creada en: $filepath"
```

### Script 3: Crear guía técnica
```powershell
# create-guide.ps1
param(
    [Parameter(Mandatory=$true)]
    [string]$GuideName,
    [string]$Description = "Guía técnica"
)

$filename = "$GuideName.md"
$filepath = "c:\Users\Sonia\Documents\Espemo\Apps\AppMaterial\docs\guides\$filename"

$content = @"
# 📖 $Description - $GuideName

## 🎯 Propósito

[Para qué sirve esta guía]

## 🛠️ Pasos

[Pasos detallados]

## 💡 Tips y Mejores Prácticas

[Consejos útiles]

## 🔍 Troubleshooting

[Problemas comunes y soluciones]

---
*Guía creada: $(Get-Date -Format 'dd/MM/yyyy')*
"@

Set-Content -Path $filepath -Value $content -Encoding UTF8
Write-Host "✅ Guía creada en: $filepath"
```

## 🎯 Uso de los Scripts

### Crear reporte de implementación:
```powershell
.\create-implementation-report.ps1 -ComponentName "MaterialEditor" -Description "Editor de materiales implementado"
```

### Crear solución técnica:
```powershell
.\create-solution.ps1 -ProblemName "NAVEGACION-LENTA" -Description "Optimización de navegación"
```

### Crear guía técnica:
```powershell
.\create-guide.ps1 -GuideName "GUIA-DEBUGGING-FIREBASE" -Description "Debugging de Firebase"
```

## 🔄 Proceso Recomendado

### Al completar una implementación:
1. **Usar script helper** o crear manualmente en `docs/reports/`
2. **Nombrar con patrón** establecido
3. **Incluir métricas** y resultados
4. **Documentar testing** realizado

### Al resolver un problema técnico:
1. **Crear en** `docs/solutions/`
2. **Describir problema** y solución claramente
3. **Incluir verificación** de que funciona
4. **Listar archivos** modificados

### Al crear documentación técnica:
1. **Usar** `docs/guides/` para guías específicas
2. **Usar** `docs/README/[tema]/` para documentación estructurada
3. **Mantener** principio de "un tema, un lugar"

---

## 📋 Checklist antes de crear documentos

- [ ] ¿Es un reporte de implementación? → `docs/reports/`
- [ ] ¿Es una solución técnica? → `docs/solutions/`  
- [ ] ¿Es una guía específica? → `docs/guides/`
- [ ] ¿Es documentación estructurada? → `docs/README/[tema]/`
- [ ] ¿Sigue el patrón de nombres establecido?
- [ ] ¿Incluye fecha de creación?
- [ ] ¿Tiene contenido actionable y útil?

---
*Guía establecida: 9 de junio de 2025*
