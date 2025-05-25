# Patrones de Uso de Fechas en AppMaterial

Este documento describe los patrones recomendados para el manejo de fechas en la aplicación AppMaterial.

## Tipos de Fecha

El proyecto utiliza tres tipos principales de representación de fechas:

1. **JavaScript Date**: Para manipulación interna en componentes y funciones
2. **Firebase Timestamp**: Para almacenamiento en Firestore
3. **Strings formateados**: Para presentación en la interfaz de usuario

## Conversiones entre Formatos

### De cualquier formato a Date

```typescript
import { toDate } from '../utils/dateUtils';

// Desde Timestamp
const date = toDate(firestoreTimestamp);

// Desde string
const date = toDate('2023-05-15');

// Validación segura
if (toDate(someValue)) {
  // La fecha es válida
}
```

### De Date a Timestamp

```typescript
import { toTimestamp } from '../utils/dateUtils';

// Preparar para guardar en Firestore
const timestamp = toTimestamp(dateObject);
```

### Formateo para mostrar al usuario

```typescript
import { formatDate } from '../utils/dateUtils';

// Formato por defecto (dd/mm/yyyy)
const fechaCorta = formatDate(actividad.fechaInicio);

// Formato personalizado
const fechaConHora = formatDate(actividad.fechaInicio, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
```