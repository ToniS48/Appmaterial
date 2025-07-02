# Scripts de Integración - Google APIs

Scripts para la integración y gestión de Google APIs (Calendar, Drive, etc.).

## Scripts de verificación

### `check-google-apis.js`
**Propósito**: Verificación rápida del estado de Google APIs
**Uso**: `node check-google-apis.js`

### `verify-google-apis.js`
**Propósito**: Verificación completa de todas las Google APIs
**Uso**: `node verify-google-apis.js`

### `verify-google-apis-simple.js`
**Propósito**: Verificación simplificada de Google APIs
**Uso**: `node verify-google-apis-simple.js`

## Scripts de configuración

### `install-google-apis.js`
**Propósito**: Instala y configura las dependencias de Google APIs
**Uso**: `node install-google-apis.js`

### `google-apis-base.js`
**Propósito**: Configuración base para Google APIs
**Uso**: Importado por otros scripts

### `google-apis-verification.js`
**Propósito**: Módulo de verificación de Google APIs
**Uso**: Importado por scripts de verificación

## Scripts específicos

### Google Calendar
- `google-calendar-script.js`: Script principal de Google Calendar
- `google-calendar-events.js`: Gestión de eventos de calendario

### Google Drive
- `google-drive-script.js`: Script principal de Google Drive
- `google-drive-files.js`: Gestión de archivos de Drive

### Verificación general
- `google-verification-script.js`: Script de verificación general

## Dependencias

- Google APIs credentials configuradas
- OAuth 2.0 configurado
- Variables de entorno de Google APIs

## Documentación relacionada

- `docs-new/integrations/GOOGLE-APIS-*`
- `docs-new/setup/GUIA-MIGRACION-API-KEYS.md`
