# 🔧 CORRECCIÓN: Mostrar Meteorología en Actividades en Curso hasta Finalizadas +1 Día

## 📋 PROBLEMA IDENTIFICADO

Los badges meteorológicos estaban desapareciendo de las cards de actividades que están en curso, cuando deberían mostrarse hasta que estén completamente finalizadas (fecha fin + 1 día).

### Comportamiento Anterior:
- ❌ **Actividades "en_curso"**: No mostraban badges meteorológicos
- ❌ **Actividades "finalizada"**: No mostraban badges meteorológicos
- ❌ **Lógica restrictiva**: Solo actividades "planificada" mostraban meteorología

### Comportamiento Esperado:
- ✅ **Actividades "planificada"**: Mostrar meteorología
- ✅ **Actividades "en_curso"**: Mostrar meteorología
- ✅ **Actividades "finalizada"**: Mostrar meteorología hasta 1 día después del fin
- ✅ **Actividades "cancelada"**: No mostrar meteorología

## 🔧 SOLUCIÓN IMPLEMENTADA

### 1. **ActividadCard.tsx** - Variable `shouldShowWeather`

**ANTES:**
```typescript
const shouldShowWeather = useMemo(() => {
  if (actividad.estado === 'cancelada' || actividad.estado === 'finalizada') return false;
  
  const fechaActividad = actividad.fechaInicio instanceof Date 
    ? actividad.fechaInicio 
    : actividad.fechaInicio.toDate();
  
  const hoy = new Date();
  const diasHastaActividad = Math.ceil((fechaActividad.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  
  return diasHastaActividad >= -1 && diasHastaActividad <= 15;
}, [actividad.estado, actividad.fechaInicio]);
```

**DESPUÉS:**
```typescript
const shouldShowWeather = useMemo(() => {
  if (actividad.estado === 'cancelada') return false;
  
  const fechaInicio = actividad.fechaInicio instanceof Date 
    ? actividad.fechaInicio 
    : actividad.fechaInicio.toDate();
  
  const fechaFin = actividad.fechaFin 
    ? (actividad.fechaFin instanceof Date ? actividad.fechaFin : actividad.fechaFin.toDate())
    : fechaInicio;
  
  const hoy = new Date();
  const diasDesdeFin = Math.ceil((hoy.getTime() - fechaFin.getTime()) / (1000 * 60 * 60 * 24));
  const diasHastaInicio = Math.ceil((fechaInicio.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  
  // Mostrar meteo hasta 1 día después del fin de la actividad y hasta 15 días antes del inicio
  return diasDesdeFin <= 1 && diasHastaInicio <= 15;
}, [actividad.estado, actividad.fechaInicio, actividad.fechaFin]);
```

### 2. **use7DayWeather.ts** - Hook de datos meteorológicos

**ANTES:**
```typescript
// Solo mostrar pronóstico para actividades futuras
const today = new Date();
const activityDate = actividad.fechaInicio instanceof Timestamp 
  ? actividad.fechaInicio.toDate() 
  : actividad.fechaInicio;

if (activityDate <= today) {
  setWeatherData([]);
  return;
}
```

**DESPUÉS:**
```typescript
// Mostrar pronóstico hasta 1 día después del fin de la actividad
const today = new Date();
const activityStartDate = actividad.fechaInicio instanceof Timestamp 
  ? actividad.fechaInicio.toDate() 
  : actividad.fechaInicio;

const activityEndDate = actividad.fechaFin
  ? (actividad.fechaFin instanceof Timestamp ? actividad.fechaFin.toDate() : actividad.fechaFin)
  : activityStartDate;

// Calcular días desde el fin de la actividad
const daysSinceEnd = Math.ceil((today.getTime() - activityEndDate.getTime()) / (1000 * 60 * 60 * 24));

// No mostrar si han pasado más de 1 día desde el fin
if (daysSinceEnd > 1) {
  setWeatherData([]);
  return;
}
```

### 3. **weatherService.ts** - Función `get7DayForecastForActivity`

**ANTES:**
```typescript
async get7DayForecastForActivity(
  activityStartDate: Date | Timestamp,
  location?: string
): Promise<WeatherData[]>
```

**DESPUÉS:**
```typescript
async get7DayForecastForActivity(
  activityStartDate: Date | Timestamp,
  location?: string,
  activityEndDate?: Date | Timestamp  // ← Nueva parameter
): Promise<WeatherData[]>
```

**Lógica actualizada:**
```typescript
// Calcular días desde el fin de la actividad
const daysSinceEnd = Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

// Si la actividad es muy lejana o ya terminó hace más de 1 día, no mostrar pronóstico
if (daysUntilActivity > 15 || daysSinceEnd > 1) {
  return [];
}
```

## 🎯 CASOS DE USO CORREGIDOS

### Actividad Planificada (Futuro)
- **Estado**: `planificada`
- **Fechas**: 25/06/2025 - 27/06/2025
- **Resultado**: ✅ Muestra badges meteorológicos

### Actividad en Curso (Presente)
- **Estado**: `en_curso`
- **Fechas**: 18/06/2025 - 22/06/2025 (hoy: 20/06/2025)
- **Resultado**: ✅ Muestra badges meteorológicos

### Actividad Recién Finalizada
- **Estado**: `finalizada`
- **Fechas**: 17/06/2025 - 19/06/2025 (hoy: 20/06/2025)
- **Días desde fin**: 1 día
- **Resultado**: ✅ Muestra badges meteorológicos

### Actividad Finalizada Hace Tiempo
- **Estado**: `finalizada`
- **Fechas**: 15/06/2025 - 17/06/2025 (hoy: 20/06/2025)
- **Días desde fin**: 3 días
- **Resultado**: ❌ No muestra badges meteorológicos

### Actividad Cancelada
- **Estado**: `cancelada`
- **Fechas**: Cualquier fecha
- **Resultado**: ❌ No muestra badges meteorológicos

## 📊 BENEFICIOS DE LA CORRECCIÓN

### Para Usuarios:
- ✅ **Información relevante**: Ver el clima durante actividades en curso
- ✅ **Continuidad visual**: Los badges no desaparecen abruptamente
- ✅ **Mejor planificación**: Información útil hasta 1 día después del evento
- ✅ **UX consistente**: Comportamiento predecible de la interfaz

### Para el Sistema:
- ✅ **Lógica coherente**: Basada en fechas de fin reales, no solo estado
- ✅ **Optimización**: No carga datos innecesarios para actividades muy antiguas
- ✅ **Flexibilidad**: Funciona con actividades de 1 día o múltiples días
- ✅ **Robustez**: Maneja correctamente actividades sin fecha de fin

## 🔧 ARCHIVOS MODIFICADOS

### Componentes
- `src/components/actividades/ActividadCard.tsx`
  - Lógica `shouldShowWeather` actualizada
  - Considera fechas de fin en lugar de solo estado

### Hooks
- `src/hooks/use7DayWeather.ts`
  - Validación basada en fecha de fin
  - Pasa `fechaFin` al servicio meteorológico

### Servicios
- `src/services/weatherService.ts`
  - Nueva parameter `activityEndDate` en `get7DayForecastForActivity`
  - Lógica de filtrado basada en fecha de fin

## 🧪 TESTING RECOMENDADO

### Casos de Prueba:
1. **Actividad planificada futura** → Debería mostrar meteo
2. **Actividad en curso hoy** → Debería mostrar meteo
3. **Actividad que terminó ayer** → Debería mostrar meteo
4. **Actividad que terminó hace 2 días** → NO debería mostrar meteo
5. **Actividad cancelada** → NO debería mostrar meteo

### Verificación Manual:
```javascript
// En consola del navegador:
// Verificar cards que están en curso
document.querySelectorAll('[data-estado="en_curso"]').forEach(card => {
  const meteoBadges = card.querySelectorAll('.weather-compact-preview');
  console.log('Card en curso tiene meteo:', meteoBadges.length > 0);
});
```

## 📝 NOTAS TÉCNICAS

### Consideraciones:
- **Fecha de fin**: Si una actividad no tiene `fechaFin`, usa `fechaInicio` como fallback
- **Días calculados**: Usa `Math.ceil()` para redondear hacia arriba
- **Zona horaria**: Las fechas se manejan en hora local del usuario
- **Performance**: Solo carga datos meteorológicos cuando es necesario

### Compatibilidad:
- ✅ **Firebase Timestamp**: Maneja tanto `Date` como `Timestamp`
- ✅ **Actividades existentes**: Funciona con datos legacy
- ✅ **Estados múltiples**: Compatible con todos los estados de actividad

---

**Status**: ✅ COMPLETADO
**Los badges meteorológicos ahora se muestran correctamente en actividades en curso hasta 1 día después de finalizadas.**
