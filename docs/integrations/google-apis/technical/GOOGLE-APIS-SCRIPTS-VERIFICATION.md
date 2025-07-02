# 🔧 Scripts de Verificación de Google APIs

## 📋 Descripción

Este documento describe los scripts disponibles para verificar y diagnosticar el estado de las Google APIs en el proyecto AppMaterial. Los scripts funcionan tanto en entorno Node.js como en Firebase Functions.

## 🚀 Scripts Disponibles

### 1. Verificación desde Node.js (Desarrollo Local)

#### Comando Básico
```bash
npm run apis:verify
```

#### Comando Detallado
```bash
npm run apis:verify-detailed
```

#### Uso Directo
```bash
node scripts/verify-google-apis.js
node scripts/verify-google-apis.js --detailed
```

### 2. Verificación desde Firebase Functions (Producción)

#### Endpoints HTTP Disponibles

##### Health Check Rápido
```
GET https://your-project.cloudfunctions.net/googleApisHealth
```

##### Verificación Completa
```
GET https://your-project.cloudfunctions.net/verifyGoogleApis
```

##### Diagnóstico Detallado
```
GET https://your-project.cloudfunctions.net/googleApisDiagnostic
```

## 📊 Qué Verifican los Scripts

### ✅ Variables de Entorno
- `GCP_PROJECT_ID` / `REACT_APP_GCP_PROJECT_ID`
- `GA_PROPERTY_ID` / `REACT_APP_GA_PROPERTY_ID`
- `API_ENCRYPT_KEY` / `REACT_APP_API_ENCRYPT_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS` (Functions only)

### ✅ Configuración de Firebase
- Conexión a Firestore
- Configuración de Google APIs guardada
- Estados de habilitación de cada API

### ✅ APIs del Frontend
- Google Maps JavaScript API
- Maps Embed API
- Geocoding API
- Gmail API
- Google Chat API
- Cloud Messaging API

### ✅ APIs Avanzadas
- Google Analytics configuración
- BigQuery configuración
- Service Account (Firebase Functions)

### ✅ Estado del Backend
- Firebase Functions disponibles
- Service Account configurado
- Conectividad con Google APIs

## 📝 Ejemplo de Salida

### Verificación Exitosa
```
🚀 Iniciando verificación de Google APIs desde Node.js...

📊 REPORTE DE VERIFICACIÓN - GOOGLE APIS
==========================================
✅ Verificación exitosa - Todas las APIs están correctamente configuradas

📋 Resumen de Estado:
Entorno: NODE
Backend (Service Account): ✅ OK
Variables de Entorno: ✅ OK
Frontend APIs: ✅ OK
Google Analytics: ✅ OK
BigQuery: ✅ OK

🎉 ¡Verificación completada exitosamente!
```

### Verificación con Advertencias
```
🚀 Iniciando verificación de Google APIs desde Node.js...

📊 REPORTE DE VERIFICACIÓN - GOOGLE APIS
==========================================
❌ Se encontraron problemas:
   • GA_PROPERTY_ID no está configurado
   • BigQuery no está habilitado o configurado

📋 Resumen de Estado:
Entorno: NODE
Backend (Service Account): ✅ OK
Variables de Entorno: ❌ Error
Frontend APIs: ✅ OK
Google Analytics: ⚠️  Sin configurar
BigQuery: ⚠️  Sin configurar

🎯 Próximos pasos recomendados:
   1. Configurar variables de entorno requeridas
      - GA_PROPERTY_ID no está configurado
   3. Habilitar y configurar Google Analytics
   4. Habilitar y configurar BigQuery

⚠️  Verificación completada con advertencias.
```

## 🔧 Configuración Requerida

### Variables de Entorno (.env)
```env
# Proyecto de Google Cloud
REACT_APP_GCP_PROJECT_ID=your-project-id
GCP_PROJECT_ID=your-project-id

# Google Analytics
REACT_APP_GA_PROPERTY_ID=your-ga-property-id
GA_PROPERTY_ID=your-ga-property-id

# Clave de encriptación para API keys
REACT_APP_API_ENCRYPT_KEY=your-secret-key
API_ENCRYPT_KEY=your-secret-key

# Service Account (solo en Functions)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Dependencias Necesarias
```bash
# Dependencias principales (ya instaladas)
npm install firebase firebase-admin

# Dependencias de desarrollo para scripts
npm install --save-dev ts-node dotenv @types/dotenv
```

## 🚀 Despliegue de Functions

Para que los endpoints HTTP estén disponibles en producción:

```bash
# Desplegar todas las functions
firebase deploy --only functions

# Desplegar solo las functions de verificación
firebase deploy --only functions:verifyGoogleApis,functions:googleApisDiagnostic,functions:googleApisHealth
```

## 🎯 Casos de Uso

### Durante Desarrollo
```bash
# Verificar antes de hacer commit
npm run apis:verify

# Diagnóstico completo durante debugging
npm run apis:verify-detailed
```

### En CI/CD
```bash
# En pipeline de CI
npm run apis:verify || exit 1
```

### En Producción
```bash
# Health check via HTTP
curl https://your-project.cloudfunctions.net/googleApisHealth

# Diagnóstico completo via HTTP
curl https://your-project.cloudfunctions.net/googleApisDiagnostic
```

## 🔍 Troubleshooting

### Error: "Module not found"
```bash
# Asegúrate de que ts-node está instalado
npm install --save-dev ts-node

# Verifica que tsconfig.node.json existe
ls tsconfig.node.json
```

### Error: "Firebase not initialized"
```bash
# Verifica configuración de Firebase
firebase projects:list
firebase use your-project-id
```

### Error: "Cannot read properties of undefined"
```bash
# Verifica variables de entorno
echo $REACT_APP_GCP_PROJECT_ID
cat .env
```

## 📚 Referencias

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Google APIs Documentation](https://developers.google.com/apis-explorer)
- [Node.js ts-node](https://typestrong.org/ts-node/)
- [dotenv Documentation](https://github.com/motdotla/dotenv)
