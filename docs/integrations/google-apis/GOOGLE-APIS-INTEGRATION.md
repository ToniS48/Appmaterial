# GUÍA DE CONFIGURACIÓN GOOGLE APIS - ESPEMO

## 📋 RESUMEN DE LA CONFIGURACIÓN

### Estructura Organizacional
- **Cuenta Patrona**: `espeleo@espemo.org` - Gestiona recursos (Calendar, Drive)
- **Cuenta Admin**: `tonisoler@espemo.org` - Gestiona Google Cloud Console
- **Proyecto**: `fichamaterial` (existente)

## 🔧 PASOS DE CONFIGURACIÓN

### FASE 1: Google Cloud Console (tonisoler@espemo.org)

#### 1.1 Usar Proyecto Existente
```
1. Ir a: https://console.cloud.google.com/
2. Login con: tonisoler@espemo.org
3. Seleccionar proyecto existente: fichamaterial
```

#### 1.2 Habilitar APIs
```
Ir a: APIs y servicios > Biblioteca
Habilitar las siguientes APIs:
✅ Google Drive API
✅ Google Calendar API
✅ Google Sheets API
✅ Gmail API
```

#### 1.3 Crear Service Account
```
1. Ir a: APIs y servicios > Credenciales
2. + Crear credenciales > Cuenta de servicio
3. Configurar:
   - Nombre: AppMaterial Service Account
   - ID: appmaterial-service
   - Descripción: Service Account para gestión de material del club Espemo
4. Crear y continuar
5. Función: Editor del proyecto
6. Finalizar
```

#### 1.4 Generar Clave JSON
```
1. Clic en la cuenta de servicio creada
2. Pestaña "Claves"
3. Agregar clave > Crear nueva clave
4. Tipo: JSON
5. Se descarga automáticamente: fichamaterial-xxxxxxxxx.json
```

**Email del Service Account generado:**
`appmaterial-service@fichamaterial.iam.gserviceaccount.com`

### FASE 2: Configuración de Recursos (espeleo@espemo.org)

#### 2.1 Preparar Google Drive
```
1. Login con: espeleo@espemo.org
2. Crear estructura de carpetas:

📁 AppMaterial_Espemo/
  📁 01_Documentos_Material/
  📁 02_Fotos_Material/
  📁 03_Reportes_Prestamos/
  📁 04_Backup_Configuraciones/
  📁 05_Templates_Documentos/
  📁 06_Historiales/
```

#### 2.2 Compartir Drive con Service Account
```
1. Clic derecho en carpeta "AppMaterial_Espemo"
2. Compartir > Agregar personas
3. Email: appmaterial-service@fichamaterial.iam.gserviceaccount.com
4. Permisos: Editor
5. Enviar
6. Copiar ID de la carpeta desde la URL
```

#### 2.3 Crear Calendar Específico
```
1. Ir a: Google Calendar
2. Crear nuevo calendario:
   - Nombre: "Material Club Espemo"
   - Descripción: "Gestión de préstamos y mantenimiento de material"
   - Zona horaria: Europe/Madrid
```

#### 2.4 Compartir Calendar con Service Account
```
1. Configuración del calendario creado
2. Compartir con personas específicas
3. Email: appmaterial-service@fichamaterial.iam.gserviceaccount.com
4. Permisos: "Realizar cambios en eventos"
5. Copiar ID del calendario (desde configuración)
```

### FASE 3: Configuración en la Aplicación

#### 3.1 Archivo .env
```env
# ========================================
# ESTRUCTURA ORGANIZACIONAL ESPEMO
# ========================================
# Cuenta Patrona (recursos): espeleo@espemo.org
# Cuenta Admin (Cloud Console): tonisoler@espemo.org
# Proyecto Google Cloud: fichamaterial (existente)

# Proyecto de Google Cloud
REACT_APP_GOOGLE_PROJECT_ID=fichamaterial

# ========================================
# SERVICE ACCOUNT CREDENTIALS
# ========================================
# Datos del archivo JSON proporcionado por tonisoler@espemo.org
GOOGLE_TYPE=service_account
GOOGLE_PROJECT_ID=fichamaterial
GOOGLE_PRIVATE_KEY_ID=[del JSON]
GOOGLE_PRIVATE_KEY="[del JSON - con \n reemplazado por \\n]"
GOOGLE_CLIENT_EMAIL=appmaterial-service@fichamaterial.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=[del JSON]
GOOGLE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_CLIENT_X509_CERT_URL=[del JSON]

# ========================================
# RECURSOS DEL CLUB
# ========================================
# IDs que proporcionará espeleo@espemo.org
REACT_APP_GOOGLE_DRIVE_FOLDER_ID=[ID de la carpeta AppMaterial_Espemo]
REACT_APP_GOOGLE_CALENDAR_ID=[ID del calendario Material Club Espemo]
REACT_APP_GOOGLE_SPREADSHEET_ID=[Opcional - si se crea una hoja de cálculo]

# ========================================
# CONFIGURACIÓN DEL CLUB ESPEMO
# ========================================
REACT_APP_CLUB_EMAIL=espeleo@espemo.org
REACT_APP_CLUB_NAME=ESPEMO - Sección Espeleología
REACT_APP_CLUB_ADMIN_EMAIL=tonisoler@espemo.org
```

## 🔐 SEGURIDAD

### Variables Sensibles
```
⚠️ NUNCA subir a Git:
- GOOGLE_PRIVATE_KEY
- GOOGLE_PRIVATE_KEY_ID
- GOOGLE_CLIENT_ID
- Archivo JSON del Service Account

✅ Verificar .gitignore incluye:
- .env
- .env.local
- *.json (credenciales)
```

### Permisos Mínimos
```
Service Account debe tener solo:
✅ Acceso a la carpeta específica del Drive
✅ Acceso al calendario específico del club
❌ NO acceso total al Drive/Calendar de la cuenta patrona
```

## 🧪 VERIFICACIÓN

### 1. Verificar Configuración
```javascript
// En la aplicación
import { checkGoogleServicesConfiguration } from './services/google';

const config = checkGoogleServicesConfiguration();
console.log('Configuración:', config);
```

### 2. Probar Conexiones
```javascript
// Test Calendar
const events = await googleCalendarService.getEvents({ maxResults: 1 });

// Test Drive
const folders = await googleDriveService.getFolderStructure();
```

### 3. Crear Primer Evento
```javascript
await googleCalendarService.createLoanEvent({
  materialName: "Cuerda de prueba",
  userName: "Usuario Test",
  userEmail: "test@espemo.org",
  startDate: "2025-07-01T10:00:00.000Z",
  endDate: "2025-07-03T18:00:00.000Z",
  description: "Prueba de integración"
});
```

## 📞 CONTACTOS

- **Soporte técnico**: Desarrollador del proyecto
- **Admin Google Cloud**: tonisoler@espemo.org
- **Gestión recursos**: espeleo@espemo.org

## 🚨 SOLUCIÓN DE PROBLEMAS

### Error: "Service account does not exist"
- Verificar que el Service Account esté creado en el proyecto correcto
- Verificar email del Service Account en .env

### Error: "Insufficient Permission"
- Verificar que espeleo@espemo.org haya compartido los recursos
- Verificar permisos del Service Account (Editor mínimo)

### Error: "Invalid private key"
- Verificar formato de GOOGLE_PRIVATE_KEY en .env
- Asegurar que `\n` esté escapado como `\\n`
- Verificar que la clave esté entre comillas dobles

1. Ve a **Configuración → APIs → Google APIs**
2. Ingresa las API Keys correspondientes
3. Habilita las APIs que quieras usar
4. Configura las opciones por defecto (ubicación, zoom, etc.)

## 🛠️ Uso en la Aplicación

### Hook useGoogleApis

```tsx
import { useGoogleApis } from '../hooks/useGoogleApis';

const MiComponente = () => {
  const { 
    config, 
    loading, 
    error,
    isMapEnabled,
    mapsConfig,
    getApiKey 
  } = useGoogleApis();

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  return (
    <div>
      {isMapEnabled && (
        <p>Google Maps disponible con zoom: {mapsConfig.defaultZoom}</p>
      )}
    </div>
  );
};
```

### Contexto GoogleApisContext

```tsx
import { useGoogleApisContext } from '../contexts/GoogleApisContext';

const MiComponente = () => {
  const { 
    mapsService, 
    calendarService, 
    driveService 
  } = useGoogleApisContext();

  const crearMapa = async () => {
    try {
      const map = await mapsService.createMap('mi-mapa', {
        zoom: 12,
        center: { lat: 40.4168, lng: -3.7038 }
      });
      
      mapsService.addMarker(map, 
        { lat: 40.4168, lng: -3.7038 }, 
        'Madrid', 
        'Capital de España'
      );
    } catch (error) {
      console.error('Error creando mapa:', error);
    }
  };

  return <button onClick={crearMapa}>Crear Mapa</button>;
};
```

### Componente GoogleMapComponent

```tsx
import GoogleMapComponent from '../components/common/GoogleMapComponent';

const MiPagina = () => {
  const markers = [
    {
      position: { lat: 40.4168, lng: -3.7038 },
      title: 'Madrid',
      info: 'Capital de España'
    }
  ];

  const handleMapReady = (map: any) => {
    console.log('Mapa listo:', map);
  };

  return (
    <GoogleMapComponent
      height="500px"
      markers={markers}
      onMapReady={handleMapReady}
      defaultZoom={10}
    />
  );
};
```

## 📊 Dashboard de APIs

El componente `GoogleApisDashboard` proporciona una vista completa del estado de todas las APIs:

```tsx
import GoogleApisDashboard from '../components/dashboard/GoogleApisDashboard';

const ConfiguracionPage = () => {
  return (
    <div>
      <GoogleApisDashboard />
    </div>
  );
};
```

## 🔐 Seguridad

### Encriptación de API Keys
Las API Keys se almacenan encriptadas en Firestore usando CryptoJS:

```typescript
// La encriptación es automática en ApisGoogleSection
const encryptedKey = CryptoJS.AES.encrypt(
  apiKey, 
  process.env.REACT_APP_API_ENCRYPT_KEY
).toString();
```

### Variables de Entorno

Crea un archivo `.env.local`:

```env
# Clave para encriptar API keys
REACT_APP_API_ENCRYPT_KEY=tu_clave_secreta_muy_larga

# API Keys de desarrollo (opcional)
REACT_APP_GOOGLE_MAPS_API_KEY=tu_api_key_aqui
REACT_APP_GOOGLE_CALENDAR_API_KEY=tu_api_key_aqui
```

### Restricciones de Dominio

En Google Cloud Console, configura restricciones:

1. **HTTP referrers** para APIs frontend (Maps, Calendar)
2. **IP addresses** para APIs backend
3. **Aplicaciones Android/iOS** para apps móviles

## 🔧 Utilidades y Scripts

### Verificar Configuración

```bash
npm run apis:check
```

### Probar APIs

```bash
npm run apis:test
```

### Ver Estado en Consola

```javascript
// En la consola del navegador
window.googleApisService.getApisStatus();
```

## 📝 Ejemplos Prácticos

### Crear Evento en Calendar

```tsx
const crearEvento = async () => {
  const { calendarService } = useGoogleApisContext();
  
  try {
    const evento = {
      summary: 'Actividad de Escalada',
      description: 'Escalada en Pedriza',
      start: {
        dateTime: '2024-07-01T09:00:00',
        timeZone: 'Europe/Madrid'
      },
      end: {
        dateTime: '2024-07-01T17:00:00',
        timeZone: 'Europe/Madrid'
      },
      location: 'La Pedriza, Madrid'
    };
    
    await calendarService.createEvent(evento);
    console.log('✅ Evento creado');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};
```

### Geocodificar Dirección

```tsx
const buscarUbicacion = async (direccion: string) => {
  const { mapsService } = useGoogleApisContext();
  
  try {
    const coordenadas = await mapsService.geocodeAddress(direccion);
    console.log('📍 Coordenadas:', coordenadas);
    return coordenadas;
  } catch (error) {
    console.error('❌ Error geocodificando:', error);
  }
};
```

### Gestionar Archivos de Drive

```tsx
const { driveService } = useGoogleApisContext();

// URL de vista previa
const previewUrl = driveService.getPreviewUrl('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');

// URL de descarga
const downloadUrl = driveService.getDownloadUrl('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
```

## 🔄 Estados de las APIs

Cada API puede estar en uno de estos estados:

- **No configurada**: No hay API key
- **Configurada**: API key presente pero API deshabilitada
- **Habilitada**: API habilitada pero librería no cargada
- **Disponible**: API completamente funcional

## 🐛 Solución de Problemas

### Error: "API no disponible"

1. Verifica que la API esté habilitada en configuración
2. Comprueba que la API key sea válida
3. Revisa las restricciones de dominio en Google Cloud

### Error: "Script de Google Maps no carga"

1. Verifica conexión a internet
2. Comprueba que la API key tenga permisos para Maps JavaScript API
3. Revisa la consola del navegador para errores de CORS

### Error: "Cuota excedida"

1. Ve a Google Cloud Console → APIs & Services → Quotas
2. Verifica el uso actual vs límites
3. Solicita aumento de cuota si es necesario

## 📚 Recursos Adicionales

- [Documentación Google Maps API](https://developers.google.com/maps/documentation)
- [Documentación Google Calendar API](https://developers.google.com/calendar/api)
- [Documentación Google Drive API](https://developers.google.com/drive/api)
- [Google Cloud Console](https://console.cloud.google.com/)

## 🎯 Próximas Funcionalidades

- [ ] Integración con Google Photos para galería de actividades
- [ ] Google Sheets API para exportar datos
- [ ] Google Forms API para encuestas de actividades  
- [ ] Places API para búsqueda avanzada de ubicaciones
- [ ] Directions API para rutas de acceso a actividades

---

**💡 Tip**: Usa el dashboard de APIs para monitorear el estado y configuración de todas las integraciones desde un solo lugar.
