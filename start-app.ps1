# Script para iniciar la aplicación AppMaterial
Write-Host "🚀 Iniciando aplicación AppMaterial..." -ForegroundColor Green

# Cambiar al directorio del proyecto
Set-Location "c:\Users\Sonia\Documents\Espemo\Apps\AppMaterial"

Write-Host "📁 Directorio actual: $(Get-Location)" -ForegroundColor Blue

# Verificar que npm está disponible
try {
    $npmVersion = npm --version
    Write-Host "✅ npm versión: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm no está disponible" -ForegroundColor Red
    exit 1
}

# Verificar que package.json existe
if (Test-Path "package.json") {
    Write-Host "✅ package.json encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ package.json no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Instalando dependencias..." -ForegroundColor Yellow
npm install

Write-Host "🚀 Iniciando aplicación..." -ForegroundColor Green
npm start
