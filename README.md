# 🎯 ESPEMO - Aplicación de Gestión de Materiales

**Aplicación optimizada para la gestión de materiales deportivos y actividades**  
Versión 2.0 - Arquitectura modular con separación UI/lógica y optimizaciones de rendimiento

## 📋 Descripción

ESPEMO es una aplicación web moderna desarrollada en React TypeScript que permite gestionar materiales deportivos, actividades y préstamos de manera eficiente. La aplicación implementa una arquitectura modular con separación completa entre la lógica de negocio y la interfaz de usuario.

## 📚 Documentación Completa

Para información detallada sobre el proyecto, consulte nuestra **[documentación organizada](./docs/README/INDEX-MAESTRO.md)**:

- 🏗️ **[Arquitectura](./docs/README/architecture/README-ARCHITECTURE.md)** - Patrones, estructura y diseño del sistema
- 🧪 **[Testing](./docs/README/testing/README-TESTING.md)** - Herramientas de testing y validación
- 🔍 **[Debugging](./docs/README/debugging/README-DEBUGGING.md)** - Guías de troubleshooting y debugging
- 📊 **[Reportes](./docs/reports/)** - Reportes de implementaciones y optimizaciones
- 💡 **[Soluciones](./docs/solutions/)** - Soluciones documentadas de problemas específicos

## ✨ Características Principales

- 🎨 **Interfaz moderna** con Material-UI y diseño responsivo
- 🔄 **Arquitectura modular** con separación UI/lógica de negocio
- ⚡ **Optimizaciones de rendimiento** avanzadas (100% reducción violaciones scheduler)
- 🔐 **Autenticación robusta** con Firebase Auth y gestión de roles
- 📊 **Base de datos** en tiempo real con Firestore optimizado
- 🧪 **Testing completo** con herramientas de debugging integradas
- 🚀 **CI/CD automatizado** para deployment continuo

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 16+
- Firebase CLI
- Cuenta de Firebase configurada

### Instalación
```bash
# Clonar e instalar
git clone [repository-url]
cd AppMaterial
npm install

# Configurar Firebase
cp .env.example .env.local
# Editar .env.local con configuraciones de Firebase

# Iniciar desarrollo
npm start
```

### Comandos Principales
```bash
npm start          # Servidor de desarrollo
npm run build      # Build de producción  
npm test           # Ejecutar tests
npm run deploy     # Deploy a Firebase
```

## 🎯 Funcionalidades Clave

### 📦 Gestión de Materiales
- Inventario completo con estados y disponibilidad
- Sistema de préstamos con tracking automático
- Filtrado avanzado por tipo, estado y disponibilidad

### 🎪 Gestión de Actividades  
- Creación y edición de actividades deportivas
- Asignación automática de materiales necesarios
- Gestión de participantes y responsables

### 👥 Sistema de Usuarios
- Autenticación con roles (admin, vocal, usuario)
- Permisos granulares por funcionalidad
- Dashboard personalizado por rol

## ⚡ Performance & Optimizaciones

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Violaciones Scheduler | 5-10+ | 0 | **100%** |
| Tiempo de Respuesta | >100ms | <50ms | **50%+** |
| FPS Interacciones | Variable | 60 FPS | **Estable** |

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

## 🔧 Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **UI Library**: Material-UI (MUI)
- **Backend**: Firebase (Auth + Firestore + Hosting)
- **Testing**: Jest + Testing Library + Scripts personalizados
- **Build**: Create React App optimizado
- **CI/CD**: GitHub Actions + Firebase

## 🚀 Deployment

### Automático (Recomendado)
El proyecto incluye CI/CD automático con GitHub Actions que despliega automáticamente a Firebase Hosting en cada push a `main`.

### Manual
```bash
npm run build
firebase deploy
```

## 🤝 Contribución

1. **Fork** el proyecto
2. **Crea** tu feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** al branch (`git push origin feature/AmazingFeature`)
5. **Abre** un Pull Request

## 📞 Soporte

- **Documentación**: Ver [docs/README/INDEX-MAESTRO.md](./docs/README/INDEX-MAESTRO.md)
- **Debugging**: Ver [docs/README/debugging/](./docs/README/debugging/)
- **Issues**: GitHub Issues
- **Contacto**: [información de contacto]

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

**🎯 ESPEMO v2.0** - Gestión inteligente de materiales deportivos con arquitectura optimizada y testing completo.
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
  

