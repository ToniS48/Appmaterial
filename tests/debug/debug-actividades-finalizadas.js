// Script de debugging para diagnosticar el problema de actividades finalizadas
// Ejecutar en la consola del navegador cuando estés en la página de actividades

console.log(`
🐛 DEBUG: ACTIVIDADES FINALIZADAS
===================================

Este script te ayudará a diagnosticar por qué las actividades finalizadas
no aparecen correctamente en la sección "Actividades Realizadas".

Instrucciones:
1. Ve a la página de actividades (/activities)
2. Abre la consola del navegador (F12)
3. Ejecuta: debugActividadesFinalizadas()
4. Revisa los resultados y compártelos si es necesario
`);

// Función para debuggear actividades finalizadas
window.debugActividadesFinalizadas = function() {
    console.log('🔍 DEBUGGING ACTIVIDADES FINALIZADAS');
    console.log('====================================');
    
    // 1. Verificar estado de React
    const reactRoot = document.querySelector('#root, [data-reactroot]');
    if (!reactRoot) {
        console.log('❌ No se encontró la app React');
        return;
    }
    
    console.log('✅ App React encontrada');
    
    // 2. Buscar tabs de actividades
    const tabs = document.querySelectorAll('[role="tab"]');
    console.log(`📋 Tabs encontradas: ${tabs.length}`);
    
    tabs.forEach((tab, index) => {
        console.log(`  ${index + 1}. "${tab.textContent}" - Activa: ${tab.getAttribute('aria-selected') === 'true'}`);
    });
    
    // 3. Buscar cards de actividades
    const actividadCards = document.querySelectorAll('[data-testid="actividad-card"], .chakra-card, [class*="card"]');
    console.log(`🎴 Cards de actividades encontradas: ${actividadCards.length}`);
    
    // 4. Analizar estados de actividades
    const estadosEncontrados = {};
    actividadCards.forEach((card, index) => {
        try {
            const cardText = card.textContent || '';
            
            // Buscar indicadores de estado
            const estados = ['Planificada', 'En curso', 'Finalizada', 'CANCELADA'];
            const estadoEncontrado = estados.find(estado => cardText.includes(estado));
            
            if (estadoEncontrado) {
                estadosEncontrados[estadoEncontrado] = (estadosEncontrados[estadoEncontrado] || 0) + 1;
                
                if (estadoEncontrado === 'Finalizada') {
                    console.log(`🎯 ACTIVIDAD FINALIZADA ENCONTRADA: Card ${index + 1}`);
                    console.log(`   Texto: ${cardText.substring(0, 100)}...`);
                    
                    // Verificar en qué sección está
                    const seccionElement = card.closest('[role="tabpanel"]');
                    if (seccionElement) {
                        const tabIndex = seccionElement.getAttribute('data-index') || 'desconocido';
                        console.log(`   📍 Está en la pestaña: ${tabIndex}`);
                    }
                }
            }
        } catch (error) {
            console.warn(`⚠️ Error analizando card ${index + 1}:`, error);
        }
    });
    
    console.log('\n📊 RESUMEN DE ESTADOS:');
    Object.entries(estadosEncontrados).forEach(([estado, count]) => {
        console.log(`   ${estado}: ${count} actividades`);
    });
    
    // 5. Buscar específicamente la sección "Actividades Realizadas"
    const actividadesRealizadas = document.querySelector('*:contains("Actividades Realizadas")');
    if (actividadesRealizadas) {
        console.log('\n✅ Sección "Actividades Realizadas" encontrada');
        const cardsEnSeccion = actividadesRealizadas.parentElement?.querySelectorAll('.chakra-card, [class*="card"]') || [];
        console.log(`   📦 Cards en esta sección: ${cardsEnSeccion.length}`);
    } else {
        console.log('\n❌ Sección "Actividades Realizadas" NO encontrada');
    }
    
    // 6. Verificar datos en localStorage/sessionStorage
    console.log('\n💾 DATOS EN STORAGE:');
    try {
        const cacheKeys = Object.keys(localStorage).filter(key => key.includes('actividad'));
        console.log(`   LocalStorage keys relacionadas: ${cacheKeys.join(', ')}`);
        
        const sessionKeys = Object.keys(sessionStorage).filter(key => key.includes('actividad'));
        console.log(`   SessionStorage keys relacionadas: ${sessionKeys.join(', ')}`);
    } catch (error) {
        console.log('   ⚠️ Error accediendo al storage:', error);
    }
    
    console.log('\n🎯 PRÓXIMOS PASOS:');
    console.log('1. Si hay actividades finalizadas pero no aparecen en "Actividades Realizadas":');
    console.log('   - Verifica que el filtrado en ActividadesPage.tsx esté funcionando');
    console.log('   - Comprueba que el estado de la actividad sea realmente "finalizada"');
    console.log('2. Si no hay actividades finalizadas:');
    console.log('   - Verifica en Firestore que existan actividades con estado "finalizada"');
    console.log('   - Comprueba la función de carga de datos');
    console.log('3. Ejecuta debugCacheActividades() para ver el caché');
};

// Función para debuggear el caché de actividades
window.debugCacheActividades = function() {
    console.log('\n🗄️ DEBUG CACHÉ DE ACTIVIDADES:');
    console.log('==============================');
    
    try {
        // Buscar keys de caché en localStorage
        const cacheKeys = Object.keys(localStorage).filter(key => 
            key.includes('actividad') || key.includes('cache')
        );
        
        cacheKeys.forEach(key => {
            try {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                console.log(`📦 ${key}:`, data);
                
                if (data.actividades && Array.isArray(data.actividades)) {
                    const finalizadas = data.actividades.filter(act => act.estado === 'finalizada');
                    console.log(`   🎯 Actividades finalizadas en caché: ${finalizadas.length}`);
                    finalizadas.forEach(act => {
                        console.log(`      - ${act.nombre} (${act.estado})`);
                    });
                }
            } catch (parseError) {
                console.log(`   ⚠️ Error parseando ${key}:`, parseError);
            }
        });
    } catch (error) {
        console.log('❌ Error accediendo al caché:', error);
    }
};

// Función para limpiar caché y recargar
window.limpiarCacheActividades = function() {
    console.log('🧹 LIMPIANDO CACHÉ DE ACTIVIDADES...');
    
    try {
        const cacheKeys = Object.keys(localStorage).filter(key => 
            key.includes('actividad') || key.includes('cache')
        );
        
        cacheKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`   ✅ Eliminado: ${key}`);
        });
        
        // También limpiar sessionStorage
        sessionStorage.setItem('actividades_cache_invalidated', 'true');
        
        console.log('✅ Caché limpiado. Recarga la página para ver cambios.');
        console.log('🔄 Tip: Presiona Ctrl+R o F5 para recargar');
        
    } catch (error) {
        console.log('❌ Error limpiando caché:', error);
    }
};

console.log(`
🚀 FUNCIONES DISPONIBLES:
- debugActividadesFinalizadas() - Analizar estado actual
- debugCacheActividades() - Revisar caché
- limpiarCacheActividades() - Limpiar caché y forzar recarga

Ejemplo de uso:
> debugActividadesFinalizadas()
`);
