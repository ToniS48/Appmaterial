# 🎯 ESPEMO - Aplicación de Gestión de Materiales

 **Aplicación optimizada para la gestión de materiales deportivos y actividades**  
 Versión 2.0 - Arquitectura modular con separación UI/lógica y optimizaciones de rendimiento

## 📋 Descripción

ESPEMO es una aplicación web moderna desarrollada en React TypeScript que permite gestionar materiales deportivos, actividades y préstamos de manera eficiente. La aplicación implementa una arquitectura modular con separación completa entre la lógica de negocio y la interfaz de usuario.

## ✨ Características Principales

- 🎨 **Interfaz moderna** con Material-UI
- 🔄 **Arquitectura modular** con separación UI/lógica
- ⚡ **Optimizaciones de rendimiento** avanzadas
- 📱 **Diseño responsivo** para todos los dispositivos
- 🔐 **Autenticación** con Firebase Auth
- 📊 **Base de datos** en tiempo real con Firestore
- 🚀 **Despliegue automático** con CI/CD

## 🏗️ Arquitectura del Proyecto

### 📁 Estructura de Directorios

```
src/
├── components/           # Componentes de UI reutilizables
│   ├── actividades/     # Componentes específicos de actividades
│   ├── common/          # Componentes comunes
│   └── testing/         # Herramientas de testing y validación
├── hooks/               # Custom hooks para lógica de UI
│   ├── useActividadForm.ts
│   ├── useActividadPageData.ts
│   └── useActividadPageUI.ts
├── repositories/        # Patrón Repository para acceso a datos
│   ├── BaseRepository.ts
│   ├── MaterialRepository.ts
│   └── ActividadRepository.ts
├── services/           # Servicios de dominio y lógica de negocio
│   └── domain/
│       ├── MaterialService.ts
│       └── ActividadService.ts
├── utils/              # Utilidades y optimizaciones
│   ├── performanceUtils.ts
│   ├── eventOptimizer.ts
│   └── reactSchedulerOptimizer.ts
└── pages/              # Páginas principales de la aplicación
```

### 🎯 Patrones Implementados

1. **Repository Pattern** - Abstracción del acceso a datos
2. **Service Layer** - Lógica de negocio centralizada
3. **Custom Hooks** - Gestión de estado UI especializada
4. **Component Composition** - Componentes modulares y reutilizables

## ⚡ Optimizaciones de Rendimiento

La aplicación incluye un sistema completo de optimizaciones:

- **Deferred Execution** - Operaciones diferidas para no bloquear la UI
- **Throttling** - Limitación de frecuencia de eventos
- **Memoization** - Optimización de cálculos costosos
- **Chunked Processing** - División de operaciones pesadas
- **Scheduler Optimization** - Eliminación de violaciones del React Scheduler

### 📊 Resultados de Rendimiento

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Violaciones del Scheduler | 5-10+ | 0 | **100%** |
| Tiempo de Respuesta | >100ms | <50ms | **50%+** |
| FPS durante interacciones | Variable | 60 FPS | **Estable** |

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 16+
- npm o yarn
- Cuenta de Firebase (para producción)

### Instalación

```bash
# Clonar el repositorio
git clone [repository-url]
cd AppMaterial

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus configuraciones de Firebase
```

### Comandos Disponibles

```bash
# Desarrollo
npm start                 # Inicia el servidor de desarrollo

# Testing
npm test                  # Ejecuta las pruebas
npm run test:coverage     # Pruebas con cobertura

# Producción
npm run build            # Construye para producción
npm run build:analyze    # Analiza el bundle

# Optimizaciones
npm run performance      # Herramientas de rendimiento
```

## 🔧 Configuración

### Variables de Entorno

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## 🧪 Testing y Validación

La aplicación incluye herramientas avanzadas de testing:

```tsx
// Validador de rendimiento
import PerformanceValidator from '../components/testing/PerformanceValidator';

// Demo de optimizaciones
import PerformanceDemo from '../components/testing/PerformanceDemo';
```

Para probar las optimizaciones:

1. Agregar el componente de testing a cualquier página
2. Abrir DevTools (F12) → Console
3. Comparar rendimiento con/sin optimizaciones

## 📦 Despliegue

### CI/CD Automático

El proyecto incluye GitHub Actions que se ejecuta automáticamente:

```yaml
# .github/workflows/firebase-hosting-merge.yml
name: Deploy to Firebase Hosting on merge
on:
  push:
    branches: [ main ]
```

### Configuración de Secretos

En tu repositorio de GitHub, configura:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT`

### Despliegue Manual

```bash
# Construir para producción
npm run build

# Desplegar a Firebase
firebase deploy
```

## 🔍 Funcionalidades Principales

### 📋 Gestión de Materiales

- **Inventario completo** con categorías (cuerdas, anclajes, varios)
- **Control de estado** (disponible, prestado, mantenimiento, baja)
- **Códigos QR** para identificación rápida
- **Alertas de mantenimiento** programadas

### 🎯 Gestión de Actividades

- **Planificación** de actividades deportivas
- **Asignación de materiales** necesarios
- **Control de participantes** y responsables
- **Estados de actividad** (planificada, en curso, finalizada)

### 🔄 Sistema de Préstamos

- **Préstamos vinculados** a actividades
- **Control de devoluciones** con incidencias
- **Notificaciones** automáticas
- **Seguimiento** del estado del material

## 👥 Roles de Usuario

### 🔑 Administrador
- Gestión total del sistema
- Configuración global
- Acceso a estadísticas y logs
- Gestión de usuarios y roles

### 🎖️ Vocal
- Supervisión del material deportivo
- Validación de devoluciones
- Gestión de incidencias
- Control de actividades

### 👤 Socio
- Creación de actividades
- Solicitud de material
- Participación en eventos
- Reporte de incidencias

## 🛠️ Tecnologías

### Frontend
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Material-UI** - Componentes de diseño
- **React Hook Form** - Gestión de formularios
- **date-fns** - Manipulación de fechas

### Backend
- **Firebase Auth** - Autenticación
- **Firestore** - Base de datos NoSQL
- **Firebase Functions** - Funciones serverless
- **Firebase Storage** - Almacenamiento de archivos
- **Firebase Hosting** - Hosting web

### DevOps
- **GitHub Actions** - CI/CD
- **ESLint** - Linting de código
- **Prettier** - Formateo de código
- **Jest** - Testing unitario

## 📊 Modelo de Datos

### Colecciones Principales

```typescript
// Usuarios
interface Usuario {
  uid: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'vocal' | 'socio';
  activo: boolean;
}

// Materiales
interface Material {
  id: string;
  nombre: string;
  categoria: 'cuerdas' | 'anclajes' | 'varios';
  estado: 'disponible' | 'prestado' | 'mantenimiento' | 'baja';
  fechaAdquisicion: Date;
  proximaRevision?: Date;
}

// Actividades
interface Actividad {
  id: string;
  nombre: string;
  fecha: Date;
  responsable: string;
  participantes: string[];
  materialesAsignados: string[];
  estado: 'planificada' | 'en_curso' | 'finalizada' | 'cancelada';
}
```

## 🔒 Seguridad

### Reglas de Firestore

```javascript
// Ejemplo de reglas de seguridad
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
    
    match /material_deportivo/{materialId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && getUserRole(request.auth.uid) in ['admin', 'vocal'];
    }
  }
}
```

### Autenticación

- **Firebase Auth** para gestión de usuarios
- **Roles basados en claims** personalizados
- **Protección de rutas** por rol de usuario
- **Validación** en frontend y backend

## 📈 Métricas y Monitoreo

### Performance Monitoring

- **Web Vitals** - Core Web Vitals
- **User Timing API** - Métricas personalizadas
- **Console Performance** - Validación en desarrollo
- **Bundle Analysis** - Optimización del bundle

### Analytics

- **Firebase Analytics** - Uso de la aplicación
- **Custom Events** - Eventos personalizados
- **User Engagement** - Métricas de usuario
- **Crash Reporting** - Reporte de errores

## 🔄 Actualizaciones y Mantenimiento

### Versionado

El proyecto sigue **Semantic Versioning**:

- **MAJOR**: Cambios incompatibles en la API
- **MINOR**: Nuevas funcionalidades compatibles
- **PATCH**: Correcciones de bugs

### Proceso de Release

1. **Desarrollo** en rama `develop`
2. **Feature branches** para nuevas funcionalidades
3. **Pull Request** con revisión de código
4. **Testing** automático en CI/CD
5. **Merge** a `main` para despliegue

### Copias de Seguridad

- **Firestore Backup** - Diario automático
- **Código fuente** - GitHub como respaldo
- **Configuración** - Variables de entorno versionadas

## 📚 Documentación Adicional

### Para Desarrolladores

- [Guía de Contribución](./CONTRIBUTING.md)
- [Arquitectura Detallada](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Testing Guide](./docs/TESTING.md)

### Para Usuarios

- [Manual de Usuario](./docs/USER_MANUAL.md)
- [FAQ](./docs/FAQ.md)
- [Solución de Problemas](./docs/TROUBLESHOOTING.md)

## 🤝 Contribuciones

Para contribuir al proyecto:

1. **Fork** el repositorio
2. Crear **feature branch**: `git checkout -b feature/nueva-funcionalidad`
3. **Commit** cambios: `git commit -am 'Añadir nueva funcionalidad'`
4. **Push** a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear **Pull Request**

### Convenciones de Código

- **ESLint** y **Prettier** configurados
- **Conventional Commits** para mensajes
- **TypeScript strict** habilitado
- **Testing** obligatorio para nuevas funcionalidades

## 📝 Licencia

Este proyecto es privado y para uso exclusivo del club ESPEMO.

## 📞 Soporte

Para soporte técnico o consultas:

- **Email**: [support@espemo.com]
- **Issues**: [GitHub Issues](./issues)
- **Wiki**: [Documentación Wiki](./wiki)

---

## 🏆 Estado del Proyecto

✅ **Arquitectura modular** implementada  
✅ **Optimizaciones de rendimiento** completadas  
✅ **Testing y validación** integrados  
✅ **CI/CD** configurado  
✅ **Documentación** actualizada  

**Versión actual**: 2.0.0  
**Última actualización**: Enero 2025  
**Estado**: Producción estable  

---

© 2025 ESPEMO - Todos los derechos reservados
=======
### Despliegue manual

Si necesitas desplegar manualmente:

git add .
git commit -m "Prueba de despliegue automatizado"
git push origin main


ESPEMO - Sistema de Gestión de Material Deportivo
<img alt="Estado del despliegue" src="https://img.shields.io/badge/estado-desplegado-success">
Descripción general
ESPEMO es una aplicación web para la gestión integral del material deportivo y actividades del club de espeleología ESPEMO. La aplicación permite gestionar material deportivo especializado (cuerdas, anclajes y varios), planificar actividades, gestionar préstamos, y mantener un control del estado y mantenimiento del equipamiento.

Tecnologías utilizadas
Frontend: React 18, TypeScript, Chakra UI
Backend: Firebase (Firestore, Authentication, Functions, Storage, Hosting)
Herramientas adicionales:
React Hook Form para formularios
date-fns para manipulación de fechas
QRCode para generación de códigos QR
GitHub Actions para CI/CD
Estructura del proyecto
El proyecto sigue una arquitectura basada en componentes con React y TypeScript:

components: Componentes reutilizables organizados por funcionalidad
contexts: Contextos de React para el estado global (autenticación, notificaciones, etc.)
services: Servicios para comunicación con Firebase
types: Interfaces y tipos TypeScript
pages: Páginas principales de la aplicación
constants: Constantes y mensajes de la aplicación
styles: Estilos globales y tema de Chakra UI
utils: Utilidades y funciones auxiliares
functions: Funciones de Firebase (backend serverless)
Características principales
Gestión de material deportivo
Inventario detallado de material con categorías (cuerdas, anclajes, varios)
Seguimiento del ciclo de vida del material (adquisición, revisiones, baja)
Generación de códigos QR para identificación rápida
Control de estado (disponible, prestado, mantenimiento, baja, perdido)
Alertas automáticas para revisiones programadas
Sistema de préstamos
Gestión de préstamos de material a socios
Vinculación de préstamos a actividades
Registro de devoluciones con control de incidencias
Seguimiento del estado del material prestado
Notificaciones para recordatorios de devolución
Planificación de actividades
Calendario de actividades del club
Asignación de responsables y participantes
Gestión de material necesario para cada actividad
Estados de actividad (planificada, en curso, finalizada, cancelada)
Integración con Google Calendar
Comentarios y comunicación entre participantes
Sistema de notificaciones
Notificaciones en tiempo real para usuarios
Alertas de sistema (material pendiente de revisión, préstamos vencidos)
Recordatorios para devoluciones y actividades próximas
Panel de administración
Gestión de usuarios y roles
Configuración global del sistema
Estadísticas y reportes
Gestión de copias de seguridad
Roles de usuario
El sistema contempla tres roles principales con diferentes permisos:

1. Administrador
Gestión total del sistema
Configuración de la aplicación
Gestión de roles y permisos
Acceso a logs y estadísticas
2. Vocal
Supervisión del material deportivo
Validación de devoluciones
Gestión de incidencias
Creación y gestión de actividades
Control limitado de usuarios
3. Socio
Creación de actividades
Solicitud y devolución de material
Participación en actividades
Reporte de incidencias
Modelo de datos
El sistema utiliza Firebase Firestore con las siguientes colecciones principales:

usuarios: Información de usuarios, roles y permisos
actividades: Eventos planificados con participantes y material asignado
material_deportivo: Inventario de material (cuerdas, anclajes, varios)
prestamos: Registro de material prestado y devoluciones
incidencias: Registro de problemas con el material
notificaciones: Sistema de alertas y comunicaciones
Configuración y despliegue
Requisitos previos
Node.js 22 o superior
Cuenta de Firebase (plan Spark o superior)
## Performance Optimizations (Mayo 2025)

Se han implementado importantes mejoras de rendimiento para resolver las violaciones del scheduler en React:

### Componentes Optimizados

- **MaterialSelector**: Componente principal optimizado para seleccionar materiales
- **ActividadFormPage**: Página de creación de actividades con navegación por pestañas mejorada
- **MaterialCard**: Componente de UI con renderizado optimizado

### Utilidades de Optimización

Se han creado varias utilidades para mejorar el rendimiento:

- `performanceMonitor.ts`: Sistema para detectar y registrar violaciones de rendimiento
- `reactSchedulerOptimizer.ts`: Utilidades para prevenir violaciones del scheduler de React
- `eventOptimizer.ts`: Hooks para optimizar el manejo de eventos

### Verificación de Optimizaciones

Para comprobar las mejoras de rendimiento:

1. Ejecutar `npm start` para iniciar la aplicación
2. Navegar a `/debug/material-selector-test` para usar el componente de pruebas
3. Alternar entre modo optimizado y no optimizado para comparar

Para pruebas desde línea de comandos:
```
node src/utils/testPerformance.js
```

### Documentación

Para más detalles sobre las optimizaciones implementadas, consultar:

- `docs/Optimizaciones-Rendimiento-2025.md`: Documentación completa
- `docs/MaterialSelector-Optimizacion.md`: Especificaciones del componente

