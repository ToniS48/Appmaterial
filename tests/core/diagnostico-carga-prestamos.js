/**
 * 🧪 TEST DE DIAGNÓSTICO: ¿Por qué no cargan los préstamos?
 * 
 * Ejecutar en consola del navegador (F12) para diagnosticar el problema
 */

console.log('🔍 DIAGNÓSTICO: Investigando por qué no cargan los préstamos...\n');

async function diagnosticarCargaPrestamos() {
    console.log('1️⃣ Verificando servicios disponibles...');
    
    // Verificar servicios básicos
    const servicios = {
        prestamoService: !!window.prestamoService,
        listarPrestamos: !!window.prestamoService?.listarPrestamos,
        obtenerPrestamosVencidos: !!window.prestamoService?.obtenerPrestamosVencidos
    };
    
    console.log('📋 Estado de servicios:');
    Object.entries(servicios).forEach(([nombre, disponible]) => {
        console.log(`  ${disponible ? '✅' : '❌'} ${nombre}`);
    });
    
    if (!servicios.prestamoService) {
        console.log('❌ PROBLEMA: prestamoService no está disponible');
        console.log('💡 SOLUCIÓN: Recargar la página');
        return;
    }
    
    console.log('\n2️⃣ Probando carga directa de préstamos...');
    
    try {
        console.log('🔄 Llamando a listarPrestamos()...');
        const startTime = Date.now();
        const prestamos = await window.prestamoService.listarPrestamos();
        const endTime = Date.now();
        
        console.log(`✅ Préstamos obtenidos: ${prestamos.length}`);
        console.log(`⏱️ Tiempo: ${endTime - startTime}ms`);
        
        if (prestamos.length > 0) {
            console.log('📋 Primer préstamo:', {
                id: prestamos[0].id,
                material: prestamos[0].nombreMaterial,
                usuario: prestamos[0].nombreUsuario,
                estado: prestamos[0].estado
            });
        } else {
            console.log('⚠️ No hay préstamos en la base de datos');
        }
        
    } catch (error) {
        console.error('❌ ERROR en listarPrestamos:', error);
        console.log('🔍 Detalles del error:', {
            mensaje: error.message,
            codigo: error.code,
            stack: error.stack?.split('\n')[0]
        });
    }
    
    console.log('\n3️⃣ Verificando autenticación...');
    
    if (window.authDebug) {
        console.log('👤 Usuario actual:', window.authDebug.currentUser);
        console.log('📝 Perfil:', window.authDebug.userProfile);
        console.log('🔄 Loading:', window.authDebug.loading);
    } else {
        console.log('⚠️ authDebug no disponible');
    }
    
    console.log('\n4️⃣ Verificando conexión Firebase...');
    
    try {
        // Test simple de conexión
        if (window.firebase || window.firebaseConfig) {
            console.log('✅ Firebase conectado');
        } else {
            console.log('❌ Firebase no detectado');
        }
    } catch (error) {
        console.log('❌ Error verificando Firebase:', error.message);
    }
    
    console.log('\n5️⃣ Verificando estado del componente...');
    
    // Buscar indicadores en el DOM
    const indicadores = {
        spinner: document.querySelector('[data-testid="spinner"], .chakra-spinner'),
        tablaVacia: document.querySelector('table tbody tr'),
        mensajesError: document.querySelectorAll('[role="alert"]'),
        botonesCarga: document.querySelectorAll('button:contains("Cargar"), button:contains("Refresh")')
    };
    
    console.log('🎨 Estado visual:');
    console.log(`  - Spinner activo: ${indicadores.spinner ? '✅' : '❌'}`);
    console.log(`  - Filas en tabla: ${indicadores.tablaVacia ? '✅' : '❌'}`);
    console.log(`  - Mensajes de error: ${indicadores.mensajesError.length}`);
    console.log(`  - Botones de carga: ${indicadores.botonesCarga.length}`);
    
    console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
    console.log('=====================================');
    
    if (servicios.prestamoService && servicios.listarPrestamos) {
        console.log('✅ Servicios disponibles - El problema no es de código');
        console.log('🔍 Posibles causas:');
        console.log('   - Problema de permisos Firebase');
        console.log('   - Error en consulta/índices');
        console.log('   - Problema de autenticación');
        console.log('   - Error de red/conexión');
    } else {
        console.log('❌ Problema en servicios - Recargar página');
    }
    
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('1. Si servicios OK → Revisar errores de Firebase en Network tab');
    console.log('2. Si hay errores → Revisar permisos de Firestore');
    console.log('3. Si autenticación falla → Relogin');
    console.log('4. Si persiste → Revisar reglas firestore.rules');
}

// Auto-ejecutar
if (typeof window !== 'undefined') {
    window.diagnosticarCargaPrestamos = diagnosticarCargaPrestamos;
    console.log('💡 Ejecuta: diagnosticarCargaPrestamos()');
    
    // También auto-ejecutar después de 2 segundos
    setTimeout(() => {
        console.log('\n🚀 Ejecutando diagnóstico automático...');
        diagnosticarCargaPrestamos();
    }, 2000);
}
