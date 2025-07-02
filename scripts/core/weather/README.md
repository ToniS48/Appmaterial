# Scripts Core - Meteorología

Scripts relacionados con el sistema meteorológico del proyecto.

## Scripts disponibles

### `debug-weather-config.js`
**Propósito**: Diagnostica la configuración del servicio meteorológico
**Uso**: `node debug-weather-config.js`
**Función**: Verifica las configuraciones de AEMET y la integración meteorológica

### `diagnostico-aemet-apikey.js`
**Propósito**: Verifica la validez y funcionamiento de la API key de AEMET
**Uso**: `node diagnostico-aemet-apikey.js`
**Función**: Testa la conexión y autenticación con la API de AEMET

### `diagnostico-meteorologico-consola.js`
**Propósito**: Diagnóstico completo del sistema meteorológico desde consola
**Uso**: Ejecutar desde la consola del navegador
**Función**: Verifica todos los componentes del sistema meteorológico

### `reparar-servicio-meteorologico.js`
**Propósito**: Repara problemas comunes en el servicio meteorológico
**Uso**: `node reparar-servicio-meteorologico.js`
**Función**: Corrige configuraciones y restablece el servicio

### `test-weather-method.js`
**Propósito**: Prueba unitaria de los métodos meteorológicos
**Uso**: `node test-weather-method.js`
**Función**: Verifica el funcionamiento de métodos específicos

## Dependencias

- AEMET API Key configurada
- Firebase configurado
- Variables de entorno establecidas

## Documentación relacionada

- `docs-new/core-flows/05-FLUJO-METEOROLOGICO.md`
- `docs-new/integrations/SOLUCION-SERVICIO-METEOROLOGICO.md`
