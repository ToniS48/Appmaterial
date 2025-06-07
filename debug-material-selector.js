// Script de diagnóstico para MaterialSelector
// Ejecutar en la consola del navegador

console.log('🔍 DIAGNÓSTICO MATERIAL SELECTOR - INICIANDO');

// Test 1: Verificar Firebase
console.log('📡 Test 1: Verificando Firebase...');
try {
  if (window.firebase || window.db) {
    console.log('✅ Firebase disponible');
  } else {
    console.log('❌ Firebase no disponible globalmente');
  }
} catch (e) {
  console.log('❌ Error verificando Firebase:', e);
}

// Test 2: Verificar MaterialRepository
console.log('🏗️ Test 2: Verificando MaterialRepository...');
try {
  // Intentar importar MaterialRepository
  const testRepo = async () => {
    const { MaterialRepository } = await import('/src/repositories/MaterialRepository.ts');
    console.log('✅ MaterialRepository importado');
    
    const repo = new MaterialRepository();
    console.log('✅ MaterialRepository instanciado');
    
    // Test básico
    console.log('🧪 Ejecutando findMaterialesDisponibles...');
    const materiales = await repo.findMaterialesDisponibles();
    console.log('📦 Resultado:', materiales);
    console.log('📊 Cantidad:', materiales?.length || 0);
    
    return materiales;
  };
  
  testRepo().catch(e => console.error('❌ Error en test repository:', e));
} catch (e) {
  console.log('❌ Error importando MaterialRepository:', e);
}

// Test 3: Verificar estado de componente MaterialSelector
console.log('🎯 Test 3: Verificando estado MaterialSelector...');
setTimeout(() => {
  // Buscar elementos del MaterialSelector en el DOM
  const materialElements = document.querySelectorAll('[data-testid*="material"], .material-selector, .material-card');
  console.log('🔍 Elementos de material encontrados:', materialElements.length);
  
  const spinners = document.querySelectorAll('.chakra-spinner');
  console.log('⏳ Spinners activos:', spinners.length);
  
  const errorElements = document.querySelectorAll('[style*="red"], .error, [color="red.700"]');
  console.log('❌ Elementos de error:', errorElements.length);
  
  if (errorElements.length > 0) {
    errorElements.forEach((el, i) => {
      console.log(`Error ${i + 1}:`, el.textContent);
    });
  }
}, 2000);

// Test 4: Simular carga manual
console.log('🔄 Test 4: Simulando carga manual...');
window.testMaterialLoad = async () => {
  try {
    console.log('🚀 Iniciando carga manual de materiales...');
    
    // Acceder al Firebase directamente
    if (window.firebase && window.firebase.firestore) {
      const db = window.firebase.firestore();
      const collection = db.collection('material_deportivo');
      const snapshot = await collection.get();
      
      console.log('📊 Documentos en colección:', snapshot.size);
      console.log('📋 Está vacía:', snapshot.empty);
      
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          console.log('📄 Doc:', doc.id, doc.data());
        });
      }
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      console.log('❌ Firebase Firestore no disponible');
    }
  } catch (error) {
    console.error('❌ Error en carga manual:', error);
  }
};

console.log('💡 Ejecuta window.testMaterialLoad() para test manual');
console.log('🏁 DIAGNÓSTICO COMPLETADO');
