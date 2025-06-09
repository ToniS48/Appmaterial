# 🏗️ Arquitectura del Proyecto - README

Documentación completa de la arquitectura, patrones de diseño y estructura organizacional de AppMaterial.

## 🎯 Visión Arquitectónica

AppMaterial está diseñado siguiendo principios de **Clean Architecture** y **Domain Driven Design**, con separación clara entre capas y responsabilidades bien definidas.

## 📐 Arquitectura por Capas

### 1. **Capa de Presentación** (`src/components/`, `src/pages/`)
```
📱 UI Components
├── pages/              # Páginas principales
├── components/         # Componentes reutilizables
│   ├── common/        # Componentes comunes
│   ├── actividades/   # Componentes específicos
│   └── material/      # Componentes de material
└── hooks/             # Custom hooks para UI
```

### 2. **Capa de Aplicación** (`src/hooks/`, `src/services/`)
```
🔧 Application Layer
├── hooks/             # Lógica de UI y estado
├── services/          # Servicios de dominio
│   └── domain/       # Lógica de negocio pura
└── contexts/         # Contextos de React
```

### 3. **Capa de Infraestructura** (`src/repositories/`, `src/config/`)
```
🗄️ Infrastructure
├── repositories/      # Patrón Repository
├── config/           # Configuraciones
├── services/         # Servicios externos (Firebase)
└── utils/            # Utilidades y optimizaciones
```

## 🎨 Patrones de Diseño Implementados

### 1. **Repository Pattern**
Abstracción completa del acceso a datos:

```typescript
// BaseRepository.ts - Interfaz común
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: T): Promise<string>;
  update(id: string, entity: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
}

// MaterialRepository.ts - Implementación específica
class MaterialRepository implements IRepository<Material> {
  // Lógica específica de materiales
}
```

### 2. **Custom Hooks Pattern**
Separación de lógica UI y de negocio:

```typescript
// useActividadPageData.ts - Lógica de datos
export const useActividadPageData = (actividadId: string) => {
  // Manejo de datos y estado
}

// useActividadPageUI.ts - Lógica de UI
export const useActividadPageUI = () => {
  // Manejo de interfaz y interacciones
}
```

### 3. **Service Layer Pattern**
Encapsulación de lógica de dominio:

```typescript
// MaterialService.ts - Lógica de negocio
export class MaterialService {
  constructor(private materialRepo: MaterialRepository) {}
  
  async prestarMaterial(materialId: string, cantidad: number): Promise<void> {
    // Lógica de negocio pura
  }
}
```

## 📁 Estructura Organizacional Detallada

### **`src/components/`** - Componentes UI
```
components/
├── common/                    # Componentes reutilizables
│   ├── LoadingSpinner/       # Spinner de carga
│   ├── ErrorBoundary/        # Manejo de errores
│   └── FormComponents/       # Componentes de formulario
├── actividades/              # Componentes específicos
│   ├── ActividadCard/        # Tarjeta de actividad
│   ├── ActividadForm/        # Formulario de actividad
│   └── ParticipantesList/    # Lista de participantes
└── material/                 # Componentes de material
    ├── MaterialSelector/     # Selector de materiales
    ├── MaterialEditor/       # Editor de material
    └── MaterialCard/         # Tarjeta de material
```

### **`src/hooks/`** - Custom Hooks
```
hooks/
├── useActividadForm.ts       # Hook para formularios de actividad
├── useActividadPageData.ts   # Hook para datos de página
├── useActividadPageUI.ts     # Hook para UI de página
├── useMaterialSelector.ts    # Hook para selector de materiales
└── useOptimizedState.ts      # Hook para estado optimizado
```

### **`src/repositories/`** - Capa de Datos
```
repositories/
├── BaseRepository.ts         # Interfaz base
├── MaterialRepository.ts     # Repositorio de materiales
├── ActividadRepository.ts    # Repositorio de actividades
├── UsuarioRepository.ts      # Repositorio de usuarios
└── PrestamoRepository.ts     # Repositorio de préstamos
```

### **`src/services/`** - Servicios
```
services/
├── domain/                   # Servicios de dominio
│   ├── MaterialService.ts    # Lógica de materiales
│   ├── ActividadService.ts   # Lógica de actividades
│   └── PrestamoService.ts    # Lógica de préstamos
├── firebase/                 # Servicios Firebase
│   ├── authService.ts        # Autenticación
│   ├── firestoreService.ts   # Base de datos
│   └── storageService.ts     # Almacenamiento
└── notifications/            # Sistema de notificaciones
    └── notificationService.ts
```

### **`src/utils/`** - Utilidades y Optimizaciones
```
utils/
├── performanceUtils.ts       # Utilidades de rendimiento
├── eventOptimizer.ts         # Optimización de eventos
├── reactSchedulerOptimizer.ts # Optimización de React Scheduler
├── dateUtils.ts              # Utilidades de fechas
├── validationUtils.ts        # Utilidades de validación
└── testPerformance.js        # Testing de performance
```

## ⚡ Optimizaciones Implementadas

### 1. **Performance Optimizations**
- **React.memo** para componentes pesados
- **useMemo/useCallback** para cálculos costosos
- **Lazy loading** de rutas y componentes
- **Event debouncing** en formularios

### 2. **React Scheduler Optimizations**
```typescript
// reactSchedulerOptimizer.ts
export const optimizeScheduler = () => {
  // Configuración optimizada del scheduler
  // Prevención de violaciones de performance
}
```

### 3. **Event Optimization**
```typescript
// eventOptimizer.ts
export const optimizeEvents = () => {
  // Debouncing automático de eventos
  // Throttling de scroll y resize
}
```

## 🔄 Flujo de Datos

### 1. **Flujo Típico de Operación**
```
User Action → Hook → Service → Repository → Firebase
                ↓
Component ← Hook ← Service ← Repository ← Response
```

### 2. **Gestión de Estado**
- **Local State**: useState, useReducer
- **Global State**: Context API
- **Server State**: Custom hooks con React Query pattern
- **Form State**: React Hook Form

### 3. **Manejo de Errores**
```typescript
// Error Boundary para captura global
// Custom hooks para manejo específico
// Service layer para validaciones de negocio
```

## 🧪 Testing Architecture

### **Estructura de Testing**
```
tests/
├── core/                     # Tests de lógica de negocio
│   └── prestamos/           # Tests específicos de préstamos
├── debug/                   # Scripts de debugging
├── browser-tests/           # Tests de UI en navegador
├── scripts/                 # Scripts de automatización
└── utils/                   # Utilidades de testing
```

### **Estrategia de Testing**
- **Unit Tests**: Servicios y utilidades
- **Integration Tests**: Flujos completos
- **E2E Tests**: Casos de usuario completos
- **Performance Tests**: Optimizaciones y rendimiento

## 📚 Documentación Arquitectónica

### **Decisiones de Arquitectura**
Documentadas en `docs/reports/`:
- **REFACTORING_COMPLETADO.md** - Refactoring principal
- **OPTIMIZACIONES-COMPLETADAS.md** - Optimizaciones implementadas
- **ANALISIS-COMPONENTES-REUTILIZABLES.md** - Análisis de componentes

### **Patrones Implementados**
Documentados en `docs/solutions/`:
- **CORRECCION_ESTRUCTURA_PARTICIPANTES.md** - Patrón de participantes
- **SOLUCION_TIPO_SUBTIPO.md** - Patrón de tipos y subtipos

## 🚀 Roadmap Arquitectónico

### **Próximas Mejoras**
1. **Microfront-ends** para módulos independientes
2. **State Management** con Zustand/Redux Toolkit
3. **GraphQL** para optimización de queries
4. **Service Workers** para funcionalidad offline
5. **Module Federation** para escalabilidad

### **Principios de Evolución**
- **Backward Compatibility** en cambios
- **Progressive Enhancement** en features
- **Performance First** en nuevas implementaciones
- **Developer Experience** optimizada

---
*Documentación arquitectónica actualizada: Junio 2025*
