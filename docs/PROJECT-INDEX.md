# AppMaterial - Documentación del Proyecto

## 📁 Estructura del Proyecto

### Scripts (`/scripts`)
Scripts organizados por componentes y funcionalidad:

- **core/**: Componentes principales del sistema
  - **auth/**: Autenticación y permisos
  - **materials/**: Gestión de materiales
  - **activities/**: Gestión de actividades  
  - **weather/**: Sistema meteorológico

- **integrations/**: Integraciones externas
  - **google-apis/**: Google Calendar, Drive, etc.
  - **firebase/**: Firebase y Firestore

- **setup/**: Configuración y migración
  - **config/**: Scripts de configuración
  - **migration/**: Scripts de migración

- **utils/**: Utilidades
  - **debug/**: Diagnósticos y debug
  - **version/**: Gestión de versiones

- **deprecated/**: Scripts obsoletos

### Documentación (`/docs`)
Documentación organizada por categorías:

- **core-flows/**: Flujos principales (01-08)
- **integrations/**: Google APIs y meteorología
- **setup/**: Configuración y migraciones
- **troubleshooting/**: Solución de problemas
- **archive/**: Documentos históricos

## 🚀 Inicio Rápido

### 1. Configuración inicial
```bash
# Configurar Firebase
node scripts/setup/config/configurar-firebase-admin.js

# Verificar variables de entorno
node scripts/setup/config/verificar-env.js
```

### 2. Verificar integraciones
```bash
# Google APIs
node scripts/integrations/google-apis/verify-google-apis.js

# Servicio meteorológico
node scripts/core/weather/debug-weather-config.js
```

### 3. Ejecutar la aplicación
```bash
npm start
```

## 📖 Documentación Principal

1. **Flujos del Sistema**: `docs/core-flows/README.md`
2. **Integraciones**: `docs/integrations/README.md`
3. **Configuración**: `docs/setup/`
4. **Solución de Problemas**: `docs/troubleshooting/`

## 🛠️ Desarrollo

### Scripts de desarrollo más usados
- **Debug general**: `scripts/utils/debug/`
- **Verificación APIs**: `scripts/integrations/google-apis/verify-google-apis.js`
- **Diagnóstico Firebase**: `scripts/integrations/firebase/diagnostico-colecciones-firestore.js`
- **Test meteorología**: `scripts/core/weather/test-weather-method.js`

### Estructura de archivos importante
- `firebase.json`: Configuración de Firebase
- `firestore.rules`: Reglas de Firestore
- `package.json`: Dependencias y scripts npm
- `.env.*`: Variables de entorno

## 📊 Estado del Proyecto

- ✅ **Scripts organizados**: 45/45 reorganizados
- ✅ **Documentación estructurada**: 38/38 documentos organizados
- ✅ **Integraciones activas**: Google APIs, AEMET
- ✅ **Sistema modular**: Componentes separados y mantenibles

## 🔧 Mantenimiento

- Scripts obsoletos están en `scripts/deprecated/`
- Documentación histórica en `docs/archive/`
- Cada carpeta tiene su propio README con detalles específicos

---

*Última actualización: 2 de julio de 2025*
*Reorganización completada con éxito* ✨
