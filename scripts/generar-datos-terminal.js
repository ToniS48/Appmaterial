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
      console.log('� Usando Service Account Key...');
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

// Inicializar Firebase
let app, db;

async function generarDatosHistoriales() {
  try {
    // Inicializar Firebase si no está inicializado
    if (!app) {
      app = inicializarFirebase();
      db = admin.firestore();
    }

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
      console.log('📦 No hay materiales existentes, creando materiales de ejemplo...');
      await crearMaterialesPrueba(db);
      // Volver a obtener los materiales creados
      const nuevosMaterieles = await db.collection('materiales').get();
      nuevosMaterieles.forEach(doc => {
        materiales.push({
          id: doc.id,
          ...doc.data()
        });
      });
    }

    console.log(`📦 Generando historial para ${materiales.length} materiales...`);

    const eventosGenerados = [];
    const tiposEventos = ['mantenimiento', 'reparacion', 'inspeccion', 'reemplazo', 'calibracion', 'creacion', 'actualizacion'];
    const gravedades = ['baja', 'media', 'alta'];
    const fechaInicio = new Date('2024-01-01');
    const fechaFin = new Date();

    for (const material of materiales) {
      // Generar entre 8 y 20 eventos por material
      const numEventos = Math.floor(Math.random() * 13) + 8;
      
      for (let i = 0; i < numEventos; i++) {
        const tipoEvento = tiposEventos[Math.floor(Math.random() * tiposEventos.length)];
        const fechaEvento = new Date(
          fechaInicio.getTime() + Math.random() * (fechaFin.getTime() - fechaInicio.getTime())
        );

        const evento = {
          materialId: material.id,
          nombreMaterial: material.nombre || `Material ${material.id}`,
          tipoEvento: tipoEvento,
          descripcion: `${tipoEvento} del material ${material.nombre || material.id} - Evento generado automáticamente`,
          fecha: admin.firestore.Timestamp.fromDate(fechaEvento),
          año: fechaEvento.getFullYear(),
          mes: fechaEvento.getMonth() + 1,
          registradoPor: 'Sistema Terminal',
          gravedad: gravedades[Math.floor(Math.random() * gravedades.length)],
          costoAsociado: Math.random() > 0.4 ? Math.floor(Math.random() * 1500) + 50 : 0,
          completado: Math.random() > 0.15,
          fechaRegistro: admin.firestore.Timestamp.now(),
          metadatos: {
            generadoEn: 'terminal',
            version: '1.1',
            categoria: material.categoria || 'general',
            automatico: true,
            timestamp: new Date().toISOString()
          }
        };

        eventosGenerados.push(evento);
      }
    }

    // Ordenar eventos por fecha
    eventosGenerados.sort((a, b) => a.fecha.toDate() - b.fecha.toDate());

    console.log(`📈 Guardando ${eventosGenerados.length} eventos en lotes...`);

    // Guardar en lotes para mejor rendimiento
    const loteSize = 450; // Usamos un límite seguro menor a 500
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
      console.log(`✅ Lote ${Math.floor(i / loteSize) + 1} guardado (${lote.length} eventos) - Total: ${eventosGuardados}`);
    }

    console.log('\n🎉 GENERACIÓN COMPLETADA');
    console.log(`📊 Total de eventos generados: ${eventosGenerados.length}`);
    console.log(`📦 Materiales procesados: ${materiales.length}`);
    
    // Verificar resultado final
    const verificacion = await db.collection('material_historial').get();
    console.log(`✅ Verificación: ${verificacion.size} eventos totales en la base de datos`);

    // Estadísticas finales
    const stats = {
      materiales: new Set(),
      tiposEvento: {},
      costoTotal: 0,
      eventosPorAño: {}
    };
    
    verificacion.docs.forEach(doc => {
      const data = doc.data();
      stats.materiales.add(data.materialId);
      stats.tiposEvento[data.tipoEvento] = (stats.tiposEvento[data.tipoEvento] || 0) + 1;
      stats.costoTotal += data.costoAsociado || 0;
      stats.eventosPorAño[data.año] = (stats.eventosPorAño[data.año] || 0) + 1;
    });
    
    console.log('\n📈 ESTADÍSTICAS FINALES:');
    console.log(`🏷️ Materiales únicos: ${stats.materiales.size}`);
    console.log(`💰 Costo total: $${stats.costoTotal.toLocaleString()}`);
    console.log('📊 Eventos por tipo:', stats.tiposEvento);
    console.log('📅 Eventos por año:', stats.eventosPorAño);
    
    console.log('\n✅ DATOS LISTOS PARA EL DASHBOARD');
    console.log('🎯 Ahora el dashboard debería mostrar estos datos');
    console.log('🔄 Recarga la aplicación para ver los cambios');

    return {
      exito: true,
      eventosGenerados: eventosGenerados.length,
      materialesProcesados: materiales.length,
      totalEventosEnDB: verificacion.size
    };

  } catch (error) {
    console.error('❌ Error generando datos:', error);
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
      precio: 0.15,
      stock: 5000
    },
    {
      nombre: 'Acero Corrugado',
      categoria: 'construccion', 
      descripcion: 'Barras de acero para refuerzo',
      unidad: 'kg',
      precio: 0.8,
      stock: 2000
    },
    {
      nombre: 'Ladrillo Común',
      categoria: 'albañileria',
      descripcion: 'Ladrillo estándar para construcción',
      unidad: 'unidad',
      precio: 0.5,
      stock: 10000
    },
    {
      nombre: 'Pintura Acrílica',
      categoria: 'acabados',
      descripcion: 'Pintura para exteriores e interiores',
      unidad: 'litro',
      precio: 12.5,
      stock: 500
    },
    {
      nombre: 'Tubo PVC',
      categoria: 'plomeria',
      descripcion: 'Tubería de PVC para instalaciones',
      unidad: 'metro',
      precio: 3.2,
      stock: 1500
    },
    {
      nombre: 'Arena Gruesa',
      categoria: 'construccion',
      descripcion: 'Arena para mezclas de concreto',
      unidad: 'm3',
      precio: 25.0,
      stock: 200
    },
    {
      nombre: 'Grava',
      categoria: 'construccion',
      descripcion: 'Grava para concreto y drenajes',
      unidad: 'm3',
      precio: 30.0,
      stock: 150
    }
  ];

  const batch = db.batch();
  
  for (const material of materialesPrueba) {
    const docRef = db.collection('materiales').doc();
    batch.set(docRef, {
      ...material,
      fechaCreacion: admin.firestore.Timestamp.now(),
      activo: true,
      ultimaActualizacion: admin.firestore.Timestamp.now()
    });
  }

  await batch.commit();
  console.log(`✅ ${materialesPrueba.length} materiales de prueba creados`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  console.log('🚀 Iniciando generación de datos históricos...');
  
  generarDatosHistoriales()
    .then(resultado => {
      if (resultado && resultado.exito) {
        console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE');
        console.log(`📊 Eventos generados: ${resultado.eventosGenerados}`);
        console.log(`📦 Materiales procesados: ${resultado.materialesProcesados}`);
        console.log(`💾 Total en base de datos: ${resultado.totalEventosEnDB}`);
        process.exit(0);
      } else {
        console.log('\n❌ Proceso falló');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Error fatal:', error.message);
      console.log('\n💡 POSIBLES SOLUCIONES:');
      console.log('1. Verificar que Firebase Admin esté configurado correctamente');
      console.log('2. Ejecutar: npm install firebase-admin');
      console.log('3. Verificar credenciales en functions/service-account-key.json');
      console.log('4. O ejecutar: firebase login && firebase use fichamaterial');
      process.exit(1);
    });
}

module.exports = { generarDatosHistoriales, crearMaterialesPrueba };
