// Script para corregir valores NaN en materiales
// Ejecutar en la consola del navegador después de cargar la aplicación

console.log('🔧 === SCRIPT DE CORRECCIÓN DE VALORES NaN (MEJORADO) ===');

/**
 * Función mejorada para detectar valores NaN y problemáticos
 */
function esValorProblematico(valor) {
    return valor === null || 
           valor === undefined || 
           isNaN(valor) || 
           valor === 'NaN' || 
           (typeof valor === 'string' && valor.toLowerCase() === 'nan') ||
           (typeof valor === 'number' && !isFinite(valor));
}

async function corregirValoresNaN() {
    try {
        console.log('1️⃣ Verificando servicios...');
        
        if (!window.materialService) {
            console.error('❌ materialService no disponible');
            console.log('💡 Asegúrate de estar en la aplicación con la sesión iniciada');
            return;
        }

        console.log('2️⃣ Obteniendo materiales...');
        const materiales = await window.materialService.listarMateriales();
        console.log(`📦 Total materiales: ${materiales.length}`);

        console.log('3️⃣ Analizando problemas de datos...');
        const materialesProblematicos = [];

        materiales.forEach((material, index) => {
            const problemas = [];
            
            // Verificar campo cantidad con detección mejorada
            if (esValorProblematico(material.cantidad)) {
                problemas.push(`cantidad: ${material.cantidad} (${typeof material.cantidad}) → PROBLEMÁTICO`);
            }
            
            // Verificar campo cantidadDisponible con detección mejorada  
            if (material.cantidadDisponible !== undefined && esValorProblematico(material.cantidadDisponible)) {
                problemas.push(`cantidadDisponible: ${material.cantidadDisponible} (${typeof material.cantidadDisponible}) → PROBLEMÁTICO`);
            }
            
            if (problemas.length > 0) {
                materialesProblematicos.push({
                    material,
                    problemas,
                    index: index + 1
                });
            }
        });

        console.log(`🚨 Materiales con problemas: ${materialesProblematicos.length}`);
        
        if (materialesProblematicos.length === 0) {
            console.log('✅ No se encontraron problemas de datos NaN');
            return;
        }

        // Mostrar problemas encontrados
        console.log('📋 Detalle de problemas:');
        materialesProblematicos.forEach(({ material, problemas, index }) => {
            console.log(`   ${index}. ${material.nombre} (${material.id})`);
            console.log(`      Tipo: ${material.tipo}`);
            problemas.forEach(problema => {
                console.log(`      - ${problema}`);
            });
        });

        // Preguntar confirmación para corregir
        const confirmar = confirm(`Se encontraron ${materialesProblematicos.length} materiales con problemas.\n¿Deseas corregirlos automáticamente?`);
        
        if (!confirmar) {
            console.log('❌ Corrección cancelada por el usuario');
            return;
        }

        console.log('4️⃣ Aplicando correcciones...');
        let corregidos = 0;

        for (const { material } of materialesProblematicos) {
            try {
                const datosCorregidos = {};
                
                // Corregir cantidad
                if (isNaN(Number(material.cantidad)) || material.cantidad === null || material.cantidad === undefined) {
                    if (material.tipo === 'cuerda') {
                        datosCorregidos.cantidad = 1;
                    } else {
                        // Para anclajes y varios, usar un valor por defecto basado en el tipo
                        datosCorregidos.cantidad = material.tipo === 'anclaje' ? 10 : 5;
                    }
                    console.log(`   ✏️ ${material.nombre}: cantidad ${material.cantidad} → ${datosCorregidos.cantidad}`);
                }
                
                // Corregir cantidadDisponible
                if (material.cantidadDisponible !== undefined) {
                    if (isNaN(Number(material.cantidadDisponible)) || material.cantidadDisponible === null) {
                        if (material.tipo === 'cuerda') {
                            datosCorregidos.cantidadDisponible = material.estado === 'disponible' ? 1 : 0;
                        } else {
                            datosCorregidos.cantidadDisponible = datosCorregidos.cantidad || Number(material.cantidad) || 0;
                        }
                        console.log(`   ✏️ ${material.nombre}: cantidadDisponible ${material.cantidadDisponible} → ${datosCorregidos.cantidadDisponible}`);
                    }
                }
                
                // Aplicar correcciones si hay cambios
                if (Object.keys(datosCorregidos).length > 0) {
                    await window.materialService.actualizarMaterial(material.id, datosCorregidos);
                    console.log(`   ✅ Corregido: ${material.nombre}`);
                    corregidos++;
                } else {
                    console.log(`   ⚠️ Sin cambios necesarios: ${material.nombre}`);
                }
                
            } catch (error) {
                console.error(`   ❌ Error corrigiendo ${material.nombre}:`, error);
            }
        }

        console.log(`🎉 Corrección completada: ${corregidos}/${materialesProblematicos.length} materiales corregidos`);
        console.log('💡 Recarga la página para ver los cambios');

    } catch (error) {
        console.error('❌ Error durante la corrección:', error);
    }
}

// Función para validar préstamos y mostrar estadísticas
async function diagnosticarPrestamos() {
    try {
        console.log('🔍 === DIAGNÓSTICO DE PRÉSTAMOS ===');
        
        if (!window.PrestamoRepository) {
            console.error('❌ PrestamoRepository no disponible');
            return;
        }

        const prestamoRepo = new window.PrestamoRepository();
        const materiales = await window.materialService.listarMateriales();
        
        console.log('📊 Análisis de préstamos por material:');
        
        for (let i = 0; i < Math.min(5, materiales.length); i++) {
            const material = materiales[i];
            try {
                const cantidadPrestada = await prestamoRepo.getCantidadPrestada(material.id);
                const prestamosActivos = await prestamoRepo.findPrestamos({
                    materialId: material.id,
                    where: [{ field: 'estado', operator: '!=', value: 'devuelto' }]
                });
                
                console.log(`📦 ${material.nombre} (${material.tipo})`);
                console.log(`   📊 Cantidad total: ${material.cantidad}`);
                console.log(`   📋 Cantidad prestada: ${cantidadPrestada}`);
                console.log(`   📄 Préstamos activos: ${prestamosActivos.length}`);
                
                if (prestamosActivos.length > 0) {
                    prestamosActivos.forEach((prestamo, index) => {
                        console.log(`     ${index + 1}. Estado: ${prestamo.estado}, Cantidad: ${prestamo.cantidadPrestada}`);
                    });
                }
                
                // Validación
                const sumaReal = prestamosActivos.reduce((sum, p) => sum + (p.cantidadPrestada || 1), 0);
                if (sumaReal !== cantidadPrestada) {
                    console.warn(`   ⚠️ INCONSISTENCIA: Suma real (${sumaReal}) != getCantidadPrestada (${cantidadPrestada})`);
                }
                
            } catch (error) {
                console.error(`   ❌ Error analizando ${material.nombre}:`, error);
            }
        }
        
    } catch (error) {
        console.error('❌ Error en diagnóstico de préstamos:', error);
    }
}

// Exponer funciones globalmente
window.corregirValoresNaN = corregirValoresNaN;
window.diagnosticarPrestamos = diagnosticarPrestamos;

console.log('📋 Funciones disponibles:');
console.log('   corregirValoresNaN() - Corregir valores NaN en materiales');
console.log('   diagnosticarPrestamos() - Analizar consistencia de préstamos');
console.log('');
console.log('🚀 Para empezar, ejecuta: corregirValoresNaN()');
