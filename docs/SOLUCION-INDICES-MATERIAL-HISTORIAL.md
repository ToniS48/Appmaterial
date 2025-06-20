# Solución: Crear Índices para material_historial

## Problema Identificado
El dashboard de seguimiento de materiales no muestra datos porque las consultas de Firestore requieren índices compuestos que no existen.

## Consultas que Fallan (sin índices)
Las siguientes consultas en `MaterialHistorialRepository.ts` necesitan índices:

1. **findEventosByMaterialYear** (línea 68-72):
   - `where('materialId', '==', value)`
   - `where('año', '==', value)` 
   - `orderBy('fecha', 'desc')`

2. **findEventosByTipo** (línea 83-89):
   - `where('tipoEvento', '==', value)`
   - `where('año', '>=', value)` y/o `where('año', '<=', value)`
   - `orderBy('fecha', 'desc')`

3. **findEventosConCosto** (línea 115):
   - `where('costoAsociado', '>', 0)`
   - `where('año', '==', value)`
   - `orderBy('costoAsociado', 'desc')`

## Índices Necesarios

### 1. Índice para consultas por material y año
```json
{
  "collectionGroup": "material_historial",
  "queryScope": "COLLECTION", 
  "fields": [
    {
      "fieldPath": "materialId",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "año", 
      "order": "ASCENDING"
    },
    {
      "fieldPath": "fecha",
      "order": "DESCENDING"
    }
  ]
}
```

### 2. Índice para consultas por tipo de evento y año
```json
{
  "collectionGroup": "material_historial",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "tipoEvento",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "año",
      "order": "ASCENDING" 
    },
    {
      "fieldPath": "fecha",
      "order": "DESCENDING"
    }
  ]
}
```

### 3. Índice para consultas por costo y año
```json
{
  "collectionGroup": "material_historial",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "costoAsociado",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "año", 
      "order": "ASCENDING"
    },
    {
      "fieldPath": "costoAsociado",
      "order": "DESCENDING"
    }
  ]
}
```

## Pasos para Crear los Índices

### Opción 1: Firebase Console (Recomendado)
1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar el proyecto `fichamaterial`
3. Ir a Firestore Database > Índices
4. Hacer clic en "Create Index"
5. Configurar cada índice según las especificaciones arriba
6. Esperar a que se construyan (puede tomar unos minutos)

### Opción 2: CLI de Firebase
```bash
firebase deploy --only firestore:indexes
```
Nota: Puede fallar si hay conflictos con índices existentes.

## Verificación

Una vez creados los índices, verificar con:

1. **Recargar la pestaña Material > Seguimiento** en la aplicación
2. **Ejecutar el script de diagnóstico** en la consola del navegador:
   ```javascript
   copy(await import('./debug-diagnostico-historial.js'))
   ```
3. **Verificar logs** en la consola del navegador para errores de consulta

## Estado Actual
- ✅ Repositorio identificado con consultas problemáticas
- ✅ Índices necesarios especificados 
- ⏳ Creación de índices en Firebase Console
- ⏳ Verificación de funcionamiento

## Próximos Pasos
1. Crear los índices en Firebase Console
2. Generar datos de historial usando el script robusto
3. Verificar que el dashboard muestra los datos correctamente
4. Documentar el procedimiento para futuros casos

---
**Actualizado**: 2025-06-19 15:30
**Estado**: Esperando creación de índices en Firebase Console
