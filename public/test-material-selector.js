// Script de debugging para MaterialSelector
console.log('🔧 Iniciando debugging de MaterialSelector...');

// Función para obtener información del repositorio
const debugMaterialRepository = () => {
  console.log('📦 === DEBUGGING MATERIAL REPOSITORY ===');
  
  if (window.materialRepository) {
    console.log('✅ MaterialRepository disponible');
    
    // Probar obtener materiales
    window.materialRepository.findMaterialesDisponibles()
      .then(materiales => {
        console.log(`📋 Total materiales encontrados: ${materiales?.length || 0}`);
        
        if (materiales && materiales.length > 0) {
          // Filtrar cuerdas
          const cuerdas = materiales.filter(m => m.tipo === 'cuerda');
          console.log(`🧗‍♂️ Cuerdas encontradas: ${cuerdas.length}`);
          
          cuerdas.forEach((cuerda, idx) => {
            console.log(`🪢 Cuerda ${idx + 1}:`, {
              id: cuerda.id,
              nombre: cuerda.nombre,
              estado: cuerda.estado,
              cantidadDisponible: cuerda.cantidadDisponible,
              tipo: cuerda.tipo
            });
          });
          
          // Filtrar otros materiales
          const anclajes = materiales.filter(m => m.tipo === 'anclaje');
          const varios = materiales.filter(m => m.tipo === 'varios');
          
          console.log(`⚓ Anclajes encontrados: ${anclajes.length}`);
          console.log(`🔧 Varios encontrados: ${varios.length}`);
        }
        
        // Exponer para inspección manual
        window.debugMateriales = materiales;
        console.log('🔍 Materiales expuestos en window.debugMateriales');
        
      })
      .catch(error => {
        console.error('❌ Error obteniendo materiales:', error);
      });
  } else {
    console.log('❌ MaterialRepository no disponible');
  }
};

// Función para debuggear el estado del MaterialSelector
const debugMaterialSelector = () => {
  console.log('🎯 === DEBUGGING MATERIAL SELECTOR STATE ===');
  
  // Buscar el componente MaterialSelector en el DOM
  const selectorElements = document.querySelectorAll('[data-testid*="material"], .material-selector, [class*="material-selector"]');
  console.log(`🔍 Elementos encontrados: ${selectorElements.length}`);
  
  // Verificar datos expuestos
  if (window.lastLoadedMateriales) {
    console.log('📦 Últimos materiales cargados:', window.lastLoadedMateriales);
  }
  
  if (window.lastConvertedMateriales) {
    console.log('🔄 Últimos materiales convertidos:', window.lastConvertedMateriales);
  }
  
  if (window.lastMaterialError) {
    console.log('❌ Último error:', window.lastMaterialError);
  }
};

// Ejecutar debugging
setTimeout(() => {
  debugMaterialRepository();
  debugMaterialSelector();
}, 2000);

// Función disponible globalmente
window.debugMaterialSelector = debugMaterialSelector;
window.debugMaterialRepository = debugMaterialRepository;

console.log('✅ Scripts de debugging listos. Usa:');
console.log('- window.debugMaterialRepository() para revisar el repositorio');
console.log('- window.debugMaterialSelector() para revisar el selector');
