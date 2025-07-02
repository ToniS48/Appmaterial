/**
 * DIAGNÓSTICO DETALLADO DE INSERCIÓN - PARA EJECUTAR EN CONSOLA DEL NAVEGADOR
 * 
 * INSTRUCCIONES:
 * 1. Ir a http://localhost:3000
 * 2. Navegar a "Seguimiento de Materiales" 
 * 3. Abrir DevTools (F12)
 * 4. Ir a la pestaña Console
 * 5. Copiar y pegar todo el código de este archivo
 * 6. Presionar Enter para ejecutar
 */

(async function diagnosticoInsercion() {
  console.clear();
  console.log('🔍 DIAGNÓSTICO DETALLADO DE INSERCIÓN DE EVENTOS');
  console.log('================================================');
  
  try {
    // 1. Verificar disponibilidad del servicio
    if (!window.materialHistorialService) {
      console.log('❌ MaterialHistorialService no disponible');
      console.log('💡 ACCIÓN REQUERIDA: Ve a "Seguimiento de Materiales" primero');
      return;
    }
    
    const service = window.materialHistorialService;
    console.log('✅ MaterialHistorialService disponible');
    
    // 2. Verificar autenticación
    console.log('\n🔐 Verificando autenticación...');
    
    try {
      const auth = window.firebase?.auth();
      const currentUser = auth?.currentUser;
      console.log('👤 Usuario:', currentUser?.email || 'No autenticado');
      console.log('🔑 UID:', currentUser?.uid || 'N/A');
      
      if (!currentUser) {
        console.log('❌ PROBLEMA: Usuario no autenticado');
        console.log('💡 ACCIÓN: Iniciar sesión en la aplicación');
        return;
      }
    } catch (e) {
      console.log('⚠️ Error verificando auth:', e.message);
    }
    
    // 3. Probar acceso directo a Firestore
    console.log('\n🔍 Probando acceso directo a Firestore...');
    
    try {
      const db = window.firebase.firestore();
      console.log('✅ Firestore inicializado');
      
      // Probar lectura
      console.log('📖 Probando lectura...');
      const snapshot = await db.collection('material_historial').limit(1).get();
      console.log(`✅ Lectura exitosa. Documentos existentes: ${snapshot.size}`);
      
      // Probar escritura directa
      console.log('✍️ Probando escritura directa...');
      const docRef = await db.collection('material_historial').add({
        test: true,
        timestamp: window.firebase.firestore.Timestamp.now(),
        diagnostico: 'Prueba directa desde consola',
        fecha: new Date().toISOString()
      });
      console.log('✅ Escritura directa exitosa:', docRef.id);
      
      // Eliminar documento de prueba
      await docRef.delete();
      console.log('🗑️ Documento de prueba eliminado');
      
    } catch (firestoreError) {
      console.error('❌ ERROR EN FIRESTORE:', firestoreError);
      console.log('📋 Código de error:', firestoreError.code);
      console.log('📋 Mensaje:', firestoreError.message);
      
      if (firestoreError.code === 'permission-denied') {
        console.log('🚫 PROBLEMA DETECTADO: Permisos de Firestore denegados');
        console.log('💡 SOLUCIÓN: Revisar firestore.rules');
      }
      return;
    }
    
    // 4. Probar inserción a través del servicio
    console.log('\n🧪 Probando inserción a través del servicio...');
    
    const eventoMinimo = {
      materialId: 'DIAG001',
      nombreMaterial: 'Material Diagnóstico',
      tipoEvento: 'inspeccion',
      descripcion: 'Evento de diagnóstico',
      fecha: new Date(),
      responsable: 'Sistema de Diagnóstico'
    };
    
    console.log('📋 Evento a insertar:', eventoMinimo);
    
    try {
      console.log('⏳ Llamando a service.registrarEvento...');
      const resultado = await service.registrarEvento(eventoMinimo);
      console.log('✅ INSERCIÓN EXITOSA:', resultado);
      
      // Verificar que se insertó
      console.log('🔍 Verificando inserción...');
      const eventos = await service.obtenerHistorial({ años: [2025] });
      console.log(`📊 Total eventos después: ${eventos.length}`);
      
      if (eventos.length > 0) {
        const ultimoEvento = eventos[eventos.length - 1];
        console.log('📝 Último evento:', ultimoEvento);
      }
      
    } catch (serviceError) {
      console.error('❌ ERROR EN SERVICIO:', serviceError);
      console.log('📋 Detalles:');
      console.log('  - Mensaje:', serviceError.message);
      console.log('  - Stack:', serviceError.stack);
      console.log('  - Código:', serviceError.code);
      
      // Análisis de errores
      if (serviceError.message.includes('permission') || serviceError.message.includes('denied')) {
        console.log('🚫 TIPO: Error de permisos');
      } else if (serviceError.message.includes('validation') || serviceError.message.includes('required')) {
        console.log('📝 TIPO: Error de validación');
      } else if (serviceError.message.includes('network') || serviceError.message.includes('connection')) {
        console.log('🌐 TIPO: Error de conexión');
      } else {
        console.log('❓ TIPO: Error desconocido');
      }
      
      // Intentar acceso al repositorio directamente
      console.log('\n🔧 Intentando acceso directo al repositorio...');
      
      try {
        const repositorio = service.materialHistorialRepository || service.repository;
        
        if (repositorio) {
          console.log('✅ Repositorio accesible');
          
          const eventoRepo = {
            ...eventoMinimo,
            año: 2025,
            mes: 6,
            dia: 20,
            fechaRegistro: new Date(),
            registradoPor: 'Diagnóstico Directo'
          };
          
          const resultadoRepo = await repositorio.create(eventoRepo);
          console.log('✅ Inserción directa en repositorio exitosa:', resultadoRepo);
          
        } else {
          console.log('❌ Repositorio no accesible');
        }
        
      } catch (repoError) {
        console.error('❌ Error en repositorio:', repoError);
        console.log('📋 Código repo:', repoError.code);
        console.log('📋 Mensaje repo:', repoError.message);
      }
    }
    
    // 5. Resumen final
    console.log('\n📋 RESUMEN DE DIAGNÓSTICO');
    console.log('=========================');
    console.log('🔍 Estado de componentes:');
    console.log('  ✅ MaterialHistorialService: Disponible');
    console.log('  ✅ Firebase Auth: Conectado');
    console.log('  ✅ Firestore: Accesible');
    console.log('  ✅ Permisos de escritura: Verificados');
    console.log('');
    console.log('💡 Si hay errores arriba, revisar:');
    console.log('  1. Reglas de Firestore (firestore.rules)');
    console.log('  2. Validaciones en MaterialHistorialService');
    console.log('  3. Estructura de datos esperada');
    console.log('  4. Autenticación de usuario');
    
  } catch (error) {
    console.error('❌ ERROR GENERAL EN DIAGNÓSTICO:', error);
    console.log('📋 Detalles del error general:');
    console.log('  - Mensaje:', error.message);
    console.log('  - Stack:', error.stack);
  }
})();
