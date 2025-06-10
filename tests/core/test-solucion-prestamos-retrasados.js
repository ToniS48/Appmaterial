/**
 * 🧪 TEST: Solución de Problemas de Carga de Préstamos Retrasados
 * 
 * Verifica que las mejoras implementadas resuelvan el problema de llamadas múltiples
 */

console.log('🚀 Iniciando test de solución de problemas de carga...');

// Configuración del test
const TEST_CONFIG = {
    timeoutPrincipal: 5000,
    timeoutCache: 2000,
    intentosMaximos: 3
};

// Función para simular múltiples llamadas concurrentes
async function testCallsSimultaneas() {
    console.log('\n🔄 Testing: Llamadas simultáneas a obtenerPrestamosVencidos');
    
    if (!window.prestamoService?.obtenerPrestamosVencidos) {
        console.log('❌ Servicio no disponible');
        return false;
    }
    
    const startTime = Date.now();
    
    // Lanzar 5 llamadas simultáneas
    const promesas = Array(5).fill().map((_, index) => {
        console.log(`📞 Llamada ${index + 1} iniciada`);
        return window.prestamoService.obtenerPrestamosVencidos()
            .then(result => {
                console.log(`✅ Llamada ${index + 1} completada: ${result.length} préstamos`);
                return result;
            })
            .catch(error => {
                console.log(`❌ Llamada ${index + 1} falló:`, error.message);
                return [];
            });
    });
    
    try {
        const resultados = await Promise.all(promesas);
        const endTime = Date.now();
        const tiempoTotal = endTime - startTime;
        
        console.log(`⏱️ Tiempo total: ${tiempoTotal}ms`);
        console.log(`📊 Resultados: ${resultados.length} respuestas`);
        
        // Verificar que todos los resultados son consistentes
        const cantidades = resultados.map(r => r.length);
        const consistente = cantidades.every(c => c === cantidades[0]);
        
        console.log(`🔍 Consistencia: ${consistente ? '✅ Consistente' : '❌ Inconsistente'}`);
        console.log(`📈 Cantidades: [${cantidades.join(', ')}]`);
        
        return {
            exito: consistente,
            tiempoTotal,
            cantidadPromesas: promesas.length,
            consistente
        };
        
    } catch (error) {
        console.error('❌ Error en test de llamadas simultáneas:', error);
        return { exito: false, error: error.message };
    }
}

// Test de verificación de cache
async function testCacheFuncional() {
    console.log('\n📦 Testing: Funcionalidad de cache');
    
    if (!window.prestamoService?.obtenerPrestamosVencidos) {
        console.log('❌ Servicio no disponible');
        return false;
    }
    
    // Primera llamada
    console.log('🔄 Primera llamada (sin cache)...');
    const startTime1 = Date.now();
    const resultado1 = await window.prestamoService.obtenerPrestamosVencidos();
    const tiempo1 = Date.now() - startTime1;
    
    // Segunda llamada inmediata (debería usar cache)
    console.log('📦 Segunda llamada (con cache esperado)...');
    const startTime2 = Date.now();
    const resultado2 = await window.prestamoService.obtenerPrestamosVencidos();
    const tiempo2 = Date.now() - startTime2;
    
    console.log(`⏱️ Tiempo primera llamada: ${tiempo1}ms`);
    console.log(`⏱️ Tiempo segunda llamada: ${tiempo2}ms`);
    console.log(`📊 Cantidad primera: ${resultado1.length}`);
    console.log(`📊 Cantidad segunda: ${resultado2.length}`);
    
    const mejoraCache = tiempo2 < tiempo1 * 0.5; // Segunda llamada debe ser al menos 50% más rápida
    const consistencia = resultado1.length === resultado2.length;
    
    console.log(`🚀 Mejora por cache: ${mejoraCache ? '✅ Detectada' : '❌ No detectada'}`);
    console.log(`🔍 Consistencia datos: ${consistencia ? '✅ Consistente' : '❌ Inconsistente'}`);
    
    return {
        exito: mejoraCache && consistencia,
        tiempo1,
        tiempo2,
        mejoraCache,
        consistencia
    };
}

// Test del componente Dashboard
function testComponenteDashboard() {
    console.log('\n🖥️ Testing: Comportamiento del componente Dashboard');
    
    // Verificar que no hay múltiples llamadas en la consola
    const originalLog = console.log;
    const logs = [];
    
    console.log = function(...args) {
        logs.push(args.join(' '));
        originalLog.apply(console, args);
    };
    
    // Simular cambio de filtro
    console.log('🔄 Simulando cambio de filtro...');
    
    // Restaurar console.log después de un momento
    setTimeout(() => {
        console.log = originalLog;
        
        // Analizar logs para detectar múltiples llamadas
        const llamadasVencidos = logs.filter(log => 
            log.includes('Buscando préstamos vencidos') || 
            log.includes('obtenerPrestamosVencidos')
        ).length;
        
        console.log(`📊 Llamadas detectadas a préstamos vencidos: ${llamadasVencidos}`);
        
        return {
            exito: llamadasVencidos <= 2, // Máximo 2 llamadas aceptables
            llamadasDetectadas: llamadasVencidos
        };
    }, 2000);
}

// Test de limpieza de cache
async function testLimpiezaCache() {
    console.log('\n🧹 Testing: Limpieza de cache');
    
    if (!window.prestamoService?.limpiarCacheVencidos) {
        console.log('❌ Función limpiarCacheVencidos no disponible');
        return false;
    }
    
    // Cargar cache
    console.log('📦 Cargando cache inicial...');
    await window.prestamoService.obtenerPrestamosVencidos();
    
    // Limpiar cache
    console.log('🧹 Limpiando cache...');
    window.prestamoService.limpiarCacheVencidos();
    
    // Verificar que la siguiente llamada toma más tiempo (sin cache)
    console.log('🔄 Verificando que cache fue limpiado...');
    const startTime = Date.now();
    const resultado = await window.prestamoService.obtenerPrestamosVencidos();
    const tiempo = Date.now() - startTime;
    
    console.log(`⏱️ Tiempo después de limpiar cache: ${tiempo}ms`);
    console.log(`📊 Resultado: ${resultado.length} préstamos`);
    
    return {
        exito: tiempo > 100, // Debería tomar más de 100ms sin cache
        tiempo,
        cantidad: resultado.length
    };
}

// Ejecutar todos los tests
async function ejecutarTestsCompletos() {
    console.log('\n🎯 EJECUTANDO TESTS DE SOLUCIÓN DE PROBLEMAS\n');
    
    const resultados = {
        callsSimultaneas: null,
        cacheFuncional: null,
        componenteDashboard: null,
        limpiezaCache: null
    };
    
    try {
        // Test 1: Llamadas simultáneas
        resultados.callsSimultaneas = await testCallsSimultaneas();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 2: Cache funcional
        resultados.cacheFuncional = await testCacheFuncional();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 3: Componente Dashboard
        resultados.componenteDashboard = testComponenteDashboard();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Test 4: Limpieza de cache
        resultados.limpiezaCache = await testLimpiezaCache();
        
    } catch (error) {
        console.error('❌ Error ejecutando tests:', error);
        return { error: error.message, resultados };
    }
    
    // Resumen final
    console.log('\n📋 RESUMEN DE TESTS DE SOLUCIÓN');
    console.log('================================');
    
    const testsPasados = Object.values(resultados).filter(r => r && r.exito).length;
    const testsTotal = Object.keys(resultados).length;
    
    console.log(`✅ Tests pasados: ${testsPasados}/${testsTotal}`);
    
    Object.entries(resultados).forEach(([nombre, resultado]) => {
        if (resultado) {
            const estado = resultado.exito ? '✅' : '❌';
            console.log(`${estado} ${nombre}: ${resultado.exito ? 'PASÓ' : 'FALLÓ'}`);
        }
    });
    
    console.log('\n🎉 Tests de solución completados');
    return { resultados, exito: testsPasados === testsTotal };
}

// Auto-ejecutar o exportar para uso manual
if (typeof window !== 'undefined') {
    // En navegador
    window.testSolucionPrestamosRetrasados = ejecutarTestsCompletos;
    console.log('💡 Para ejecutar el test, usa: testSolucionPrestamosRetrasados()');
} else {
    // En Node.js
    ejecutarTestsCompletos();
}
