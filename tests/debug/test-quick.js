// Test rápido para MaterialSelector - ejecutar en consola del navegador
console.log('🧪 === TEST MATERIAL SELECTOR ===');

// 1. Verificar que el repositorio está disponible
if (window.materialRepository) {
    console.log('✅ MaterialRepository disponible');
    
    // 2. Obtener materiales disponibles
    window.materialRepository.findMaterialesDisponibles()
        .then(materiales => {
            console.log(`📦 Total materiales: ${materiales?.length || 0}`);
            
            // 3. Filtrar por tipos
            const cuerdas = materiales?.filter(m => m.tipo === 'cuerda') || [];
            const anclajes = materiales?.filter(m => m.tipo === 'anclaje') || [];
            const varios = materiales?.filter(m => m.tipo === 'varios') || [];
            
            console.log(`🪢 Cuerdas: ${cuerdas.length}`);
            console.log(`⚓ Anclajes: ${anclajes.length}`);
            console.log(`🔧 Varios: ${varios.length}`);
            
            // 4. Verificar cuerdas disponibles específicamente
            const cuerdasDisponibles = cuerdas.filter(c => c.estado === 'disponible');
            console.log(`✅ Cuerdas disponibles: ${cuerdasDisponibles.length}`);
            
            cuerdasDisponibles.forEach((cuerda, idx) => {
                console.log(`🪢 Cuerda ${idx + 1}:`, {
                    nombre: cuerda.nombre,
                    estado: cuerda.estado,
                    cantidadDisponible: cuerda.cantidadDisponible,
                    codigo: cuerda.codigo
                });
            });
            
            // 5. Probar la función getMaterialStock
            if (window.getMaterialStock) {
                cuerdasDisponibles.forEach(cuerda => {
                    const stock = window.getMaterialStock(cuerda);
                    console.log(`📊 Stock calculado para ${cuerda.nombre}: ${stock}`);
                });
            }
            
        })
        .catch(error => {
            console.error('❌ Error:', error);
        });
        
} else {
    console.log('❌ MaterialRepository no disponible');
    console.log('💡 Asegúrate de que la aplicación esté cargada y en modo desarrollo');
}
