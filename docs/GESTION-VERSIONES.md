# Guía de Gestión de Versiones

## 🎯 **Cuándo cambiar la versión padre**

### **Versionado Semántico (SemVer)**
```
MAJOR.MINOR.PATCH
  1.0.0
  ↑ ↑ ↑
  │ │ └── PATCH: Bug fixes, correcciones menores
  │ └──── MINOR: Nuevas funcionalidades (compatible hacia atrás)  
  └────── MAJOR: Cambios que rompen compatibilidad
```

## 🚀 **Comandos Disponibles**

### **Información de Versión**
```bash
npm run version:info          # Mostrar información actual completa
```

### **Incrementar Versión**
```bash
npm run version:patch         # 0.1.0 → 0.1.1 (bug fixes)
npm run version:minor         # 0.1.0 → 0.2.0 (nuevas funcionalidades)
npm run version:major         # 0.1.0 → 1.0.0 (cambios importantes)
```

### **Versión Específica**
```bash
npm run version:set 1.0.0     # Establecer versión específica
```

### **Con Tags de Git**
```bash
npm run version:patch-tag     # Incrementar + crear tag automático
npm run version:minor-tag     # Incrementar + crear tag automático  
npm run version:major-tag     # Incrementar + crear tag automático
```

## 📊 **Ejemplos Prácticos**

### **Escenario 1: Corrección de Bug**
```bash
# Tienes v0.1.66 y corriges un bug crítico
npm run version:patch-tag
# Resultado: v0.1.1 (nueva versión base)
# Versión automática: v0.1.66 (sigue siendo la misma)
```

### **Escenario 2: Nueva Funcionalidad**
```bash
# Añades una funcionalidad importante (ej: sistema de usuarios)
npm run version:minor-tag
# Resultado: v0.2.0 (nueva versión base)
# Versión automática: v0.2.66 (se ajusta automáticamente)
```

### **Escenario 3: Versión Estable**
```bash
# Proyecto listo para producción
npm run version:major-tag
# Resultado: v1.0.0 (nueva versión base)
# Versión automática: v1.0.66 (se ajusta automáticamente)
```

### **Escenario 4: Release Específico**
```bash
# Quieres una versión específica para un release
npm run version:set 2.1.0
# Resultado: v2.1.0 (versión base específica)
# Versión automática: v2.1.66 (se ajusta automáticamente)
```

## 🔄 **Flujo de Trabajo Recomendado**

### **Desarrollo Diario**
1. Haces commits normales → Versión automática se incrementa
2. `v0.1.66 → v0.1.67 → v0.1.68...`

### **Bug Fix (cada 1-2 semanas)**
```bash
npm run version:patch-tag
git push origin main
git push origin v0.1.1  # Subir el tag
```

### **Nueva Funcionalidad (cada mes)**
```bash
npm run version:minor-tag
git push origin main  
git push origin v0.2.0  # Subir el tag
```

### **Release Mayor (cada 3-6 meses)**
```bash
npm run version:major-tag
git push origin main
git push origin v1.0.0  # Subir el tag
```

## 📋 **Resultado Visual**

### **Antes del cambio:**
- Versión mostrada: `v0.1.66`
- Tooltip: "Versión: 0.1.66, Base: 0.1.0"

### **Después de `npm run version:minor`:**
- Versión mostrada: `v0.2.66` 
- Tooltip: "Versión: 0.2.66, Base: 0.2.0"

## 🏷️ **Tags de Git**

Los tags permiten:
- Marcar releases importantes
- Volver a versiones específicas
- Generar releases en GitHub
- Tracking de versiones en producción

### **Gestión de Tags**
```bash
# Ver todos los tags
git tag

# Ver tags con información
git tag -l -n

# Subir tag específico
git push origin v1.0.0

# Subir todos los tags
git push origin --tags

# Eliminar tag local
git tag -d v1.0.0

# Eliminar tag remoto
git push origin --delete v1.0.0
```

## 🎯 **Recomendaciones**

### **Para tu proyecto actual:**
1. **Ahora**: Mantén `0.1.x` para desarrollo
2. **Primera versión estable**: `npm run version:major-tag` → `v1.0.0`
3. **Nuevas funcionalidades**: `npm run version:minor-tag`
4. **Bug fixes**: `npm run version:patch-tag`

### **Timing sugerido:**
- **PATCH**: Cuando arreglas bugs críticos
- **MINOR**: Cuando añades funcionalidades nuevas importantes
- **MAJOR**: Cuando el proyecto está listo para producción o cambios importantes

¡Con este sistema tienes control total sobre las versiones y un historial claro del progreso del proyecto! 🚀
