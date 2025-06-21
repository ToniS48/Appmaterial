# 🚀 Gestión de Versiones Semi-Automática

Este proyecto incluye scripts para gestionar versiones de forma semi-automática después de hacer push. Los scripts permiten seleccionar el tipo de cambio de versión de manera interactiva.

## 📋 Scripts Disponibles

### Scripts Principales (Post-Push)

#### `npm run version:quick` ⚡
**Script recomendado para uso diario**
- Interfaz rápida y minimalista
- Muestra la versión actual y opciones disponibles
- Permite seleccionar: PATCH, MINOR, MAJOR, CUSTOM, o SALIR
- Opción de crear tag de Git

```bash
npm run version:quick
```

#### `npm run version:interactive` 🎯
**Script completo con análisis de commits**
- Analiza los últimos commits para sugerir el tipo de versión
- Muestra historial de commits recientes
- Opciones avanzadas de configuración de tags
- Más información contextual

```bash
npm run version:interactive
```

#### `npm run version:post-push` 📤
**Verificación de estado + versión interactiva**
- Verifica el estado de sincronización con remoto
- Ejecuta el gestor interactivo si todo está actualizado

```bash
npm run version:post-push
```

### Scripts Directos (Sin Interacción)

```bash
# Incrementos directos
npm run version:patch     # 0.7.0 → 0.7.1
npm run version:minor     # 0.7.0 → 0.8.0  
npm run version:major     # 0.7.0 → 1.0.0

# Con creación automática de tags
npm run version:patch-tag
npm run version:minor-tag
npm run version:major-tag

# Información y utilidades
npm run version:info      # Mostrar información actual
npm run version:generate  # Regenerar archivos de versión
```

## 🔄 Flujo de Trabajo Recomendado

### Después de hacer push:

1. **Desarrollo terminado y pusheado**
   ```bash
   git add .
   git commit -m "feat: nueva funcionalidad"
   git push
   ```

2. **Actualizar versión** (elige uno):
   ```bash
   # Opción rápida (recomendada)
   npm run version:quick
   
   # Opción con análisis de commits
   npm run version:interactive
   ```

3. **Push del tag** (si se creó):
   ```bash
   git push origin v0.8.0
   ```

## 🎯 Tipos de Versión (Semantic Versioning)

| Tipo | Cuándo usar | Ejemplo |
|------|-------------|---------|
| **PATCH** | Correcciones de bugs, cambios menores | `0.7.0 → 0.7.1` |
| **MINOR** | Nuevas funcionalidades, cambios compatibles | `0.7.0 → 0.8.0` |
| **MAJOR** | Cambios importantes, breaking changes | `0.7.0 → 1.0.0` |
| **CUSTOM** | Versión específica (ej: preparar release) | `0.7.0 → 1.0.0-beta.1` |

## 🤖 Análisis Automático de Commits

El script interactivo analiza los commits recientes buscando palabras clave:

- **MAJOR**: `breaking`, `major`, `BREAKING CHANGE`
- **MINOR**: `feat`, `feature`, `add`, `new`
- **PATCH**: `fix`, `patch`, `bug`, `hotfix`, `correction`

## 📁 Archivos Generados

Los scripts actualizan automáticamente:

- `package.json` - Versión del proyecto
- `src/version-info.json` - Información detallada de versión
- `.env.local` - Variables de entorno para React

## ⚙️ Configuración Avanzada

### Personalizar Análisis de Commits

Editar `scripts/interactive-version-manager.js`:

```javascript
const keywords = {
  major: ['breaking', 'major', 'BREAKING CHANGE'],
  minor: ['feat', 'feature', 'add', 'new'],
  patch: ['fix', 'patch', 'bug', 'hotfix']
};
```

### Git Hooks (Opcional)

Para ejecutar automáticamente después de push, crear `.git/hooks/post-push`:

```bash
#!/bin/sh
echo "🚀 Push completado. ¿Actualizar versión?"
npm run version:quick
```

## 🔧 Solución de Problemas

### Error: "No se pudo obtener información de Git"
```bash
# Verificar que estás en un repositorio Git
git status

# Verificar remoto configurado
git remote -v
```

### Error: "Comando desconocido"
```bash
# Verificar que Node.js está instalado
node --version

# Reinstalar dependencias si es necesario
npm install
```

### Tag ya existe
```bash
# Eliminar tag local
git tag -d v0.8.0

# Eliminar tag remoto
git push --delete origin v0.8.0
```

## 📝 Ejemplos de Uso

### Caso 1: Corrección de Bug
```bash
# Después del push
npm run version:quick
# Seleccionar opción 1 (PATCH)
# Resultado: 0.7.0 → 0.7.1
```

### Caso 2: Nueva Funcionalidad
```bash
# Después del push
npm run version:interactive
# Ver sugerencia automática: MINOR
# Confirmar con Enter
# Crear tag: Y
# Resultado: 0.7.0 → 0.8.0 + tag v0.8.0
```

### Caso 3: Release Mayor
```bash
npm run version:quick
# Seleccionar opción 3 (MAJOR)
# Resultado: 0.7.0 → 1.0.0
```

## 🎨 Personalización

Los scripts usan colores en la consola. Para deshabilitarlos:

```bash
NO_COLOR=1 npm run version:quick
```

---

**💡 Tip**: Usa `npm run version:quick` para la mayoría de casos. Es rápido, claro y suficiente para el uso diario.
