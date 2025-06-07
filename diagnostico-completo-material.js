/**
 * Script completo de debugging para MaterialSelector
 * Este script debe ejecutarse en la consola del navegador después de cargar la aplicación
 */

console.log('🚀 Iniciando diagnóstico completo del MaterialSelector...');

// Función principal de diagnóstico
async function diagnosticoCompleto() {
  console.log('\n=== DIAGNÓSTICO COMPLETO MATERIALSELECTOR ===\n');
  
  try {
    // 1. Verificar que MaterialRepository esté disponible
    console.log('1️⃣ Verificando disponibilidad de MaterialRepository...');
    
    if (window.materialRepository) {
      console.log('✅ MaterialRepository encontrado en window.materialRepository');
      const repo = window.materialRepository;
      
      // 2. Probar método debugConnection
      console.log('\n2️⃣ Probando conexión directa a Firebase...');
      try {
        await repo.debugConnection();
        console.log('✅ Conexión a Firebase verificada');
      } catch (error) {
        console.error('❌ Error en conexión Firebase:', error);
      }
      
      // 3. Probar método find general
      console.log('\n3️⃣ Probando método find() general...');
      try {
        const todosMateriales = await repo.find();
        console.log(`📊 Total materiales encontrados: ${todosMateriales.length}`);
        
        if (todosMateriales.length > 0) {
          console.log('📋 Primer material:', todosMateriales[0]);
        }
      } catch (error) {
        console.error('❌ Error en find():', error);
      }
      
      // 4. Probar método findMaterialesDisponibles
      console.log('\n4️⃣ Probando método findMaterialesDisponibles()...');
      try {
        const materialesDisponibles = await repo.findMaterialesDisponibles();
        console.log(`📊 Materiales disponibles: ${materialesDisponibles.length}`);
        
        if (materialesDisponibles.length > 0) {
          console.log('📋 Primer material disponible:', materialesDisponibles[0]);
        } else {
          console.warn('⚠️ No se encontraron materiales disponibles');
        }
      } catch (error) {
        console.error('❌ Error en findMaterialesDisponibles():', error);
      }
      
    } else {
      console.error('❌ MaterialRepository no está disponible en window');
      console.log('💡 Asegúrate de que la aplicación esté cargada y el MaterialSelector haya sido renderizado');
    }
    
    // 5. Verificar datos cargados en el componente
    console.log('\n5️⃣ Verificando datos del último MaterialSelector...');
    if (window.lastLoadedMateriales) {
      console.log('📦 Últimos materiales cargados:', window.lastLoadedMateriales);
      console.log('🔄 Últimos materiales convertidos:', window.lastConvertedMateriales);
    } else {
      console.log('ℹ️ No hay datos de carga recientes');
    }
    
    if (window.lastMaterialError) {
      console.log('❌ Último error capturado:', window.lastMaterialError);
    }
    
    // 6. Verificar Firebase directamente
    console.log('\n6️⃣ Verificando Firebase directamente...');
    await verificarFirebaseDirecto();
    
    console.log('\n✅ DIAGNÓSTICO COMPLETADO');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

// Función para verificar Firebase directamente
async function verificarFirebaseDirecto() {
  try {
    // Verificar que Firebase esté disponible
    if (!window.db) {
      console.error('❌ window.db no está disponible');
      return;
    }
    
    console.log('✅ Firebase db disponible:', window.db);
    
    // Importar funciones de Firestore
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    
    // Probar acceso directo a la colección
    console.log('📡 Accediendo directamente a la colección material_deportivo...');
    const materialesRef = collection(window.db, 'material_deportivo');
    const snapshot = await getDocs(materialesRef);
    
    console.log(`📊 Documentos en colección: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.warn('⚠️ La colección está vacía - necesitas crear materiales de prueba');
      
      // Sugerir crear materiales de prueba
      console.log('💡 Para crear materiales de prueba, ejecuta:');
      console.log('   await crearMaterialesPrueba()');
    } else {
      console.log('📄 Documentos encontrados:');
      let count = 0;
      snapshot.forEach((doc) => {
        if (count < 3) {
          console.log(`  ${count + 1}. ID: ${doc.id}`, doc.data());
          count++;
        }
      });
      
      // Probar consulta con filtros (como hace findMaterialesDisponibles)
      console.log('🔍 Probando consulta con filtros...');
      const consultaFiltrada = query(
        materialesRef,
        where('cantidadDisponible', '>', 0)
      );
      
      const snapshotFiltrado = await getDocs(consultaFiltrada);
      console.log(`📊 Materiales con cantidadDisponible > 0: ${snapshotFiltrado.size}`);
    }
    
  } catch (error) {
    console.error('❌ Error verificando Firebase directamente:', error);
  }
}

// Función para crear materiales de prueba
async function crearMaterialesPrueba() {
  try {
    console.log('🏗️ Creando materiales de prueba...');
    
    const { collection, addDoc } = await import('firebase/firestore');
    const materialesRef = collection(window.db, 'material_deportivo');
    
    const materialesPrueba = [
      {
        nombre: 'Cuerda Dinámica 10mm',
        tipo: 'cuerda',
        descripcion: 'Cuerda de escalada dinámica de 10mm',
        estado: 'Disponible',
        cantidad: 5,
        cantidadDisponible: 5,
        codigo: 'CUERDA-001',
        categoria: 'Escalada',
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      },
      {
        nombre: 'Arnés de Escalada',
        tipo: 'varios',
        descripcion: 'Arnés completo para escalada deportiva',
        estado: 'Disponible',
        cantidad: 8,
        cantidadDisponible: 8,
        codigo: 'ARNES-001',
        categoria: 'Escalada',
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      },
      {
        nombre: 'Anclaje Químico',
        tipo: 'anclaje',
        descripcion: 'Anclaje químico para vías de escalada',
        estado: 'Disponible',
        cantidad: 20,
        cantidadDisponible: 20,
        codigo: 'ANCLAJE-001',
        categoria: 'Anclajes',
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      }
    ];
    
    for (const material of materialesPrueba) {
      const docRef = await addDoc(materialesRef, material);
      console.log(`✅ Material creado: ${material.nombre} (ID: ${docRef.id})`);
    }
    
    console.log('🎉 Materiales de prueba creados exitosamente');
    console.log('💡 Ahora puedes ejecutar diagnosticoCompleto() nuevamente');
    
  } catch (error) {
    console.error('❌ Error creando materiales de prueba:', error);
  }
}

// Función para limpiar materiales de prueba
async function limpiarMaterialesPrueba() {
  try {
    console.log('🧹 Limpiando materiales de prueba...');
    
    const { collection, getDocs, deleteDoc, doc, query, where } = await import('firebase/firestore');
    const materialesRef = collection(window.db, 'material_deportivo');
    
    const q = query(materialesRef, where('categoria', '==', 'Prueba'));
    const snapshot = await getDocs(q);
    
    const deletePromises = [];
    snapshot.forEach((docSnapshot) => {
      deletePromises.push(deleteDoc(doc(window.db, 'material_deportivo', docSnapshot.id)));
    });
    
    await Promise.all(deletePromises);
    console.log(`✅ ${snapshot.size} materiales de prueba eliminados`);
    
  } catch (error) {
    console.error('❌ Error limpiando materiales de prueba:', error);
  }
}

// Exportar funciones para uso manual
window.diagnosticoCompleto = diagnosticoCompleto;
window.crearMaterialesPrueba = crearMaterialesPrueba;
window.limpiarMaterialesPrueba = limpiarMaterialesPrueba;
window.verificarFirebaseDirecto = verificarFirebaseDirecto;

console.log('🔧 Script de diagnóstico cargado. Funciones disponibles:');
console.log('  - diagnosticoCompleto() - Ejecuta diagnóstico completo');
console.log('  - crearMaterialesPrueba() - Crea materiales de prueba');
console.log('  - limpiarMaterialesPrueba() - Elimina materiales de prueba');
console.log('  - verificarFirebaseDirecto() - Verifica Firebase directamente');
console.log('');
console.log('👉 Para empezar, ejecuta: diagnosticoCompleto()');

// Ejecutar diagnóstico automáticamente después de 2 segundos
setTimeout(() => {
  console.log('🤖 Ejecutando diagnóstico automático...');
  diagnosticoCompleto();
}, 2000);
