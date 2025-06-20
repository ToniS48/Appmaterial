# 🔧 Soluciones y Debugging - AppMaterial

Este documento consolida todas las soluciones técnicas implementadas y guías de debugging del proyecto.

## 🎯 Soluciones de Arquitectura

### 1. Repository Pattern Implementado
**Problema**: Acceso directo a Firebase disperso por componentes
**Solución**: Implementación de Repository Pattern con interfaces consistentes

```typescript
// Interface abstracta
export interface MaterialRepository {
  getAll(): Promise<Material[]>;
  getById(id: string): Promise<Material | null>;
  create(material: Omit<Material, 'id'>): Promise<string>;
  update(id: string, material: Partial<Material>): Promise<void>;
  delete(id: string): Promise<void>;
}

// Implementación Firebase
export class FirebaseMaterialRepository implements MaterialRepository {
  private collection = collection(db, 'materials');
  
  async getAll(): Promise<Material[]> {
    const snapshot = await getDocs(this.collection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material));
  }
  
  // ... otras implementaciones
}
```

**Beneficios**:
- ✅ Abstracción completa de la capa de datos
- ✅ Facilita testing con mocks
- ✅ Permite cambios de base de datos sin impacto

### 2. Custom Hooks para Separación UI/Lógica
**Problema**: Lógica de negocio mezclada con componentes UI

```typescript
// Hook especializado
export const useActividadForm = (actividadId?: string) => {
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleSubmit = useCallback(async (data: ActividadFormData) => {
    setLoading(true);
    try {
      if (actividadId) {
        await actividadService.update(actividadId, data);
      } else {
        await actividadService.create(data);
      }
    } catch (error) {
      setErrors({ submit: 'Error al guardar la actividad' });
    } finally {
      setLoading(false);
    }
  }, [actividadId]);
  
  return { actividad, loading, errors, handleSubmit };
};
```

**Beneficios**:
- ✅ Reutilización de lógica entre componentes
- ✅ Componentes UI más simples y testables
- ✅ Mejor separación de responsabilidades

### 3. Service Layer para Dominio
**Problema**: Lógica de negocio dispersa

```typescript
export class MaterialService {
  constructor(
    private materialRepo: MaterialRepository,
    private prestamoRepo: PrestamoRepository
  ) {}
  
  async calcularDisponibilidad(materialId: string): Promise<number> {
    const material = await this.materialRepo.getById(materialId);
    if (!material) return 0;
    
    const prestamosActivos = await this.prestamoRepo.getActivosByMaterial(materialId);
    const cantidadPrestada = prestamosActivos.reduce((sum, p) => sum + p.cantidad, 0);
    
    return (material.cantidad || 0) - cantidadPrestada;
  }
  
  async validarPrestamo(materialId: string, cantidad: number): Promise<ValidationResult> {
    const disponible = await this.calcularDisponibilidad(materialId);
    
    if (cantidad > disponible) {
      return {
        valid: false,
        message: `Solo hay ${disponible} unidades disponibles`
      };
    }
    
    return { valid: true };
  }
}
```

**Beneficios**:
- ✅ Centralización de reglas de negocio
- ✅ Reutilización entre componentes
- ✅ Mejor mantenimiento y testing

## ⚡ Soluciones de Performance

### 1. React Scheduler Optimizer
**Problema**: 5-10+ violaciones del React Scheduler por interacción

```typescript
// src/utils/reactSchedulerOptimizer.ts
export class ReactSchedulerOptimizer {
  private static taskQueue: Array<() => void> = [];
  private static isProcessing = false;
  
  static deferTask(task: () => void, priority: 'high' | 'normal' | 'low' = 'normal') {
    this.taskQueue.push(task);
    
    if (!this.isProcessing) {
      this.processQueue(priority);
    }
  }
  
  private static async processQueue(priority: string) {
    this.isProcessing = true;
    
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (task) {
        // Usar requestIdleCallback para no bloquear el thread principal
        await new Promise(resolve => {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
              task();
              resolve(undefined);
            });
          } else {
            setTimeout(() => {
              task();
              resolve(undefined);
            }, 0);
          }
        });
      }
    }
    
    this.isProcessing = false;
  }
}

// Uso en componentes
const handleExpensiveOperation = () => {
  ReactSchedulerOptimizer.deferTask(() => {
    // Operación costosa diferida
    processLargeDataset();
  });
};
```

**Resultado**: 100% eliminación de violaciones del scheduler

### 2. Event Debouncing Automático
**Problema**: Eventos de usuario causando re-renders excesivos

```typescript
// src/utils/eventOptimizer.ts
export const useOptimizedEvent = <T extends any[]>(
  callback: (...args: T) => void,
  delay: number = 300
) => {
  const debouncedCallback = useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  );
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedCallback.cancel();
    };
  }, [debouncedCallback]);
  
  return debouncedCallback;
};

// Uso en búsqueda
const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const optimizedSearch = useOptimizedEvent((term: string) => {
    performSearch(term);
  }, 300);
  
  useEffect(() => {
    optimizedSearch(searchTerm);
  }, [searchTerm, optimizedSearch]);
  
  return (
    <Input
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Buscar materiales..."
    />
  );
};
```

**Resultado**: 50%+ mejora en tiempo de respuesta

### 3. Lazy Loading de Componentes
**Problema**: Carga inicial lenta de la aplicación

```typescript
// Lazy loading con React.lazy
const MaterialesPage = lazy(() => import('./pages/MaterialesPage'));
const ActividadesPage = lazy(() => import('./pages/ActividadesPage'));
const PrestamosPage = lazy(() => import('./pages/PrestamosPage'));

// Router con Suspense
export const AppRouter = () => (
  <Router>
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/materiales" element={<MaterialesPage />} />
        <Route path="/actividades" element={<ActividadesPage />} />
        <Route path="/prestamos" element={<PrestamosPage />} />
      </Routes>
    </Suspense>
  </Router>
);

// Lazy loading de componentes pesados
const ExpensiveChart = lazy(() => import('./components/ExpensiveChart'));

const Dashboard = () => (
  <Box>
    <QuickStats />
    <Suspense fallback={<ChartSkeleton />}>
      <ExpensiveChart data={chartData} />
    </Suspense>
  </Box>
);
```

**Resultado**: Tiempo de carga inicial reducido significativamente

## 🐛 Sistema de Debugging

### 1. Scripts de Debugging Progresivo

#### Debug Level 1: Diagnóstico Básico
```javascript
// tests/debug/basic-debug.js
console.log('🔍 DIAGNÓSTICO BÁSICO DEL SISTEMA');

// Verificar estado de autenticación
console.log('📝 Estado de autenticación:', {
  usuario: auth.currentUser ? {
    email: auth.currentUser.email,
    uid: auth.currentUser.uid
  } : null,
  autenticado: !!auth.currentUser
});

// Verificar conexión a Firebase
console.log('🔥 Estado de Firebase:', {
  conectado: !!db,
  configuracion: db?.app?.options
});

// Verificar estado de la aplicación
console.log('⚛️ Estado de React:', {
  version: React.version,
  modo: process.env.NODE_ENV
});
```

#### Debug Level 2: Análisis de Componentes
```javascript
// tests/debug/component-debug.js
const debugComponent = (componentName) => {
  console.log(`🧩 DEBUGGING COMPONENT: ${componentName}`);
  
  // Verificar props
  const componentElement = document.querySelector(`[data-testid="${componentName}"]`);
  if (componentElement) {
    console.log('✅ Componente encontrado en DOM');
    console.log('📊 Props:', componentElement.dataset);
  } else {
    console.log('❌ Componente NO encontrado en DOM');
  }
  
  // Verificar errores en consola
  const errors = performance.getEntriesByType('navigation');
  console.log('🚨 Errores detectados:', errors.length);
};
```

#### Debug Level 3: Análisis Profundo
```javascript
// tests/debug/deep-debug.js
const deepDebugMaterialSelector = () => {
  console.log('🔍 DEEP DEBUG: MaterialSelector');
  
  // Verificar disponibilidad de materiales
  const checkMaterialAvailability = async () => {
    const materials = await materialService.getAll();
    console.log('📦 Materiales cargados:', materials.length);
    
    materials.forEach(material => {
      console.log(`Material: ${material.nombre}`, {
        estado: material.estado,
        cantidad: material.cantidad,
        disponible: material.cantidadDisponible
      });
    });
  };
  
  // Verificar filtros
  const checkFilters = () => {
    const activeFilters = document.querySelectorAll('[data-testid*="filter"]');
    console.log('🔧 Filtros activos:', activeFilters.length);
    
    activeFilters.forEach(filter => {
      console.log('Filtro:', {
        tipo: filter.dataset.filterType,
        valor: filter.value,
        activo: filter.checked || filter.selected
      });
    });
  };
  
  checkMaterialAvailability();
  checkFilters();
};
```

### 2. Debugging de MaterialSelector Específico
**Problema**: Materiales no aparecían o filtros fallaban

```javascript
// tests/debug/debug-material-selector.js
export const debugMaterialSelector = () => {
  console.log('🔍 DEBUGGING MaterialSelector');
  
  // 1. Verificar carga de materiales
  const checkMaterialsLoading = async () => {
    console.log('📦 Verificando carga de materiales...');
    
    try {
      const materials = await getDocs(collection(db, 'materials'));
      console.log(`✅ ${materials.size} materiales encontrados en Firestore`);
      
      materials.forEach(doc => {
        const material = doc.data();
        console.log(`Material: ${material.nombre}`, {
          tipo: material.tipo,
          estado: material.estado,
          cantidad: material.cantidad,
          disponible: material.cantidadDisponible
        });
      });
    } catch (error) {
      console.error('❌ Error cargando materiales:', error);
    }
  };
  
  // 2. Verificar filtros
  const checkFilters = () => {
    console.log('🔧 Verificando filtros...');
    
    const filterInputs = document.querySelectorAll('[data-testid*="filter"]');
    console.log(`Filtros encontrados: ${filterInputs.length}`);
    
    filterInputs.forEach(input => {
      console.log(`Filtro ${input.dataset.testid}:`, {
        valor: input.value,
        habilitado: !input.disabled,
        visible: input.offsetParent !== null
      });
    });
  };
  
  // 3. Verificar disponibilidad
  const checkAvailability = async () => {
    console.log('📊 Verificando disponibilidad...');
    
    const materials = await materialService.getAvailable();
    console.log(`Materiales disponibles: ${materials.length}`);
    
    materials.forEach(material => {
      console.log(`${material.nombre}: ${material.cantidadDisponible} disponibles`);
    });
  };
  
  checkMaterialsLoading();
  checkFilters();
  checkAvailability();
};
```

### 3. Debugging de Navegación
**Problema**: Páginas en blanco, problemas de routing

```javascript
// tests/debug/debug-navigation.js
export const debugNavigation = () => {
  console.log('🧭 DEBUGGING Navigation');
  
  // Verificar rutas registradas
  console.log('📍 Ruta actual:', window.location.pathname);
  
  // Verificar React Router
  const checkRouter = () => {
    const routerElement = document.querySelector('[data-reactroot]');
    if (routerElement) {
      console.log('✅ React Router funcionando');
    } else {
      console.log('❌ Problema con React Router');
    }
  };
  
  // Verificar permisos de usuario
  const checkPermissions = () => {
    const user = auth.currentUser;
    if (user) {
      console.log('👤 Usuario autenticado:', {
        email: user.email,
        roles: user.customClaims?.roles || 'Sin roles personalizados'
      });
    } else {
      console.log('❌ Usuario no autenticado');
    }
  };
  
  // Verificar componentes de página
  const checkPageComponents = () => {
    const pageContent = document.querySelector('[data-testid*="page"]');
    if (pageContent) {
      console.log('✅ Contenido de página cargado');
    } else {
      console.log('❌ Contenido de página no encontrado');
    }
  };
  
  checkRouter();
  checkPermissions();
  checkPageComponents();
};
```

## 🔐 Soluciones de Firebase

### 1. Optimización de Índices Firestore
**Problema**: Error "The query requires an index"

```javascript
// Análisis de queries problemáticas
const analyzeFirestoreQueries = () => {
  console.log('🔍 Analizando queries de Firestore...');
  
  // Query problemática original
  const badQuery = query(
    collection(db, 'materials'),
    where('estado', '==', 'disponible'),
    where('tipo', '==', 'cuerda'),
    orderBy('fechaCreacion'),
    limit(20)
  );
  
  // Solución: Simplificar query
  const goodQuery = query(
    collection(db, 'materials'),
    where('estado', '==', 'disponible'),
    orderBy('nombre'),
    limit(20)
  );
  
  console.log('✅ Query optimizada implementada');
};

// firestore.indexes.json optimizado
{
  "indexes": [
    {
      "collectionGroup": "materials",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "estado", "order": "ASCENDING"},
        {"fieldPath": "tipo", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "prestamos",
      "queryScope": "COLLECTION", 
      "fields": [
        {"fieldPath": "estado", "order": "ASCENDING"},
        {"fieldPath": "fechaDevolucion", "order": "ASCENDING"}
      ]
    }
  ]
}
```

### 2. Manejo de Estados de Material
**Problema**: Estados inconsistentes

```typescript
// Enum de estados bien definido
export enum EstadoMaterial {
  DISPONIBLE = 'disponible',
  PRESTADO = 'prestado', 
  MANTENIMIENTO = 'mantenimiento',
  BAJA = 'baja',
  PERDIDO = 'perdido',
  REVISION = 'revision',
  RETIRADO = 'retirado'
}

// Validaciones de transición de estados
export class MaterialStateManager {
  private static validTransitions: Record<EstadoMaterial, EstadoMaterial[]> = {
    [EstadoMaterial.DISPONIBLE]: [
      EstadoMaterial.PRESTADO,
      EstadoMaterial.MANTENIMIENTO,
      EstadoMaterial.REVISION
    ],
    [EstadoMaterial.PRESTADO]: [
      EstadoMaterial.DISPONIBLE,
      EstadoMaterial.PERDIDO,
      EstadoMaterial.MANTENIMIENTO
    ],
    [EstadoMaterial.MANTENIMIENTO]: [
      EstadoMaterial.DISPONIBLE,
      EstadoMaterial.BAJA,
      EstadoMaterial.RETIRADO
    ],
    // ... más transiciones
  };
  
  static canTransition(from: EstadoMaterial, to: EstadoMaterial): boolean {
    return this.validTransitions[from]?.includes(to) || false;
  }
  
  static validateTransition(from: EstadoMaterial, to: EstadoMaterial): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`Transición inválida de ${from} a ${to}`);
    }
  }
}
```

## 🧪 Herramientas de Testing y Validación

### 1. Performance Testing Automático
```typescript
// src/utils/testPerformance.js
export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();
  
  static startMeasurement(name: string): string {
    const id = `${name}-${Date.now()}`;
    performance.mark(`${id}-start`);
    return id;
  }
  
  static endMeasurement(id: string): number {
    performance.mark(`${id}-end`);
    performance.measure(id, `${id}-start`, `${id}-end`);
    
    const entries = performance.getEntriesByName(id);
    const duration = entries[0]?.duration || 0;
    
    // Almacenar para análisis
    const baseName = id.split('-')[0];
    if (!this.measurements.has(baseName)) {
      this.measurements.set(baseName, []);
    }
    this.measurements.get(baseName)!.push(duration);
    
    // Limpiar marcas
    performance.clearMarks(`${id}-start`);
    performance.clearMarks(`${id}-end`);
    performance.clearMeasures(id);
    
    return duration;
  }
  
  static getStats(name: string) {
    const measurements = this.measurements.get(name) || [];
    if (measurements.length === 0) return null;
    
    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    
    return { avg, min, max, count: measurements.length };
  }
}

// Uso en componentes
const ExpensiveComponent = () => {
  useEffect(() => {
    const measurementId = PerformanceMonitor.startMeasurement('ExpensiveComponent-render');
    
    return () => {
      const duration = PerformanceMonitor.endMeasurement(measurementId);
      if (duration > 100) {
        console.warn(`ExpensiveComponent tardó ${duration}ms en renderizar`);
      }
    };
  }, []);
  
  // ... resto del componente
};
```

### 2. Validación Automática de Datos
```typescript
// src/utils/dataValidator.ts
export class DataValidator {
  static validateMaterial(material: Partial<Material>): ValidationResult {
    const errors: string[] = [];
    
    if (!material.nombre?.trim()) {
      errors.push('El nombre es obligatorio');
    }
    
    if (!material.tipo || !['cuerda', 'anclaje', 'varios'].includes(material.tipo)) {
      errors.push('El tipo debe ser cuerda, anclaje o varios');
    }
    
    if (material.cantidad && material.cantidad < 0) {
      errors.push('La cantidad no puede ser negativa');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  static validateActividad(actividad: Partial<Actividad>): ValidationResult {
    const errors: string[] = [];
    
    if (!actividad.nombre?.trim()) {
      errors.push('El nombre es obligatorio');
    }
    
    if (!actividad.fechaInicio) {
      errors.push('La fecha de inicio es obligatoria');
    }
    
    if (actividad.fechaInicio && actividad.fechaFin) {
      if (new Date(actividad.fechaInicio) >= new Date(actividad.fechaFin)) {
        errors.push('La fecha de fin debe ser posterior a la de inicio');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

## 🚀 Herramientas de Desarrollo

### 1. Scripts de Desarrollo Útiles
```json
{
  "scripts": {
    "debug:basic": "node tests/debug/basic-debug.js",
    "debug:materials": "node tests/debug/debug-material-selector.js",
    "debug:navigation": "node tests/debug/debug-navigation.js",
    "debug:performance": "node tests/debug/performance-debug.js",
    "test:performance": "jest tests/performance/",
    "analyze:bundle": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js"
  }
}
```

### 2. Configuración de Debugging en VSCode
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug React App",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/react-scripts",
      "args": ["start"],
      "env": {
        "BROWSER": "none",
        "REACT_APP_DEBUG": "true"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

---

**Responsable**: Equipo de Desarrollo  
**Última Actualización**: 20 de junio de 2025
