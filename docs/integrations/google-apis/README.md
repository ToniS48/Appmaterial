# 🔗 Google APIs - Documentación Consolidada

Documentación unificada para la integración con Google APIs (Calendar, Drive, etc.).

## 📊 Estado Actual: ⚠️ **CONFIGURACIÓN PARCIAL**

### ✅ **Implementado (50%)**
- Estructura de servicios completa
- Variables de entorno base
- Interfaz de configuración
- Scripts de verificación

### ❌ **Pendiente (50%)**
- Service Account de Google Cloud
- APIs habilitadas
- Credenciales JSON
- IDs de recursos (Calendar, Drive)

---

## 🎯 **DOCUMENTO PRINCIPAL** (LEER PRIMERO)

### 📄 **`00-GOOGLE-APIS-CONSOLIDADO.md`**
**Documento unificado con TODA la información necesaria**
- ✅ Estado actual completo
- ✅ Próximos pasos detallados
- ✅ Guía de configuración paso a paso
- ✅ Arquitectura técnica
- ✅ Solución de problemas
- ✅ Contactos y responsables

**👉 ESTE ES EL ÚNICO DOCUMENTO QUE NECESITAS LEER** 👈

---

## 📁 **Estructura Organizada**

### 📄 **Documentos Principales**
```
📄 00-GOOGLE-APIS-CONSOLIDADO.md     ← DOCUMENTO PRINCIPAL
📄 README.md                         ← Este archivo (navegación)
📄 GOOGLE-INTEGRATION-SUMMARY.md     ← Resumen ejecutivo
� GOOGLE-APIS-INTEGRATION.md        ← Guía de configuración
📄 GOOGLE-APIS-IMPLEMENTATION.md     ← Detalles de implementación
```

### 📂 **technical/** - Documentación Técnica
```
📂 technical/
├── GOOGLE-APIS-ADVANCED-INTEGRATION.md    ← Configuración avanzada
├── GOOGLE-APIS-FUNCTIONS-IMPLEMENTATION.md ← Cloud Functions
├── GOOGLE-APIS-SCRIPTS-VERIFICATION.md    ← Scripts de verificación
└── GOOGLE-APIS-MOCK-SOLUTION.md           ← Soluciones mock
```

### 📂 **archive/** - Documentos Históricos
```
📂 archive/
└── GOOGLE-APIS-CLEANUP.md                 ← Limpieza realizada
```

---

## 🚀 **Inicio Súper Rápido**

### ⚡ **Para configurar Google APIs** (5 minutos)
1. **Leer**: `00-GOOGLE-APIS-CONSOLIDADO.md`
2. **Admin Google Cloud**: Crear Service Account
3. **Admin Workspace**: Configurar Calendar/Drive
4. **Desarrollador**: Actualizar variables de entorno

### � **Para desarrollar** (Testing)
1. **Usar mocks**: `technical/GOOGLE-APIS-MOCK-SOLUTION.md`
2. **Scripts de prueba**: `scripts/integrations/google-apis/`
3. **Verificación**: `node scripts/integrations/google-apis/verify-google-apis.js`

---

## 💡 **Información Rápida**

### **Contactos Clave**
- **Google Cloud Admin**: tonisoler@espemo.org
- **Google Workspace Admin**: espeleo@espemo.org
- **Proyecto**: fichamaterial

### **APIs Requeridas**
- Google Calendar API
- Google Drive API
- Google Sheets API (opcional)

### **Variables Críticas Pendientes**
```env
GOOGLE_PRIVATE_KEY=[Del JSON de Service Account]
GOOGLE_CLIENT_ID=[Del JSON de Service Account]
REACT_APP_GOOGLE_DRIVE_FOLDER_ID=[ID de carpeta en Drive]
REACT_APP_GOOGLE_CALENDAR_ID=[ID de calendario]
```

---

## 🔧 **Scripts Disponibles**

### Verificación y Diagnóstico
```bash
# Verificación básica
node scripts/integrations/google-apis/verify-google-apis.js

# Diagnóstico completo
node scripts/integrations/google-apis/check-google-apis.js

# Instalación de dependencias
node scripts/integrations/google-apis/install-google-apis.js
```

### Pruebas Específicas
```bash
# Probar Google Calendar
node scripts/integrations/google-apis/google-calendar-script.js

# Probar Google Drive
node scripts/integrations/google-apis/google-drive-script.js
```

---

## ⚠️ **IMPORTANTE**

### ✅ **Para configurar completamente**
**Seguir EXACTAMENTE los pasos en `00-GOOGLE-APIS-CONSOLIDADO.md`**

### ✅ **Para desarrollo sin configuración**
**Usar los mocks en `technical/GOOGLE-APIS-MOCK-SOLUTION.md`**

### ✅ **Para solución de problemas**
**Consultar sección de troubleshooting en documento consolidado**

---

*Documentación consolidada: 2 de julio de 2025*
*Toda la información importante está en `00-GOOGLE-APIS-CONSOLIDADO.md`*

---

## 🎯 **Próximos Pasos Críticos**

### Para Admin Google Cloud (tonisoler@espemo.org)
1. ✅ Crear Service Account en proyecto fichamaterial
2. ✅ Habilitar Google Calendar API
3. ✅ Habilitar Google Drive API
4. ✅ Generar y descargar JSON de credenciales

### Para Admin Google Workspace (espeleo@espemo.org)
1. ✅ Crear calendario dedicado para AppMaterial
2. ✅ Crear carpeta en Drive para documentos
3. ✅ Compartir acceso al Service Account

### Para Desarrollador
1. ✅ Actualizar variables de entorno
2. ✅ Ejecutar scripts de verificación
3. ✅ Probar funcionalidades básicas

---

## 🔗 **Scripts Relacionados**

- `scripts/integrations/google-apis/verify-google-apis.js` - Verificación básica
- `scripts/integrations/google-apis/check-google-apis.js` - Diagnóstico completo
- `scripts/integrations/google-apis/install-google-apis.js` - Instalación

---

## 📞 **Contactos**

- **Google Cloud Admin**: tonisoler@espemo.org
- **Google Workspace Admin**: espeleo@espemo.org
- **Club**: ESPEMO - Sección Espeleología

---

*Para el resumen consolidado de todas las integraciones, ver: `../00-RESUMEN-CONSOLIDADO-INTEGRACIONES.md`*
