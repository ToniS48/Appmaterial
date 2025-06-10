@echo off
echo 🚀 Desplegando indices de Firebase para prestamos...
echo.

echo 📊 Verificando configuracion...
if not exist "firebase.json" (
    echo ❌ Error: No se encontro firebase.json
    echo Asegurate de estar en el directorio raiz del proyecto
    pause
    exit /b 1
)

echo 📦 Desplegando indices...
firebase deploy --only firestore:indexes

if %errorlevel% equ 0 (
    echo.
    echo ✅ ¡Indices desplegados exitosamente!
    echo.
    echo 💡 Los nuevos indices pueden tardar unos minutos en estar disponibles.
    echo    Si sigues viendo errores, espera 2-3 minutos e intenta de nuevo.
    echo.
) else (
    echo.
    echo ❌ Error al desplegar indices
    echo.
    echo 💡 Soluciones posibles:
    echo    1. Verifica que tengas permisos en el proyecto Firebase
    echo    2. Ejecuta: firebase login
    echo    3. Verifica que el proyecto este configurado: firebase use --add
    echo.
)

echo Presiona cualquier tecla para cerrar...
pause >nul
