# Integración Meteorológica: Solución al problema CORS de AEMET

## Problema

La API de AEMET (Agencia Estatal de Meteorología) bloquea las peticiones CORS desde entornos de desarrollo local (localhost). Esto causa que al ejecutar la aplicación en desarrollo local, la integración con AEMET falle y aparezcan errores como:

```
Access to fetch at 'https://opendata.aemet.es/opendata/api/maestro/municipios' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solución implementada (Julio 2025)

Se ha implementado una solución que:

1. Detecta automáticamente si la aplicación está en entorno de desarrollo local (localhost) verificando el hostname
2. Deshabilita automáticamente las peticiones a AEMET en localhost
3. Utiliza Open-Meteo como servicio de respaldo en desarrollo local
4. Mantiene AEMET habilitado en producción para permitir la comparación de pronósticos

### Modificaciones realizadas:

- **`weatherService.ts`**: Se añadió detección de entorno local y se evita el uso de AEMET cuando estamos en localhost
- **`App.tsx`**: Se modificó la inicialización del servicio meteorológico para permitir AEMET en producción y deshabilitarlo en localhost

## Alternativas consideradas

### 1. Implementar un proxy del lado del servidor

La solución más robusta sería implementar un proxy en Firebase Functions que actúe como intermediario entre nuestra aplicación y la API de AEMET. Este proxy:

- Recibiría peticiones desde la aplicación web
- Realizaría la petición a AEMET desde el servidor (donde no hay restricciones CORS)
- Devolvería los datos a la aplicación web

Esta sería una solución recomendada para entornos de desarrollo donde se requiera acceso a AEMET.

### 2. Solicitar acceso CORS a AEMET

AEMET podría permitir el acceso desde dominios específicos (incluido localhost) si lo solicitamos, pero esto depende de sus políticas y tiempos de respuesta.

## Notas para desarrolladores

- La funcionalidad de AEMET está deshabilitada en entornos de desarrollo local (localhost)
- AEMET está disponible en entornos de producción (fichamaterial.web.app)
- Open-Meteo proporciona datos meteorológicos fiables y es gratuito para uso no comercial
- La aplicación detecta automáticamente el entorno y ajusta su comportamiento
