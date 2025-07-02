# Implementación de Proxy para AEMET en Google Cloud Functions

## Solución al problema CORS

La API de AEMET presenta problemas de CORS cuando se intenta consumir directamente desde un frontend desplegado en producción (https://fichamaterial.web.app). Para resolver este problema, se ha implementado un proxy mediante Google Cloud Functions que actúa como intermediario entre la aplicación y la API de AEMET.

## Componentes implementados

### 1. Cloud Function Proxy (Backend)

Se ha creado una función en Firebase Cloud Functions (`aemetProxy.js`) que:

- Recibe solicitudes desde el frontend
- Valida la API key de la aplicación para evitar uso no autorizado
- Reenvía la solicitud a la API de AEMET con la API key correspondiente
- Devuelve la respuesta al frontend sin restricciones CORS

### 2. Servicio de Proxy en Frontend

Se ha implementado un servicio dedicado (`AemetProxyService.ts`) que:

- Inicializa la configuración del proxy desde Firestore
- Proporciona métodos para consumir los endpoints de AEMET a través del proxy
- Maneja errores y casos donde la configuración no esté disponible

### 3. Integración en Servicio Meteorológico

El servicio meteorológico (`weatherService.ts`) se ha modificado para:

- Usar el proxy en entorno de producción
- Utilizar acceso directo como fallback en desarrollo/local
- Manejar automáticamente las diferentes APIs meteorológicas

## Configuración de la Función

### Ubicación en la UI

La configuración del proxy se ha integrado en la sección "Google Maps & Services APIs" del panel de administración, donde:

- Se puede configurar la URL de la función desplegada
- Se gestiona la clave de acceso a la función de forma segura
- Se proporciona información sobre la función y su uso

### Campos de Configuración

1. **URL de la función proxy**: URL completa de la Cloud Function desplegada
   Ejemplo: `https://us-central1-fichamaterial.cloudfunctions.net/aemetProxy`

2. **API Key de la App**: Clave que protege el acceso a la función
   Valor por defecto en desarrollo: `temp-app-key-for-testing`

## Despliegue y configuración

1. Desplegar la Cloud Function desde la carpeta `functions/`
2. Configurar la URL y clave del proxy en el panel de administración
3. Verificar el funcionamiento accediendo a la sección meteorológica

## Seguridad

- La clave de acceso a la función se almacena de forma segura en Firestore
- La Cloud Function valida esta clave en cada solicitud
- La API key de AEMET se mantiene encriptada y solo se desencripta en el servidor

## Arquitectura

```
Frontend (App) <-> Cloud Function Proxy <-> API AEMET
    |                    |                     |
    |                    |                     |
  Solicita datos    Valida API key      Requiere API key
  con API key app    Reenvía con         de AEMET
                     API key AEMET
```

## Mantenimiento

Ante cualquier cambio en la API de AEMET, solo será necesario actualizar la Cloud Function, sin modificar el frontend.
