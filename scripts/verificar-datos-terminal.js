#!/usr/bin/env node

/**
 * VERIFICADOR DE DATOS PARA TERMINAL
 * Script robusto para verificar el estado de Firestore desde Node.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICADOR DE DATOS - TERMINAL MODE');
console.log('=====================================\n');

// Función para inicializar Firebase Admin
function inicializarFirebase() {
  if (admin.apps.length > 0) {
    console.log('✅ Firebase ya inicializado');
    return admin.apps[0];
  }

  try {
    // Método 1: Service Account Key
    const serviceAccountPath = path.join(__dirname, '..', 'functions', 'service-account-key.json');
    if (fs.existsSync(serviceAccountPath)) {
      console.log('🔑 Usando Service Account Key...');
      const serviceAccount = require(serviceAccountPath);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'fichamaterial'
      });
    }

    // Método 2: Variable de entorno
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('🔑 Usando GOOGLE_APPLICATION_CREDENTIALS...');
      return admin.initializeApp({
        projectId: 'fichamaterial'
      });
    }

    // Método 3: Application Default Credentials (Firebase CLI)
    console.log('🔑 Usando Application Default Credentials...');
    return admin.initializeApp({
      projectId: 'fichamaterial'
    });

  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error.message);
    console.log('\n💡 SOLUCIONES:');
    console.log('1. Ejecutar: node scripts/configurar-firebase-admin.js');
    console.log('2. Verificar que el service account key esté en functions/service-account-key.json');
    console.log('3. O ejecutar: firebase login && firebase use fichamaterial');
    throw error;
  }
}

async function verificarColecciones() {
  const db = admin.firestore();
  const resultados = {};

  try {
    console.log('📊 VERIFICANDO COLECCIONES...\n');

    // Verificar colección de materiales
    const materialesRef = db.collection('materiales');
    const materialesSnapshot = await materialesRef.limit(5).get();
    resultados.materiales = {
      total: materialesSnapshot.size,
      existe: !materialesSnapshot.empty,
      muestra: []
    };

    if (!materialesSnapshot.empty) {
      materialesSnapshot.forEach(doc => {
        const data = doc.data();
        resultados.materiales.muestra.push({
          id: doc.id,
          nombre: data.nombre || 'Sin nombre',
          categoria: data.categoria || 'Sin categoría'
        });
      });
    }

    // Verificar colección de historial
    const historialRef = db.collection('material_historial');
    const historialSnapshot = await historialRef.limit(5).get();
    resultados.historial = {
      total: historialSnapshot.size,
      existe: !historialSnapshot.empty,
      muestra: []
    };

    if (!historialSnapshot.empty) {
      historialSnapshot.forEach(doc => {
        const data = doc.data();
        resultados.historial.muestra.push({
          id: doc.id,
          materialId: data.materialId,
          tipoEvento: data.tipoEvento,
          fecha: data.fecha ? data.fecha.toDate() : 'Sin fecha'
        });
      });
    }

    // Verificar colección de usuarios
    const usuariosRef = db.collection('users');
    const usuariosSnapshot = await usuariosRef.limit(3).get();
    resultados.usuarios = {
      total: usuariosSnapshot.size,
      existe: !usuariosSnapshot.empty
    };

    return resultados;

  } catch (error) {
    console.error('❌ Error verificando colecciones:', error.message);
    throw error;
  }
}

function mostrarResultados(resultados) {
  console.log('📋 RESULTADOS DE VERIFICACIÓN');
  console.log('============================\n');

  // Materiales
  console.log('📦 MATERIALES:');
  if (resultados.materiales.existe) {
    console.log(`   ✅ ${resultados.materiales.total} documentos encontrados`);
    resultados.materiales.muestra.forEach((material, index) => {
      console.log(`   ${index + 1}. ${material.nombre} (${material.categoria})`);
    });
  } else {
    console.log('   ❌ No se encontraron materiales');
  }
  console.log('');

  // Historial
  console.log('📊 HISTORIAL DE MATERIALES:');
  if (resultados.historial.existe) {
    console.log(`   ✅ ${resultados.historial.total} eventos encontrados`);
    resultados.historial.muestra.forEach((evento, index) => {
      console.log(`   ${index + 1}. ${evento.tipoEvento} - Material: ${evento.materialId}`);
      console.log(`      📅 ${evento.fecha}`);
    });
  } else {
    console.log('   ❌ No se encontraron eventos de historial');
    console.log('   💡 Ejecutar generador de datos para crear eventos');
  }
  console.log('');

  // Usuarios
  console.log('👥 USUARIOS:');
  if (resultados.usuarios.existe) {
    console.log(`   ✅ ${resultados.usuarios.total} usuarios encontrados`);
  } else {
    console.log('   ❌ No se encontraron usuarios');
  }
  console.log('');

  // Recomendaciones
  console.log('🎯 RECOMENDACIONES:');
  if (!resultados.historial.existe) {
    console.log('   📈 Ejecutar: node scripts/generar-datos-terminal.js');
    console.log('   🌐 O usar: scripts de navegador en la consola');
  }
  if (resultados.historial.existe) {
    console.log('   ✅ Los datos están listos para el dashboard');
    console.log('   🚀 Ejecutar: npm start');
  }
}

async function main() {
  try {
    // Inicializar Firebase
    inicializarFirebase();
    console.log('✅ Firebase Admin SDK inicializado\n');

    // Verificar colecciones
    const resultados = await verificarColecciones();
    
    // Mostrar resultados
    mostrarResultados(resultados);

  } catch (error) {
    console.error('\n❌ ERROR EN VERIFICACIÓN:', error.message);
    console.log('\n🛠️  SOLUCIONAR CON:');
    console.log('   node scripts/configurar-firebase-admin.js');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { verificarColecciones, inicializarFirebase };
