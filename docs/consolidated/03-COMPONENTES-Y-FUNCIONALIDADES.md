# 🧩 Componentes y Funcionalidades - AppMaterial

Este documento consolida toda la información sobre los componentes principales y funcionalidades del sistema.

## 🎯 Funcionalidades Principales

### 1. 📦 Sistema de Gestión de Materiales
- **Inventario completo** de materiales de escalada
- **Estados automáticos** (disponible, prestado, mantenimiento, etc.)
- **Tracking de disponibilidad** en tiempo real
- **Categorización** por tipo (cuerdas, anclajes, varios)
- **Alertas de mantenimiento** y revisiones

### 2. 🏃‍♂️ Sistema de Actividades
- **Planificación de actividades** con gestión de materiales
- **Integración meteorológica** para mejor planificación
- **Gestión de participantes** y responsabilidades
- **Estados de actividad** (planificada, en curso, finalizada)
- **Vinculación automática** con préstamos de material

### 3. 🔄 Sistema de Préstamos
- **Proceso digitalizado** completo de préstamos
- **Tracking automático** de materiales prestados
- **Vinculación con actividades** específicas
- **Gestión de devoluciones** con incidencias
- **Alertas automáticas** para devoluciones pendientes

### 4. 🌤️ Sistema Meteorológico
- **Integración con Open-Meteo API**
- **Pronósticos de 7 días** para planificación
- **Historial meteorológico** para análisis
- **Alertas meteorológicas** para actividades

## 🏗️ Componentes UI Principales

### 1. MaterialSelector
**Propósito**: Selección inteligente de materiales para actividades

```typescript
interface MaterialSelectorProps {
  onMaterialsChange: (materials: MaterialField[]) => void;
  initialMaterials?: MaterialField[];
  actividadTipo?: string;
}
```

**Características**:
- ✅ Filtrado por tipo, estado y disponibilidad
- ✅ Búsqueda en tiempo real
- ✅ Validación de disponibilidad
- ✅ Selección múltiple con cantidades
- ✅ UI responsive y accesible

**Funcionalidades**:
- Filtros avanzados (tipo, estado, disponibilidad)
- Búsqueda por nombre o código
- Validación automática de cantidades
- Preview de materiales seleccionados

### 2. ActividadForm
**Propósito**: Formulario completo para crear/editar actividades

```typescript
interface ActividadFormProps {
  actividad?: Actividad;
  onSubmit: (actividad: Actividad) => void;
  onCancel: () => void;
}
```

**Características**:
- ✅ Validación completa con React Hook Form
- ✅ Integración con MaterialSelector
- ✅ Predicción meteorológica integrada
- ✅ Gestión de participantes
- ✅ Estados y responsabilidades

**Secciones**:
1. **Información básica**: Nombre, descripción, ubicación
2. **Fechas y horarios**: Inicio, fin, duración
3. **Materiales**: Selección y cantidades
4. **Participantes**: Gestión de lista de participantes
5. **Meteorología**: Consulta automática del clima

### 3. MaterialCard
**Propósito**: Tarjeta de presentación de material

```typescript
interface MaterialCardProps {
  material: Material;
  onEdit?: (material: Material) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}
```

**Características**:
- ✅ Información completa del material
- ✅ Estados visuales claros
- ✅ Acciones contextuales
- ✅ Responsive design
- ✅ Badges de estado y tipo

**Información mostrada**:
- Nombre y código del material
- Tipo y categoría
- Estado actual
- Disponibilidad
- Próxima revisión
- Acciones (editar, eliminar, prestar)

### 4. ActividadCard
**Propósito**: Tarjeta de presentación de actividad

```typescript
interface ActividadCardProps {
  actividad: Actividad;
  onEdit?: (actividad: Actividad) => void;
  onDelete?: (id: string) => void;
  showWeather?: boolean;
}
```

**Características**:
- ✅ Información resumida de la actividad
- ✅ Estado visual claro
- ✅ Información meteorológica
- ✅ Lista de participantes
- ✅ Acciones rápidas

### 5. PrestamoCard
**Propósito**: Gestión visual de préstamos

```typescript
interface PrestamoCardProps {
  prestamo: Prestamo;
  onReturn?: (prestamo: Prestamo) => void;
  onEdit?: (prestamo: Prestamo) => void;
  showDetails?: boolean;
}
```

**Características**:
- ✅ Estado del préstamo claro
- ✅ Información de fechas
- ✅ Lista de materiales
- ✅ Acciones de devolución
- ✅ Alertas de retraso

### 6. WeatherWidget
**Propósito**: Información meteorológica integrada

```typescript
interface WeatherWidgetProps {
  location: string;
  date?: Date;
  showForecast?: boolean;
  compact?: boolean;
}
```

**Características**:
- ✅ Información actual del clima
- ✅ Pronóstico de 7 días
- ✅ Iconos meteorológicos
- ✅ Alertas de condiciones adversas
- ✅ Historial disponible

## 📱 Páginas Principales

### 1. Dashboard
**Ruta**: `/dashboard`

**Componentes**:
- Resumen de materiales por estado
- Próximas actividades
- Préstamos activos
- Alertas de mantenimiento
- Widget meteorológico

**Funcionalidades**:
- Vista general del sistema
- Acceso rápido a funciones principales
- Métricas en tiempo real
- Navegación intuitiva

### 2. Materiales
**Ruta**: `/materiales`

**Componentes**:
- Lista de materiales con filtros
- Modal de creación/edición
- Acciones masivas
- Búsqueda avanzada

**Funcionalidades**:
- CRUD completo de materiales
- Filtrado por múltiples criterios
- Importación/exportación
- Historial de cambios

### 3. Actividades
**Ruta**: `/actividades`

**Componentes**:
- Lista de actividades
- Filtros por estado y fecha
- Modal de creación/edición
- Vista de calendario

**Funcionalidades**:
- Planificación de actividades
- Gestión de materiales por actividad
- Integración meteorológica
- Gestión de participantes

### 4. Préstamos
**Ruta**: `/prestamos`

**Componentes**:
- Lista de préstamos activos
- Filtros por estado y usuario
- Modal de devolución
- Histórico de préstamos

**Funcionalidades**:
- Gestión completa de préstamos
- Devoluciones con incidencias
- Alertas de retrasos
- Reportes de préstamos

### 5. Meteorología
**Ruta**: `/meteorologia`

**Componentes**:
- Widget meteorológico completo
- Pronóstico extendido
- Historial meteorológico
- Configuración de alertas

**Funcionalidades**:
- Consulta de clima actual
- Pronósticos para planificación
- Historial para análisis
- Alertas personalizadas

## 🎨 Sistema de Design

### Tema y Colores
```typescript
const theme = {
  colors: {
    primary: '#3182CE',    // Azul principal
    secondary: '#38A169',  // Verde secundario
    warning: '#D69E2E',    // Amarillo advertencia
    error: '#E53E3E',      // Rojo error
    success: '#38A169',    // Verde éxito
  }
};
```

### Componentes Base
- **Box**: Contenedor base
- **Stack**: Layout vertical/horizontal
- **Grid**: Layout de rejilla
- **Flex**: Layout flexible
- **Button**: Botones con variantes
- **Input**: Campos de entrada
- **Select**: Selección de opciones
- **Modal**: Ventanas modales
- **Toast**: Notificaciones

### Responsive Design
```typescript
const breakpoints = {
  sm: '30em',    // 480px
  md: '48em',    // 768px
  lg: '62em',    // 992px
  xl: '80em',    // 1280px
};
```

## 🔧 Hooks Personalizados

### 1. useAuth
**Propósito**: Gestión de autenticación

```typescript
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const login = async (email: string, password: string) => {
    // Lógica de login
  };
  
  const logout = async () => {
    // Lógica de logout
  };
  
  return { user, loading, login, logout };
};
```

### 2. useMaterials
**Propósito**: Gestión de materiales

```typescript
const useMaterials = (filters?: MaterialFilters) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  
  const addMaterial = async (material: CreateMaterialData) => {
    // Lógica para añadir material
  };
  
  const updateMaterial = async (id: string, updates: Partial<Material>) => {
    // Lógica para actualizar material
  };
  
  return { materials, loading, addMaterial, updateMaterial };
};
```

### 3. useWeather
**Propósito**: Datos meteorológicos

```typescript
const useWeather = (location: string) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  
  const refreshWeather = async () => {
    // Actualizar datos meteorológicos
  };
  
  return { weather, forecast, loading, refreshWeather };
};
```

### 4. useLocalStorage
**Propósito**: Persistencia local

```typescript
const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });
  
  const setStoredValue = useCallback((newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  }, [key]);
  
  return [value, setStoredValue] as const;
};
```

## 🚀 Funcionalidades Avanzadas

### 1. Búsqueda y Filtrado
- **Búsqueda en tiempo real** con debouncing
- **Filtros múltiples** combinables
- **Guardado de filtros** favoritos
- **Búsqueda semántica** por descripción

### 2. Notificaciones
- **Toast notifications** para acciones
- **Alertas del sistema** para eventos importantes
- **Notificaciones push** (futuro)
- **Email notifications** para recordatorios

### 3. Exportación de Datos
- **Excel export** para reportes
- **PDF generation** para documentos
- **CSV export** para análisis
- **Print optimization** para documentos

### 4. Responsive y Accesibilidad
- **Mobile-first design**
- **Touch-friendly interactions**
- **Keyboard navigation**
- **Screen reader support**
- **High contrast mode**

## 📊 Flujos de Usuario

### Flujo de Préstamo de Material
1. Usuario accede a `/prestamos`
2. Hace clic en "Nuevo Préstamo"
3. Selecciona materiales con MaterialSelector
4. Especifica fechas y responsable
5. Opcional: vincula con actividad
6. Confirma préstamo
7. Sistema actualiza disponibilidad
8. Genera registro de préstamo

### Flujo de Creación de Actividad
1. Usuario accede a `/actividades`
2. Hace clic en "Nueva Actividad"
3. Completa información básica
4. Selecciona fechas
5. Añade materiales necesarios
6. Gestiona lista de participantes
7. Revisa información meteorológica
8. Guarda actividad
9. Sistema reserva materiales

### Flujo de Devolución
1. Usuario accede a préstamo activo
2. Hace clic en "Devolver"
3. Revisa lista de materiales
4. Marca estado de cada material
5. Añade observaciones si hay incidencias
6. Confirma devolución
7. Sistema actualiza disponibilidad
8. Cierra préstamo

---

**Responsable**: Equipo de Frontend  
**Última Actualización**: 20 de junio de 2025
