/**
 * Script de diagnóstico para documentos desactualizados
 * Analiza en detalle qué documentos no coinciden con el esquema actual
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin
try {
  const serviceAccount = require('../firebase-admin-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.log('⚠️  No se encontró firebase-admin-key.json, usando credenciales por defecto');
  admin.initializeApp();
}

const db = admin.firestore();

// Funciones auxiliares para replicar la funcionalidad del servicio
async function getCollectionDocuments(collectionName, limit = 100) {
  const snapshot = await db.collection(collectionName).limit(limit).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function detectCollectionFields(collectionName, sampleSize = 100) {
  const documents = await getCollectionDocuments(collectionName, sampleSize);
  const fieldCounts = {};
  
  documents.forEach(doc => {
    Object.keys(doc).forEach(field => {
      if (field !== 'id') {
        fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      }
    });
  });
  
  return Object.keys(fieldCounts);
}

async function getCollectionSchema(collectionName) {
  const detectedFields = await detectCollectionFields(collectionName);
  
  // Para este script simplificado, asumimos que todos son campos detectados
  return {
    baseFields: [],
    customFields: [],
    detectedFields: detectedFields.map(name => ({ name, type: 'string' })),
    totalFields: detectedFields.length
  };
}

async function diagnosticoDocumentosDesactualizados() {
  console.log('='.repeat(70));
  console.log('🔍 DIAGNÓSTICO DE DOCUMENTOS DESACTUALIZADOS');
  console.log('='.repeat(70));
  
  try {
    // Test en la colección usuarios donde sabemos que hay diferencias
    const collectionName = 'usuarios';
    console.log(`\n📋 Analizando colección: ${collectionName}`);
    
    // 1. Obtener el esquema actual
    console.log('\n🔧 Paso 1: Obteniendo esquema actual...');
    const schema = await getCollectionSchema(collectionName);
    
    console.log(`📊 Esquema actual:`);
    console.log(`  - Campos detectados: ${schema.detectedFields.length}`);
    
    const allSchemaFields = schema.detectedFields.map(f => f.name);
    console.log(`  - Total campos en esquema: ${allSchemaFields.length}`);
    console.log(`  - Campos: ${allSchemaFields.join(', ')}`);
    
    // 2. Obtener documentos de muestra
    console.log('\n📄 Paso 2: Obteniendo documentos de muestra...');
    const documents = await getCollectionDocuments(collectionName, 20);
    console.log(`📊 Documentos obtenidos: ${documents.length}`);
    
    // 3. Analizar cada documento
    console.log('\n🔍 Paso 3: Analizando documentos individualmente...');
    const analysis = [];
    
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const docFields = Object.keys(doc).filter(field => field !== 'id');
      
      const missingFields = allSchemaFields.filter(field => !(field in doc));
      const extraFields = docFields.filter(field => !allSchemaFields.includes(field));
      
      const docAnalysis = {
        docId: doc.id,
        totalFields: docFields.length,
        schemaFields: allSchemaFields.length,
        missingFields,
        extraFields,
        isOutdated: missingFields.length > 0 || extraFields.length > 0
      };
      
      analysis.push(docAnalysis);
      
      console.log(`\n📄 Documento ${i + 1}: ${doc.id.substring(0, 8)}...`);
      console.log(`  - Campos en documento: ${docFields.length}`);
      console.log(`  - Campos en esquema: ${allSchemaFields.length}`);
      console.log(`  - Campos faltantes: ${missingFields.length} ${missingFields.length > 0 ? `(${missingFields.join(', ')})` : ''}`);
      console.log(`  - Campos extra: ${extraFields.length} ${extraFields.length > 0 ? `(${extraFields.join(', ')})` : ''}`);
      console.log(`  - ¿Desactualizado? ${docAnalysis.isOutdated ? '❌ SÍ' : '✅ NO'}`);
    }
    
    // 4. Resumen de análisis
    console.log('\n📊 Paso 4: Resumen del análisis...');
    const outdatedDocs = analysis.filter(doc => doc.isOutdated);
    const upToDateDocs = analysis.filter(doc => !doc.isOutdated);
    
    console.log(`\n📈 RESUMEN:`);
    console.log(`  - Total documentos analizados: ${analysis.length}`);
    console.log(`  - Documentos desactualizados: ${outdatedDocs.length}`);
    console.log(`  - Documentos actualizados: ${upToDateDocs.length}`);
    console.log(`  - Porcentaje desactualizado: ${Math.round((outdatedDocs.length / analysis.length) * 100)}%`);
    
    // 5. Comparar con diferentes estrategias de detección
    console.log('\n🧪 Paso 5: Probando diferentes estrategias de detección...');
    
    // Estrategia 1: Por diferencia en número de campos
    const docsWithDifferentFieldCount = analysis.filter(doc => doc.totalFields !== doc.schemaFields);
    console.log(`📊 Documentos con diferente número de campos: ${docsWithDifferentFieldCount.length}`);
    
    // Estrategia 2: Por campos faltantes o extra
    const docsWithMissingOrExtra = analysis.filter(doc => doc.missingFields.length > 0 || doc.extraFields.length > 0);
    console.log(`📊 Documentos con campos faltantes o extra: ${docsWithMissingOrExtra.length}`);
    
    // Mostrar detalles de documentos con diferentes números de campos
    if (docsWithDifferentFieldCount.length > 0) {
      console.log('\n🔍 Documentos con diferentes números de campos:');
      docsWithDifferentFieldCount.forEach(doc => {
        console.log(`  - ${doc.docId.substring(0, 8)}...: ${doc.totalFields} campos (esquema: ${doc.schemaFields})`);
        if (doc.missingFields.length > 0) {
          console.log(`    ↳ Faltantes: ${doc.missingFields.join(', ')}`);
        }
        if (doc.extraFields.length > 0) {
          console.log(`    ↳ Extra: ${doc.extraFields.join(', ')}`);
        }
      });
    }
    
    // 6. Análisis de campos más comunes faltantes
    if (outdatedDocs.length > 0) {
      console.log('\n📋 Paso 6: Campos faltantes más comunes...');
      const allMissingFields = outdatedDocs.flatMap(doc => doc.missingFields);
      const missingFieldCounts = {};
      
      allMissingFields.forEach(field => {
        missingFieldCounts[field] = (missingFieldCounts[field] || 0) + 1;
      });
      
      const sortedMissingFields = Object.entries(missingFieldCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      console.log('📊 Top 5 campos faltantes:');
      sortedMissingFields.forEach(([field, count]) => {
        console.log(`  - ${field}: falta en ${count} documentos`);
      });
    }
    
    console.log('\n✅ Diagnóstico de documentos desactualizados completado');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
    console.error('Stack:', error.stack);
  }
  
  console.log('='.repeat(70));
}

// Verificar si el script se ejecuta directamente
if (require.main === module) {
  diagnosticoDocumentosDesactualizados();
}

module.exports = { diagnosticoDocumentosDesactualizados };
