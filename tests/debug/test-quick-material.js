/**
 * Script simplificado para probar materiales en actividades
 * Ejecutar en consola del navegador
 */

window.testAddMaterial = function() {
  console.log('🧪 Test rápido de añadir material');
  
  // Verificar MaterialSelector
  const buttons = document.querySelectorAll('button');
  const addButtons = Array.from(buttons).filter(btn => 
    btn.textContent?.includes('Añadir') || 
    btn.textContent?.includes('Agregar') ||
    btn.textContent?.includes('+')
  );
  
  console.log(`🔘 Botones de añadir encontrados: ${addButtons.length}`);
  
  if (addButtons.length > 0) {
    console.log('💡 Haz clic en uno de los botones de "Añadir material"');
    addButtons.forEach((btn, i) => {
      console.log(`  ${i + 1}. ${btn.textContent?.trim()}`);
    });
  } else {
    console.log('❌ No se encontraron botones de añadir');
    console.log('💡 Asegúrate de estar en la pestaña Material y tener responsable asignado');
  }
};

window.checkMaterialForm = function() {
  console.log('🔍 Verificando estado del formulario de materiales');
  
  // Verificar useFieldArray fields
  const materialsSection = document.querySelector('[data-testid="materials-section"], .materials-section');
  if (materialsSection) {
    console.log('✅ Sección de materiales encontrada');
  } else {
    console.log('❌ Sección de materiales no encontrada');
  }
  
  // Verificar materiales añadidos
  const materialItems = document.querySelectorAll('[data-testid="material-item"], .material-item');
  console.log(`📦 Materiales añadidos: ${materialItems.length}`);
  
  if (materialItems.length > 0) {
    console.log('✅ Hay materiales en el formulario');
  } else {
    console.log('⚠️ No hay materiales añadidos aún');
  }
};

console.log('🛠️ Scripts de test cargados:');
console.log('  - testAddMaterial() - Buscar botones de añadir');
console.log('  - checkMaterialForm() - Verificar estado del formulario');
console.log('');
console.log('👉 Ejecuta: testAddMaterial()');
