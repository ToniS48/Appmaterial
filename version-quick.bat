@echo off
:: Script de Windows para gestión rápida de versiones
:: Uso: version-quick.bat

title Gestión Rápida de Versiones

echo.
echo 🚀 GESTOR RAPIDO DE VERSIONES
echo ============================
echo.

:: Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ Error: No se encontró package.json
    echo    Ejecuta este script desde la raíz del proyecto
    pause
    exit /b 1
)

:: Verificar que Node.js está disponible
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js no está instalado o no está en PATH
    pause
    exit /b 1
)

:: Mostrar menú
:menu
echo.
echo 📋 Opciones disponibles:
echo    1. Versión rápida (interfaz interactiva)
echo    2. Versión con análisis de commits
echo    3. PATCH directo (correcciones)
echo    4. MINOR directo (funcionalidades)
echo    5. MAJOR directo (cambios importantes)
echo    6. Ver información actual
echo    0. Salir
echo.

set /p choice="❓ Selecciona opción [1]: "

if "%choice%"=="" set choice=1

if "%choice%"=="1" (
    echo.
    echo 🎯 Ejecutando versión rápida...
    npm run version:quick
    goto end
)

if "%choice%"=="2" (
    echo.
    echo 🔍 Ejecutando versión con análisis...
    npm run version:interactive
    goto end
)

if "%choice%"=="3" (
    echo.
    echo 🔧 Incrementando PATCH...
    npm run version:patch
    echo.
    echo ✅ Versión PATCH actualizada
    goto end
)

if "%choice%"=="4" (
    echo.
    echo ⭐ Incrementando MINOR...
    npm run version:minor
    echo.
    echo ✅ Versión MINOR actualizada
    goto end
)

if "%choice%"=="5" (
    echo.
    echo 🚀 Incrementando MAJOR...
    npm run version:major
    echo.
    echo ✅ Versión MAJOR actualizada
    goto end
)

if "%choice%"=="6" (
    echo.
    npm run version:info
    echo.
    pause
    goto menu
)

if "%choice%"=="0" (
    echo.
    echo 👋 ¡Hasta luego!
    goto end
)

echo ❌ Opción inválida
goto menu

:end
echo.
pause
