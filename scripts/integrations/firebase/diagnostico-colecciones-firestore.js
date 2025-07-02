/**
 * Script de diagnóstico para verificar la detección de colecciones de Firestore
 * Ejecuta pruebas de detección y muestra estadísticas detalladas
 */

const { firestoreDynamicService } = require('../src/services/firestore/FirestoreDynamicService');

async function diagnosticoColecciones() {
  console.log('='.repeat(60));
  console.log('🔍 DIAGNÓSTICO DE COLECCIONES DE FIRESTORE');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Detección automática de colecciones
    console.log('\n📋 Test 1: Detección automática de colecciones...');
    const detectedCollections = await firestoreDynamicService.detectAvailableCollections();
    console.log(`✅ Colecciones detectadas: ${detectedCollections.length}`);
    console.log('Colecciones encontradas:', detectedCollections);
    
    // Test 2: Verificar colecciones específicas
    console.log('\n🎯 Test 2: Verificación de colecciones específicas...');
    const collectionesToTest = ['material_deportivo', 'usuarios', 'actividades', 'prestamos'];
    
    for (const collection of collectionesToTest) {
      try {
        const documents = await firestoreDynamicService.getCollectionDocuments(collection, 1);
        console.log(`✅ ${collection}: ${documents.length} documentos accesibles`);
      } catch (error) {
        console.log(`❌ ${collection}: Error - ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }
    
    // Test 3: Colecciones disponibles para UI
    console.log('\n🖥️ Test 3: Colecciones disponibles para UI...');
    const uiCollections = await firestoreDynamicService.getAvailableCollectionsAsync();
    console.log(`✅ Colecciones para UI: ${uiCollections.length}`);
    console.log('Colecciones filtradas:', uiCollections);
    
    // Test 4: Comparación con FIRESTORE_CONVERTERS
    console.log('\n🔄 Test 4: Comparación con FIRESTORE_CONVERTERS...');
    const knownCollections = firestoreDynamicService.getAvailableCollections();
    console.log(`📚 Colecciones conocidas: ${knownCollections.length}`);
    console.log('Conocidas:', knownCollections);
    
    const nuevasColecciones = detectedCollections.filter(col => !knownCollections.includes(col));
    const faltantes = knownCollections.filter(col => !detectedCollections.includes(col));
    
    if (nuevasColecciones.length > 0) {
      console.log(`🆕 Nuevas colecciones detectadas: ${nuevasColecciones.join(', ')}`);
    }
    
    if (faltantes.length > 0) {
      console.log(`⚠️ Colecciones no detectadas: ${faltantes.join(', ')}`);
    }
    
    console.log('\n✅ Diagnóstico completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
  
  console.log('='.repeat(60));
}

// Verificar si el script se ejecuta directamente
if (require.main === module) {
  diagnosticoColecciones();
}

module.exports = { diagnosticoColecciones };
