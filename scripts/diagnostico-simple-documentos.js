/**
 * Script simple de diagnóstico para documentos desactualizados
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Inicializar Firebase Admin
console.log('🔧 Inicializando Firebase Admin...');
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
    console.log('✅ Firebase Admin inicializado con variables de entorno');
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function diagnosticoSimple() {
  console.log('\n🔍 DIAGNÓSTICO SIMPLE DE DOCUMENTOS');
  console.log('===================================');
  
  try {
    const collectionName = 'usuarios';
    console.log(`\n📋 Analizando colección: ${collectionName}`);
    
    // Obtener documentos de muestra
    console.log('🔍 Obteniendo documentos de muestra...');
    const snapshot = await db.collection(collectionName).limit(20).get();
    
    if (snapshot.empty) {
      console.log('❌ No se encontraron documentos en la colección');
      return;
    }
    
    console.log(`📊 Documentos encontrados: ${snapshot.size}`);
    
    // Analizar estructura de cada documento
    const fieldCounts = {};
    const documents = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const fields = Object.keys(data);
      const docInfo = {
        id: doc.id,
        fieldCount: fields.length,
        fields: fields
      };
      documents.push(docInfo);
      
      // Contar frecuencia de cada campo
      fields.forEach(field => {
        fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      });
    });
    
    // Mostrar estadísticas por documento
    console.log('\n📄 Análisis por documento:');
    const fieldCountStats = {};
    documents.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.id.substring(0, 8)}... → ${doc.fieldCount} campos`);
      fieldCountStats[doc.fieldCount] = (fieldCountStats[doc.fieldCount] || 0) + 1;
    });
    
    // Estadísticas de campos por documento
    console.log('\n📊 Distribución de número de campos:');
    Object.entries(fieldCountStats)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([count, docs]) => {
        console.log(`  - ${count} campos: ${docs} documentos`);
      });
    
    // Campos más comunes
    console.log('\n📋 Campos más comunes:');
    const sortedFields = Object.entries(fieldCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20);
    
    sortedFields.forEach(([field, count]) => {
      const percentage = Math.round((count / snapshot.size) * 100);
      console.log(`  - ${field}: ${count}/${snapshot.size} (${percentage}%)`);
    });
    
    // Identificar campos que no están en todos los documentos
    console.log('\n🔍 Campos que no están en todos los documentos:');
    const missingFields = Object.entries(fieldCounts)
      .filter(([field, count]) => count < snapshot.size)
      .sort(([,a], [,b]) => a - b);
    
    if (missingFields.length > 0) {
      missingFields.forEach(([field, count]) => {
        const missing = snapshot.size - count;
        console.log(`  - ${field}: falta en ${missing} documentos`);
      });
    } else {
      console.log('  ✅ Todos los campos están presentes en todos los documentos');
    }
    
    console.log('\n✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n🔧 Cerrando conexión...');
    process.exit(0);
  }
}

diagnosticoSimple();
