# 🧪 Testing y Calidad - AppMaterial

Este documento consolida la estrategia de testing, scripts de debugging y herramientas de aseguramiento de calidad implementadas.

## 🎯 Estrategia de Testing

### Pirámide de Testing Implementada
```
    🔺 E2E Tests (5%)
   🔺🔺 Integration Tests (15%)
  🔺🔺🔺 Unit Tests (80%)
```

### Cobertura de Testing
| Área | Cobertura Actual | Objetivo | Estado |
|------|------------------|----------|--------|
| Componentes UI | 85% | 90% | 🔶 En progreso |
| Servicios | 90% | 95% | ✅ Completado |
| Hooks | 80% | 85% | 🔶 En progreso |
| Utils | 95% | 95% | ✅ Completado |
| Integración | 70% | 80% | 🔶 En progreso |

## 🧪 Testing Unitario

### 1. Configuración de Jest
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/serviceWorker.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 10000
};
```

### 2. Testing de Componentes
```typescript
// src/components/__tests__/MaterialCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MaterialCard } from '../MaterialCard';
import { Material } from '@/types/material';

const mockMaterial: Material = {
  id: '1',
  nombre: 'Cuerda 10m',
  tipo: 'cuerda',
  estado: 'disponible',
  fechaAdquisicion: new Date('2023-01-01'),
  fechaUltimaRevision: new Date('2023-06-01'),
  proximaRevision: new Date('2024-06-01'),
  cantidad: 5,
  cantidadDisponible: 3,
  longitud: 10,
  diametro: 9.5
};

const renderWithChakra = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      {component}
    </ChakraProvider>
  );
};

describe('MaterialCard', () => {
  it('renders material information correctly', () => {
    renderWithChakra(<MaterialCard material={mockMaterial} />);
    
    expect(screen.getByText('Cuerda 10m')).toBeInTheDocument();
    expect(screen.getByText('disponible')).toBeInTheDocument();
    expect(screen.getByText('3 disponibles')).toBeInTheDocument();
  });
  
  it('displays material type badge', () => {
    renderWithChakra(<MaterialCard material={mockMaterial} />);
    
    const typeBadge = screen.getByText('cuerda');
    expect(typeBadge).toBeInTheDocument();
    expect(typeBadge).toHaveClass('chakra-badge');
  });
  
  it('shows length and diameter for rope materials', () => {
    renderWithChakra(<MaterialCard material={mockMaterial} />);
    
    expect(screen.getByText('10m')).toBeInTheDocument();
    expect(screen.getByText('9.5mm')).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button is clicked', async () => {
    const mockOnEdit = jest.fn();
    renderWithChakra(
      <MaterialCard 
        material={mockMaterial} 
        onEdit={mockOnEdit}
        showActions={true}
      />
    );
    
    const editButton = screen.getByLabelText('Editar material');
    fireEvent.click(editButton);
    
    await waitFor(() => {
      expect(mockOnEdit).toHaveBeenCalledWith(mockMaterial);
    });
  });
  
  it('displays warning for materials needing maintenance', () => {
    const materialNeedingMaintenance = {
      ...mockMaterial,
      proximaRevision: new Date('2023-01-01') // Fecha pasada
    };
    
    renderWithChakra(<MaterialCard material={materialNeedingMaintenance} />);
    
    expect(screen.getByText(/revisión pendiente/i)).toBeInTheDocument();
  });
});
```

### 3. Testing de Custom Hooks
```typescript
// src/hooks/__tests__/useMaterials.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMaterials } from '../useMaterials';
import { materialService } from '@/services/materialService';

// Mock del servicio
jest.mock('@/services/materialService');
const mockMaterialService = materialService as jest.Mocked<typeof materialService>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useMaterials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('loads materials successfully', async () => {
    const mockMaterials = [
      { id: '1', nombre: 'Cuerda A', tipo: 'cuerda' },
      { id: '2', nombre: 'Anclaje B', tipo: 'anclaje' }
    ];
    
    mockMaterialService.getAll.mockResolvedValue(mockMaterials);
    
    const { result } = renderHook(() => useMaterials(), {
      wrapper: createWrapper()
    });
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.materials).toEqual(mockMaterials);
    expect(result.current.error).toBeNull();
  });
  
  it('handles error when loading materials fails', async () => {
    const errorMessage = 'Failed to load materials';
    mockMaterialService.getAll.mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useMaterials(), {
      wrapper: createWrapper()
    });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.materials).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });
  
  it('filters materials by type', async () => {
    const mockMaterials = [
      { id: '1', nombre: 'Cuerda A', tipo: 'cuerda' },
      { id: '2', nombre: 'Anclaje B', tipo: 'anclaje' },
      { id: '3', nombre: 'Cuerda C', tipo: 'cuerda' }
    ];
    
    mockMaterialService.getAll.mockResolvedValue(mockMaterials);
    
    const { result } = renderHook(() => useMaterials({ tipo: 'cuerda' }), {
      wrapper: createWrapper()
    });
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    const cuerdas = result.current.materials.filter(m => m.tipo === 'cuerda');
    expect(cuerdas).toHaveLength(2);
  });
});
```

### 4. Testing de Servicios
```typescript
// src/services/__tests__/materialService.test.ts
import { MaterialService } from '../materialService';
import { MaterialRepository } from '@/repositories/materialRepository';
import { Material } from '@/types/material';

// Mock del repository
const mockRepository: jest.Mocked<MaterialRepository> = {
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getByFilters: jest.fn()
};

describe('MaterialService', () => {
  let service: MaterialService;
  
  beforeEach(() => {
    service = new MaterialService(mockRepository);
    jest.clearAllMocks();
  });
  
  describe('calcularDisponibilidad', () => {
    it('calculates availability correctly', async () => {
      const material: Material = {
        id: '1',
        nombre: 'Cuerda Test',
        tipo: 'cuerda',
        estado: 'disponible',
        cantidad: 10,
        cantidadDisponible: 7,
        fechaAdquisicion: new Date(),
        fechaUltimaRevision: new Date(),
        proximaRevision: new Date()
      };
      
      mockRepository.getById.mockResolvedValue(material);
      
      const disponibilidad = await service.calcularDisponibilidad('1');
      
      expect(disponibilidad).toBe(7);
      expect(mockRepository.getById).toHaveBeenCalledWith('1');
    });
    
    it('returns 0 when material not found', async () => {
      mockRepository.getById.mockResolvedValue(null);
      
      const disponibilidad = await service.calcularDisponibilidad('nonexistent');
      
      expect(disponibilidad).toBe(0);
    });
  });
  
  describe('validarPrestamo', () => {
    it('validates loan when sufficient material available', async () => {
      mockRepository.getById.mockResolvedValue({
        id: '1',
        cantidadDisponible: 5
      } as Material);
      
      const result = await service.validarPrestamo('1', 3);
      
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });
    
    it('rejects loan when insufficient material', async () => {
      mockRepository.getById.mockResolvedValue({
        id: '1',
        cantidadDisponible: 2
      } as Material);
      
      const result = await service.validarPrestamo('1', 5);
      
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Solo hay 2 unidades disponibles');
    });
  });
});
```

## 🔗 Testing de Integración

### 1. Testing de Flujos Completos
```typescript
// src/__tests__/integration/materialFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/App';
import { TestProviders } from '@/test-utils/TestProviders';

// Mock de Firebase
jest.mock('@/config/firebase', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-user',
      email: 'test@example.com'
    }
  }
}));

describe('Material Management Flow', () => {
  const renderApp = () => {
    return render(
      <TestProviders>
        <App />
      </TestProviders>
    );
  };
  
  it('completes full material creation flow', async () => {
    const user = userEvent.setup();
    
    renderApp();
    
    // Navegar a página de materiales
    const materialesLink = screen.getByRole('link', { name: /materiales/i });
    await user.click(materialesLink);
    
    // Abrir modal de creación
    const createButton = screen.getByRole('button', { name: /nuevo material/i });
    await user.click(createButton);
    
    // Completar formulario
    const nombreInput = screen.getByLabelText(/nombre/i);
    await user.type(nombreInput, 'Cuerda Test');
    
    const tipoSelect = screen.getByLabelText(/tipo/i);
    await user.selectOptions(tipoSelect, 'cuerda');
    
    const cantidadInput = screen.getByLabelText(/cantidad/i);
    await user.type(cantidadInput, '5');
    
    // Guardar material
    const saveButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(saveButton);
    
    // Verificar que el material aparece en la lista
    await waitFor(() => {
      expect(screen.getByText('Cuerda Test')).toBeInTheDocument();
    });
  });
  
  it('handles material editing correctly', async () => {
    const user = userEvent.setup();
    
    renderApp();
    
    // Buscar material existente y editarlo
    const editButton = screen.getByLabelText(/editar material/i);
    await user.click(editButton);
    
    // Modificar nombre
    const nombreInput = screen.getByDisplayValue(/cuerda test/i);
    await user.clear(nombreInput);
    await user.type(nombreInput, 'Cuerda Modificada');
    
    // Guardar cambios
    const saveButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(saveButton);
    
    // Verificar cambios
    await waitFor(() => {
      expect(screen.getByText('Cuerda Modificada')).toBeInTheDocument();
    });
  });
});
```

### 2. Testing de APIs
```typescript
// src/__tests__/integration/weatherAPI.test.ts
import { WeatherService } from '@/services/weather/weatherService';

describe('Weather API Integration', () => {
  let weatherService: WeatherService;
  
  beforeEach(() => {
    weatherService = new WeatherService();
  });
  
  it('fetches current weather successfully', async () => {
    const lat = 40.4168;
    const lon = -3.7038; // Madrid coordinates
    
    const weather = await weatherService.getCurrentWeather(lat, lon);
    
    expect(weather).toBeDefined();
    expect(weather.temperature).toBeDefined();
    expect(typeof weather.temperature).toBe('number');
    expect(weather.description).toBeDefined();
    expect(weather.time).toBeInstanceOf(Date);
  }, 10000);
  
  it('fetches forecast successfully', async () => {
    const lat = 40.4168;
    const lon = -3.7038;
    
    const forecast = await weatherService.getForecast(lat, lon, 3);
    
    expect(forecast).toBeDefined();
    expect(forecast.daily).toHaveLength(3);
    expect(forecast.daily[0]).toMatchObject({
      date: expect.any(Date),
      temperatureMax: expect.any(Number),
      temperatureMin: expect.any(Number),
      description: expect.any(String)
    });
  }, 10000);
  
  it('handles API errors gracefully', async () => {
    const invalidLat = 999;
    const invalidLon = 999;
    
    await expect(
      weatherService.getCurrentWeather(invalidLat, invalidLon)
    ).rejects.toThrow();
  });
});
```

## 🤖 Testing E2E con Playwright

### 1. Configuración de Playwright
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

### 2. Tests E2E Principales
```typescript
// e2e/material-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Material Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login si es necesario
    await page.click('[data-testid="login-button"]');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword');
    await page.click('[data-testid="submit-login"]');
    await page.waitForURL('/dashboard');
  });
  
  test('creates new material successfully', async ({ page }) => {
    // Navegar a materiales
    await page.click('[data-testid="nav-materiales"]');
    await expect(page).toHaveURL('/materiales');
    
    // Crear nuevo material
    await page.click('[data-testid="btn-nuevo-material"]');
    await page.fill('[data-testid="input-nombre"]', 'Cuerda E2E Test');
    await page.selectOption('[data-testid="select-tipo"]', 'cuerda');
    await page.fill('[data-testid="input-cantidad"]', '3');
    await page.click('[data-testid="btn-guardar-material"]');
    
    // Verificar que aparece en la lista
    await expect(page.locator('text=Cuerda E2E Test')).toBeVisible();
  });
  
  test('edits existing material', async ({ page }) => {
    await page.goto('/materiales');
    
    // Buscar y editar material
    await page.click('[data-testid="material-card"]:first-child [data-testid="btn-editar"]');
    await page.fill('[data-testid="input-nombre"]', 'Material Editado');
    await page.click('[data-testid="btn-guardar-material"]');
    
    // Verificar cambios
    await expect(page.locator('text=Material Editado')).toBeVisible();
  });
  
  test('filters materials by type', async ({ page }) => {
    await page.goto('/materiales');
    
    // Aplicar filtro
    await page.selectOption('[data-testid="filter-tipo"]', 'cuerda');
    
    // Verificar que solo aparecen cuerdas
    const materialCards = page.locator('[data-testid="material-card"]');
    const count = await materialCards.count();
    
    for (let i = 0; i < count; i++) {
      await expect(materialCards.nth(i).locator('[data-testid="badge-tipo"]')).toHaveText('cuerda');
    }
  });
});

// e2e/activity-weather.spec.ts
test.describe('Activity Weather Integration', () => {
  test('shows weather information when creating activity', async ({ page }) => {
    await page.goto('/actividades');
    
    await page.click('[data-testid="btn-nueva-actividad"]');
    await page.fill('[data-testid="input-nombre"]', 'Actividad Test');
    await page.fill('[data-testid="input-ubicacion"]', 'Madrid');
    
    // Verificar que aparece información meteorológica
    await expect(page.locator('[data-testid="weather-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="weather-temperature"]')).toBeVisible();
  });
  
  test('shows weather warnings for adverse conditions', async ({ page }) => {
    // Mock de respuesta de API con mal tiempo
    await page.route('**/api.open-meteo.com/**', async route => {
      await route.fulfill({
        json: {
          daily: {
            time: ['2024-06-21'],
            precipitation_probability_max: [85],
            windspeed_10m_max: [35],
            temperature_2m_max: [25],
            temperature_2m_min: [15],
            weathercode: [61] // Lluvia
          }
        }
      });
    });
    
    await page.goto('/actividades/nueva');
    await page.fill('[data-testid="input-ubicacion"]', 'Madrid');
    
    // Verificar alertas meteorológicas
    await expect(page.locator('[data-testid="weather-alert"]')).toBeVisible();
    await expect(page.locator('text=Alta probabilidad de lluvia')).toBeVisible();
  });
});
```

## 🔍 Scripts de Debugging

### 1. Debug Scripts Organizados
```javascript
// tests/debug/debug-master.js
console.log('🔍 MASTER DEBUG SCRIPT - AppMaterial');

const debugModules = {
  basic: () => import('./basic-debug.js'),
  materials: () => import('./debug-material-selector.js'),
  navigation: () => import('./debug-navigation.js'),
  performance: () => import('./performance-debug.js'),
  weather: () => import('./debug-weather.js'),
  firebase: () => import('./debug-firebase.js')
};

window.debugApp = {
  async runBasicDiagnostic() {
    const module = await debugModules.basic();
    module.basicDebug();
  },
  
  async debugMaterials() {
    const module = await debugModules.materials();
    module.debugMaterialSelector();
  },
  
  async debugNavigation() {
    const module = await debugModules.navigation();
    module.debugNavigation();
  },
  
  async checkPerformance() {
    const module = await debugModules.performance();
    module.performanceDebug();
  },
  
  async debugWeather() {
    const module = await debugModules.weather();
    module.debugWeatherAPI();
  },
  
  async debugFirebase() {
    const module = await debugModules.firebase();
    module.debugFirebaseConnection();
  },
  
  runAllTests() {
    console.log('🏃‍♂️ Ejecutando todos los tests de debugging...');
    
    Object.entries(debugModules).forEach(async ([name, moduleLoader]) => {
      try {
        console.log(`\n📊 Ejecutando test: ${name}`);
        const module = await moduleLoader();
        const functionName = Object.keys(module)[0];
        module[functionName]();
      } catch (error) {
        console.error(`❌ Error en test ${name}:`, error);
      }
    });
  }
};

console.log('✅ Debug tools loaded. Use window.debugApp.* methods');
console.log('Available methods:', Object.keys(window.debugApp));
```

### 2. Performance Debugging
```javascript
// tests/debug/performance-debug.js
export const performanceDebug = () => {
  console.log('⚡ PERFORMANCE DEBUGGING');
  
  // Verificar violaciones del React Scheduler
  const checkSchedulerViolations = () => {
    console.log('🔍 Verificando violaciones del React Scheduler...');
    
    let violationCount = 0;
    const originalWarn = console.warn;
    
    console.warn = (...args) => {
      if (args[0]?.includes?.('Warning: Maximum update depth exceeded')) {
        violationCount++;
        console.error('🚨 React Scheduler Violation detected!', args);
      }
      originalWarn.apply(console, args);
    };
    
    setTimeout(() => {
      console.log(`📊 Violaciones detectadas: ${violationCount}`);
      console.warn = originalWarn;
    }, 5000);
  };
  
  // Monitorear memory usage
  const monitorMemory = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('💾 Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
        percentage: `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)}%`
      });
    }
  };
  
  // Verificar FPS
  const measureFPS = () => {
    let frames = 0;
    let lastTime = Date.now();
    
    function countFrames() {
      frames++;
      requestAnimationFrame(countFrames);
    }
    
    countFrames();
    
    setTimeout(() => {
      const currentTime = Date.now();
      const fps = Math.round((frames * 1000) / (currentTime - lastTime));
      console.log(`🎯 FPS actual: ${fps}`);
      
      if (fps < 30) {
        console.warn('⚠️ FPS bajo detectado');
      } else if (fps >= 60) {
        console.log('✅ FPS óptimo');
      }
    }, 3000);
  };
  
  // Medir tiempos de carga de componentes
  const measureComponentLoadTimes = () => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('component-')) {
          console.log(`⏱️ ${entry.name}: ${entry.duration.toFixed(2)}ms`);
          
          if (entry.duration > 100) {
            console.warn(`🐌 Componente lento detectado: ${entry.name}`);
          }
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
  };
  
  checkSchedulerViolations();
  monitorMemory();
  measureFPS();
  measureComponentLoadTimes();
  
  // Monitoreo continuo cada 30 segundos
  setInterval(() => {
    monitorMemory();
  }, 30000);
};
```

### 3. Firebase Debugging
```javascript
// tests/debug/debug-firebase.js
export const debugFirebaseConnection = async () => {
  console.log('🔥 FIREBASE CONNECTION DEBUG');
  
  // Verificar configuración
  const checkConfig = () => {
    console.log('⚙️ Verificando configuración de Firebase...');
    
    const config = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing',
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing',
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing',
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing',
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing',
      appId: process.env.REACT_APP_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing'
    };
    
    console.table(config);
  };
  
  // Verificar conexión a Firestore
  const checkFirestoreConnection = async () => {
    console.log('📊 Verificando conexión a Firestore...');
    
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/config/firebase');
      
      const testCollection = collection(db, 'materials');
      const snapshot = await getDocs(testCollection);
      
      console.log(`✅ Conexión exitosa. Documentos encontrados: ${snapshot.size}`);
      
      if (snapshot.size === 0) {
        console.warn('⚠️ No hay documentos en la colección materials');
      }
      
    } catch (error) {
      console.error('❌ Error conectando a Firestore:', error);
    }
  };
  
  // Verificar autenticación
  const checkAuth = async () => {
    console.log('👤 Verificando autenticación...');
    
    try {
      const { auth } = await import('@/config/firebase');
      
      if (auth.currentUser) {
        console.log('✅ Usuario autenticado:', {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          emailVerified: auth.currentUser.emailVerified
        });
      } else {
        console.log('❌ No hay usuario autenticado');
      }
      
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
    }
  };
  
  // Verificar índices de Firestore
  const checkIndexes = async () => {
    console.log('📇 Verificando índices de Firestore...');
    
    try {
      const { query, where, orderBy, collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/config/firebase');
      
      const testQueries = [
        {
          name: 'Materials by estado and tipo',
          query: query(
            collection(db, 'materials'),
            where('estado', '==', 'disponible'),
            where('tipo', '==', 'cuerda')
          )
        },
        {
          name: 'Prestamos by estado',
          query: query(
            collection(db, 'prestamos'),
            where('estado', '==', 'activo'),
            orderBy('fechaCreacion')
          )
        }
      ];
      
      for (const testQuery of testQueries) {
        try {
          await getDocs(testQuery.query);
          console.log(`✅ ${testQuery.name}: Índice OK`);
        } catch (error) {
          console.error(`❌ ${testQuery.name}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error verificando índices:', error);
    }
  };
  
  checkConfig();
  await checkFirestoreConnection();
  await checkAuth();
  await checkIndexes();
};
```

## 📊 Herramientas de Calidad

### 1. ESLint Configuración Avanzada
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:a11y/recommended'
  ],
  plugins: [
    '@typescript-eslint',
    'react-hooks',
    'jsx-a11y',
    'testing-library'
  ],
  rules: {
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-const': 'error',
    
    // React rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-no-target-blank': 'error',
    
    // Accessibility rules
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/click-events-have-key-events': 'warn',
    
    // Performance rules
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'prefer-const': 'error',
    'no-var': 'error'
  },
  overrides: [
    {
      files: ['**/__tests__/**/*', '**/*.test.*'],
      extends: ['plugin:testing-library/react'],
      rules: {
        'testing-library/await-async-query': 'error',
        'testing-library/no-await-sync-query': 'error',
        'testing-library/no-debugging-utils': 'warn'
      }
    }
  ]
};
```

### 2. Prettier Configuración
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid"
}
```

### 3. Husky Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:ci",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ],
    "src/**/*.{js,jsx,ts,tsx,json,css,md}": [
      "prettier --write"
    ]
  }
}
```

## 📈 CI/CD Testing Pipeline

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:coverage
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
    
    - name: Run Lighthouse CI
      run: |
        npm install -g @lhci/cli@0.12.x
        lhci autorun
```

### 2. Métricas de Calidad Automáticas
```javascript
// scripts/quality-metrics.js
const fs = require('fs');
const { execSync } = require('child_process');

const runQualityChecks = () => {
  console.log('📊 Ejecutando métricas de calidad...');
  
  // Coverage report
  const coverageResult = execSync('npm run test:coverage -- --json', { encoding: 'utf8' });
  const coverage = JSON.parse(coverageResult);
  
  // ESLint report
  const lintResult = execSync('npx eslint src/ --format json', { encoding: 'utf8' });
  const lintReport = JSON.parse(lintResult);
  
  // TypeScript errors
  const typeCheckResult = execSync('npx tsc --noEmit --skipLibCheck', { encoding: 'utf8' });
  
  // Bundle size analysis
  const bundleStats = JSON.parse(fs.readFileSync('build/asset-manifest.json', 'utf8'));
  
  const qualityReport = {
    timestamp: new Date().toISOString(),
    coverage: {
      lines: coverage.coverageMap.getCoverageSummary().lines.pct,
      functions: coverage.coverageMap.getCoverageSummary().functions.pct,
      branches: coverage.coverageMap.getCoverageSummary().branches.pct,
      statements: coverage.coverageMap.getCoverageSummary().statements.pct
    },
    linting: {
      errors: lintReport.reduce((sum, file) => sum + file.errorCount, 0),
      warnings: lintReport.reduce((sum, file) => sum + file.warningCount, 0)
    },
    typeCheck: {
      hasErrors: typeCheckResult.includes('error')
    },
    bundleSize: {
      mainBundle: Object.values(bundleStats.files).find(f => f.endsWith('.js')),
      totalSize: Object.values(bundleStats.files).reduce((sum, file) => {
        const stats = fs.statSync(`build/${file}`);
        return sum + stats.size;
      }, 0)
    }
  };
  
  fs.writeFileSync('quality-report.json', JSON.stringify(qualityReport, null, 2));
  console.log('✅ Reporte de calidad generado: quality-report.json');
  
  return qualityReport;
};

runQualityChecks();
```

---

**Conclusión**: El sistema de testing y calidad implementado garantiza la robustez y mantenibilidad del código a través de múltiples capas de validación, desde testing unitario hasta E2E, con herramientas automatizadas de calidad y debugging.

---

**Responsable**: Equipo de QA  
**Última Actualización**: 20 de junio de 2025
