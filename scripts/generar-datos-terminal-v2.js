#!/usr/bin/env node

/**
 * GENERADOR DE DATOS PARA NODE.JS
 * Script para ejecutar desde terminal usando Firebase Admin SDK
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

console.log('🚀 GENERADOR DE DATOS HISTÓRICOS - TERMINAL MODE');
console.log('===============================================\n');

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

async function crearMaterialesPrueba(db) {
  console.log('🏗️  Creando materiales de prueba...');
  
  const materialesPrueba = [
    {
      nombre: 'Cemento Portland',
      categoria: 'construccion',
      descripcion: 'Cemento de alta calidad para construcción',
      unidad: 'kg',
      precio: 0.15
    },
    {
      nombre: 'Acero Corrugado',
      categoria: 'construccion', 
      descripcion: 'Barras de acero para refuerzo',
      unidad: 'kg',
      precio: 0.8
    },
    {
      nombre: 'Ladrillo Común',
      categoria: 'albañileria',
      descripcion: 'Ladrillo estándar para construcción',
      unidad: 'unidad',
      precio: 0.5
    },
    {
      nombre: 'Pintura Acrílica',
      categoria: 'acabados',
      descripcion: 'Pintura para exteriores e interiores',
      unidad: 'litro',
      precio: 12.5
    },
    {
      nombre: 'Tubo PVC',
      categoria: 'plomeria',
      descripcion: 'Tubería de PVC para instalaciones',
      unidad: 'metro',
      precio: 3.2
    }
  ];

  const batch = db.batch();
  
  for (const material of materialesPrueba) {
    const docRef = db.collection('materiales').doc();
    batch.set(docRef, {
      ...material,
      fechaCreacion: admin.firestore.Timestamp.now(),
      activo: true
    });
  }

  await batch.commit();
  console.log(`✅ ${materialesPrueba.length} materiales de prueba creados`);
}

async function generarDatosHistoriales() {
  const db = admin.firestore();
  
  try {
    console.log('\n📊 Verificando datos existentes...');
    
    // Verificar materiales existentes
    const materialesSnapshot = await db.collection('materiales').limit(5).get();
    if (materialesSnapshot.empty) {
      console.log('❌ No se encontraron materiales. Creando materiales de prueba...');
      await crearMaterialesPrueba(db);
    } else {
      console.log(`✅ ${materialesSnapshot.size} materiales encontrados`);
    }

    // Verificar historial existente
    const historialSnapshot = await db.collection('material_historial').limit(1).get();
    if (!historialSnapshot.empty) {
      console.log('⚠️  Ya existen eventos de historial. Generando eventos adicionales...');
    }

    console.log('\n🏗️  Generando eventos históricos...');
    
    // Obtener materiales para generar historial
    const materialesCompletos = await db.collection('materiales').get();
    const materiales = [];
    
    materialesCompletos.forEach(doc => {
      materiales.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if (materiales.length === 0) {
      throw new Error('No hay materiales disponibles para generar historial');
    }

    console.log(`📦 Generando historial para ${materiales.length} materiales...`);

    const eventosGenerados = [];
    const tiposEventos = ['creacion', 'actualizacion', 'revision', 'backup'];
    const fechaInicio = new Date('2024-01-01');
    const fechaFin = new Date();

    for (const material of materiales) {
      // Generar entre 5 y 15 eventos por material
      const numEventos = Math.floor(Math.random() * 11) + 5;
      
      for (let i = 0; i < numEventos; i++) {
        const tipoEvento = tiposEventos[Math.floor(Math.random() * tiposEventos.length)];
        const fechaEvento = new Date(
          fechaInicio.getTime() + Math.random() * (fechaFin.getTime() - fechaInicio.getTime())
        );

        const evento = {
          materialId: material.id,
          tipoEvento: tipoEvento,
          fecha: admin.firestore.Timestamp.fromDate(fechaEvento),
          descripcion: `${tipoEvento} del material ${material.nombre || material.id}`,
          usuario: 'sistema',
          metadatos: {
            version: Math.floor(Math.random() * 10) + 1,
            automatico: true,
            categoria: material.categoria || 'general'
          }
        };

        eventosGenerados.push(evento);
      }
    }

    // Ordenar eventos por fecha
    eventosGenerados.sort((a, b) => a.fecha.toDate() - b.fecha.toDate());

    console.log(`📈 Guardando ${eventosGenerados.length} eventos...`);

    // Guardar en lotes para mejor rendimiento
    const loteSize = 500; // Firestore permite hasta 500 operaciones por lote
    let eventosGuardados = 0;

    for (let i = 0; i < eventosGenerados.length; i += loteSize) {
      const lote = eventosGenerados.slice(i, i + loteSize);
      const batch = db.batch();
      
      for (const evento of lote) {
        const docRef = db.collection('material_historial').doc();
        batch.set(docRef, evento);
      }

      await batch.commit();
      eventosGuardados += lote.length;
      console.log(`✅ Lote ${Math.floor(i / loteSize) + 1} guardado (${lote.length} eventos)`);
    }

    console.log('\n🎉 GENERACIÓN COMPLETADA');
    console.log(`📊 Total de eventos generados: ${eventosGenerados.length}`);
    console.log(`📦 Materiales procesados: ${materiales.length}`);
    
    // Verificar resultado
    const verificacion = await db.collection('material_historial').get();
    console.log(`✅ Verificación: ${verificacion.size} eventos en la base de datos`);
    
    console.log('\n🎯 SIGUIENTE PASO:');
    console.log('   🚀 Ejecutar: npm start');
    console.log('   📊 Ir al dashboard de materiales para ver los datos');

    return {
      exito: true,
      eventosGenerados: eventosGenerados.length,
      materialesProcesados: materiales.length
    };

  } catch (error) {
    console.error('❌ Error generando datos:', error);
    throw error;
  }
}

async function main() {
  try {
    // Inicializar Firebase
    inicializarFirebase();
    console.log('✅ Firebase Admin SDK inicializado\n');

    // Generar datos
    const resultado = await generarDatosHistoriales();
    
    if (resultado.exito) {
      console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ ERROR EN GENERACIÓN:', error.message);
    console.log('\n🛠️  SOLUCIONAR CON:');
    console.log('   node scripts/configurar-firebase-admin.js');
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { generarDatosHistoriales, inicializarFirebase };
