/**
 * SCRIPT DE PRUEBA FINAL PARA VERIFICAR CREACIÓN DE PRÉSTAMOS
 * Ejecutar en la consola del navegador (F12) en http://localhost:3000
 */

console.log('🎯 SCRIPT DE PRUEBA FINAL - Creación de Préstamos en Actividades');
console.log('================================================================');

// Función principal de prueba
async function testPrestamosCompleteFinal() {
    console.log('\n🚀 Iniciando prueba completa de préstamos...');
    
    const timestamp = new Date().getTime();
    const actividadTest = {
        nombre: `Actividad Test Préstamos Final ${timestamp}`,
        descripcion: 'Prueba final para verificar que los préstamos se crean correctamente',
        tipo: ['escalada'],
        subtipo: ['deportiva'],
        fechaInicio: new Date(Date.now() + 24 * 60 * 60 * 1000), // Mañana
        fechaFin: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Pasado mañana
        lugar: 'Sector de prueba',
        lugarEncuentro: 'Punto de encuentro test',
        creadorId: 'test-creator-' + timestamp,
        responsableActividadId: 'test-responsable-actividad-' + timestamp,
        responsableMaterialId: 'test-responsable-material-' + timestamp,
        participanteIds: [`test-creator-${timestamp}`, `test-responsable-actividad-${timestamp}`, `test-responsable-material-${timestamp}`],
        necesidadMaterial: true, // ✅ CRÍTICO: Debe ser true
        materiales: [
            {
                materialId: `material-test-1-${timestamp}`,
                nombre: 'Cuerda de escalada test',
                cantidad: 2
            },
            {
                materialId: `material-test-2-${timestamp}`,
                nombre: 'Arnés test',
                cantidad: 3
            }
        ],
        estado: 'planificada',
        dificultad: 'intermedio',
        capacidadMaxima: 8,
        observaciones: 'Actividad de prueba final para verificar préstamos'
    };

    console.log('\n📊 Datos de la actividad de prueba:');
    console.log(`  📝 Nombre: ${actividadTest.nombre}`);
    console.log(`  🎯 Necesidad Material: ${actividadTest.necesidadMaterial}`);
    console.log(`  👤 Responsable Material: ${actividadTest.responsableMaterialId}`);
    console.log(`  📦 Materiales: ${actividadTest.materiales.length} elementos`);
    actividadTest.materiales.forEach((m, i) => {
        console.log(`    ${i+1}. ${m.nombre} (x${m.cantidad}) [ID: ${m.materialId}]`);
    });

    try {
        // PASO 1: Intentar crear la actividad
        console.log('\n🔧 PASO 1: Creando actividad...');
        
        // Intentar usar el servicio directamente si está disponible
        let resultado;
        if (window.actividadService && window.actividadService.crearActividad) {
            console.log('✅ Usando servicio directo de actividades');
            resultado = await window.actividadService.crearActividad(actividadTest);
        } else {
            // Fallback a API REST
            console.log('🔄 Usando API REST como fallback');
            const response = await fetch('/api/actividades', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(actividadTest)
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
            }

            resultado = await response.json();
        }

        console.log('✅ ACTIVIDAD CREADA EXITOSAMENTE:');
        console.log(`  🆔 ID: ${resultado.id}`);
        console.log(`  📝 Nombre: ${resultado.nombre}`);
        console.log(`  🎯 Necesidad Material: ${resultado.necesidadMaterial}`);

        // PASO 2: Verificar préstamos creados
        console.log('\n🔧 PASO 2: Verificando préstamos creados...');
        
        // Esperar un momento para que se procesen los préstamos
        await new Promise(resolve => setTimeout(resolve, 2000));

        let prestamos = [];
        
        // Intentar obtener préstamos
        try {
            if (window.prestamoService && window.prestamoService.obtenerPrestamosPorActividad) {
                console.log('✅ Usando servicio directo de préstamos');
                prestamos = await window.prestamoService.obtenerPrestamosPorActividad(resultado.id);
            } else {
                // Fallback a API REST
                console.log('🔄 Usando API REST para préstamos');
                const prestamosResponse = await fetch(`/api/prestamos?actividadId=${resultado.id}`);
                if (prestamosResponse.ok) {
                    prestamos = await prestamosResponse.json();
                }
            }
        } catch (error) {
            console.warn('⚠️ Error al obtener préstamos, continuando...', error.message);
        }

        // PASO 3: Análisis de resultados
        console.log('\n🔧 PASO 3: Análisis de resultados...');
        console.log(`📦 Préstamos encontrados: ${prestamos.length}`);
        console.log(`📦 Materiales esperados: ${actividadTest.materiales.length}`);

        if (prestamos.length > 0) {
            console.log('\n🎉 ¡SUCCESS! PRÉSTAMOS CREADOS CORRECTAMENTE:');
            prestamos.forEach((prestamo, index) => {
                console.log(`  ${index + 1}. ${prestamo.nombreMaterial || prestamo.materialId}`);
                console.log(`     - Cantidad: ${prestamo.cantidadPrestada}`);
                console.log(`     - Usuario: ${prestamo.nombreUsuario || prestamo.usuarioId}`);
                console.log(`     - Estado: ${prestamo.estado}`);
                console.log(`     - Actividad: ${prestamo.nombreActividad || prestamo.actividadId}`);
            });
            
            // Verificar que el número de préstamos coincide con los materiales
            if (prestamos.length === actividadTest.materiales.length) {
                console.log('\n✅ VERIFICACIÓN EXITOSA: Número de préstamos coincide con materiales');
            } else {
                console.log('\n⚠️ ADVERTENCIA: Número de préstamos no coincide exactamente');
            }
        } else {
            console.log('\n❌ PROBLEMA: No se crearon préstamos');
            console.log('\n🔍 DIAGNÓSTICO ADICIONAL:');
            
            // Verificar los logs de la consola
            console.log('1. Revisa si aparecen logs de "crearPrestamosParaActividad" arriba');
            console.log('2. Verifica que necesidadMaterial = true');
            console.log('3. Verifica que responsableMaterialId está definido');
            console.log('4. Verifica que materiales array no está vacío');
            
            console.log('\n📋 Datos de verificación:');
            console.log(`  - necesidadMaterial: ${resultado.necesidadMaterial}`);
            console.log(`  - responsableMaterialId: ${resultado.responsableMaterialId}`);
            console.log(`  - materiales: ${resultado.materiales ? resultado.materiales.length : 'undefined'}`);
        }

        // PASO 4: Resumen final
        console.log('\n🎯 RESUMEN FINAL:');
        console.log(`  📝 Actividad ID: ${resultado.id}`);
        console.log(`  📦 Préstamos creados: ${prestamos.length}`);
        console.log(`  ✅ Test ${prestamos.length > 0 ? 'EXITOSO' : 'FALLIDO'}`);
        
        return { actividad: resultado, prestamos, exitoso: prestamos.length > 0 };

    } catch (error) {
        console.error('\n❌ ERROR EN LA PRUEBA:', error);
        console.error('Stack trace:', error.stack);
        return { error: error.message, exitoso: false };
    }
}

// Función para verificar el estado actual de los servicios
function verificarEstadoServicios() {
    console.log('\n🔍 VERIFICANDO ESTADO DE SERVICIOS...');
    
    const servicios = {
        actividadService: typeof window.actividadService,
        prestamoService: typeof window.prestamoService,
        fetch: typeof fetch,
        console: typeof console
    };
    
    console.log('📋 Servicios disponibles:');
    Object.entries(servicios).forEach(([servicio, tipo]) => {
        const estado = tipo !== 'undefined' ? '✅' : '❌';
        console.log(`  ${estado} ${servicio}: ${tipo}`);
    });
    
    return servicios;
}

// Función de ayuda para desarrolladores
function mostrarInstrucciones() {
    console.log('\n📖 INSTRUCCIONES DE USO:');
    console.log('1. Abre http://localhost:3000 en el navegador');
    console.log('2. Abre DevTools (F12) y ve a la pestaña Console');
    console.log('3. Ejecuta: testPrestamosCompleteFinal()');
    console.log('4. Observa los logs para verificar que los préstamos se crean');
    console.log('\n💡 FUNCIONES DISPONIBLES:');
    console.log('  - testPrestamosCompleteFinal(): Ejecutar prueba completa');
    console.log('  - verificarEstadoServicios(): Ver estado de servicios');
    console.log('  - mostrarInstrucciones(): Mostrar estas instrucciones');
}

// Exportar funciones al scope global
window.testPrestamosCompleteFinal = testPrestamosCompleteFinal;
window.verificarEstadoServicios = verificarEstadoServicios;
window.mostrarInstrucciones = mostrarInstrucciones;

// Ejecutar verificación inicial
console.log('\n🚀 SCRIPT CARGADO CORRECTAMENTE');
verificarEstadoServicios();
mostrarInstrucciones();

// Detectar si estamos en la página correcta
if (window.location.href.includes('localhost:3000')) {
    console.log('\n✅ Aplicación detectada correctamente');
    console.log('🎯 Listo para ejecutar: testPrestamosCompleteFinal()');
} else {
    console.log('\n⚠️ Navega a http://localhost:3000 para ejecutar las pruebas');
}
