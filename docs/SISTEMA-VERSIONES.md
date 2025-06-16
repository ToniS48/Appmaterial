# Sistema de Versiones del Proyecto

Este documento explica cómo funciona el sistema de versiones implementado en la aplicación.

## ¿Por qué no cambia la versión con los commits?

El sistema maneja **dos tipos de versiones**:

1. **Versión Base** (`0.1.0`): Del `package.json`, se cambia manualmente para releases importantes
2. **Versión Automática** (`0.1.66`): Se genera automáticamente como `{major}.{minor}.{commits}`

### Ejemplo Actual:
- **Versión base**: `0.1.0` (del package.json)
- **Versión automática**: `0.1.66` (0.1 + 66 commits)
- **Versión mostrada**: `v0.1.66` (la automática)

## Componentes Creados

### 1. `VersionDisplay.tsx`
Componente simple para mostrar la versión del proyecto.

**Props:**
- `position`: Posición del componente ('absolute', 'relative', 'fixed')
- `bottom`, `right`: Posición en pantalla
- `fontSize`: Tamaño de fuente
- `color`: Color del texto
- `showTooltip`: Mostrar tooltip con información detallada
- `format`: Formato de visualización ('short', 'version-only', 'with-build')

### 2. `AdvancedVersionDisplay.tsx`
Componente avanzado con modal de información detallada.

**Características:**
- Click para abrir modal con información completa
- Información de commit, build, fecha, rama
- Interfaz visual mejorada con iconos

### 3. Hook `useVersionInfo.ts`
Hook personalizado para acceder a la información de versión.

**Funciones exportadas:**
- `useVersionInfo()`: Información completa
- `useVersion()`: Solo la versión
- `useVersionString(format)`: Versión formateada

## Script de Generación `generate-version.js`

El script captura automáticamente:
- Hash del commit actual
- Número de build (cantidad de commits)
- Fecha del commit
- Rama actual
- Mensaje del commit
- Fecha de build

## Configuración

### Package.json
Se han añadido los siguientes scripts:
```json
{
  "prebuild": "node scripts/generate-version.js",
  "start": "node scripts/generate-version.js && react-scripts start",
  "version:generate": "node scripts/generate-version.js"
}
```

### Variables de Entorno
El script genera automáticamente estas variables:
- `REACT_APP_VERSION`: Versión base del package.json
- `REACT_APP_AUTO_VERSION`: Versión automática con commits
- `REACT_APP_DISPLAY_VERSION`: Versión que se muestra en la UI
- `REACT_APP_COMMIT_HASH`: Hash completo del commit
- `REACT_APP_BUILD_NUMBER`: Número de commits (build number)
- `REACT_APP_COMMIT_DATE`: Fecha del commit
- `REACT_APP_BRANCH_NAME`: Rama actual
- `REACT_APP_BUILD_DATE`: Fecha del build

## Uso en la Aplicación

### Implementación Actual
El componente está integrado en `AuthPageLayout.tsx` y se muestra en:
- Página de login
- Página de registro
- Cualquier página que use el layout de autenticación

### Uso Manual
```tsx
import VersionDisplay from '../components/version/VersionDisplay';

// Versión simple
<VersionDisplay />

// Versión con configuración personalizada
<VersionDisplay 
  position="fixed"
  bottom="20px"
  right="20px"
  format="short"
  showTooltip={true}
/>
```

```tsx
import AdvancedVersionDisplay from '../components/version/AdvancedVersionDisplay';

// Versión avanzada con modal
<AdvancedVersionDisplay 
  showModal={true}
  format="with-build"
/>
```

### Usando el Hook
```tsx
import { useVersionInfo, useVersion } from '../hooks/useVersionInfo';

function MyComponent() {
  const version = useVersion(); // Solo la versión
  const fullInfo = useVersionInfo(); // Información completa
  
  return <div>Versión: {version}</div>;
}
```

## Archivos Generados

- `/src/version-info.json`: Información completa (ignorado por Git)
- `/.env.local`: Variables de entorno (ignorado por Git)

## Consideraciones de Producción

1. **CI/CD**: El script debe ejecutarse en el pipeline de build
2. **Docker**: Incluir el script en el proceso de build del contenedor
3. **Variables de Entorno**: Pueden sobrescribirse en producción
4. **Fallbacks**: El sistema funciona sin Git (modo desarrollo)

## Personalización

### Cambiar Formato de Versión
Modificar el hook `useVersionInfo.ts` para cambiar cómo se muestra la versión.

### Añadir Información Adicional
Extender el script `generate-version.js` para capturar más datos del repositorio.

### Estilos Personalizados
Los componentes usan Chakra UI y pueden personalizarse fácilmente.

## Troubleshooting

### Error: "git command not found"
- Instalar Git en el sistema
- Verificar que Git esté en el PATH

### Variables de entorno no disponibles
- Ejecutar `npm run version:generate` manualmente
- Verificar que el script se ejecute antes del build

### Componente no se muestra
- Verificar que el componente esté importado correctamente
- Comprobar la posición y z-index del componente
