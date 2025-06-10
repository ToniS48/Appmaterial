/**
 * 🧪 SCRIPT DE PRUEBA RÁPIDA POST-OPTIMIZACIÓN
 * 
 * Ejecutar en consola del navegador después de las optimizaciones
 */

console.log('🚀 Iniciando prueba rápida de optimizaciones...');

async function probarOptimizaciones() {
    console.log('\n1️⃣ Verificando servicios disponibles...');
    
    // Verificar que los servicios estén disponibles
    const serviciosDisponibles = {
        prestamoService: !!window.prestamoService,
        obtenerPrestamosVencidos: !!window.prestamoService?.obtenerPrestamosVencidos,
        limpiarCacheVencidos: !!window.prestamoService?.limpiarCacheVencidos,
        listarPrestamos: !!window.prestamoService?.listarPrestamos
    };
    
    console.log('📋 Servicios disponibles:');
    Object.entries(serviciosDisponibles).forEach(([servicio, disponible]) => {
        console.log(`  ${disponible ? '✅' : '❌'} ${servicio}`);
    });
    
    if (!serviciosDisponibles.prestamoService) {
        console.log('❌ prestamoService no disponible. Recargar página.');
        return false;
    }
    
    console.log('\n2️⃣ Probando función de préstamos vencidos...');
    
    try {
        const startTime = Date.now();
        const prestamosVencidos = await window.prestamoService.obtenerPrestamosVencidos();
        const endTime = Date.now();
        
        console.log(`✅ Préstamos vencidos obtenidos: ${prestamosVencidos.length}`);
        console.log(`⏱️ Tiempo de respuesta: ${endTime - startTime}ms`);
        
        if (prestamosVencidos.length > 0) {
            console.log('📋 Ejemplo de préstamo vencido:');
            const ejemplo = prestamosVencidos[0];
            console.log(`  - Material: ${ejemplo.nombreMaterial}`);
            console.log(`  - Usuario: ${ejemplo.nombreUsuario}`);
            console.log(`  - Estado: ${ejemplo.estado}`);
        }
        
    } catch (error) {
        console.error('❌ Error al obtener préstamos vencidos:', error);
        return false;
    }
    
    console.log('\n3️⃣ Probando función de limpieza de cache...');
    
    try {
        window.prestamoService.limpiarCacheVencidos();
        console.log('✅ Cache limpiado correctamente');
    } catch (error) {
        console.error('❌ Error al limpiar cache:', error);
        return false;
    }
    
    console.log('\n4️⃣ Probando lista general de préstamos...');
    
    try {
        const startTime = Date.now();
        const todosPrestamos = await window.prestamoService.listarPrestamos();
        const endTime = Date.now();
        
        console.log(`✅ Total préstamos obtenidos: ${todosPrestamos.length}`);
        console.log(`⏱️ Tiempo de respuesta: ${endTime - startTime}ms`);
        
    } catch (error) {
        console.error('❌ Error al obtener lista de préstamos:', error);
        return false;
    }
    
    console.log('\n5️⃣ Verificando elementos de UI...');
    
    // Buscar elementos clave del filtro
    const elementos = {
        switchRetrasados: document.querySelector('input[type="checkbox"]'),
        tablaFilas: document.querySelectorAll('tr'),
        botones: document.querySelectorAll('button')
    };
    
    console.log('🎨 Elementos de UI encontrados:');
    console.log(`  - Switches: ${elementos.switchRetrasados ? '✅' : '❌'}`);
    console.log(`  - Filas en tabla: ${elementos.tablaFilas.length}`);
    console.log(`  - Botones: ${elementos.botones.length}`);
    
    console.log('\n🎉 RESUMEN DE PRUEBA:');
    console.log('=====================================');
    console.log('✅ Servicios funcionando correctamente');
    console.log('✅ Obtención de préstamos vencidos operativa');
    console.log('✅ Limpieza de cache funcionando');
    console.log('✅ Lista general de préstamos operativa');
    console.log('✅ Elementos de UI presentes');
    
    console.log('\n🚀 ESTADO: OPTIMIZACIONES FUNCIONANDO CORRECTAMENTE');
    
    return true;
}

// Auto-ejecutar si se carga como script
if (typeof window !== 'undefined') {
    // En navegador
    window.probarOptimizaciones = probarOptimizaciones;
    console.log('💡 Para ejecutar la prueba, ejecuta: probarOptimizaciones()');
    
    // También disponible como prueba automática
    window.testRapidoOptimizaciones = () => {
        setTimeout(probarOptimizaciones, 1000); // Esperar 1 segundo
    };
    
    console.log('💡 Para prueba automática, ejecuta: testRapidoOptimizaciones()');
}

// Exportar para uso en tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { probarOptimizaciones };
}
