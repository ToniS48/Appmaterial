# Sistema de Gestión de Permisos para Configuración

## Descripción General

El sistema de permisos para la configuración proporciona control granular sobre qué usuarios pueden acceder y modificar diferentes secciones del panel de configuración. Este sistema está diseñado específicamente para gestionar los permisos de los vocales del club de montaña.

## Características Principales

### 🔐 Control de Acceso Granular
- **Niveles de permisos**: `none`, `read`, `edit`, `full`
- **Control por sección y subsección**
- **Validación automática en tiempo real**

### 👥 Roles de Usuario
- **Admin**: Acceso completo a toda la configuración
- **Vocal**: Permisos configurables por los administradores
- **Usuario**: Sin acceso a configuración (futuro)

### ⚙️ Configuración Personalizable
- Los administradores pueden ajustar los permisos de los vocales
- Configuración persistente en Firebase
- Valores por defecto seguros

## Arquitectura del Sistema

### Componentes Principales

#### 1. `usePermissions` Hook
```typescript
const { hasPermission, canEdit, canRead } = usePermissions(userRole);
```

#### 2. `WithPermissions` HOC
```typescript
<WithPermissions 
  section="variables" 
  subsection="loanManagement" 
  requiredLevel="edit" 
  userRole={userRole}
>
  {/* Contenido protegido */}
</WithPermissions>
```

#### 3. `PermissionManager` Componente
- Interface para administradores
- Gestión visual de permisos
- Persistencia automática

## Estructura de Permisos

### Variables del Sistema
- `loanManagement`: Gestión de préstamos
- `notifications`: Configuración de notificaciones
- `materialManagement`: Gestión de material
- `activityManagement`: Gestión de actividades
- `reputationSystem`: Sistema de reputación
- `reports`: Configuración de reportes

### APIs y Servicios
- `googleDrive`: Enlaces de Google Drive
- `weatherServices`: Servicios meteorológicos
- `notificationServices`: Servicios de notificación
- `backupAnalytics`: Backup y analytics

### Configuración de Material
- `stockConfiguration`: Configuración de stock
- `maintenanceSettings`: Configuración de mantenimiento

### Secciones Especiales
- `security`: Configuración de seguridad (solo admin)
- `dropdowns`: Formularios de material (solo admin)
- `systemViewer`: Visor del sistema (solo admin)

## Configuración por Defecto para Vocales

```typescript
vocal: {
  variables: {
    loanManagement: 'edit',     // ✅ Pueden editar
    notifications: 'edit',      // ✅ Pueden editar
    materialManagement: 'edit', // ✅ Pueden editar
    activityManagement: 'edit', // ✅ Pueden editar
    reputationSystem: 'read',   // 👁️ Solo lectura
    reports: 'read',            // 👁️ Solo lectura
  },
  apis: {
    googleDrive: 'edit',        // ✅ Pueden editar URLs
    weatherServices: 'read',    // 👁️ Solo lectura
    notificationServices: 'none', // ❌ Sin acceso
    backupAnalytics: 'none',    // ❌ Sin acceso
  },
  material: {
    stockConfiguration: 'edit', // ✅ Pueden editar
    maintenanceSettings: 'read', // 👁️ Solo lectura
  },
  security: 'none',             // ❌ Sin acceso
  dropdowns: 'none',           // ❌ Sin acceso
  systemViewer: 'none',        // ❌ Sin acceso
}
```

## Uso en Desarrollo

### Proteger una Sección Completa
```typescript
<WithPermissions 
  section="apis" 
  requiredLevel="read" 
  userRole={userRole}
  fallbackMessage="No tienes acceso a la configuración de APIs."
>
  <ApiConfiguration />
</WithPermissions>
```

### Proteger un Campo Específico
```typescript
<WithPermissions 
  section="variables" 
  subsection="loanManagement" 
  requiredLevel="edit" 
  userRole={userRole}
  showReadOnlyBadge={true}
>
  <FormControl>
    <Select onChange={handleChange} />
  </FormControl>
</WithPermissions>
```

### Verificar Permisos Programáticamente
```typescript
const { canEdit, hasPermission } = usePermissions(userRole);

if (canEdit('variables', 'loanManagement')) {
  // Mostrar controles de edición
}

if (hasPermission('apis', 'googleDrive', 'read')) {
  // Mostrar información
}
```

## Gestión de Permisos (Solo Admin)

### Interfaz de Administración
1. Acceder a la pestaña "Permisos" en configuración
2. Ajustar permisos por sección y subsección
3. Los cambios se aplican inmediatamente a todos los vocales

### Persistencia
- Los permisos se guardan en Firebase (`configuracion/permisos`)
- Fallback automático a valores por defecto
- Histórico de cambios con timestamp

## Integración Completa

El sistema está completamente integrado en:
- ✅ ConfigurationManager principal
- ✅ Todas las pestañas de configuración
- ✅ Secciones individuales (ejemplo: LoanManagementSection)
- ✅ Hooks de datos y handlers
- ✅ Tipos TypeScript completos

## Beneficios

1. **Seguridad**: Control granular de acceso
2. **Flexibilidad**: Permisos ajustables por administradores
3. **UX**: Mensajes claros sobre restricciones
4. **Mantenibilidad**: Código modular y reutilizable
5. **Escalabilidad**: Fácil añadir nuevas secciones y permisos

## Próximos Pasos Sugeridos

1. Aplicar `WithPermissions` a más secciones específicas
2. Añadir logging de cambios de permisos
3. Implementar notificaciones de cambios de permisos
4. Crear preset de permisos para diferentes tipos de vocales
5. Añadir permisos temporales con expiración
