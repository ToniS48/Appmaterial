@echo off
echo 🔥 Desplegando indices de Firebase...
echo.

REM Cambiar al directorio del proyecto
cd /d "c:\Users\Sonia\Documents\Espemo\Apps\AppMaterial"

echo 📍 Directorio actual: %CD%
echo.

REM Verificar que Firebase CLI esté instalado
firebase --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Firebase CLI no está instalado
    echo 💡 Instala con: npm install -g firebase-tools
    pause
    exit /b 1
)

echo ✅ Firebase CLI disponible
echo.

REM Verificar si hay un proyecto configurado
if not exist firebase.json (
    echo ❌ No se encontró firebase.json
    echo 💡 Ejecuta 'firebase init' primero
    pause
    exit /b 1
)

echo ✅ Proyecto Firebase configurado
echo.

REM Mostrar índices actuales
echo 📋 Indices definidos en firestore.indexes.json:
type firestore.indexes.json
echo.

REM Desplegar índices
echo 🚀 Desplegando índices a Firebase...
firebase deploy --only firestore:indexes

if %ERRORLEVEL% eq 0 (
    echo.
    echo ✅ ¡Índices desplegados exitosamente!
    echo 💡 Los índices pueden tardar unos minutos en estar disponibles
    echo.
    echo 🔍 Verifica en Firebase Console:
    echo https://console.firebase.google.com/project/fichamaterial/firestore/indexes
) else (
    echo.
    echo ❌ Error al desplegar índices
    echo 💡 Verifica que estés autenticado: firebase login
)

echo.
pause
