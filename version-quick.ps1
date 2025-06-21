# Script de PowerShell para gestión rápida de versiones
# Uso: .\version-quick.ps1

param(
    [string]$Action = "menu"
)

# Configuración de colores
$Host.UI.RawUI.WindowTitle = "Gestión Rápida de Versiones"

function Write-ColorText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Show-Banner {
    Write-Host ""
    Write-ColorText "🚀 GESTOR RAPIDO DE VERSIONES" "Cyan"
    Write-ColorText "============================" "Cyan"
    Write-Host ""
}

function Test-Prerequisites {
    # Verificar package.json
    if (-not (Test-Path "package.json")) {
        Write-ColorText "❌ Error: No se encontró package.json" "Red"
        Write-ColorText "   Ejecuta este script desde la raíz del proyecto" "Yellow"
        return $false
    }
    
    # Verificar Node.js
    try {
        $null = node --version
    } catch {
        Write-ColorText "❌ Error: Node.js no está instalado o no está en PATH" "Red"
        return $false
    }
    
    return $true
}

function Get-CurrentVersion {
    try {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        return $packageJson.version
    } catch {
        return "unknown"
    }
}

function Show-Menu {
    $currentVersion = Get-CurrentVersion
    
    Write-ColorText "📊 Versión actual: $currentVersion" "Green"
    Write-Host ""
    Write-ColorText "📋 Opciones disponibles:" "Blue"
    Write-Host "   1. Versión rápida (interfaz interactiva)"
    Write-Host "   2. Versión con análisis de commits"
    Write-Host "   3. PATCH directo (correcciones)"
    Write-Host "   4. MINOR directo (funcionalidades)" 
    Write-Host "   5. MAJOR directo (cambios importantes)"
    Write-Host "   6. Ver información actual"
    Write-Host "   0. Salir"
    Write-Host ""
}

function Invoke-VersionAction {
    param([string]$Action)
    
    switch ($Action) {
        "1" { 
            Write-ColorText "🎯 Ejecutando versión rápida..." "Blue"
            npm run version:quick 
        }
        "2" { 
            Write-ColorText "🔍 Ejecutando versión con análisis..." "Blue"
            npm run version:interactive 
        }
        "3" { 
            Write-ColorText "🔧 Incrementando PATCH..." "Blue"
            npm run version:patch
            Write-ColorText "✅ Versión PATCH actualizada" "Green"
        }
        "4" { 
            Write-ColorText "⭐ Incrementando MINOR..." "Blue"
            npm run version:minor
            Write-ColorText "✅ Versión MINOR actualizada" "Green"
        }
        "5" { 
            Write-ColorText "🚀 Incrementando MAJOR..." "Blue"
            npm run version:major
            Write-ColorText "✅ Versión MAJOR actualizada" "Green"
        }
        "6" { 
            npm run version:info
            Write-Host ""
            Read-Host "Presiona Enter para continuar"
            return "continue"
        }
        "0" { 
            Write-ColorText "👋 ¡Hasta luego!" "Yellow"
            return "exit"
        }
        default { 
            Write-ColorText "❌ Opción inválida" "Red"
            return "continue"
        }
    }
    return "exit"
}

# Función principal
function Main {
    Show-Banner
    
    if (-not (Test-Prerequisites)) {
        Read-Host "Presiona Enter para salir"
        return
    }
    
    # Si se pasa un parámetro, ejecutar directamente
    if ($Action -ne "menu") {
        $result = Invoke-VersionAction $Action
        if ($result -ne "continue") {
            Read-Host "Presiona Enter para salir"
        }
        return
    }
    
    # Menú interactivo
    do {
        Show-Menu
        $choice = Read-Host "❓ Selecciona opción [1]"
        
        if ([string]::IsNullOrWhiteSpace($choice)) {
            $choice = "1"
        }
        
        Write-Host ""
        $result = Invoke-VersionAction $choice
        Write-Host ""
        
    } while ($result -eq "continue")
}

# Ejecutar función principal
Main
