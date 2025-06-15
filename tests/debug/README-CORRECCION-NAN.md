# GUÍA DE CORRECCIÓN DE VALORES NaN EN MATERIAL_DEPORTIVO

## Problema Identificado
Se han detectado documentos en la colección `material_deportivo` de Firestore que contienen valores `NaN` en los campos `cantidad` y `cantidadDisponible`. Esto causa problemas en la lógica de la aplicación.

## Scripts de Corrección Disponibles

### 1. Script de Diagnóstico y Corrección Interactiva
**Archivo:** `tests/debug/fix-nan-cantidades.js`

**Uso:**
1. Abrir la aplicación en el navegador
2. Iniciar sesión
3. Abrir la consola de desarrollador (F12)
4. Copiar y pegar el contenido del script
5. Ejecutar el diagnóstico: `await ejecutarCorreccionNaN()`
6. Si se encuentran problemas, ejecutar: `await corregirMaterialesNaN(materialesProblematicos)`

### 2. Script de Corrección Automática  
**Archivo:** `tests/debug/auto-fix-nan.js`

**Uso:**
1. Abrir la aplicación en el navegador
2. Iniciar sesión  
3. Abrir la consola de desarrollador (F12)
4. Copiar y pegar el contenido del script
5. Ejecutar: `await correccionAutomaticaNaN()`

### 3. Script de Validación Mejorada
**Archivo:** `tests/debug/fix-cantidades-nan.js` (actualizado)

**Uso:**
1. Seguir los mismos pasos que el script 1
2. Ejecutar: `await corregirValoresNaN()`

## Lógica de Corrección

### Para Cuerdas (tipo === 'cuerda')
- `cantidad`: 1 (las cuerdas son elementos únicos)
- `cantidadDisponible`: 1

### Para Anclajes (tipo === 'anclaje')  
- `cantidad`: 10 (valor por defecto razonable)
- `cantidadDisponible`: igual a `cantidad` o valor existente válido

### Para Varios (tipo === 'varios')
- `cantidad`: 1 (valor por defecto)
- `cantidadDisponible`: igual a `cantidad` o valor existente válido

## Valores Problemáticos Detectados
Los scripts detectan y corrigen:
- `NaN` (valor JavaScript)
- `null`
- `undefined`
- Cadenas "NaN" o "nan"
- Números infinitos
- Valores no finitos

## Prevención Futura

### 1. Validación en MaterialForm.tsx
Se ha implementado validación automática para cuerdas:
```typescript
// Si se selecciona cuerda, establecer automáticamente cantidad = 1
if (watchTipo === 'cuerda') {
  setValue('cantidad', 1);
  setValue('cantidadDisponible', 1);
}
```

### 2. Validación en el Procesamiento de Datos
Los componentes de visualización ahora incluyen validación:
```typescript
const cantidad = Number(material.cantidad) || 0;
const cantidadDisponible = Number(material.cantidadDisponible) || 0;

// Validar que los valores sean números válidos
if (isNaN(cantidad) || isNaN(cantidadDisponible)) {
  // Mostrar error o valor por defecto
}
```

## Verificación Post-Corrección

Después de ejecutar cualquier script de corrección:

1. **Validar en consola:**
   ```javascript
   await validarCorrecciones()
   ```

2. **Recargar la aplicación** para ver los cambios aplicados

3. **Verificar en las vistas de inventario** que ya no aparecen errores "Error en datos"

## Notas Importantes

- ⚠️ **Los scripts modifican directamente Firestore** - usar con precaución
- ✅ **Crear respaldo** antes de ejecutar correcciones masivas
- 🔍 **Probar primero** con el script de diagnóstico
- 📊 **Verificar resultados** después de cada corrección

## Contacto
Para reportar problemas o solicitar asistencia con la corrección de datos, contactar al equipo de desarrollo.
