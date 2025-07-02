# Flujos Principales del Sistema

Documentación de los 8 flujos principales que conforman el core del sistema AppMaterial.

## Flujos disponibles

### 01 - Autenticación (`01-FLUJO-AUTENTICACION.md`)
- Login/logout de usuarios
- Gestión de sesiones
- Permisos y roles

### 02 - Materiales (`02-FLUJO-MATERIALES.md`)
- Gestión del inventario de materiales
- CRUD de materiales
- Categorización y búsqueda

### 03 - Actividades (`03-FLUJO-ACTIVIDADES.md`)
- Gestión de actividades
- Programación y calendario
- Estados de actividades

### 04 - Préstamos (`04-FLUJO-PRESTAMOS.md`)
- Sistema de préstamos de materiales
- Reservas y devoluciones
- Historial de préstamos

### 05 - Meteorológico (`05-FLUJO-METEOROLOGICO.md`)
- Integración con AEMET
- Consulta de condiciones meteorológicas
- Predicciones para actividades

### 06 - Notificaciones (`06-FLUJO-NOTIFICACIONES.md`)
- Sistema de notificaciones push
- Alertas automáticas
- Configuración de notificaciones

### 07 - Mensajería (`07-FLUJO-MENSAJERIA.md`)
- Sistema de mensajería interna
- Comunicación entre usuarios
- Notificaciones de mensajes

### 08 - Configuración (`08-FLUJO-CONFIGURACION.md`)
- Configuración global del sistema
- Parámetros de usuario
- Variables de entorno

## Orden de lectura recomendado

1. **Autenticación** (01) - Base del sistema
2. **Configuración** (08) - Configuración inicial
3. **Materiales** (02) - Inventario base
4. **Actividades** (03) - Funcionalidad principal
5. **Préstamos** (04) - Extensión de materiales
6. **Meteorológico** (05) - Servicio auxiliar
7. **Notificaciones** (06) - Sistema de alertas
8. **Mensajería** (07) - Comunicación

## Dependencias entre flujos

```
Autenticación (01) ← Base para todos
    ↓
Configuración (08) ← Configuración inicial
    ↓
Materiales (02) → Préstamos (04)
    ↓
Actividades (03) → Meteorológico (05)
    ↓
Notificaciones (06) ← Mensajería (07)
```
