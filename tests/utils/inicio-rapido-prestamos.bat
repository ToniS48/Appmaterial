@echo off
echo.
echo 🎯 =========================================
echo    SOLUCION PRESTAMOS - INICIO RAPIDO
echo =========================================
echo.

REM Cambiar al directorio del proyecto
cd /d "c:\Users\Sonia\Documents\Espemo\Apps\AppMaterial"

echo 📍 Proyecto: %CD%
echo.

echo 📋 PROBLEMA RESUELTO:
echo ✅ Errores de TypeScript corregidos
echo ✅ Logica de prestamos implementada
echo ✅ Logging detallado agregado
echo ✅ Tests de diagnostico creados
echo.

echo 🚀 OPCIONES DISPONIBLES:
echo.
echo [1] Ejecutar test completo (PowerShell)
echo [2] Abrir solo pagina de tests
echo [3] Ver resumen de la solucion
echo [4] Desplegar indices Firebase
echo [5] Iniciar aplicacion manualmente
echo [0] Salir
echo.

set /p choice="Selecciona una opcion [0-5]: "

if "%choice%"=="1" (
    echo.
    echo 🧪 Ejecutando test completo...
    powershell -ExecutionPolicy Bypass -File "test-prestamos-completo.ps1"
    goto end
)

if "%choice%"=="2" (
    echo.
    echo 🌐 Abriendo pagina de tests...
    start "" "test-prestamos-navegador.html"
    echo ✅ Pagina abierta. Ejecuta los tests en orden.
    goto end
)

if "%choice%"=="3" (
    echo.
    echo 📖 Abriendo resumen...
    start "" "RESUMEN-SOLUCION-PRESTAMOS-FINAL.md"
    goto end
)

if "%choice%"=="4" (
    echo.
    echo 🔥 Desplegando indices Firebase...
    call "deploy-firebase-indexes.bat"
    goto end
)

if "%choice%"=="5" (
    echo.
    echo 🚀 Iniciando aplicacion...
    echo ⚠️ Esto abrira una nueva ventana. Usa Ctrl+C para cerrar.
    start cmd /k "cd /d %CD% && npm start"
    echo.
    echo 💡 Para probar:
    echo    1. Abre http://localhost:3000
    echo    2. Crea una actividad con material
    echo    3. Verifica que se crean prestamos
    goto end
)

if "%choice%"=="0" (
    echo.
    echo 👋 ¡Hasta luego!
    goto end
)

echo.
echo ❌ Opcion invalida. Intenta de nuevo.
echo.
pause
goto start

:end
echo.
echo 🎉 ¡Listo! 
echo.
echo 💡 RECORDATORIOS:
echo    - Los prestamos ahora se crean automaticamente
echo    - Si hay errores de indice, ejecuta la opcion 4
echo    - Los logs aparecen en la consola del navegador
echo.
pause
