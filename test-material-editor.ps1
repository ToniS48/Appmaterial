# Script para iniciar la aplicación y testear MaterialEditor
Write-Host "🚀 Iniciando aplicación para testing de MaterialEditor..." -ForegroundColor Green

# Cambiar al directorio del proyecto
Set-Location "c:\Users\Sonia\Documents\Espemo\Apps\AppMaterial"

Write-Host "📋 Funcionalidad implementada:" -ForegroundColor Cyan
Write-Host "  ✅ MaterialEditor requiere responsable de material asignado"
Write-Host "  ✅ Mensaje claro cuando no hay responsable"
Write-Host "  ✅ Formulario solo visible con responsable asignado"
Write-Host "  ✅ UX mejorada: responsable primero, material después"

Write-Host "`n🔧 Para probar la funcionalidad:" -ForegroundColor Yellow
Write-Host "1. Ve a 'Crear Actividad'"
Write-Host "2. Completa la información básica"
Write-Host "3. Ve a la pestaña 'Participantes' y asigna un responsable de material"
Write-Host "4. Ve a la pestaña 'Material' - ahora debería aparecer el formulario"
Write-Host "5. Sin responsable de material, verás un mensaje de alerta"

Write-Host "`n🌐 Iniciando servidor..." -ForegroundColor Green
npm start
