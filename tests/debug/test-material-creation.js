/**
 * Script para probar la funcionalidad de creación de actividades con materiales
 * Ejecutar en la consola del navegador mientras la app está cargada
 */

window.testMaterialCreation = async function() {
  console.log('🧪 === TEST DE CREACIÓN DE MATERIALES EN ACTIVIDAD ===');
  console.log('');
  
  // Verificar que estamos en la página correcta
  if (!window.location.pathname.includes('/activities/new')) {
    console.log('❌ Necesitas estar en la página de crear actividad');
    console.log('📍 Navega a: /activities/new');
    return;
  }
  
  console.log('✅ En página de crear actividad');
  console.log('');
  
  // Test 1: Verificar que MaterialSelector está disponible
  const materialSelectors = document.querySelectorAll('[data-testid="material-selector"], .material-selector');
  if (materialSelectors.length === 0) {
    console.log('❌ MaterialSelector no encontrado en la página');
    console.log('💡 Asegúrate de estar en la pestaña de Material');
    return;
  }
  
  console.log('✅ MaterialSelector encontrado');
  
  // Test 2: Verificar que hay materiales disponibles
  if (window.materialRepository) {
    try {
      const materiales = await window.materialRepository.find();
      console.log(`📦 Materiales disponibles: ${materiales.length}`);
      
      if (materiales.length === 0) {
        console.log('⚠️ No hay materiales disponibles');
        console.log('💡 Ejecuta: await crearMaterialesPruebaRapido()');
        return;
      }
      
      console.log('✅ Materiales disponibles para prueba');
      
      // Mostrar algunos materiales disponibles
      const primerosTres = materiales.slice(0, 3);
      console.log('📋 Primeros materiales disponibles:');
      primerosTres.forEach((material, index) => {
        console.log(`  ${index + 1}. ${material.nombre} (${material.tipo}) - Estado: ${material.estado}`);
      });
      
    } catch (error) {
      console.error('❌ Error al cargar materiales:', error);
      return;
    }
  } else {
    console.log('⚠️ MaterialRepository no está disponible globalmente');
  }
  
  console.log('');
  console.log('🎯 === INSTRUCCIONES PARA PROBAR ===');
  console.log('1. Ve a la pestaña "Material" en el formulario');
  console.log('2. Asegúrate de haber asignado un responsable de material en "Participantes"');
  console.log('3. Selecciona algunos materiales usando el selector');
  console.log('4. Observa la consola para ver logs de sincronización');
  console.log('5. Avanza a la siguiente pestaña o guarda la actividad');
  console.log('6. Verifica que los materiales se guardan correctamente');
  console.log('');
  console.log('🔍 Para debuggear, revisa estos logs:');
  console.log('  - "MaterialSelector - useFieldArray"');
  console.log('  - "ANTES DE APPEND - MaterialSelector"');
  console.log('  - "ActividadFormPage handleMaterialUpdate"');
  console.log('  - "Sincronizando materiales desde formulario hacia hook"');
};

window.debugMaterialFlow = function() {
  console.log('🔧 === DEBUG DEL FLUJO DE MATERIALES ===');
  console.log('');
  
  // Verificar React Hook Form
  if (window.React && window.ReactHookForm) {
    console.log('✅ React Hook Form disponible');
  } else {
    console.log('⚠️ React Hook Form no detectado globalmente');
  }
  
  // Verificar estado actual del formulario (si está disponible)
  const formElements = document.querySelectorAll('form');
  console.log(`📝 Formularios encontrados: ${formElements.length}`);
  
  // Verificar campos de materiales
  const materialFields = document.querySelectorAll('[name*="materiales"], [id*="materiales"]');
  console.log(`📦 Campos de materiales encontrados: ${materialFields.length}`);
  
  // Verificar botones de añadir material
  const addButtons = document.querySelectorAll('button[title*="añadir"], button[title*="agregar"], .add-material-btn');
  console.log(`➕ Botones de añadir encontrados: ${addButtons.length}`);
  
  console.log('');
  console.log('💡 Tips para debugging:');
  console.log('  - Abre las DevTools de React para ver el estado del formulario');
  console.log('  - Usa el tab "Components" para inspeccionar MaterialSelector');
  console.log('  - Revisa el tab "Profiler" para ver re-renders');
};

// Auto-ejecutar test básico
console.log('🛠️ Scripts de test de materiales cargados');
console.log('💡 Funciones disponibles:');
console.log('  - testMaterialCreation() - Test completo de creación');
console.log('  - debugMaterialFlow() - Debug del flujo de materiales');
console.log('');
console.log('👉 Ejecuta: testMaterialCreation()');
