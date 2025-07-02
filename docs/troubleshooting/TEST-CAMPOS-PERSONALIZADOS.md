# Test de Campos Personalizados - Firestore

## Problema Identificado
Error al añadir campos personalizados: `Invalid argument: Cannot use undefined as a Firestore value`

## Causa del Error
En el componente `FirestoreSchemaManager.tsx`, línea 365, se estaba asignando:
```typescript
description: description.trim() || undefined
```

Esto generaba valores `undefined` que Firestore no permite.

## Solución Aplicada
Cambio en la creación de la definición del campo:

### Antes (problemático):
```typescript
const definition: FieldDefinition = {
  type: fieldType,
  required,
  description: description.trim() || undefined  // ❌ Puede ser undefined
};
```

### Después (corregido):
```typescript
const definition: FieldDefinition = {
  type: fieldType,
  required
};

// Solo añadir descripción si tiene contenido
if (description.trim()) {
  definition.description = description.trim();  // ✅ Solo asigna si hay valor
}
```

## Verificación de la Función cleanUndefinedValues
La función `cleanUndefinedValues` en `FirestoreDynamicService.ts` también ayuda como medida de seguridad adicional para limpiar cualquier valor `undefined` antes de enviar a Firestore.

## Pasos para Probar
1. Ir a Configuración → Firestore
2. Seleccionar colección "usuarios"
3. Añadir un campo personalizado:
   - Nombre: `nivelExperiencia`
   - Tipo: `string` 
   - Descripción: `Nivel de experiencia del usuario`
   - Sin valor por defecto (dejar vacío)
4. Verificar que se añade sin errores
5. Verificar que aparece en la lista de campos personalizados
6. Verificar que la recarga de datos funciona automáticamente

## Estado Esperado
- ✅ No debe aparecer el error de `undefined as a Firestore value`
- ✅ El campo debe añadirse correctamente
- ✅ La UI debe recargarse automáticamente mostrando el nuevo campo
- ✅ El campo debe aparecer diferenciado como "personalizado"

## Debug Adicional
Los logs de consola mostrarán:
```
[DEBUG] Field definition original: { type: 'string', required: false }
[DEBUG] Field definition cleaned: { type: 'string', required: false }
[DEBUG] Guardando esquema para usuarios: { customFields: [...], lastModified: Date }
```

## Archivos Modificados
- `src/components/configuration/sections/System/FirestoreSchemaManager.tsx` (línea ~365)
