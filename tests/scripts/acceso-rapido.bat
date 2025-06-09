@echo off
REM ========================================
REM   ACCESO RAPIDO - TESTS Y UTILIDADES
REM ========================================
echo.
echo 🧪 TESTS Y UTILIDADES - ACCESO RAPIDO
echo ====================================
echo.
echo 📁 ESTRUCTURA REORGANIZADA:
echo.
echo 🔧 TESTS PRINCIPALES:
echo [1] Inicio Prestamos
echo [2] Test Prestamos (Navegador)
echo [3] Deploy Firebase Indexes
echo [4] Verificacion
echo.
echo 📖 DOCUMENTACION:
echo [5] Ver README de Tests
echo [6] Reportes de Analisis
echo [7] Soluciones Documentadas
echo.
echo 🔍 ESTRUCTURA:
echo [8] Ver Tests Core
echo [9] Ver Tests Utils
echo.
echo [0] Salir
echo.
set /p choice="Selecciona una opcion [0-9]: "

if "%choice%"=="1" (
    echo.
    echo 🚀 Ejecutando Inicio Prestamos...
    tests\utils\inicio-prestamos.bat
) else if "%choice%"=="2" (
    echo.
    echo 🌐 Abriendo Test de Prestamos en Navegador...
    start tests\utils\test-prestamos-navegador.html
) else if "%choice%"=="3" (
    echo.
    echo 🔥 Ejecutando Deploy Firebase Indexes...
    tests\utils\deploy-firebase-indexes.bat
) else if "%choice%"=="4" (
    echo.
    echo ✅ Ejecutando Verificacion...
    powershell -ExecutionPolicy Bypass -File tests\utils\verificacion.ps1
) else if "%choice%"=="5" (
    echo.
    echo 📖 Mostrando README de Tests...
    type tests\README.md
    pause
) else if "%choice%"=="6" (
    echo.
    echo 📊 Reportes Disponibles:
    dir /b docs\reports\
    echo.
    set /p report="Nombre del reporte a ver: "
    if exist "docs\reports\%report%" (
        type "docs\reports\%report%"
    ) else (
        echo ❌ Reporte no encontrado
    )
    pause
) else if "%choice%"=="7" (
    echo.
    echo 💡 Soluciones Disponibles:
    dir /b docs\solutions\
    echo.
    set /p solution="Nombre de la solucion a ver: "
    if exist "docs\solutions\%solution%" (
        type "docs\solutions\%solution%"
    ) else (
        echo ❌ Solucion no encontrada
    )
    pause
) else if "%choice%"=="8" (
    echo.
    echo 🧪 Tests Core:
    dir /b tests\core\
    pause
) else if "%choice%"=="9" (
    echo.
    echo 🔧 Tests Utils:
    dir /b tests\utils\
    pause
) else if "%choice%"=="0" (
    echo.
    echo 👋 ¡Hasta luego!
    exit /b
) else (
    echo.
    echo ❌ Opcion invalida
    pause
    goto :eof
)

echo.
echo ✨ Operacion completada
echo.
pause
