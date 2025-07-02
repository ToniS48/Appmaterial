# 🔗 Google APIs - Documentación Consolidada

**Estado**: ⚠️ **CONFIGURACIÓN PARCIAL**  
**Objetivo**: Integración completa con Google Calendar y Google Drive  
**Responsables**: tonisoler@espemo.org (Google Cloud) | espeleo@espemo.org (Workspace)

---

## 📋 **RESUMEN EJECUTIVO**

### ✅ **YA IMPLEMENTADO**
- **Arquitectura de servicios** - Clases y estructura de código
- **Variables de entorno base** - Configuración inicial definida
- **Interfaz de configuración** - UI para gestión de credenciales
- **Scripts de verificación** - Herramientas de diagnóstico

### ❌ **PENDIENTE DE CONFIGURACIÓN**
- **Service Account** en Google Cloud
- **APIs habilitadas** (Calendar, Drive)
- **Credenciales JSON** descargadas
- **IDs de recursos** (Calendar ID, Drive Folder ID)

---

## 🎯 **PRÓXIMOS PASOS CRÍTICOS**

### **Para tonisoler@espemo.org (Admin Google Cloud)**

#### 1. Acceder a Google Cloud Console
```
URL: https://console.cloud.google.com/
Cuenta: tonisoler@espemo.org
Proyecto: fichamaterial (existente)
```

#### 2. Habilitar APIs Requeridas
```
Navegación: APIs y servicios > Biblioteca
```
Habilitar:
- ✅ **Google Calendar API**
- ✅ **Google Drive API**
- ✅ **Google Sheets API** (opcional)
- ✅ **Gmail API** (opcional)

#### 3. Crear Service Account
```
Navegación: IAM y administración > Cuentas de servicio
```
**Configuración**:
- **Nombre**: `appmaterial-service`
- **Email**: `appmaterial-service@fichamaterial.iam.gserviceaccount.com`
- **Roles**: Editor (básico)

#### 4. Generar Credenciales JSON
```
1. Seleccionar Service Account creado
2. Pestaña "Claves"
3. "Agregar clave" > "Crear nueva clave"
4. Tipo: JSON
5. Descargar archivo JSON
```

### **Para espeleo@espemo.org (Admin Google Workspace)**

#### 1. Crear Calendario Dedicado
```
1. Ir a Google Calendar
2. Crear nuevo calendario: "AppMaterial - Actividades"
3. Compartir con Service Account (email del paso anterior)
4. Permisos: "Crear y editar eventos"
5. Copiar Calendar ID (desde configuración del calendario)
```

#### 2. Crear Carpeta en Drive
```
1. Ir a Google Drive
2. Crear carpeta: "AppMaterial - Documentos"
3. Compartir con Service Account
4. Permisos: "Editor"
5. Copiar Folder ID (desde URL de la carpeta)
```

### **Para Desarrollador**

#### 1. Actualizar Variables de Entorno
```env
# Completar estas variables con los datos obtenidos:

# ✅ YA CONFIGURADAS
REACT_APP_GOOGLE_PROJECT_ID=fichamaterial
GOOGLE_PROJECT_ID=fichamaterial
GOOGLE_CLIENT_EMAIL=appmaterial-service@fichamaterial.iam.gserviceaccount.com
REACT_APP_CLUB_EMAIL=espeleo@espemo.org
REACT_APP_CLUB_NAME=ESPEMO - Sección Espeleología
REACT_APP_CLUB_ADMIN_EMAIL=tonisoler@espemo.org

# ❌ PENDIENTES (obtener del JSON descargado)
GOOGLE_PRIVATE_KEY=[Del archivo JSON]
GOOGLE_CLIENT_ID=[Del archivo JSON]

# ⚠️ PENDIENTES (obtener de espeleo@espemo.org)
REACT_APP_GOOGLE_DRIVE_FOLDER_ID=[ID de la carpeta creada]
REACT_APP_GOOGLE_CALENDAR_ID=[ID del calendario creado]
```

#### 2. Ejecutar Verificación
```bash
# Verificar configuración
node scripts/integrations/google-apis/verify-google-apis.js

# Diagnóstico completo
node scripts/integrations/google-apis/check-google-apis.js
```

---

## 🏗️ **ARQUITECTURA TÉCNICA**

### **Estructura de Servicios**
```
src/services/google/
├── GoogleBaseService.ts       # Autenticación y configuración base
├── GoogleCalendarService.ts   # Gestión de eventos de calendario
├── GoogleDriveService.ts      # Gestión de archivos y carpetas
└── index.ts                   # Exportaciones y utilidades
```

### **Componentes de UI**
```
src/components/
├── configuration/sections/GoogleConfigurationSection.tsx  # Configuración
├── common/GoogleMapComponent.tsx                          # Mapas (opcional)
└── dashboard/GoogleApisDashboard.tsx                      # Dashboard de estado
```

### **Scripts y Herramientas**
```
scripts/integrations/google-apis/
├── verify-google-apis.js           # Verificación básica
├── check-google-apis.js            # Diagnóstico completo
├── install-google-apis.js          # Instalación de dependencias
├── google-calendar-script.js       # Pruebas de Calendar API
└── google-drive-script.js          # Pruebas de Drive API
```

---

## 🔧 **FUNCIONALIDADES IMPLEMENTADAS**

### **Google Calendar Integration**
- ✅ **Crear eventos** desde formulario de actividades
- ✅ **Sincronizar fechas** automáticamente
- ✅ **Gestión de participantes** via calendario
- ✅ **Notificaciones** integradas

### **Google Drive Integration**
- ✅ **Subir documentos** de actividades
- ✅ **Organizar por carpetas** automáticamente
- ✅ **Compartir archivos** con participantes
- ✅ **Gestión de permisos** granular

### **Configuración Dinámica**
- ✅ **UI de configuración** en la aplicación
- ✅ **Validación en tiempo real** de credenciales
- ✅ **Estado de conexión** visible
- ✅ **Recarga automática** tras configurar

---

## 🚀 **TESTING Y VERIFICACIÓN**

### **Scripts de Diagnóstico**

#### Verificación Básica
```bash
node scripts/integrations/google-apis/verify-google-apis.js
```
**Verifica**: Conexión, credenciales, permisos básicos

#### Diagnóstico Completo
```bash
node scripts/integrations/google-apis/check-google-apis.js
```
**Verifica**: Todos los servicios, APIs habilitadas, funcionalidades

#### Pruebas Específicas
```bash
# Probar Google Calendar
node scripts/integrations/google-apis/google-calendar-script.js

# Probar Google Drive  
node scripts/integrations/google-apis/google-drive-script.js
```

### **Soluciones Mock para Desarrollo**
```javascript
// En desarrollo sin credenciales reales
const mockGoogleService = {
  calendar: {
    createEvent: () => Promise.resolve({ id: 'mock-event-123' }),
    listEvents: () => Promise.resolve({ items: [] })
  },
  drive: {
    uploadFile: () => Promise.resolve({ id: 'mock-file-456' }),
    createFolder: () => Promise.resolve({ id: 'mock-folder-789' })
  }
};
```

---

## 🔍 **SOLUCIÓN DE PROBLEMAS**

### **Error: Service Account no encontrado**
```javascript
// Verificar en consola del navegador
console.log('GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL);
console.log('GOOGLE_PRIVATE_KEY exists:', !!process.env.GOOGLE_PRIVATE_KEY);
```

### **Error: APIs no habilitadas**
1. Ir a Google Cloud Console
2. APIs y servicios > Biblioteca
3. Buscar y habilitar APIs requeridas
4. Esperar 5-10 minutos para propagación

### **Error: Permisos insuficientes**
1. Verificar que el Service Account tenga acceso a Calendar/Drive
2. Confirmar que los recursos estén compartidos correctamente
3. Revisar roles y permisos en Google Cloud

### **Error: IDs incorrectos**
```javascript
// Validar formato de IDs
const calendarIdPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const driveIdPattern = /^[a-zA-Z0-9_-]{28,}$/;

console.log('Calendar ID válido:', calendarIdPattern.test(calendarId));
console.log('Drive ID válido:', driveIdPattern.test(driveId));
```

---

## 📚 **RECURSOS Y DOCUMENTACIÓN**

### **APIs de Google**
- [Google Calendar API](https://developers.google.com/calendar/api)
- [Google Drive API](https://developers.google.com/drive/api)
- [Service Accounts](https://cloud.google.com/iam/docs/service-accounts)

### **Documentación Técnica Específica**
- **Implementación avanzada**: Ver archivos técnicos en esta carpeta
- **Cloud Functions**: `GOOGLE-APIS-FUNCTIONS-IMPLEMENTATION.md`
- **Configuración compleja**: `GOOGLE-APIS-ADVANCED-INTEGRATION.md`
- **Scripts de verificación**: `GOOGLE-APIS-SCRIPTS-VERIFICATION.md`

---

## 📞 **CONTACTOS**

- **Google Cloud Admin**: tonisoler@espemo.org
- **Google Workspace Admin**: espeleo@espemo.org
- **Club**: ESPEMO - Sección Espeleología
- **Proyecto**: AppMaterial

---

## 📊 **ESTADO ACTUAL**

| Componente | Estado | Descripción |
|------------|--------|-------------|
| **Código** | ✅ Completo | Servicios implementados |
| **UI** | ✅ Completo | Interfaz de configuración |
| **Scripts** | ✅ Completo | Herramientas de diagnóstico |
| **Credenciales** | ❌ Pendiente | Service Account + JSON |
| **APIs** | ❌ Pendiente | Habilitar en Google Cloud |
| **Recursos** | ❌ Pendiente | Calendar ID + Drive Folder ID |

**Progreso**: 50% - **Falta configuración en Google Cloud y Workspace**

---

*Documentación consolidada: 2 de julio de 2025*  
*Para implementación completa, seguir los próximos pasos críticos arriba*
