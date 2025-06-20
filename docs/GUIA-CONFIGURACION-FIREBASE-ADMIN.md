# GUÍA COMPLETA: CONFIGURACIÓN FIREBASE ADMIN SDK

Esta guía te ayudará a configurar Firebase Admin SDK para generar datos históricos desde terminal.

## 🎯 OBJETIVO

Configurar las credenciales necesarias para que los scripts de Node.js puedan acceder a Firestore y generar datos históricos para el dashboard de materiales.

## 📋 PRERREQUISITOS

- Node.js instalado
- Acceso al proyecto Firebase "fichamaterial"
- Permisos de administrador en el proyecto

## 🔧 MÉTODO 1: SERVICE ACCOUNT KEY (RECOMENDADO)

### Paso 1: Obtener Service Account Key

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto **"fichamaterial"**
3. Ve a **Configuración del proyecto** (ícono de engranaje)
4. Ve a la pestaña **Cuentas de servicio**
5. Haz clic en **"Generar nueva clave privada"**
6. Se descargará un archivo JSON

### Paso 2: Guardar el archivo

1. Crea la carpeta `functions` si no existe:
   ```
   AppMaterial/functions/
   ```

2. Guarda el archivo descargado como:
   ```
   AppMaterial/functions/service-account-key.json
   ```

### Paso 3: Verificar configuración

```powershell
node scripts/configurar-firebase-admin.js
```

### Paso 4: Generar datos

```powershell
node scripts/generar-datos-terminal-v2.js
```

## 🔧 MÉTODO 2: VARIABLE DE ENTORNO

Si prefieres usar variables de entorno:

### En PowerShell:
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\completa\al\archivo\service-account-key.json"
node scripts/generar-datos-terminal-v2.js
```

### En CMD:
```cmd
set GOOGLE_APPLICATION_CREDENTIALS=C:\ruta\completa\al\archivo\service-account-key.json
node scripts/generar-datos-terminal-v2.js
```

## 🔧 MÉTODO 3: FIREBASE CLI (SIMPLE)

### Paso 1: Instalar Firebase CLI
```powershell
npm install -g firebase-tools
```

### Paso 2: Autenticarse
```powershell
firebase login
```

### Paso 3: Seleccionar proyecto
```powershell
firebase use fichamaterial
```

### Paso 4: Generar datos
```powershell
node scripts/generar-datos-terminal-v2.js
```

## 🛠️ SCRIPTS DISPONIBLES

### 1. Configurador de Firebase Admin
```powershell
node scripts/configurar-firebase-admin.js
```
- Verifica el estado de la configuración
- Muestra instrucciones específicas
- Detecta qué métodos de autenticación están disponibles

### 2. Verificador de datos
```powershell
node scripts/verificar-datos-terminal.js
```
- Verifica conexión con Firestore
- Muestra el estado de las colecciones
- Lista materiales y eventos existentes

### 3. Generador de datos v2
```powershell
node scripts/generar-datos-terminal-v2.js
```
- Genera datos históricos de materiales
- Crea materiales de prueba si es necesario
- Muestra progreso y estadísticas

## 🚨 SOLUCIÓN DE PROBLEMAS

### Error: "Error inicializando Firebase"

**Solución:**
1. Ejecuta el configurador: `node scripts/configurar-firebase-admin.js`
2. Sigue las instrucciones mostradas
3. Verifica que el archivo `service-account-key.json` esté en la ubicación correcta

### Error: "Permission denied"

**Solución:**
1. Verifica que tu cuenta tenga permisos en el proyecto Firebase
2. Asegúrate de estar usando el service account key correcto
3. Ejecuta `firebase login` y selecciona la cuenta correcta

### Error: "Project not found"

**Solución:**
1. Verifica que el proyecto "fichamaterial" exista
2. Ejecuta `firebase projects:list` para ver los proyectos disponibles
3. Asegúrate de tener acceso al proyecto

## ✅ VERIFICACIÓN EXITOSA

Cuando todo esté configurado correctamente, deberías ver:

```
✅ Firebase Admin SDK inicializado
✅ X materiales encontrados
📈 Guardando Y eventos...
✅ Lote 1 guardado (Z eventos)
🎉 GENERACIÓN COMPLETADA
📊 Total de eventos generados: Y
✅ Verificación: Y eventos en la base de datos
```

## 🎯 SIGUIENTE PASO

Una vez que los datos estén generados:

1. Ejecuta la aplicación:
   ```powershell
   npm start
   ```

2. Ve al dashboard de materiales

3. Verifica que se muestren:
   - Gráficas con datos históricos
   - Métricas de actividad
   - Eventos recientes

## 📁 ESTRUCTURA DE ARCHIVOS

```
AppMaterial/
├── functions/
│   └── service-account-key.json (TU ARCHIVO AQUÍ)
├── scripts/
│   ├── configurar-firebase-admin.js
│   ├── verificar-datos-terminal.js
│   └── generar-datos-terminal-v2.js
├── .firebaserc (proyecto: fichamaterial)
└── firebase.json
```

## 🔒 SEGURIDAD

**IMPORTANTE:**
- Nunca subas `service-account-key.json` a control de versiones
- Mantén tus credenciales seguras
- El archivo ya está incluido en `.gitignore`

## 📞 AYUDA ADICIONAL

Si necesitas ayuda:

1. Ejecuta el diagnóstico: `node scripts/configurar-firebase-admin.js`
2. Revisa los logs de error en detalle
3. Verifica que tengas permisos en Firebase Console
