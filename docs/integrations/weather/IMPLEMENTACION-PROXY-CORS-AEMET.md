# Documentación: Solución a problemas CORS con la API de AEMET

## Problema identificado

La API de AEMET (Agencia Estatal de Meteorología) bloquea solicitudes CORS desde navegadores web cuando se accede desde dominios como `https://fichamaterial.web.app`, lo que impide el acceso directo desde la aplicación en producción.

## Solución implementada

Se ha creado un proxy utilizando Firebase Cloud Functions que actúa como intermediario entre la aplicación web y la API de AEMET, evitando así las restricciones CORS.

### Componentes de la solución:

1. **Cloud Function `aemetProxy`**: 
   - Recibe solicitudes desde la aplicación web
   - Realiza peticiones a la API de AEMET desde el servidor
   - Devuelve los datos a la aplicación web sin restricciones CORS

2. **Servicio integrado en la aplicación**:
   - `AemetProxyService.ts`: Servicio que facilita la comunicación con la Cloud Function
   - Configuración en la interfaz de administración para gestionar la URL y clave de acceso

## Configuración necesaria

### 1. Desplegar la Cloud Function

```bash
cd functions
npm install
firebase deploy --only functions
```

### 2. Configurar la aplicación

En la interfaz de administración (Configuración → APIs):

1. En la sección "Firebase Functions Proxy para AEMET":
   - Introducir la URL completa de la función desplegada 
     (Ejemplo: `https://us-central1-fichamaterial.cloudfunctions.net/aemetProxy`)
   - Configurar la clave de acceso a la función (la clave temporal es `temp-app-key-for-testing`)

2. En la sección "AEMET":
   - Mantener configurada la API key de AEMET

## Diagrama de funcionamiento

```
[Aplicación Web] → [Cloud Function] → [API AEMET]
     ↑                                     |
     |                                     |
     └--------- Datos sin CORS ------------┘
```

## Consideraciones de seguridad

- La Cloud Function está protegida con una clave de acceso para evitar uso no autorizado
- La API key de AEMET sigue almacenándose de forma segura y encriptada en Firestore
- Solo los administradores pueden configurar estos parámetros

## Mantenimiento

Si se actualizan las Cloud Functions, asegúrate de actualizar también la URL en la configuración.

## Solución de problemas

Si hay problemas con el proxy:

1. Verifica los logs de Firebase Functions
2. Asegúrate de que la API key de AEMET sea válida
3. Comprueba que la URL de la función y la clave de acceso estén correctamente configuradas
