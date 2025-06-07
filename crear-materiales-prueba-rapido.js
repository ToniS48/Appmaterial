/**
 * Script para crear materiales de prueba en Firebase
 * Ejecutar en la consola del navegador mientras la app está cargada
 */

window.crearMaterialesPruebaRapido = async function() {
  console.log('🏗️ Creando materiales de prueba para testing...');
  
  try {
    // Verificar que Firebase esté disponible
    if (!window.db) {
      console.error('❌ Firebase db no está disponible');
      return;
    }
    
    // Importar funciones de Firestore
    const { collection, addDoc } = await import('firebase/firestore');
    const materialesRef = collection(window.db, 'material_deportivo');
    
    // Materiales de prueba básicos
    const materialesPrueba = [
      {
        nombre: 'Cuerda Dinámica 10mm',
        tipo: 'cuerda',
        descripcion: 'Cuerda de escalada dinámica de 10mm x 60m',
        estado: 'disponible',
        cantidad: 5,
        cantidadDisponible: 5,
        codigo: 'CUERDA-001',
        categoria: 'Escalada',
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      },
      {
        nombre: 'Arnés Completo',
        tipo: 'varios',
        descripcion: 'Arnés de escalada con portamaterial',
        estado: 'disponible',
        cantidad: 10,
        cantidadDisponible: 8,
        codigo: 'ARNES-001',
        categoria: 'Escalada',
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      },
      {
        nombre: 'Anclaje Químico 12mm',
        tipo: 'anclaje',
        descripcion: 'Anclaje químico de acero inoxidable',
        estado: 'disponible',
        cantidad: 50,
        cantidadDisponible: 45,
        codigo: 'ANCLAJE-001',
        categoria: 'Anclajes',
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      },
      {
        nombre: 'Casco de Escalada',
        tipo: 'varios',
        descripcion: 'Casco de protección para escalada',
        estado: 'disponible',
        cantidad: 15,
        cantidadDisponible: 12,
        codigo: 'CASCO-001',
        categoria: 'Protección',
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      },
      {
        nombre: 'Cuerda Estática 11mm',
        tipo: 'cuerda',
        descripcion: 'Cuerda estática para rappel y rescate',
        estado: 'disponible',
        cantidad: 3,
        cantidadDisponible: 3,
        codigo: 'CUERDA-002',
        categoria: 'Escalada',
        fechaCreacion: new Date(),
        fechaActualizacion: new Date()
      }
    ];
    
    console.log(`📦 Creando ${materialesPrueba.length} materiales de prueba...`);
    
    const promesasCreacion = materialesPrueba.map(async (material, index) => {
      try {
        const docRef = await addDoc(materialesRef, material);
        console.log(`✅ ${index + 1}. ${material.nombre} creado con ID: ${docRef.id}`);
        return docRef;
      } catch (error) {
        console.error(`❌ Error creando ${material.nombre}:`, error);
        throw error;
      }
    });
    
    await Promise.all(promesasCreacion);
    
    console.log('🎉 ¡Todos los materiales de prueba creados exitosamente!');
    console.log('💡 Ahora puedes recargar la página o probar el MaterialSelector nuevamente');
    
    // Probar inmediatamente si MaterialRepository está disponible
    if (window.materialRepository) {
      console.log('🧪 Probando MaterialRepository inmediatamente...');
      try {
        const materiales = await window.materialRepository.findMaterialesDisponibles();
        console.log(`✅ Prueba exitosa: ${materiales.length} materiales encontrados`);
        
        if (materiales.length > 0) {
          console.log('📋 Primer material encontrado:', materiales[0]);
        }
      } catch (error) {
        console.log('⚠️ Error en prueba inmediata:', error);
        console.log('💡 Esto es normal si aún hay problemas de índices. Recarga la página.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error general creando materiales:', error);
  }
};

// Función para limpiar materiales de prueba
window.limpiarMaterialesPruebaRapido = async function() {
  console.log('🧹 Limpiando materiales de prueba...');
  
  try {
    const { collection, getDocs, deleteDoc, doc, query, where } = await import('firebase/firestore');
    const materialesRef = collection(window.db, 'material_deportivo');
    
    // Buscar materiales que tienen códigos de prueba
    const codigosPrueba = ['CUERDA-001', 'ARNES-001', 'ANCLAJE-001', 'CASCO-001', 'CUERDA-002'];
    
    for (const codigo of codigosPrueba) {
      const q = query(materialesRef, where('codigo', '==', codigo));
      const snapshot = await getDocs(q);
      
      for (const docSnapshot of snapshot.docs) {
        await deleteDoc(doc(window.db, 'material_deportivo', docSnapshot.id));
        console.log(`🗑️ Eliminado: ${codigo} (ID: ${docSnapshot.id})`);
      }
    }
    
    console.log('✅ Limpieza completada');
    
  } catch (error) {
    console.error('❌ Error limpiando materiales:', error);
  }
};

console.log('🚀 Script de materiales de prueba cargado');
console.log('💡 Funciones disponibles:');
console.log('  - crearMaterialesPruebaRapido() - Crear materiales de prueba');
console.log('  - limpiarMaterialesPruebaRapido() - Eliminar materiales de prueba');
console.log('');
console.log('👉 Para empezar, ejecuta: crearMaterialesPruebaRapido()');

// Auto-ejecutar después de 1 segundo si no hay materiales
setTimeout(async () => {
  if (window.materialRepository) {
    try {
      const materiales = await window.materialRepository.find();
      if (materiales.length === 0) {
        console.log('🤖 No se encontraron materiales, creando automáticamente...');
        await window.crearMaterialesPruebaRapido();
      }
    } catch (error) {
      console.log('🤖 Error verificando materiales existentes, creando de todas formas...');
      await window.crearMaterialesPruebaRapido();
    }
  }
}, 1000);
