# 🏗️ Arquitectura y Desarrollo - AppMaterial

Este documento consolida toda la información de arquitectura, patrones de desarrollo y guías técnicas del proyecto.

## 🎯 Arquitectura General

### Patrón de Arquitectura Principal
```
📱 Frontend (React + TypeScript)
    ├── 🧩 UI Components (Chakra UI)
    ├── 🔗 Custom Hooks (Lógica reutilizable)
    ├── 🎛️ Services (Lógica de negocio)
    └── 📦 Repository Pattern (Abstracción de datos)
         └── 🔥 Firebase Firestore
```

### Principios Arquitecturales
1. **Separación de Responsabilidades**: UI separada de lógica de negocio
2. **Repository Pattern**: Abstracción completa de la capa de datos
3. **Custom Hooks**: Reutilización de lógica entre componentes
4. **Service Layer**: Centralización de reglas de negocio
5. **Modularidad**: Componentes independientes y reutilizables

## 📁 Estructura del Proyecto

```
src/
├── components/           # Componentes UI reutilizables
│   ├── common/          # Componentes comunes
│   ├── forms/           # Formularios especializados
│   ├── layout/          # Componentes de layout
│   └── ui/              # Componentes base de UI
├── pages/               # Páginas principales de la app
├── hooks/               # Custom hooks
├── services/            # Servicios de negocio
├── repositories/        # Abstracción de datos (Repository Pattern)
├── types/               # Definiciones de TypeScript
├── utils/               # Utilidades y helpers
├── contexts/            # Contextos de React
└── constants/           # Constantes de la aplicación
```

## 🔧 Patrones de Desarrollo Implementados

### 1. Repository Pattern

**Objetivo**: Abstraer el acceso a datos y facilitar testing

```typescript
// Ejemplo: MaterialRepository
export interface MaterialRepository {
  getAll(): Promise<Material[]>;
  getById(id: string): Promise<Material | null>;
  create(material: Omit<Material, 'id'>): Promise<string>;
  update(id: string, material: Partial<Material>): Promise<void>;
  delete(id: string): Promise<void>;
}

// Implementación Firebase
export class FirebaseMaterialRepository implements MaterialRepository {
  // Implementación específica de Firebase
}
```

**Beneficios**:
- ✅ Facilita cambios de base de datos
- ✅ Mejora testabilidad
- ✅ Abstrae complejidad de Firebase

### 2. Custom Hooks Pattern

**Objetivo**: Reutilizar lógica de estado entre componentes

```typescript
// Ejemplo: useActividadForm
export const useActividadForm = (actividadId?: string) => {
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Lógica del formulario...
  
  return {
    actividad,
    loading,
    handleSubmit,
    handleChange,
    resetForm
  };
};
```

**Beneficios**:
- ✅ Lógica reutilizable
- ✅ Componentes más simples
- ✅ Easier testing

### 3. Service Layer Pattern

**Objetivo**: Centralizar lógica de negocio

```typescript
// Ejemplo: MaterialService
export class MaterialService {
  constructor(private materialRepo: MaterialRepository) {}
  
  async calcularDisponibilidad(materialId: string): Promise<number> {
    // Lógica de negocio específica
  }
  
  async validarPrestamo(materialId: string, cantidad: number): Promise<boolean> {
    // Validaciones de negocio
  }
}
```

**Beneficios**:
- ✅ Lógica centralizada
- ✅ Fácil mantenimiento
- ✅ Reutilización entre componentes

## 🛠️ Stack Tecnológico

### Frontend
- **React 18**: Framework principal
- **TypeScript**: Tipado estático
- **Chakra UI**: Sistema de componentes
- **React Router**: Navegación
- **React Hook Form**: Gestión de formularios

### Backend/Servicios
- **Firebase Firestore**: Base de datos NoSQL
- **Firebase Auth**: Autenticación
- **Firebase Hosting**: Hosting estático
- **Open-Meteo API**: Datos meteorológicos

### Desarrollo
- **Vite**: Build tool
- **ESLint**: Linting
- **Prettier**: Formateo de código
- **Husky**: Git hooks

## 🔒 Gestión de Estado

### 1. Estado Local con useState/useReducer
```typescript
// Para estado simple de componentes
const [loading, setLoading] = useState(false);

// Para estado complejo
const [state, dispatch] = useReducer(materialReducer, initialState);
```

### 2. Estado Global con Context API
```typescript
// Contexto de autenticación
export const AuthContext = createContext<AuthContextType | null>(null);

// Provider del contexto
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // ...
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 3. Estado de Servidor con Custom Hooks
```typescript
// Hook para datos del servidor
export const useMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch data
  }, []);
  
  return { materials, loading, refetch };
};
```

## 🔐 Autenticación y Autorización

### Sistema de Roles
```typescript
export type UserRole = 'admin' | 'responsable' | 'participante';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}
```

### Protección de Rutas
```typescript
// Componente de protección
export const ProtectedRoute: React.FC<{
  children: ReactNode;
  requiredRole?: UserRole;
}> = ({ children, requiredRole }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && !hasPermission(user.role, requiredRole)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
};
```

## 📊 Gestión de Datos con Firebase

### Estructura de Datos
```typescript
// Colecciones principales
materials/         # Materiales
activities/        # Actividades
loans/            # Préstamos
users/            # Usuarios
weatherHistory/   # Historial meteorológico
```

### Optimización de Queries
```typescript
// Query optimizada con índices
const materials = await materialsRef
  .where('estado', '==', 'disponible')
  .where('tipo', '==', 'cuerda')
  .orderBy('nombre')
  .limit(20)
  .get();
```

### Gestión de Índices
- Índices automáticos para queries simples
- Índices compuestos para queries complejas
- Configuración en `firestore.indexes.json`

## 🧪 Estrategia de Testing

### 1. Testing de Componentes
```typescript
// Test con React Testing Library
import { render, screen } from '@testing-library/react';
import { MaterialCard } from './MaterialCard';

test('renders material name', () => {
  const material = { id: '1', nombre: 'Cuerda 10m' };
  render(<MaterialCard material={material} />);
  
  expect(screen.getByText('Cuerda 10m')).toBeInTheDocument();
});
```

### 2. Testing de Custom Hooks
```typescript
// Test de hook con renderHook
import { renderHook } from '@testing-library/react';
import { useMaterials } from './useMaterials';

test('loads materials correctly', async () => {
  const { result } = renderHook(() => useMaterials());
  
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
    expect(result.current.materials).toHaveLength(3);
  });
});
```

### 3. Testing de Servicios
```typescript
// Test de servicio con mocks
import { MaterialService } from './MaterialService';

jest.mock('./MaterialRepository');

test('calculates availability correctly', async () => {
  const mockRepo = new MockMaterialRepository();
  const service = new MaterialService(mockRepo);
  
  const availability = await service.calcularDisponibilidad('material-1');
  expect(availability).toBe(5);
});
```

## 🚀 Mejores Prácticas de Desarrollo

### 1. Convenciones de Código
- **Naming**: camelCase para variables, PascalCase para componentes
- **Files**: kebab-case para archivos, PascalCase para componentes
- **Imports**: Absolute imports con barrel exports

### 2. Estructura de Componentes
```typescript
// Estructura estándar de componente
interface Props {
  // Props tipadas
}

export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks al inicio
  const [state, setState] = useState();
  
  // Funciones de manejo
  const handleClick = useCallback(() => {
    // Handler logic
  }, []);
  
  // Render
  return (
    <Box>
      {/* JSX */}
    </Box>
  );
};
```

### 3. Error Handling
```typescript
// Error boundaries para componentes
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

### 4. Performance Optimization
```typescript
// Memoización de componentes costosos
export const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return heavyComputation(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});
```

## 🔧 Herramientas de Desarrollo

### 1. Scripts de Desarrollo
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "jest",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  }
}
```

### 2. Configuración de ESLint
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'react-app',
    '@typescript-eslint/recommended'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
```

### 3. Configuración de TypeScript
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "@/components/*": ["components/*"]
    }
  }
}
```

## 📚 Recursos de Documentación

### APIs y Referencias
- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [React Hook Form](https://react-hook-form.com/)
- [Chakra UI Components](https://chakra-ui.com/docs/components)
- [Open-Meteo API](https://open-meteo.com/en/docs)

### Guías Internas
- [Debugging Guide](./04-SOLUCIONES-Y-DEBUGGING.md)
- [Component Guide](./03-COMPONENTES-Y-FUNCIONALIDADES.md)
- [Testing Guide](./07-TESTING-Y-CALIDAD.md)

---

**Responsable**: Equipo de Arquitectura  
**Última Actualización**: 20 de junio de 2025
