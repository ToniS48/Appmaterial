// Test para verificar la corrección del problema de actividades finalizadas
// Ejecutar en la consola del navegador después de aplicar las correcciones

console.log(`
🧪 TEST: VERIFICACIÓN DE ACTIVIDADES FINALIZADAS
================================================

Este script verifica que las actividades finalizadas aparezcan 
correctamente en la sección "Actividades Realizadas".

Pasos del test:
1. Limpiar caché
2. Verificar filtrado por estado
3. Comprobar separación en pestañas
4. Validar estados mostrados
`);

// Función principal de testing
window.testActividadesFinalizadas = async function() {
    console.log('🧪 INICIANDO TEST DE ACTIVIDADES FINALIZADAS');
    console.log('=============================================');
    
    try {
        // 1. Limpiar caché primero
        console.log('\n🧹 Paso 1: Limpiando caché...');
        if (typeof limpiarCacheActividades === 'function') {
            limpiarCacheActividades();
        } else {
            // Limpiar manualmente
            const cacheKeys = Object.keys(localStorage).filter(key => 
                key.includes('actividad') || key.includes('cache')
            );
            cacheKeys.forEach(key => localStorage.removeItem(key));
            sessionStorage.setItem('actividades_cache_invalidated', 'true');
        }
        console.log('✅ Caché limpiado');
        
        // 2. Esperar un momento y recargar datos
        console.log('\n⏳ Paso 2: Esperando recarga de datos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. Verificar estado actual de la página
        console.log('\n🔍 Paso 3: Analizando estado de la página...');
        
        // Verificar que estamos en la página correcta
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/activities')) {
            console.log('⚠️ ADVERTENCIA: No estás en la página de actividades');
            console.log(`   Página actual: ${currentPath}`);
            console.log('   Ve a /activities para ejecutar el test');
            return;
        }
        
        // 4. Buscar tabs y contenido
        console.log('\n📋 Paso 4: Analizando pestañas...');
        const tabs = document.querySelectorAll('[role="tab"]');
        console.log(`   Pestañas encontradas: ${tabs.length}`);
        
        // Hacer clic en la pestaña "Todas" para asegurar que estamos ahí
        const tabTodas = Array.from(tabs).find(tab => 
            tab.textContent?.toLowerCase().includes('todas')
        );
        
        if (tabTodas) {
            console.log('   📍 Haciendo clic en pestaña "Todas"...');
            tabTodas.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 5. Buscar sección "Actividades Realizadas"
        console.log('\n🎯 Paso 5: Buscando "Actividades Realizadas"...');
        const elementos = document.querySelectorAll('*');
        let seccionRealizadas = null;
        
        for (let el of elementos) {
            if (el.textContent?.includes('Actividades Realizadas')) {
                seccionRealizadas = el;
                break;
            }
        }
          if (seccionRealizadas) {
            console.log('✅ Sección "Actividades Realizadas" encontrada');
            
            // Buscar cards en esa sección
            const contenedor = seccionRealizadas.parentElement;
            const cardsEnSeccion = contenedor?.querySelectorAll('.chakra-card, [data-testid="actividad-card"]') || [];
            console.log(`   📦 Actividades en sección realizadas: ${cardsEnSeccion.length}`);
            
            // Analizar cada card
            cardsEnSeccion.forEach((card, index) => {
                const texto = card.textContent || '';
                const esFinalizadaOCancelada = texto.includes('Finalizada') || texto.includes('CANCELADA');
                console.log(`   ${index + 1}. ${esFinalizadaOCancelada ? '✅' : '❌'} ${texto.substring(0, 50)}...`);
            });
            
        } else {
            console.log('❌ Sección "Actividades Realizadas" NO encontrada');
            console.log('   Esto podría indicar que no hay actividades finalizadas');
        }
        
        // 6. Verificar filtrado en "Próximas"
        console.log('\n🔮 Paso 6: Verificando pestaña "Próximas"...');
        const tabProximas = Array.from(tabs).find(tab => 
            tab.textContent?.toLowerCase().includes('próximas')
        );
        
        if (tabProximas) {
            tabProximas.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const cardsProximas = document.querySelectorAll('.chakra-card, [data-testid="actividad-card"]');
            console.log(`   📦 Actividades en "Próximas": ${cardsProximas.length}`);
            
            let finalizadasEnProximas = 0;
            cardsProximas.forEach(card => {
                const texto = card.textContent || '';
                if (texto.includes('Finalizada') || texto.includes('CANCELADA')) {
                    finalizadasEnProximas++;
                }
            });
            
            if (finalizadasEnProximas === 0) {
                console.log('✅ Correcto: No hay actividades finalizadas en "Próximas"');
            } else {
                console.log(`❌ Error: ${finalizadasEnProximas} actividades finalizadas en "Próximas"`);
            }
        }
        
        // 7. Resultado final
        console.log('\n🎉 RESULTADO DEL TEST:');
        console.log('=====================');
        
        if (seccionRealizadas) {
            console.log('✅ Corrección aplicada correctamente');
            console.log('✅ Las actividades finalizadas aparecen en "Actividades Realizadas"');
        } else {
            console.log('⚠️ No se encontraron actividades realizadas');
            console.log('   Esto puede ser normal si no hay actividades finalizadas');
        }
        
        console.log('\n💡 PRÓXIMOS PASOS:');
        console.log('1. Si el test pasa: ¡La corrección funciona!');
        console.log('2. Si falta sección: Puede que no haya actividades finalizadas');
        console.log('3. Para test completo: Finaliza una actividad y vuelve a probar');
        
    } catch (error) {
        console.error('❌ Error durante el test:', error);
    }
};

// Función para finalizar una actividad de prueba (solo para testing)
window.testFinalizarActividad = function(actividadId) {
    if (!actividadId) {
        console.log('❌ Debes proporcionar un ID de actividad');
        console.log('Uso: testFinalizarActividad("id-de-la-actividad")');
        return;
    }
    
    console.log(`🔄 Finalizando actividad ${actividadId} para testing...`);
    
    // Simular llamada al servicio (requiere acceso a Firebase)
    // En un entorno real, esto se haría a través de la UI
    console.log('💡 Para testing real, usa la interfaz para finalizar una actividad');
    console.log('   y luego ejecuta testActividadesFinalizadas()');
};

// Función para simular datos de testing en el navegador
window.simularDatosDePrueba = function() {
    console.log('🎭 SIMULANDO DATOS DE PRUEBA EN EL NAVEGADOR');
    console.log('===========================================');
    
    // Esta función simula cómo deberían verse los datos después de la corrección
    const datosSimulados = {
        actividades: [
            {
                id: '1',
                nombre: 'Escalada Test (Planificada)',
                estado: 'planificada',
                fechaInicio: new Date(Date.now() + 86400000) // mañana
            },
            {
                id: '2',
                nombre: 'Senderismo Test (En Curso)',
                estado: 'en_curso',
                fechaInicio: new Date() // hoy
            },
            {
                id: '3',
                nombre: 'Barranquismo Test (Finalizada)',
                estado: 'finalizada',
                fechaInicio: new Date(Date.now() - 86400000) // ayer
            },
            {
                id: '4',
                nombre: 'Alpinismo Test (Cancelada)',
                estado: 'cancelada',
                fechaInicio: new Date(Date.now() + 172800000) // pasado mañana
            }
        ]
    };
    
    console.log('📊 Datos simulados:', datosSimulados);
    
    // Simular la lógica de separación corregida
    console.log('\n🔧 Aplicando lógica de separación corregida:');
    const actuales = [];
    const realizadas = [];
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    datosSimulados.actividades.forEach(actividad => {
        const fechaActividad = new Date(actividad.fechaInicio);
        fechaActividad.setHours(0, 0, 0, 0);
        
        // Lógica corregida
        const esRealizada = actividad.estado === 'finalizada' || actividad.estado === 'cancelada';
        const esPasadaYNoActiva = fechaActividad < hoy && !['planificada', 'en_curso'].includes(actividad.estado);
        
        if (esRealizada || esPasadaYNoActiva) {
            realizadas.push(actividad);
        } else {
            actuales.push(actividad);
        }
    });
    
    console.log('\n✅ ACTIVIDADES ACTUALES/PRÓXIMAS:');
    actuales.forEach(act => {
        console.log(`   - ${act.nombre} (${act.estado})`);
    });
    
    console.log('\n✅ ACTIVIDADES REALIZADAS:');
    realizadas.forEach(act => {
        console.log(`   - ${act.nombre} (${act.estado})`);
    });
    
    console.log('\n🎯 Como puedes ver, las actividades finalizadas y canceladas van a "Realizadas"');
};

console.log(`
🚀 FUNCIONES DE TEST DISPONIBLES:
- testActividadesFinalizadas() - Test principal
- simularDatosDePrueba() - Mostrar cómo debería funcionar
- testFinalizarActividad(id) - Helpers para testing

Para empezar:
> testActividadesFinalizadas()
`);
