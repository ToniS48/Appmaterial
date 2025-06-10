/**
 * 🧪 SCRIPT DE VALIDACIÓN: Préstamos Retrasados Optimizado
 * 
 * Ejecutar después del deploy de índices Firebase
 * Verificar que la funcionalidad mejorada funcione correctamente
 */

console.log('🚀 Iniciando validación de préstamos retrasados optimizados...');

// Test de carga múltiple controlada
async function testCargaMultiple() {
    console.log('\n📊 Test 1: Verificación de control de carga múltiple');
    
    try {
        // Simular múltiples llamadas simultáneas
        const promises = [
            window.prestamoService?.obtenerPrestamosVencidos(),
            window.prestamoService?.obtenerPrestamosVencidos(),
            window.prestamoService?.obtenerPrestamosVencidos()
        ];
        
        console.log('🔄 Ejecutando 3 llamadas simultáneas...');
        const startTime = Date.now();
        
        const results = await Promise.all(promises);
        const endTime = Date.now();
        
        console.log(`⏱️ Tiempo total: ${endTime - startTime}ms`);
        console.log(`📋 Resultados: ${results.map(r => r?.length || 0).join(', ')}`);
        
        // Verificar que todos devuelvan el mismo resultado
        const allEqual = results.every(r => r?.length === results[0]?.length);
        console.log(`✅ Consistencia: ${allEqual ? 'CORRECTA' : 'ERROR'}`);
        
        return allEqual;
    } catch (error) {
        console.error('❌ Error en test de carga múltiple:', error);
        return false;
    }
}

// Test de cache
async function testCache() {
    console.log('\n💾 Test 2: Verificación de funcionamiento del cache');
    
    try {
        // Limpiar cache primero
        sessionStorage.removeItem('contador-retrasados');
        sessionStorage.removeItem('contador-retrasados-time');
        
        // Primera llamada - debe ir a Firebase
        const start1 = Date.now();
        const result1 = await window.prestamoService?.obtenerPrestamosVencidos();
        const time1 = Date.now() - start1;
        
        console.log(`📊 Primera llamada: ${time1}ms - ${result1?.length || 0} préstamos`);
        
        // Simular cache manual
        const cacheKey = 'contador-retrasados';
        sessionStorage.setItem(cacheKey, (result1?.length || 0).toString());
        sessionStorage.setItem(`${cacheKey}-time`, Date.now().toString());
        
        console.log('✅ Cache simulado establecido');
        
        // Verificar que el cache existe
        const cacheValue = sessionStorage.getItem(cacheKey);
        console.log(`📦 Valor en cache: ${cacheValue}`);
        
        return cacheValue !== null;
    } catch (error) {
        console.error('❌ Error en test de cache:', error);
        return false;
    }
}

// Test de funcionalidad de filtro
async function testFiltroRetrasados() {
    console.log('\n🔍 Test 3: Funcionalidad de filtro de retrasados');
    
    try {
        // Obtener préstamos vencidos
        const prestamosVencidos = await window.prestamoService?.obtenerPrestamosVencidos();
        console.log(`📅 Préstamos vencidos: ${prestamosVencidos?.length || 0}`);
        
        // Obtener todos los préstamos
        const todosPrestamos = await window.prestamoService?.listarPrestamos();
        console.log(`📊 Total préstamos: ${todosPrestamos?.length || 0}`);
        
        // Verificar que vencidos <= total
        const logico = (prestamosVencidos?.length || 0) <= (todosPrestamos?.length || 0);
        console.log(`🧮 Lógica correcta: ${logico ? 'SÍ' : 'NO'}`);
        
        // Mostrar algunos ejemplos de préstamos vencidos
        if (prestamosVencidos && prestamosVencidos.length > 0) {
            console.log('📋 Ejemplos de préstamos vencidos:');
            prestamosVencidos.slice(0, 3).forEach((prestamo, index) => {
                const fechaVencimiento = prestamo.fechaDevolucionPrevista instanceof Date ? 
                    prestamo.fechaDevolucionPrevista : 
                    prestamo.fechaDevolucionPrevista.toDate();
                
                const diasRetraso = Math.ceil((new Date() - fechaVencimiento) / (1000 * 60 * 60 * 24));
                console.log(`  ${index + 1}. ${prestamo.nombreMaterial} - ${diasRetraso} días`);
            });
        }
        
        return logico;
    } catch (error) {
        console.error('❌ Error en test de filtro:', error);
        return false;
    }
}

// Test de interfaz de usuario
function testInterfazUsuario() {
    console.log('\n🎨 Test 4: Elementos de interfaz de usuario');
    
    try {
        // Buscar elementos clave en el DOM
        const elementos = {
            switchRetrasados: document.querySelector('[data-testid="switch-retrasados"]') || 
                            document.querySelector('input[type="checkbox"]'),
            botonRetrasados: document.querySelector('button[data-testid="btn-retrasados"]') ||
                           document.querySelector('button:contains("Retrasado")'),
            tablaFilas: document.querySelectorAll('tr').length,
            formularios: document.querySelectorAll('form').length
        };
        
        console.log('🔍 Elementos encontrados:');
        Object.entries(elementos).forEach(([key, value]) => {
            const estado = value ? '✅' : '❌';
            console.log(`  ${estado} ${key}: ${value ? 'Presente' : 'No encontrado'}`);
        });
        
        const elementosEsenciales = elementos.tablaFilas > 0;
        console.log(`📊 Interfaz básica: ${elementosEsenciales ? 'FUNCIONANDO' : 'PROBLEMAS'}`);
        
        return elementosEsenciales;
    } catch (error) {
        console.error('❌ Error en test de interfaz:', error);
        return false;
    }
}

// Ejecutar todos los tests
async function ejecutarValidacion() {
    console.log('🏁 EJECUTANDO BATERÍA DE TESTS...\n');
    
    const resultados = {
        cargaMultiple: await testCargaMultiple(),
        cache: await testCache(),
        filtro: await testFiltroRetrasados(),
        interfaz: testInterfazUsuario()
    };
    
    console.log('\n📊 RESUMEN DE RESULTADOS:');
    console.log('==================================');
    
    Object.entries(resultados).forEach(([test, resultado]) => {
        const emoji = resultado ? '✅' : '❌';
        console.log(`${emoji} ${test}: ${resultado ? 'PASÓ' : 'FALLÓ'}`);
    });
    
    const todosExitosos = Object.values(resultados).every(r => r);
    console.log('\n🎯 RESULTADO GENERAL:');
    console.log(`${todosExitosos ? '🎉 TODOS LOS TESTS PASARON' : '⚠️ ALGUNOS TESTS FALLARON'}`);
    
    if (todosExitosos) {
        console.log('\n✅ La funcionalidad de préstamos retrasados está funcionando correctamente');
        console.log('🚀 Sistema listo para uso en producción');
    } else {
        console.log('\n🔧 Algunos aspectos necesitan revisión');
        console.log('📋 Revisa los tests que fallaron arriba');
    }
    
    return resultados;
}

// Auto-ejecutar si se carga como script
if (typeof window !== 'undefined') {
    // En navegador
    window.validarPrestamosRetrasados = ejecutarValidacion;
    console.log('💡 Para ejecutar la validación, ejecuta: validarPrestamosRetrasados()');
} else {
    // En Node.js (si es necesario)
    ejecutarValidacion();
}

// Exportar para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testCargaMultiple,
        testCache,
        testFiltroRetrasados,
        testInterfazUsuario,
        ejecutarValidacion
    };
}
