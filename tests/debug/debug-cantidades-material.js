// Script de diagnóstico para problemas con cantidades de material
// Ejecutar en la consola del navegador

console.log('🔍 === DIAGNÓSTICO DE CANTIDADES DE MATERIAL ===');

// Función principal de diagnóstico
async function diagnosticarCantidadesMaterial() {
    try {
        console.log('\n1️⃣ Verificando servicios disponibles...');
        
        if (!window.materialService) {
            console.error('❌ materialService no disponible');
            return;
        }
        
        if (!window.PrestamoRepository) {
            console.error('❌ PrestamoRepository no disponible en window');
            // Intentar importar desde el módulo
            try {
                const { PrestamoRepository } = await import('../../src/repositories/PrestamoRepository.ts');
                window.PrestamoRepository = PrestamoRepository;
                console.log('✅ PrestamoRepository importado exitosamente');
            } catch (error) {
                console.error('❌ Error importando PrestamoRepository:', error);
                return;
            }
        }

        console.log('\n2️⃣ Obteniendo lista de materiales...');
        const materiales = await window.materialService.listarMateriales();
        console.log(`📦 Total materiales: ${materiales.length}`);

        console.log('\n3️⃣ Analizando estructura de materiales...');
        materiales.slice(0, 5).forEach((material, index) => {
            console.log(`\n📋 Material ${index + 1}: ${material.nombre}`);
            console.log(`   ID: ${material.id}`);
            console.log(`   Tipo: ${material.tipo}`);
            console.log(`   Estado: ${material.estado}`);
            console.log(`   Cantidad: ${material.cantidad}`);
            console.log(`   CantidadDisponible: ${material.cantidadDisponible}`);
            console.log(`   Longitud: ${material.longitud}`);
            console.log(`   Diámetro: ${material.diametro}`);
        });

        console.log('\n4️⃣ Probando PrestamoRepository...');
        const prestamoRepo = new window.PrestamoRepository();
        
        // Probar con los primeros materiales
        for (let i = 0; i < Math.min(3, materiales.length); i++) {
            const material = materiales[i];
            if (material.id) {
                try {
                    console.log(`\n🔍 Analizando préstamos para: ${material.nombre} (${material.id})`);
                    
                    const cantidadPrestada = await prestamoRepo.getCantidadPrestada(material.id);
                    console.log(`   📊 Cantidad prestada: ${cantidadPrestada}`);
                    
                    // Obtener préstamos activos directamente
                    const prestamosActivos = await prestamoRepo.findPrestamos({
                        materialId: material.id,
                        where: [{ field: 'estado', operator: '!=', value: 'devuelto' }]
                    });
                    
                    console.log(`   📋 Préstamos activos encontrados: ${prestamosActivos.length}`);
                    prestamosActivos.forEach((prestamo, index) => {
                        console.log(`     ${index + 1}. Estado: ${prestamo.estado}, Cantidad: ${prestamo.cantidadPrestada}`);
                    });
                    
                } catch (error) {
                    console.error(`   ❌ Error obteniendo préstamos para ${material.nombre}:`, error);
                }
            }
        }

        console.log('\n5️⃣ Verificando problemas NaN...');
        const materialesConNaN = materiales.filter(m => {
            return isNaN(m.cantidad) || isNaN(m.cantidadDisponible) || 
                   m.cantidad === undefined || m.cantidadDisponible === undefined;
        });
        
        console.log(`🚨 Materiales con problemas de cantidad: ${materialesConNaN.length}`);
        materialesConNaN.slice(0, 3).forEach((material, index) => {
            console.log(`   ${index + 1}. ${material.nombre}`);
            console.log(`      Cantidad: ${material.cantidad} (${typeof material.cantidad})`);
            console.log(`      CantidadDisponible: ${material.cantidadDisponible} (${typeof material.cantidadDisponible})`);
        });

        console.log('\n6️⃣ Verificando estados de préstamos...');
        if (window.prestamoService) {
            try {
                const todosLosPrestamos = await window.prestamoService.listarPrestamos();
                console.log(`📋 Total préstamos: ${todosLosPrestamos.length}`);
                
                const estadosPrestamos = {};
                todosLosPrestamos.forEach(prestamo => {
                    estadosPrestamos[prestamo.estado] = (estadosPrestamos[prestamo.estado] || 0) + 1;
                });
                
                console.log('📊 Distribución de estados de préstamos:');
                Object.entries(estadosPrestamos).forEach(([estado, cantidad]) => {
                    console.log(`   ${estado}: ${cantidad}`);
                });
                
                // Verificar préstamos que no se consideran "devueltos"
                const prestamosNoDevueltos = todosLosPrestamos.filter(p => p.estado !== 'devuelto');
                console.log(`📋 Préstamos NO devueltos: ${prestamosNoDevueltos.length}`);
                
            } catch (error) {
                console.error('❌ Error obteniendo préstamos:', error);
            }
        }

    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
    }
}

// Función para corregir materiales con valores NaN
async function corregirMaterialesNaN() {
    console.log('\n🔧 === CORRECCIÓN DE MATERIALES CON NaN ===');
    
    try {
        const materiales = await window.materialService.listarMateriales();
        const materialesProblematicos = materiales.filter(m => {
            return isNaN(m.cantidad) || isNaN(m.cantidadDisponible) || 
                   m.cantidad === undefined || m.cantidadDisponible === undefined;
        });
        
        console.log(`🚨 Encontrados ${materialesProblematicos.length} materiales con problemas`);
        
        for (const material of materialesProblematicos) {
            console.log(`🔧 Corrigiendo: ${material.nombre}`);
            
            const datosCorregidos = {};
            
            // Corregir cantidad
            if (isNaN(material.cantidad) || material.cantidad === undefined) {
                if (material.tipo === 'cuerda') {
                    datosCorregidos.cantidad = 1;
                } else {
                    datosCorregidos.cantidad = 0;
                }
                console.log(`   Cantidad corregida: ${datosCorregidos.cantidad}`);
            }
            
            // Corregir cantidadDisponible
            if (isNaN(material.cantidadDisponible) || material.cantidadDisponible === undefined) {
                if (material.tipo === 'cuerda') {
                    datosCorregidos.cantidadDisponible = material.estado === 'disponible' ? 1 : 0;
                } else {
                    datosCorregidos.cantidadDisponible = datosCorregidos.cantidad || material.cantidad || 0;
                }
                console.log(`   CantidadDisponible corregida: ${datosCorregidos.cantidadDisponible}`);
            }
            
            // Actualizar en Firebase si hay correcciones
            if (Object.keys(datosCorregidos).length > 0) {
                try {
                    await window.materialService.actualizarMaterial(material.id, datosCorregidos);
                    console.log(`   ✅ Material actualizado: ${material.nombre}`);
                } catch (error) {
                    console.error(`   ❌ Error actualizando ${material.nombre}:`, error);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error en corrección:', error);
    }
}

// Exponer funciones globalmente
window.diagnosticarCantidadesMaterial = diagnosticarCantidadesMaterial;
window.corregirMaterialesNaN = corregirMaterialesNaN;

console.log('\n📋 Funciones disponibles:');
console.log('   diagnosticarCantidadesMaterial() - Analizar problemas');
console.log('   corregirMaterialesNaN() - Corregir valores NaN');
console.log('\n▶️ Ejecuta: diagnosticarCantidadesMaterial()');
