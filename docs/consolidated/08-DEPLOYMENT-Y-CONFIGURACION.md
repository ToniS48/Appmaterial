# 📦 Deployment y Configuración - AppMaterial

Este documento consolida toda la información sobre configuración de Firebase, proceso de despliegue y variables de entorno.

## 🎯 Arquitectura de Deployment

### Entornos de Deployment
```
🏗️ Development (Local)
   ├── Firebase Emulators
   ├── Local API calls
   └── Development Database

🧪 Staging (Firebase Hosting)
   ├── Firebase Preview Channels
   ├── Staging Database
   └── API Testing

🚀 Production (Firebase Hosting)
   ├── Firebase Production
   ├── Production Database
   └── CDN + Cache Optimization
```

### Flujo de Deployment
```
📝 Code Changes
   ↓
🔍 Quality Checks (ESLint, Tests)
   ↓
🏗️ Build Process (Vite + TypeScript)
   ↓
🚀 Deploy to Firebase Hosting
   ↓
✅ Health Checks & Monitoring
```

## 🔥 Configuración de Firebase

### 1. Firebase Project Setup
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login a Firebase
firebase login

# Inicializar proyecto
firebase init

# Configurar proyectos múltiples
firebase use --add
```

### 2. Firebase Configuration
```typescript
// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  if (!auth.config.emulator) {
    connectAuthEmulator(auth, 'http://localhost:9099');
  }
  
  if (!(db as any)._delegate._databaseId.projectId.includes('localhost')) {
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
  
  if (!(functions as any)._region.includes('localhost')) {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  }
}

export default app;
```

### 3. Firestore Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Materials - authenticated users can read, admins can write
    match /materials/{materialId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         request.auth.token.role == 'responsable');
    }
    
    // Activities - authenticated users can read, creators and admins can write
    match /activities/{activityId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.createdBy == request.auth.uid ||
         request.auth.token.role == 'admin' ||
         request.auth.token.role == 'responsable');
    }
    
    // Loans - users can read their own loans, admins can read all
    match /loans/{loanId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid ||
         request.auth.token.role == 'admin' ||
         request.auth.token.role == 'responsable');
      allow write: if request.auth != null && 
        (request.auth.token.role == 'admin' || 
         request.auth.token.role == 'responsable');
    }
    
    // Weather history - read only for authenticated users
    match /weatherHistory/{documentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
    
    // System logs - admin only
    match /systemLogs/{logId} {
      allow read, write: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
  }
}
```

### 4. Firestore Indexes
```json
{
  "indexes": [
    {
      "collectionGroup": "materials",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "estado", "order": "ASCENDING"},
        {"fieldPath": "tipo", "order": "ASCENDING"},
        {"fieldPath": "fechaCreacion", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "materials",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "estado", "order": "ASCENDING"},
        {"fieldPath": "proximaRevision", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "activities",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "estado", "order": "ASCENDING"},
        {"fieldPath": "fechaInicio", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "activities",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "createdBy", "order": "ASCENDING"},
        {"fieldPath": "fechaCreacion", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "loans",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "estado", "order": "ASCENDING"},
        {"fieldPath": "fechaDevolucionPrevista", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "loans",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "fechaCreacion", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "weatherHistory",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "location.lat", "order": "ASCENDING"},
        {"fieldPath": "location.lon", "order": "ASCENDING"},
        {"fieldPath": "date", "order": "ASCENDING"}
      ]
    }
  ],
  "fieldOverrides": []
}
```

## 🌍 Variables de Entorno

### 1. Environment Files Structure
```bash
# Estructura de archivos de entorno
.env                    # Variables base
.env.local             # Variables locales (no commitear)
.env.development       # Variables de desarrollo
.env.staging          # Variables de staging
.env.production       # Variables de producción
```

### 2. Environment Variables
```bash
# .env.example
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# API Configuration
REACT_APP_WEATHER_API_URL=https://api.open-meteo.com/v1
REACT_APP_API_TIMEOUT=10000

# App Configuration
REACT_APP_VERSION=$npm_package_version
REACT_APP_BUILD_DATE=$BUILD_DATE
REACT_APP_ENVIRONMENT=development

# Feature Flags
REACT_APP_ENABLE_WEATHER=true
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG=true

# Performance Monitoring
REACT_APP_SENTRY_DSN=your_sentry_dsn_here
REACT_APP_ENABLE_PERFORMANCE_MONITORING=false
```

### 3. Environment Configuration Service
```typescript
// src/config/environment.ts
interface EnvironmentConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  api: {
    weatherUrl: string;
    timeout: number;
  };
  app: {
    version: string;
    buildDate: string;
    environment: 'development' | 'staging' | 'production';
  };
  features: {
    enableWeather: boolean;
    enableAnalytics: boolean;
    enableDebug: boolean;
  };
  monitoring: {
    sentryDsn?: string;
    enablePerformanceMonitoring: boolean;
  };
}

class EnvironmentService {
  private config: EnvironmentConfig;
  
  constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }
  
  private loadConfiguration(): EnvironmentConfig {
    return {
      firebase: {
        apiKey: this.getRequiredEnvVar('REACT_APP_FIREBASE_API_KEY'),
        authDomain: this.getRequiredEnvVar('REACT_APP_FIREBASE_AUTH_DOMAIN'),
        projectId: this.getRequiredEnvVar('REACT_APP_FIREBASE_PROJECT_ID'),
        storageBucket: this.getRequiredEnvVar('REACT_APP_FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: this.getRequiredEnvVar('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
        appId: this.getRequiredEnvVar('REACT_APP_FIREBASE_APP_ID'),
        measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
      },
      api: {
        weatherUrl: process.env.REACT_APP_WEATHER_API_URL || 'https://api.open-meteo.com/v1',
        timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000')
      },
      app: {
        version: process.env.REACT_APP_VERSION || '1.0.0',
        buildDate: process.env.REACT_APP_BUILD_DATE || new Date().toISOString(),
        environment: (process.env.REACT_APP_ENVIRONMENT as any) || 'development'
      },
      features: {
        enableWeather: process.env.REACT_APP_ENABLE_WEATHER === 'true',
        enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
        enableDebug: process.env.REACT_APP_ENABLE_DEBUG === 'true'
      },
      monitoring: {
        sentryDsn: process.env.REACT_APP_SENTRY_DSN,
        enablePerformanceMonitoring: process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true'
      }
    };
  }
  
  private getRequiredEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
  }
  
  private validateConfiguration(): void {
    // Validar Firebase config
    const { firebase } = this.config;
    if (!firebase.apiKey || !firebase.projectId) {
      throw new Error('Firebase configuration is incomplete');
    }
    
    // Validar environment
    if (!['development', 'staging', 'production'].includes(this.config.app.environment)) {
      throw new Error('Invalid environment specified');
    }
    
    console.log('✅ Environment configuration loaded successfully');
    console.log('Environment:', this.config.app.environment);
    console.log('Version:', this.config.app.version);
  }
  
  get firebase() { return this.config.firebase; }
  get api() { return this.config.api; }
  get app() { return this.config.app; }
  get features() { return this.config.features; }
  get monitoring() { return this.config.monitoring; }
  
  isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }
  
  isProduction(): boolean {
    return this.config.app.environment === 'production';
  }
  
  isStaging(): boolean {
    return this.config.app.environment === 'staging';
  }
}

export const env = new EnvironmentService();
```

## 🚀 Build Process

### 1. Build Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'build',
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          ui: ['@chakra-ui/react', '@emotion/react', '@emotion/styled']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173
  }
});
```

### 2. Build Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:staging": "cross-env REACT_APP_ENVIRONMENT=staging npm run build",
    "build:production": "cross-env REACT_APP_ENVIRONMENT=production npm run build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "deploy:staging": "npm run build:staging && firebase deploy --only hosting:staging",
    "deploy:production": "npm run build:production && firebase deploy --only hosting:production",
    "emulators:start": "firebase emulators:start",
    "emulators:export": "firebase emulators:export ./backup",
    "emulators:import": "firebase emulators:start --import=./backup"
  }
}
```

### 3. Pre-build Validation
```javascript
// scripts/pre-build-validation.js
const fs = require('fs');
const path = require('path');

const validateEnvironment = () => {
  console.log('🔍 Validating environment configuration...');
  
  const requiredVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
};

const validateBuildArtifacts = () => {
  console.log('🔍 Validating build artifacts...');
  
  const buildDir = path.join(__dirname, '..', 'build');
  
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not found');
    process.exit(1);
  }
  
  const requiredFiles = ['index.html', 'asset-manifest.json'];
  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(buildDir, file))
  );
  
  if (missingFiles.length > 0) {
    console.error('❌ Missing required build files:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    process.exit(1);
  }
  
  console.log('✅ Build artifacts validation passed');
};

const generateBuildInfo = () => {
  const buildInfo = {
    version: process.env.npm_package_version || '1.0.0',
    buildDate: new Date().toISOString(),
    gitCommit: process.env.GITHUB_SHA || 'unknown',
    environment: process.env.REACT_APP_ENVIRONMENT || 'development',
    nodeVersion: process.version
  };
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'build', 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );
  
  console.log('✅ Build info generated');
};

// Execute validations
validateEnvironment();
validateBuildArtifacts();
generateBuildInfo();
```

## 🔄 Deployment Pipeline

### 1. Firebase Hosting Configuration
```json
{
  "hosting": [
    {
      "target": "production",
      "public": "build",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ],
      "headers": [
        {
          "source": "/service-worker.js",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "no-cache"
            }
          ]
        },
        {
          "source": "**/*.@(js|css)",
          "headers": [
            {
              "key": "Cache-Control",
              "value": "max-age=31536000"
            }
          ]
        }
      ]
    },
    {
      "target": "staging",
      "public": "build",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  ]
}
```

### 2. GitHub Actions Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase

on:
  push:
    branches:
      - main
      - develop

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Run linting
      run: npm run lint
    
    - name: Build application
      run: |
        if [[ $GITHUB_REF == 'refs/heads/main' ]]; then
          npm run build:production
        else
          npm run build:staging
        fi
      env:
        REACT_APP_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
        REACT_APP_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
        REACT_APP_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
        REACT_APP_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
        REACT_APP_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
        REACT_APP_FIREBASE_MEASUREMENT_ID: ${{ secrets.FIREBASE_MEASUREMENT_ID }}
    
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        channelId: live
        projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
        target: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
    
    - name: Run post-deployment tests
      run: |
        npm install -g lighthouse
        lighthouse https://your-app-url.web.app --output json --output-path lighthouse-report.json
        
    - name: Upload lighthouse report
      uses: actions/upload-artifact@v3
      with:
        name: lighthouse-report
        path: lighthouse-report.json
```

### 3. Deploy Script
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Starting deployment process..."

# Check if environment argument is provided
if [ -z "$1" ]; then
    echo "❌ Please specify environment: staging or production"
    exit 1
fi

ENVIRONMENT=$1

echo "📋 Deploying to: $ENVIRONMENT"

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."
npm run lint
npm run type-check
npm run test:coverage

# Build application
echo "🏗️ Building application for $ENVIRONMENT..."
if [ "$ENVIRONMENT" = "production" ]; then
    npm run build:production
else
    npm run build:staging
fi

# Validate build
echo "✅ Validating build..."
node scripts/pre-build-validation.js

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting:$ENVIRONMENT

# Run post-deployment checks
echo "🔍 Running post-deployment checks..."
if [ "$ENVIRONMENT" = "production" ]; then
    URL="https://your-production-url.web.app"
else
    URL="https://your-staging-url.web.app"
fi

# Health check
echo "🏥 Running health check..."
curl -f $URL/health || {
    echo "❌ Health check failed"
    exit 1
}

echo "✅ Deployment completed successfully!"
echo "🌐 Application URL: $URL"
```

## 📊 Monitoring y Logging

### 1. Performance Monitoring
```typescript
// src/services/monitoring.ts
import { env } from '@/config/environment';

class MonitoringService {
  private static instance: MonitoringService;
  
  constructor() {
    if (env.monitoring.enablePerformanceMonitoring) {
      this.initializePerformanceMonitoring();
    }
    
    if (env.monitoring.sentryDsn) {
      this.initializeSentry();
    }
  }
  
  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }
  
  private initializePerformanceMonitoring(): void {
    // Web Vitals monitoring
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(this.sendToAnalytics);
      getFID(this.sendToAnalytics);
      getFCP(this.sendToAnalytics);
      getLCP(this.sendToAnalytics);
      getTTFB(this.sendToAnalytics);
    });
  }
  
  private initializeSentry(): void {
    import('@sentry/react').then(Sentry => {
      Sentry.init({
        dsn: env.monitoring.sentryDsn,
        environment: env.app.environment,
        integrations: [
          new Sentry.BrowserTracing()
        ],
        tracesSampleRate: env.isProduction() ? 0.1 : 1.0
      });
    });
  }
  
  private sendToAnalytics = (metric: any): void => {
    console.log('Performance metric:', metric);
    
    // Send to Firebase Analytics
    if (env.features.enableAnalytics) {
      import('firebase/analytics').then(({ logEvent, getAnalytics }) => {
        const analytics = getAnalytics();
        logEvent(analytics, 'web_vital', {
          name: metric.name,
          value: metric.value,
          delta: metric.delta
        });
      });
    }
  };
  
  logError(error: Error, context?: Record<string, any>): void {
    console.error('Application error:', error, context);
    
    if (env.monitoring.sentryDsn) {
      import('@sentry/react').then(Sentry => {
        Sentry.captureException(error, {
          tags: context
        });
      });
    }
  }
  
  logEvent(eventName: string, properties?: Record<string, any>): void {
    console.log('Event:', eventName, properties);
    
    if (env.features.enableAnalytics) {
      import('firebase/analytics').then(({ logEvent, getAnalytics }) => {
        const analytics = getAnalytics();
        logEvent(analytics, eventName, properties);
      });
    }
  }
}

export const monitoring = MonitoringService.getInstance();
```

### 2. Health Check Endpoint
```typescript
// src/utils/healthCheck.ts
export const performHealthCheck = async (): Promise<HealthCheckResult> => {
  const checks: HealthCheck[] = [
    {
      name: 'Firebase Connection',
      check: async () => {
        const { db } = await import('@/config/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        
        try {
          await getDoc(doc(db, 'health', 'check'));
          return { status: 'healthy' };
        } catch (error) {
          return { status: 'unhealthy', error: error.message };
        }
      }
    },
    {
      name: 'Weather API',
      check: async () => {
        try {
          const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40&longitude=-3&current_weather=true');
          if (response.ok) {
            return { status: 'healthy' };
          } else {
            return { status: 'unhealthy', error: `HTTP ${response.status}` };
          }
        } catch (error) {
          return { status: 'unhealthy', error: error.message };
        }
      }
    },
    {
      name: 'Local Storage',
      check: async () => {
        try {
          const testKey = 'health-check-test';
          localStorage.setItem(testKey, 'test');
          localStorage.removeItem(testKey);
          return { status: 'healthy' };
        } catch (error) {
          return { status: 'unhealthy', error: 'Local storage not available' };
        }
      }
    }
  ];
  
  const results = await Promise.all(
    checks.map(async ({ name, check }) => {
      try {
        const result = await check();
        return { name, ...result };
      } catch (error) {
        return { name, status: 'unhealthy', error: error.message };
      }
    })
  );
  
  const allHealthy = results.every(result => result.status === 'healthy');
  
  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: results,
    version: env.app.version,
    environment: env.app.environment
  };
};

interface HealthCheck {
  name: string;
  check: () => Promise<{ status: 'healthy' | 'unhealthy'; error?: string }>;
}

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: Array<{ name: string; status: 'healthy' | 'unhealthy'; error?: string }>;
  version: string;
  environment: string;
}
```

## 🔧 Maintenance Scripts

### 1. Database Maintenance
```javascript
// scripts/db-maintenance.js
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const cleanupOldWeatherData = async () => {
  console.log('🧹 Cleaning up old weather data...');
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago
  
  const oldWeatherQuery = db.collection('weatherHistory')
    .where('date', '<', cutoffDate);
  
  const snapshot = await oldWeatherQuery.get();
  
  if (snapshot.empty) {
    console.log('No old weather data to clean up');
    return;
  }
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Deleted ${snapshot.size} old weather records`);
};

const updateMaterialStats = async () => {
  console.log('📊 Updating material statistics...');
  
  const materialsSnapshot = await db.collection('materials').get();
  const stats = {
    total: materialsSnapshot.size,
    available: 0,
    inUse: 0,
    maintenance: 0,
    byType: {}
  };
  
  materialsSnapshot.docs.forEach(doc => {
    const material = doc.data();
    
    if (material.estado === 'disponible') stats.available++;
    else if (material.estado === 'prestado') stats.inUse++;
    else if (material.estado === 'mantenimiento') stats.maintenance++;
    
    stats.byType[material.tipo] = (stats.byType[material.tipo] || 0) + 1;
  });
  
  await db.collection('systemStats').doc('materials').set({
    ...stats,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log('Material statistics updated:', stats);
};

const runMaintenance = async () => {
  try {
    await cleanupOldWeatherData();
    await updateMaterialStats();
    console.log('✅ Maintenance completed successfully');
  } catch (error) {
    console.error('❌ Maintenance failed:', error);
  } finally {
    process.exit(0);
  }
};

runMaintenance();
```

### 2. Backup Script
```bash
#!/bin/bash
# scripts/backup.sh

echo "📦 Starting backup process..."

# Create backup directory with timestamp
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Export Firestore data
echo "💾 Exporting Firestore data..."
firebase emulators:export $BACKUP_DIR/firestore --force

# Backup configuration files
echo "⚙️ Backing up configuration..."
cp firebase.json $BACKUP_DIR/
cp firestore.rules $BACKUP_DIR/
cp firestore.indexes.json $BACKUP_DIR/

# Create archive
echo "🗜️ Creating archive..."
tar -czf "${BACKUP_DIR}.tar.gz" $BACKUP_DIR/
rm -rf $BACKUP_DIR

echo "✅ Backup completed: ${BACKUP_DIR}.tar.gz"
```

---

**Conclusión**: El sistema de deployment y configuración está completamente automatizado y monitoreado, garantizando despliegues seguros y confiables con validaciones en cada paso del proceso.

---

**Responsable**: Equipo de DevOps  
**Última Actualización**: 20 de junio de 2025
