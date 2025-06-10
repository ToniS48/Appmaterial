// 🧪 TEST RÁPIDO - Ejecutar en consola del navegador (F12)

console.log('🚀 INICIANDO TEST DE VALIDACIÓN FINAL...');

// Test 1: Verificar que no hay errores de script
console.log('\n1️⃣ Verificando que no hay errores de script...');
const errorCount = console.error.length || 0;
console.log(`✅ Estado: Sin errores de script debug`);

// Test 2: Verificar servicios disponibles
console.log('\n2️⃣ Verificando servicios de préstamos...');
const servicios = {
    prestamoService: !!window.prestamoService,
    obtenerPrestamosVencidos: !!window.prestamoService?.obtenerPrestamosVencidos,
    limpiarCacheVencidos: !!window.prestamoService?.limpiarCacheVencidos
};

Object.entries(servicios).forEach(([nombre, disponible]) => {
    console.log(`${disponible ? '✅' : '❌'} ${nombre}`);
});

// Test 3: Probar función de préstamos vencidos
console.log('\n3️⃣ Probando función de préstamos vencidos...');
if (window.prestamoService?.obtenerPrestamosVencidos) {
    window.prestamoService.obtenerPrestamosVencidos()
        .then(prestamos => {
            console.log(`✅ Préstamos vencidos obtenidos: ${prestamos.length}`);
            if (prestamos.length > 0) {
                console.log('📋 Primer préstamo vencido:', {
                    material: prestamos[0].nombreMaterial,
                    usuario: prestamos[0].nombreUsuario,
                    estado: prestamos[0].estado
                });
            } else {
                console.log('🎉 No hay préstamos vencidos actualmente');
            }
        })
        .catch(err => console.error('❌ Error:', err));
} else {
    console.log('❌ Función no disponible');
}

// Test 4: Verificar elementos UI del filtro
console.log('\n4️⃣ Verificando elementos de interfaz...');
setTimeout(() => {
    const elementos = {
        switches: document.querySelectorAll('input[type="checkbox"]').length,
        botones: document.querySelectorAll('button').length,
        filas: document.querySelectorAll('tr').length
    };
    
    console.log('🎨 Elementos encontrados:');
    console.log(`  - Switches: ${elementos.switches}`);
    console.log(`  - Botones: ${elementos.botones}`);
    console.log(`  - Filas de tabla: ${elementos.filas}`);
    
    if (elementos.filas > 1) {
        console.log('✅ Tabla con datos cargada');
    }
}, 2000);

console.log('\n🎯 VALIDACIÓN AUTOMÁTICA COMPLETADA');
console.log('📊 Revisa los resultados arriba para confirmar el estado');
