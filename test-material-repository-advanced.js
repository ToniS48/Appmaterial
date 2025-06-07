/**
 * Script de prueba del MaterialRepository
 * Ejecutar en la consola del navegador para probar la carga de materiales
 */

console.log('🧪 Iniciando pruebas del MaterialRepository...');

async function testMaterialRepository() {
  try {
    // Verificar que MaterialRepository esté disponible
    console.log('🔍 Buscando MaterialRepository...');
    
    // Intentar importar o acceder al MaterialRepository
    let MaterialRepository;
    
    // Si está disponible en window
    if (window.MaterialRepository) {
      MaterialRepository = window.MaterialRepository;
      console.log('✅ MaterialRepository encontrado en window');
    } else {
      console.log('⚠️ MaterialRepository no está en window, intentando importar...');
      // Nota: En una app React, esto podría no funcionar directamente
      console.log('💡 Sugerencia: Asegúrate de que MaterialRepository esté disponible globalmente para pruebas');
      return;
    }
    
    // Crear instancia del repositorio
    console.log('🏗️ Creando instancia de MaterialRepository...');
    const materialRepo = new MaterialRepository();
    console.log('✅ Instancia creada:', materialRepo);
    
    // Probar método findMaterialesDisponibles
    console.log('📡 Ejecutando findMaterialesDisponibles()...');
    const materiales = await materialRepo.findMaterialesDisponibles();
    console.log('📦 Materiales obtenidos:', materiales);
    console.log(`📊 Cantidad de materiales: ${materiales.length}`);
    
    if (materiales.length === 0) {
      console.warn('⚠️ No se encontraron materiales disponibles');
      
      // Probar método find general
      console.log('🔍 Probando método find() general...');
      const todosMateriales = await materialRepo.find();
      console.log('📦 Todos los materiales:', todosMateriales);
      console.log(`📊 Total de materiales (todos): ${todosMateriales.length}`);
      
      if (todosMateriales.length === 0) {
        console.error('❌ No hay materiales en la base de datos');
        
        // Verificar la colección directamente
        console.log('🔬 Verificando colección directamente...');
        await verifyCollectionDirectly();
      }
    } else {
      console.log('✅ Materiales cargados exitosamente:');
      materiales.forEach((material, index) => {
        console.log(`  ${index + 1}. ${material.nombre} (${material.tipo}) - Disponible: ${material.cantidadDisponible}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba del MaterialRepository:', error);
    console.error('Stack trace:', error.stack);
    
    // Información adicional de debug
    console.log('🔧 Información de debug:');
    console.log('- Tipo de error:', typeof error);
    console.log('- Mensaje:', error.message);
    console.log('- Nombre:', error.name);
  }
}

async function verifyCollectionDirectly() {
  try {
    console.log('🔬 Verificación directa de la colección Firebase...');
    
    // Acceder a Firestore
    const db = window.db || (window.firebase && window.firebase.firestore());
    if (!db) {
      console.error('❌ No se puede acceder a Firestore');
      return;
    }
    
    console.log('✅ Acceso a Firestore confirmado');
    
    // Verificar la colección usando la API de Firebase
    const { collection, getDocs } = await import('firebase/firestore') || window.firebase.firestore;
    
    if (collection && getDocs) {
      const materialesRef = collection(db, 'material_deportivo');
      const snapshot = await getDocs(materialesRef);
      
      console.log(`📊 Documentos en 'material_deportivo': ${snapshot.size}`);
      
      if (!snapshot.empty) {
        console.log('📄 Primeros documentos:');
        let count = 0;
        snapshot.forEach((doc) => {
          if (count < 3) { // Mostrar solo los primeros 3
            console.log(`  - ID: ${doc.id}`, doc.data());
            count++;
          }
        });
      }
    } else {
      console.error('❌ No se pueden importar funciones de Firestore');
    }
    
  } catch (error) {
    console.error('❌ Error en verificación directa:', error);
  }
}

// Función para exponer MaterialRepository globalmente (para pruebas)
function exposeMaterialRepository() {
  try {
    // Esta función debe ejecutarse desde el contexto de la aplicación React
    console.log('🌐 Intentando exponer MaterialRepository globalmente...');
    
    // Esto debe ser llamado desde un componente React que tenga acceso al MaterialRepository
    console.log('💡 Para usar esto, ejecuta desde un componente React:');
    console.log('   window.MaterialRepository = MaterialRepository;');
    console.log('   window.testMaterialRepository = testMaterialRepository;');
    
  } catch (error) {
    console.error('❌ Error al exponer MaterialRepository:', error);
  }
}

// Ejecutar prueba
testMaterialRepository();

// Exportar funciones para uso manual
window.testMaterialRepository = testMaterialRepository;
window.verifyCollectionDirectly = verifyCollectionDirectly;
window.exposeMaterialRepository = exposeMaterialRepository;

console.log('💡 Script de prueba listo. Funciones disponibles:');
console.log('  - window.testMaterialRepository()');
console.log('  - window.verifyCollectionDirectly()');
console.log('  - window.exposeMaterialRepository()');
