/**
 * Script de verificación de conexión Firebase y colección de materiales
 * Ejecutar en la consola del navegador mientras la app está cargada
 */

console.log('🔍 Verificando conexión Firebase y datos de materiales...');

async function verifyFirebaseConnection() {
  try {
    // Verificar que Firebase esté importado
    const { collection, getDocs, doc, addDoc } = await import('https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js');
    console.log('✅ Firebase SDK importado correctamente');
    
    // Acceder a la instancia de db desde window (si está disponible)
    if (!window.db && !db) {
      console.error('❌ No se encontró la instancia de Firestore');
      return;
    }
    
    const firestore = window.db || db;
    console.log('✅ Instancia de Firestore encontrada:', firestore);
    
    // Intentar obtener la colección de materiales
    console.log('📡 Intentando acceder a la colección "material_deportivo"...');
    const materialesRef = collection(firestore, 'material_deportivo');
    console.log('✅ Referencia de colección creada:', materialesRef);
    
    // Obtener documentos
    console.log('📖 Obteniendo documentos de la colección...');
    const snapshot = await getDocs(materialesRef);
    console.log('✅ Snapshot obtenido:', snapshot);
    
    console.log(`📊 Número de documentos encontrados: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.warn('⚠️ La colección está vacía. Creando material de prueba...');
      
      // Crear un material de prueba
      const materialPrueba = {
        nombre: 'Material de Prueba',
        tipo: 'Deportivo',
        descripcion: 'Material creado para verificar la conexión',
        estado: 'Disponible',
        cantidad: 10,
        cantidadDisponible: 10,
        codigo: 'TEST-001',
        categoria: 'Prueba',
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      };
      
      const docRef = await addDoc(materialesRef, materialPrueba);
      console.log('✅ Material de prueba creado con ID:', docRef.id);
      
      // Volver a verificar
      const newSnapshot = await getDocs(materialesRef);
      console.log(`📊 Documentos después de crear prueba: ${newSnapshot.size}`);
    } else {
      console.log('📄 Documentos encontrados:');
      snapshot.forEach((doc, index) => {
        console.log(`  ${index + 1}. ID: ${doc.id}`, doc.data());
      });
    }
    
    console.log('✅ Verificación completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar verificación
verifyFirebaseConnection();

// También exportar para uso manual
window.verifyFirebaseConnection = verifyFirebaseConnection;
console.log('💡 Script de verificación listo. También puedes ejecutar: window.verifyFirebaseConnection()');
