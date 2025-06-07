@echo off
echo =================================
echo  MONITOR INDICE FIREBASE FIRESTORE
echo =================================
echo.
echo Verificando estado del indice...
echo.

node test-firebase-index-fix.js

echo.
echo =================================
echo Para volver a verificar, ejecuta:
echo   .\check-index.bat
echo =================================
pause
