/**
 * Script de verificación rápida de Firebase
 * Copia y pega este código en la consola del navegador mientras la app está cargada
 */

(async function verificacionRapidaFirebase() {
  console.log('🔥 VERIFICACIÓN RÁPIDA FIREBASE');
  console.log('================================');
  
  try {
    // 1. Verificar variables globales
    console.log('\n1️⃣ Verificando variables globales...');
    console.log('window.db:', typeof window.db, window.db);
    console.log('window.materialRepository:', typeof window.materialRepository, window.materialRepository);
    
    // 2. Verificar Firebase directamente
    if (window.db) {
      console.log('\n2️⃣ Probando acceso directo a Firestore...');
      
      try {
        // Usar Firebase v9+ syntax
        const { collection, getDocs } = await import('firebase/firestore');
        const materialesRef = collection(window.db, 'material_deportivo');
        const snapshot = await getDocs(materialesRef);
        
        console.log('✅ Conexión Firebase exitosa');
        console.log(`📊 Documentos en colección: ${snapshot.size}`);
        
        if (snapshot.empty) {
          console.warn('⚠️ La colección "material_deportivo" está vacía');
          console.log('💡 ¿Quieres crear materiales de prueba? Ejecuta: crearMaterialTest()');
        } else {
          console.log('📄 Primeros documentos:');
          let count = 0;
          snapshot.forEach(doc => {
            if (count < 2) {
              console.log(`  - ${doc.id}:`, doc.data());
              count++;
            }
          });
        }
      } catch (importError) {
        console.error('❌ Error importando Firebase:', importError);
        
        // Intentar con la sintaxis legacy si existe
        if (window.firebase) {
          console.log('🔄 Intentando con Firebase legacy...');
          const db = window.firebase.firestore();
          const snapshot = await db.collection('material_deportivo').get();
          console.log(`📊 Documentos (legacy): ${snapshot.size}`);
        }
      }
    } else {
      console.error('❌ window.db no está disponible');
      console.log('💡 Asegúrate de que la aplicación esté completamente cargada');
    }
    
    // 3. Probar MaterialRepository si está disponible
    if (window.materialRepository) {
      console.log('\n3️⃣ Probando MaterialRepository...');
      
      try {
        console.log('🔍 Ejecutando findMaterialesDisponibles()...');
        const materiales = await window.materialRepository.findMaterialesDisponibles();
        console.log('📦 Resultado:', materiales);
        console.log(`📊 Cantidad: ${materiales ? materiales.length : 'undefined'}`);
        
        if (materiales && materiales.length > 0) {
          console.log('✅ MaterialRepository funciona correctamente');
          console.log('📋 Primer material:', materiales[0]);
        } else {
          console.warn('⚠️ MaterialRepository no retorna materiales');
        }
      } catch (repoError) {
        console.error('❌ Error en MaterialRepository:', repoError);
      }
    }
    
    // 4. Verificar datos de debug del componente
    console.log('\n4️⃣ Verificando datos de debug del componente...');
    if (window.lastLoadedMateriales) {
      console.log('📦 Últimos materiales cargados:', window.lastLoadedMateriales);
    }
    if (window.lastMaterialError) {
      console.log('❌ Último error:', window.lastMaterialError);
    }
    
    console.log('\n✅ VERIFICACIÓN COMPLETADA');
    
  } catch (error) {
    console.error('❌ Error durante verificación:', error);
  }
})();

// Función para crear material de prueba rápido
window.crearMaterialTest = async function() {
  try {
    console.log('🏗️ Creando material de test...');
    
    const { collection, addDoc } = await import('firebase/firestore');
    const docRef = await addDoc(collection(window.db, 'material_deportivo'), {
      nombre: 'Test Material',
      tipo: 'varios',
      descripcion: 'Material de prueba rápida',
      estado: 'Disponible',
      cantidad: 1,
      cantidadDisponible: 1,
      codigo: 'TEST-QUICK',
      categoria: 'Test',
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    });
    
    console.log('✅ Material de test creado:', docRef.id);
    console.log('💡 Ahora recarga la página o ejecuta una nueva verificación');
    
  } catch (error) {
    console.error('❌ Error creando material test:', error);
  }
};

console.log('🚀 Script de verificación rápida cargado');
console.log('💡 También disponible: crearMaterialTest()');
