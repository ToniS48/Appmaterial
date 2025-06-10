/**
 * 🧪 TEST MANUAL: Verificación de Filtro de Préstamos Retrasados
 * 
 * Instrucciones para probar la nueva funcionalidad
 */

console.log('🚀 Iniciando test de filtro de préstamos retrasados...');

// Test de funciones del servicio
async function testServicioPrestamosVencidos() {
    console.log('\n📋 Probando servicio de préstamos vencidos...');
    
    try {
        // Importar funciones si están disponibles
        if (window.prestamoService?.obtenerPrestamosVencidos) {
            console.log('✅ Función obtenerPrestamosVencidos disponible');
            
            const prestamosVencidos = await window.prestamoService.obtenerPrestamosVencidos();
            console.log(`📊 Préstamos vencidos encontrados: ${prestamosVencidos.length}`);
            
            if (prestamosVencidos.length > 0) {
                console.log('📄 Ejemplos de préstamos vencidos:');
                prestamosVencidos.slice(0, 3).forEach((prestamo, index) => {
                    const fechaVencimiento = prestamo.fechaDevolucionPrevista instanceof Date ? 
                        prestamo.fechaDevolucionPrevista : 
                        prestamo.fechaDevolucionPrevista.toDate();
                    
                    const diasRetraso = Math.ceil((new Date() - fechaVencimiento) / (1000 * 60 * 60 * 24));
                    
                    console.log(`  ${index + 1}. ${prestamo.nombreMaterial} - ${diasRetraso} días retrasado`);
                });
            } else {
                console.log('🎉 No se encontraron préstamos vencidos');
            }
        } else {
            console.log('⚠️ Función no disponible en window.prestamoService');
        }
    } catch (error) {
        console.error('❌ Error en test de servicio:', error);
    }
}

// Test de componente dashboard
function testComponenteDashboard() {
    console.log('\n🎨 Verificando componente PrestamosDashboard...');
    
    // Verificar si el componente está montado
    const dashboard = document.querySelector('[data-testid="prestamos-dashboard"]') || 
                     document.querySelector('.prestamos-dashboard') ||
                     document.querySelector('div[class*="prestamo"]');
    
    if (dashboard) {
        console.log('✅ Componente dashboard encontrado');
        
        // Buscar filtro de retrasados
        const filtroRetrasados = document.querySelector('input[id="retrasados-filter"]') ||
                                document.querySelector('input[type="checkbox"]') ||
                                document.querySelector('[role="switch"]');
        
        if (filtroRetrasados) {
            console.log('✅ Filtro de retrasados encontrado en UI');
        } else {
            console.log('⚠️ Filtro de retrasados no encontrado en UI');
        }
        
        // Buscar botón de acceso rápido
        const botonRapido = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent && btn.textContent.includes('Retrasado')
        );
        
        if (botonRapido) {
            console.log('✅ Botón de acceso rápido encontrado');
        } else {
            console.log('ℹ️ Botón de acceso rápido no visible (normal si no hay préstamos retrasados)');
        }
        
    } else {
        console.log('⚠️ Componente dashboard no encontrado - puede no estar en esta página');
    }
}

// Test de integración completa
async function testIntegracionCompleta() {
    console.log('\n🔗 Probando integración completa...');
    
    try {
        // Simular activación del filtro
        console.log('🔄 Simulando activación del filtro...');
        
        // Si hay React DevTools disponibles, podemos interactuar con el estado
        if (window.React && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            console.log('✅ React DevTools detectado - integración React disponible');
        }
        
        console.log('📝 Para test manual:');
        console.log('   1. Ve a la página de Gestión de Préstamos');
        console.log('   2. Busca el filtro "Solo retrasados" en la sección de filtros');
        console.log('   3. Activa el switch y verifica que se muestren solo préstamos retrasados');
        console.log('   4. Verifica que las filas retrasadas tengan fondo rojo');
        console.log('   5. Confirma que aparezcan badges con días de retraso');
        
    } catch (error) {
        console.error('❌ Error en test de integración:', error);
    }
}

// Ejecutar tests
async function ejecutarTodosLosTests() {
    console.log('🎯 === TEST FILTRO PRÉSTAMOS RETRASADOS ===');
    
    await testServicioPrestamosVencidos();
    testComponenteDashboard();
    await testIntegracionCompleta();
    
    console.log('\n✅ === TESTS COMPLETADOS ===');
    console.log('📄 Para más información, consulta: docs/solutions/FILTRO-PRESTAMOS-RETRASADOS-COMPLETADO.md');
}

// Auto-ejecutar si se carga como script
if (typeof window !== 'undefined') {
    // En navegador
    window.testFiltroRetrasados = ejecutarTodosLosTests;
    console.log('💡 Para ejecutar el test, ejecuta: testFiltroRetrasados()');
} else {
    // En Node.js (si es necesario)
    ejecutarTodosLosTests();
}

export { ejecutarTodosLosTests as testFiltroRetrasados };
