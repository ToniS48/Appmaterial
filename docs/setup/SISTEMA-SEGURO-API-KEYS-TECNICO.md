# Sistema Seguro de API Keys - Documentación Técnica

## Resumen del Sistema

El sistema de almacenamiento de API Keys ha sido migrado de un modelo de encriptación estática a un sistema basado en derivación de claves por usuario autenticado.

### Arquitectura Anterior (Insegura)
```javascript
// ❌ PROBLEMA: Clave expuesta en frontend
const ENCRYPTION_KEY = "ESPEMO_SECRET_KEY_2024_SECURE_ENCRYPTION";
const encrypted = CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY);
```

### Arquitectura Nueva (Segura)
```javascript
// ✅ SOLUCIÓN: Derivación de clave por usuario
const userKey = await deriveUserKey(user.uid, 'aemet');
const encrypted = await encryptWithIntegrity(apiKey, userKey);
```

## Componentes del Sistema

### 1. SecureEncryption Service (`src/services/security/SecureEncryption.ts`)

**Funciones principales:**
- `encryptApiKey(data, user, service)` - Encripta una API key
- `decryptApiKey(encryptedData, user, service)` - Desencripta una API key
- `validateEncryptedApiKey(encryptedData, user)` - Valida integridad

**Características:**
- Derivación de claves usando `PBKDF2` con salt único por usuario/servicio
- Encriptación `AES-256-GCM` con IV único por operación
- Verificación de integridad con `HMAC-SHA256`
- Formato JSON con metadata y verificación

### 2. Hook useSecureApisConfig (`src/hooks/configuration/useSecureApisConfig.ts`)

**Funciones:**
- `saveApiKey(service, key)` - Guarda API key encriptada
- `getApiKey(service)` - Recupera y desencripta API key
- `validateApiKey(service)` - Valida API key existente

**Estados:**
- `isLoading` - Cargando operación
- `error` - Error en operación
- `validationStates` - Estado de validación por servicio

### 3. Componentes UI Actualizados

**WeatherServicesSection.tsx:**
- Usa el hook seguro para AEMET API key
- Muestra estados de validación
- Feedback visual de seguridad

**ApisTab.tsx:**
- Integra todas las configuraciones de APIs
- Interfaz unificada para gestión segura

## Sistema de Migración

### Funciones Globales (Expuestas en `window`)

**`migrarApiKeysSeguras()`:**
1. Verifica autenticación del usuario
2. Recupera configuración existente de Firestore
3. Detecta formato de API key (nuevo vs antiguo)
4. Desencripta con método antiguo si es necesario
5. Re-encripta con sistema seguro
6. Actualiza documento en Firestore
7. Verifica integridad de la migración

**`diagnosticarSistemaSeguro()`:**
1. Verifica disponibilidad de componentes
2. Valida autenticación
3. Prueba funciones de encriptación/desencriptación
4. Analiza estado actual de API keys
5. Proporciona recomendaciones

### Scripts de Consola

**`scripts/migracion-simple.js`:**
- Script simplificado para usuarios finales
- Funciones wrapper (`migrarAhora()`, `verificarSistema()`)
- Validación de entorno automática

## Formato de Datos

### Formato Anterior
```javascript
// Texto encriptado directamente
"U2FsdGVkX1+abc123def456..."
```

### Formato Nuevo
```javascript
{
  "data": "eyJlbmNyeXB0ZWQiOiI...",    // Datos encriptados (base64)
  "metadata": {
    "service": "aemet",
    "userId": "user123",
    "version": "1.0",
    "timestamp": "2024-12-28T..."
  },
  "integrity": "sha256:abc123..."       // Hash de verificación
}
```

## Configuración de Entorno

### Variables de Entorno (`.env`)
```bash
# Públicas (frontend)
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...

# Privadas (backend/scripts)
AEMET_API_KEY=...  # Solo para desarrollo local
```

### Configuración Firebase
- Utiliza autenticación Firebase para derivación de claves
- Almacena datos encriptados en Firestore
- Compatible con plan Spark (sin Firebase Functions)

## Flujo de Migración Técnico

### 1. Detección de Formato
```javascript
try {
  const parsed = JSON.parse(encryptedData);
  if (parsed.data && parsed.metadata && parsed.integrity) {
    // Formato nuevo - verificar validez
    return await validateEncryptedApiKey(encryptedData, user);
  }
} catch (e) {
  // Formato antiguo - migrar
}
```

### 2. Desencriptación Legado
```javascript
// Importar CryptoJS dinámicamente
const CryptoJS = await import('crypto-js');
const oldKey = "ESPEMO_SECRET_KEY_2024_SECURE_ENCRYPTION";
const bytes = CryptoJS.AES.decrypt(encryptedData, oldKey);
const plaintext = bytes.toString(CryptoJS.enc.Utf8);
```

### 3. Re-encriptación Segura
```javascript
const newEncrypted = await SecureEncryption.encryptApiKey(
  plaintext,
  user,
  'aemet'
);
```

### 4. Actualización Firestore
```javascript
await updateDoc(apisDocRef, {
  aemetApiKey: newEncrypted,
  lastMigration: new Date().toISOString(),
  migrationBy: user.uid,
  migrationFrom: 'legacy_encryption'
});
```

## Beneficios de Seguridad

### Eliminados (Vulnerabilidades)
- ❌ Clave de encriptación expuesta en frontend
- ❌ Misma clave para todos los usuarios
- ❌ Sin verificación de integridad
- ❌ Dependencia de secretos estáticos

### Añadidos (Mejoras)
- ✅ Claves derivadas por usuario
- ✅ Sin secretos en frontend
- ✅ Verificación de integridad
- ✅ Metadata y versionado
- ✅ Compatibilidad con plan gratuito Firebase

## Testing y Validación

### Pruebas Automáticas en Diagnóstico
```javascript
// Test de roundtrip
const testData = 'test-' + Date.now();
const encrypted = await encryptApiKey(testData, user, 'test');
const decrypted = await decryptApiKey(encrypted, user, 'test');
assert(decrypted === testData);
```

### Validación de Integridad
```javascript
const isValid = await validateEncryptedApiKey(encryptedData, user);
// Verifica estructura JSON, metadatos y hash de integridad
```

## Consideraciones de Rendimiento

- **Derivación de claves:** ~100ms por operación (aceptable para APIs)
- **Caching:** Usuario autenticado mantenido en contexto
- **Lazy loading:** CryptoJS se importa solo cuando es necesario
- **Batching:** Múltiples API keys del mismo usuario usan la misma clave derivada

## Próximos Pasos

1. **Monitoreo:** Añadir logs de uso y errores
2. **UI/UX:** Completar interfaz de migración en configuración
3. **Automatización:** Migración automática en próximas versiones
4. **Extensión:** Aplicar mismo sistema a otras APIs (Google, etc.)
5. **Cleanup:** Eliminar código legado después de migración completa

## Debugging

### Variables Globales de Debug
```javascript
// En consola del navegador
window.SecureEncryption          // Servicio de encriptación
window.migrarApiKeysSeguras()    // Función de migración
window.diagnosticarSistemaSeguro() // Función de diagnóstico
```

### Logs Estructurados
Todas las operaciones generan logs detallados con:
- ✅/❌ Indicadores visuales de estado
- 🔄 Indicadores de progreso
- 💡 Sugerencias de solución
- 📋 Información contextual
