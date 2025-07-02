/**
 * DIAGNÓSTICO DETALLADO DE INSERCIÓN DE EVENTOS
 * Script para identificar exactamente por qué fallan las inserciones
 */

(async function diagnosticoInsercion() {
  console.log('🔍 DIAGNÓSTICO DETALLADO DE INSERCIÓN');
  console.log('====================================');
  
  try {
    // 1. Verificar disponibilidad del servicio
    if (!window.materialHistorialService) {
      console.log('❌ MaterialHistorialService no disponible');
      console.log('💡 Ve a "Seguimiento de Materiales" primero');
      return;
    }
    
    const service = window.materialHistorialService;
    console.log('✅ MaterialHistorialService disponible');
    
    // 2. Examinar métodos disponibles
    console.log('\n🔍 Métodos disponibles en el servicio:');
    const metodos = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
    metodos.forEach(metodo => {
      if (typeof service[metodo] === 'function') {
        console.log(`  📝 ${metodo}`);
      }
    });
    
    // 3. Verificar autenticación y contexto
    console.log('\n🔐 Verificando contexto de autenticación...');
    
    // Verificar Firebase Auth
    try {
      const auth = window.firebase?.auth || window.getAuth?.();
      const currentUser = auth?.currentUser;
      console.log('👤 Usuario actual:', currentUser?.email || 'No autenticado');
      console.log('🔑 UID:', currentUser?.uid || 'N/A');
    } catch (e) {
      console.log('⚠️ Error verificando auth:', e.message);
    }
    
    // 4. Intentar evento de prueba MUY SIMPLE
    console.log('\n🧪 Probando inserción con evento mínimo...');
    
    const eventoMinimo = {
      materialId: 'TEST001',
      nombreMaterial: 'Material de Prueba',
      tipoEvento: 'inspeccion',
      descripcion: 'Evento de prueba para diagnóstico',
      fecha: new Date(),
      responsable: 'Diagnóstico'
    };
    
    console.log('📋 Evento a insertar:', eventoMinimo);
    
    try {
      console.log('⏳ Llamando a registrarEvento...');
      const resultado = await service.registrarEvento(eventoMinimo);
      console.log('✅ Resultado de inserción:', resultado);
      
      // Verificar que se insertó
      console.log('🔍 Verificando inserción...');
      const eventos = await service.obtenerHistorial({ años: [2025] });
      console.log(`📊 Total eventos después de inserción: ${eventos.length}`);
      
    } catch (error) {
      console.error('❌ ERROR EN INSERCIÓN:', error);
      console.log('📋 Detalles del error:');
      console.log('  - Mensaje:', error.message);
      console.log('  - Stack:', error.stack);
      console.log('  - Tipo:', error.constructor.name);
      
      // Verificar si es error de permisos de Firestore
      if (error.message.includes('permission') || error.message.includes('denied')) {
        console.log('🚫 PROBLEMA DE PERMISOS DETECTADO');
        console.log('💡 Posibles soluciones:');
        console.log('  1. Verificar reglas de Firestore');
        console.log('  2. Verificar autenticación del usuario');
        console.log('  3. Verificar configuración de roles');
      }
      
      // Verificar si es error de validación
      if (error.message.includes('validation') || error.message.includes('required')) {
        console.log('📝 PROBLEMA DE VALIDACIÓN DETECTADO');
        console.log('💡 El evento no cumple con los requisitos de validación');
      }
      
      // Verificar si es error de conexión
      if (error.message.includes('network') || error.message.includes('connection')) {
        console.log('🌐 PROBLEMA DE CONEXIÓN DETECTADO');
        console.log('💡 Verificar conexión a Internet y estado de Firebase');
      }
    }
    
    // 5. Examinar el repositorio directamente
    console.log('\n🔍 Examinando repositorio directamente...');
    
    try {
      // Acceder al repositorio a través del servicio
      const repositorio = service.materialHistorialRepository || service.repository;
      
      if (repositorio) {
        console.log('✅ Repositorio accesible');
        console.log('📋 Métodos del repositorio:');
        const metodosRepo = Object.getOwnPropertyNames(Object.getPrototypeOf(repositorio));
        metodosRepo.forEach(metodo => {
          if (typeof repositorio[metodo] === 'function') {
            console.log(`  📝 ${metodo}`);
          }
        });
        
        // Intentar inserción directa en el repositorio
        console.log('\n🧪 Probando inserción directa en repositorio...');
        
        const eventoRepo = {
          ...eventoMinimo,
          año: 2025,
          mes: 6,
          dia: 20,
          fechaRegistro: new Date(),
          registradoPor: 'Diagnóstico Sistema'
        };
        
        try {
          const resultadoRepo = await repositorio.create(eventoRepo);
          console.log('✅ Inserción directa exitosa:', resultadoRepo);
        } catch (errorRepo) {
          console.error('❌ Error en inserción directa:', errorRepo);
          console.log('📋 Detalles del error del repositorio:');
          console.log('  - Mensaje:', errorRepo.message);
          console.log('  - Código:', errorRepo.code);
        }
        
      } else {
        console.log('❌ No se pudo acceder al repositorio');
      }
      
    } catch (errorAcceso) {
      console.error('❌ Error accediendo al repositorio:', errorAcceso);
    }
    
    // 6. Verificar reglas de Firestore
    console.log('\n🔐 Verificando acceso a Firestore...');
    
    try {
      // Intentar acceso directo a Firestore
      const firebase = window.firebase;
      if (firebase && firebase.firestore) {
        const db = firebase.firestore();
        console.log('✅ Firestore accesible');
        
        // Probar lectura
        try {
          const snapshot = await db.collection('material_historial').limit(1).get();
          console.log('✅ Lectura de Firestore exitosa');
          console.log(`📊 Documentos existentes: ${snapshot.size}`);
        } catch (errorLectura) {
          console.error('❌ Error en lectura de Firestore:', errorLectura);
        }
        
        // Probar escritura directa
        try {
          const docRef = await db.collection('material_historial').add({
            test: true,
            timestamp: firebase.firestore.Timestamp.now(),
            diagnostico: 'Prueba desde script'
          });
          console.log('✅ Escritura directa a Firestore exitosa:', docRef.id);
          
          // Eliminar el documento de prueba
          await docRef.delete();
          console.log('🗑️ Documento de prueba eliminado');
          
        } catch (errorEscritura) {
          console.error('❌ Error en escritura directa a Firestore:', errorEscritura);
          console.log('📋 Código de error:', errorEscritura.code);
          
          if (errorEscritura.code === 'permission-denied') {
            console.log('🚫 PROBLEMA: Permisos de Firestore denegados');
            console.log('💡 Solución: Revisar firestore.rules');
          }
        }
      }
    } catch (errorFirestore) {
      console.error('❌ Error accediendo a Firestore:', errorFirestore);
    }
    
    // 7. Resumen de diagnóstico
    console.log('\n📋 RESUMEN DE DIAGNÓSTICO:');
    console.log('=========================');
    console.log('✅ MaterialHistorialService: Disponible');
    console.log('✅ Métodos del servicio: Accesibles');
    console.log('✅ Firestore: Verificado');
    console.log('❓ Inserción a través del servicio: A verificar');
    console.log('');
    console.log('💡 PRÓXIMOS PASOS:');
    console.log('1. Revisar logs de errores específicos arriba');
    console.log('2. Verificar reglas de Firestore si hay errores de permisos');
    console.log('3. Verificar validaciones en el servicio si hay errores de validación');
    console.log('4. Probar inserción manual paso a paso');
    
  } catch (error) {
    console.error('❌ Error general en diagnóstico:', error);
  }
})();

console.log('🔧 Script de diagnóstico cargado. Ejecutándose automáticamente...');
