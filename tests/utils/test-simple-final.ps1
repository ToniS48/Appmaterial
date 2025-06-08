# Test final de prestamos
Write-Host "Test final: Verificacion de creacion de prestamos" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Verificar aplicacion
Write-Host "Verificando aplicacion..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 10
    Write-Host "Aplicacion OK (HTTP $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 2. Datos de prueba
$timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$actividadTest = @{
    nombre = "Test Prestamos Final - $timestamp"
    descripcion = "Actividad de prueba para verificar prestamos"
    tipo = @("escalada")
    fechaInicio = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    fechaFin = (Get-Date).AddDays(2).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    lugar = "Sector de prueba"
    lugarEncuentro = "Punto de encuentro"
    creadorId = "test-creator-$timestamp"
    responsableActividadId = "test-responsable-$timestamp"
    responsableMaterialId = "test-material-$timestamp"
    participanteIds = @("test-creator-$timestamp")
    necesidadMaterial = $true
    materiales = @(
        @{
            materialId = "mat-test-1-$timestamp"
            nombre = "Cuerda test"
            cantidad = 2
        },
        @{
            materialId = "mat-test-2-$timestamp"
            nombre = "Arnes test"
            cantidad = 1
        }
    )
    estado = "planificada"
    dificultad = "intermedio"
    capacidadMaxima = 6
}

Write-Host "Datos preparados: $($actividadTest.nombre)" -ForegroundColor Yellow
Write-Host "Materiales: $($actividadTest.materiales.Count)" -ForegroundColor Yellow

# 3. Crear actividad
Write-Host "Creando actividad..." -ForegroundColor Yellow
try {
    $jsonBody = $actividadTest | ConvertTo-Json -Depth 10
    $headers = @{
        'Content-Type' = 'application/json'
        'Accept' = 'application/json'
    }
    
    $createResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/actividades" -Method POST -Body $jsonBody -Headers $headers -TimeoutSec 30
    
    if ($createResponse.StatusCode -eq 200 -or $createResponse.StatusCode -eq 201) {
        $actividad = $createResponse.Content | ConvertFrom-Json
        Write-Host "Actividad creada: $($actividad.id)" -ForegroundColor Green
        
        # 4. Esperar procesamiento
        Write-Host "Esperando procesamiento (3 segundos)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        
        # 5. Verificar prestamos
        Write-Host "Verificando prestamos..." -ForegroundColor Yellow
        try {
            $prestamosResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/prestamos?actividadId=$($actividad.id)" -Method GET -TimeoutSec 15
            
            if ($prestamosResponse.StatusCode -eq 200) {
                $prestamos = $prestamosResponse.Content | ConvertFrom-Json
                
                Write-Host "RESULTADOS:" -ForegroundColor Cyan
                Write-Host "Prestamos encontrados: $($prestamos.Count)" -ForegroundColor White
                Write-Host "Materiales esperados: $($actividadTest.materiales.Count)" -ForegroundColor White
                
                if ($prestamos.Count -gt 0) {
                    Write-Host "EXITO! Prestamos creados:" -ForegroundColor Green
                    for ($i = 0; $i -lt $prestamos.Count; $i++) {
                        $prestamo = $prestamos[$i]
                        $nombre = if ($prestamo.nombreMaterial) { $prestamo.nombreMaterial } else { $prestamo.materialId }
                        Write-Host "  $($i + 1). $nombre (x$($prestamo.cantidadPrestada))" -ForegroundColor Green
                    }
                    
                    if ($prestamos.Count -eq $actividadTest.materiales.Count) {
                        Write-Host "VERIFICACION COMPLETA: TEST EXITOSO" -ForegroundColor Green
                    } else {
                        Write-Host "ADVERTENCIA: Numero no coincide exactamente" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "FALLO: No se crearon prestamos" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "Error verificando prestamos: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "Error creando actividad: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Test completado." -ForegroundColor Cyan
