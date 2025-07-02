# 🔧 Sistema de Variables Configurables

## 📋 Descripción

El sistema de variables configurables permite a los vocales y administradores ajustar el comportamiento automático de la aplicación sin necesidad de modificar código. Estas variables controlan aspectos como:

- ⏰ Tiempos de devolución y penalizaciones
- 🔔 Frecuencia de notificaciones
- 📦 Gestión de stock y material
- 🗓️ Reglas de creación y modificación de actividades
- 🏆 Sistema de puntuación y reputación

## 🏗️ Arquitectura

### 📁 Archivos Principales

1. **`/src/services/SystemConfigService.ts`** - Servicio principal
2. **`/src/pages/vocal/ConfiguracionVocalPage.tsx`** - Interfaz de configuración
3. **`/src/components/admin/SystemVariablesViewer.tsx`** - Visor de desarrollo

### 🔗 Flujo de Datos

```
Firebase (configuracion/global) 
    ↓
SystemConfigService 
    ↓
useSystemConfig Hook 
    ↓
Componentes React
```

## 🚀 Uso Básico

### 1. Hook en Componentes React

```tsx
import { useSystemConfig } from '../services/SystemConfigService';

const MiComponente = () => {
  const { 
    variables, 
    loading, 
    getVariable,
    isWithinGracePeriod,
    calculateReturnDeadline 
  } = useSystemConfig();

  if (loading) return <Spinner />;

  const diasGracia = getVariable('diasGraciaDevolucion');
  const fechaLimite = calculateReturnDeadline(activityEndDate);
  
  // ... resto del componente
};
```

### 2. Servicio Directo (fuera de React)

```typescript
import { systemConfig } from '../services/SystemConfigService';

// Cargar variables (una sola vez)
await systemConfig.loadSystemVariables();

// Usar variables
const diasGracia = systemConfig.getVariable('diasGraciaDevolucion');
const puedeCrear = systemConfig.canCreateActivity(new Date());
```

## 📊 Variables Disponibles

### 🔹 Gestión de Préstamos y Devoluciones

| Variable | Descripción | Rango | Defecto |
|----------|-------------|-------|---------|
| `diasGraciaDevolucion` | Días adicionales después del fin de actividad | 1-7 | 3 |
| `diasMaximoRetraso` | Días máximos antes de penalización | 7-45 | 15 |
| `diasBloqueoPorRetraso` | Días de bloqueo por retraso grave | 15-90 | 30 |
| `tiempoMinimoEntrePrestamos` | Días mínimos entre préstamos del mismo material | 0-7 | 1 |

### 🔹 Notificaciones Automáticas

| Variable | Descripción | Rango | Defecto |
|----------|-------------|-------|---------|
| `recordatorioPreActividad` | Días antes para recordar actividad | 1-14 | 7 |
| `recordatorioDevolucion` | Días antes del vencimiento | 1-5 | 1 |
| `notificacionRetrasoDevolucion` | Días de retraso para notificar | 1-7 | 3 |

### 🔹 Gestión de Material

| Variable | Descripción | Rango | Defecto |
|----------|-------------|-------|---------|
| `porcentajeStockMinimo` | Porcentaje mínimo para alertas | 10-50% | 20% |
| `diasRevisionPeriodica` | Días para revisión periódica | 90-365 | 180 |

### 🔹 Gestión de Actividades

| Variable | Descripción | Rango | Defecto |
|----------|-------------|-------|---------|
| `diasMinimoAntelacionCreacion` | Antelación mínima para crear actividad | 1-14 | 3 |
| `diasMaximoModificacion` | Días antes donde no se puede modificar | 1-7 | 2 |
| `limiteParticipantesPorDefecto` | Límite inicial de participantes | 10-50 | 20 |

### 🔹 Sistema de Puntuación

| Variable | Descripción | Rango | Defecto |
|----------|-------------|-------|---------|
| `penalizacionRetraso` | Puntos a descontar por retraso | 1-10 | 5 |
| `bonificacionDevolucionTemprana` | Puntos extra por devolución temprana | 1-5 | 2 |
| `umbraLinactividadUsuario` | Días sin actividad = inactivo | 180-730 | 365 |

### 🔹 Configuración de Reportes

| Variable | Descripción | Rango | Defecto |
|----------|-------------|-------|---------|
| `diasHistorialReportes` | Días de historial en reportes | 90-730 | 365 |
| `limiteElementosExportacion` | Límite en exportaciones | 500-5000 | 1000 |

## 🛠️ Métodos Utilitarios

### ⏰ Gestión de Tiempo

```typescript
// Verificar período de gracia
const enGracia = isWithinGracePeriod(fechaFinActividad);

// Calcular fecha límite de devolución
const fechaLimite = calculateReturnDeadline(fechaFinActividad);
```

### ⚖️ Sistema de Penalizaciones

```typescript
// ¿Aplicar penalización?
const penalizar = shouldApplyPenalty(diasRetraso);

// ¿Aplicar bloqueo?
const bloquear = shouldApplyBlock(diasRetraso);
```

### 🎯 Gestión de Actividades

```typescript
// ¿Se puede crear actividad?
const puedeCrear = canCreateActivity(fechaActividad);

// ¿Se puede modificar actividad?
const puedeModificar = canModifyActivity(fechaActividad);
```

### 📦 Gestión de Stock

```typescript
// ¿Stock bajo mínimo?
const stockBajo = isStockBelowMinimum(stockActual, stockTotal);
```

### 👤 Gestión de Usuarios

```typescript
// ¿Usuario inactivo?
const inactivo = isUserInactive(fechaUltimaActividad);
```

## 🔧 Implementación en Componentes Existentes

### 1. Gestión de Préstamos

```tsx
// En PrestamosService.ts
const { calculateReturnDeadline, isWithinGracePeriod } = useSystemConfig();

const calcularEstadoPrestamo = (prestamo) => {
  const fechaLimite = calculateReturnDeadline(prestamo.fechaFinActividad);
  const enGracia = isWithinGracePeriod(prestamo.fechaFinActividad);
  
  if (new Date() > fechaLimite) {
    return 'VENCIDO';
  } else if (enGracia) {
    return 'EN_GRACIA';
  }
  return 'ACTIVO';
};
```

### 2. Notificaciones Automáticas

```tsx
// En NotificacionService.ts
const { getVariable } = useSystemConfig();

const enviarRecordatorios = async () => {
  const diasAntes = getVariable('recordatorioPreActividad');
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + diasAntes);
  
  // Buscar actividades próximas...
};
```

### 3. Validación de Formularios

```tsx
// En ActividadFormPage.tsx
const { canCreateActivity } = useSystemConfig();

const validarFecha = (fecha) => {
  if (!canCreateActivity(fecha)) {
    return 'La actividad debe crearse con más antelación';
  }
  return null;
};
```

## 📱 Interfaz de Usuario

### 🎛️ Página de Configuración

**Ruta:** `/vocal/settings`

**Pestañas:**
1. **General** - Configuraciones básicas
2. **Variables del Sistema** - ⭐ Nueva pestaña con variables
3. **Material** - Configuraciones de material
4. **Clima** - Configuración meteorológica

### 🔍 Visor de Desarrollo

**Componente:** `SystemVariablesViewer`

- Muestra todas las variables actuales
- Ejemplos de uso práctico
- Verificaciones en tiempo real

## 🔄 Migración y Actualización

### 1. Cargar Variables al Inicio

```tsx
// En App.tsx o componente principal
useEffect(() => {
  systemConfig.loadSystemVariables();
}, []);
```

### 2. Actualizar Componentes Existentes

Buscar en el código:
- Valores hardcodeados relacionados con tiempos
- Lógica de validación de fechas
- Cálculos de penalizaciones
- Límites y umbrales

Reemplazar con variables del sistema.

## 🚦 Estados y Validaciones

### ✅ Casos de Uso Típicos

1. **Usuario quiere devolver material:**
   ```typescript
   if (isWithinGracePeriod(fechaFinActividad)) {
     // Permitir devolución sin penalización
   }
   ```

2. **Sistema calcula penalizaciones:**
   ```typescript
   const diasRetraso = calcularDiasRetraso(fechaLimite);
   if (shouldApplyPenalty(diasRetraso)) {
     const puntos = getVariable('penalizacionRetraso');
     aplicarPenalizacion(usuario, puntos);
   }
   ```

3. **Crear nueva actividad:**
   ```typescript
   if (!canCreateActivity(fechaSeleccionada)) {
     mostrarError('Selecciona una fecha con más antelación');
   }
   ```

## 🎯 Próximos Pasos

1. **Implementar en Componentes Existentes**
   - [ ] PrestamosService
   - [ ] NotificacionService
   - [ ] ActividadFormPage
   - [ ] MaterialService

2. **Notificaciones Automáticas**
   - [ ] Job scheduler basado en variables
   - [ ] Recordatorios automáticos

3. **Dashboard de Monitoreo**
   - [ ] Métricas basadas en variables
   - [ ] Alertas configurables

## 📞 Soporte

Para implementar estas variables en componentes específicos, consulta:
- Documentación del `SystemConfigService`
- Ejemplos en `SystemVariablesViewer`
- Casos de uso en la página de configuración vocal

---

**¡El sistema está listo para su implementación gradual en todos los componentes!** 🚀
