// Script para probar si el error de índice de Firebase se ha resuelto
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, getDocs } = require('firebase/firestore');

// Configuración de Firebase (usando variables de entorno del proyecto)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBQ4j4-GnYrXXBg-zd-KE6Y9ZXl9KH-JK0",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "fichamaterial.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "fichamaterial",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "fichamaterial.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

async function testFirestoreIndex() {
  try {
    console.log('🔧 Inicializando Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('📋 Probando consulta que causaba el error de índice...');
    
    // Esta es la consulta que causaba el error de índice
    const q = query(
      collection(db, 'prestamos'),
      where('actividadId', '==', 'test-actividad-id'),
      orderBy('fechaPrestamo', 'desc')
    );

    console.log('🔍 Ejecutando consulta...');
    const querySnapshot = await getDocs(q);
    
    console.log('✅ ¡Consulta ejecutada exitosamente!');
    console.log(`📊 Número de documentos encontrados: ${querySnapshot.size}`);
    
    if (querySnapshot.size > 0) {
      console.log('📝 Primeros resultados:');
      querySnapshot.forEach((doc, index) => {
        if (index < 3) { // Mostrar solo los primeros 3
          console.log(`  - ${doc.id}:`, doc.data());
        }
      });
    } else {
      console.log('ℹ️  No se encontraron préstamos para la actividad de prueba (esto es normal)');
    }

    console.log('\n🎉 El índice de Firebase está funcionando correctamente!');
    console.log('✅ El error "The query requires an index" ha sido resuelto.');

  } catch (error) {
    console.error('❌ Error al probar el índice:', error);
    
    if (error.message.includes('index')) {
      console.log('\n🔧 El error de índice persiste. Posibles causas:');
      console.log('1. Los índices aún se están construyendo (puede tomar varios minutos)');
      console.log('2. Se necesita un índice adicional');
      console.log('3. La configuración del índice no coincide exactamente con la consulta');
    }
  }
}

// Ejecutar la prueba
console.log('🚀 Iniciando prueba del índice de Firebase Firestore...\n');
testFirestoreIndex();
