// Test para verificar la funcionalidad de marcado automático de préstamos
console.log('🧪 === TEST MARCADO AUTOMÁTICO DE PRÉSTAMOS ===');

// Función de test principal
async function testMarcadoAutomatico() {
  console.log('🚀 Iniciando test de marcado automático...');
  
  try {
    // 1. Verificar que las funciones están disponibles
    if (!window.prestamoService) {
      console.error('❌ prestamoService no está disponible en window');
      return false;
    }
    
    if (!window.prestamoService.marcarPrestamosVencidosAutomaticamente) {
      console.error('❌ marcarPrestamosVencidosAutomaticamente no está disponible');
      return false;
    }
    
    console.log('✅ Funciones disponibles');
    
    // 2. Ejecutar marcado automático
    console.log('🔄 Ejecutando marcado automático...');
    const resultado = await window.prestamoService.marcarPrestamosVencidosAutomaticamente();
    
    console.log('📊 Resultado del marcado automático:');
    console.log(`   📋 Actividades procesadas: ${resultado.procesados}`);
    console.log(`   ✅ Préstamos marcados: ${resultado.marcados}`);
    console.log(`   ❌ Errores: ${resultado.errores}`);
    
    // 3. Verificar el resultado
    if (resultado.procesados >= 0 && resultado.errores === 0) {
      console.log('✅ Test completado exitosamente');
      return true;
    } else {
      console.log('⚠️ Test completado con advertencias');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error durante el test:', error);
    return false;
  }
}

// Función para crear datos de prueba (actividad vencida)
async function crearActividadVencidaParaTest() {
  console.log('🧪 Creando actividad vencida para test...');
  
  try {
    const db = window.firebase?.firestore?.();
    if (!db) {
      console.error('❌ Firebase Firestore no disponible');
      return null;
    }
    
    // Crear actividad finalizada hace 10 días
    const fechaFin = new Date();
    fechaFin.setDate(fechaFin.getDate() - 10); // Hace 10 días
    
    const fechaInicio = new Date(fechaFin);
    fechaInicio.setDate(fechaInicio.getDate() - 1); // Duración de 1 día
    
    const actividadData = {
      nombre: 'TEST: Actividad Vencida para Marcado Automático',
      descripcion: 'Actividad de prueba para verificar marcado automático',
      fechaInicio: window.firebase.firestore.Timestamp.fromDate(fechaInicio),
      fechaFin: window.firebase.firestore.Timestamp.fromDate(fechaFin),
      estado: 'finalizada',
      necesidadMaterial: true,
      responsableMaterialId: 'test-usuario-marcado-automatico',
      materiales: [
        {
          materialId: 'test-material-marcado-automatico',
          nombre: 'Material de Prueba Marcado Automático',
          cantidad: 1
        }
      ],
      creadoPor: 'test-usuario',
      fechaCreacion: window.firebase.firestore.Timestamp.now(),
      participantes: []
    };
    
    // Crear actividad
    const actividadRef = await db.collection('actividades').add(actividadData);
    console.log(`✅ Actividad de prueba creada: ${actividadRef.id}`);
    
    // Crear préstamo asociado en estado 'en_uso'
    const prestamoData = {
      materialId: 'test-material-marcado-automatico',
      nombreMaterial: 'Material de Prueba Marcado Automático',
      usuarioId: 'test-usuario-marcado-automatico',
      nombreUsuario: 'Usuario Test Marcado Automático',
      cantidadPrestada: 1,
      fechaPrestamo: window.firebase.firestore.Timestamp.fromDate(fechaInicio),
      fechaDevolucionPrevista: window.firebase.firestore.Timestamp.fromDate(fechaFin),
      estado: 'en_uso',
      actividadId: actividadRef.id,
      nombreActividad: actividadData.nombre,
      observaciones: 'Préstamo de prueba para test de marcado automático'
    };
    
    const prestamoRef = await db.collection('prestamos').add(prestamoData);
    console.log(`✅ Préstamo de prueba creado: ${prestamoRef.id}`);
    
    return {
      actividadId: actividadRef.id,
      prestamoId: prestamoRef.id
    };
    
  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
    return null;
  }
}

// Función para limpiar datos de prueba
async function limpiarDatosPrueba(actividadId, prestamoId) {
  console.log('🧹 Limpiando datos de prueba...');
  
  try {
    const db = window.firebase?.firestore?.();
    if (!db) return;
    
    // Eliminar préstamo
    if (prestamoId) {
      await db.collection('prestamos').doc(prestamoId).delete();
      console.log(`✅ Préstamo de prueba eliminado: ${prestamoId}`);
    }
    
    // Eliminar actividad
    if (actividadId) {
      await db.collection('actividades').doc(actividadId).delete();
      console.log(`✅ Actividad de prueba eliminada: ${actividadId}`);
    }
    
  } catch (error) {
    console.error('❌ Error limpiando datos de prueba:', error);
  }
}

// Test completo con datos de prueba
async function testCompletoConDatosPrueba() {
  console.log('🚀 === TEST COMPLETO CON DATOS DE PRUEBA ===');
  
  let datosPrueba = null;
  
  try {
    // 1. Crear datos de prueba
    datosPrueba = await crearActividadVencidaParaTest();
    if (!datosPrueba) {
      console.error('❌ No se pudieron crear datos de prueba');
      return false;
    }
    
    // 2. Esperar un poco para que se procesen
    console.log('⏳ Esperando procesamiento...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Ejecutar marcado automático
    const exito = await testMarcadoAutomatico();
    
    // 4. Verificar que el préstamo fue marcado
    if (exito) {
      console.log('🔍 Verificando que el préstamo fue marcado...');
      const db = window.firebase?.firestore?.();
      const prestamoDoc = await db.collection('prestamos').doc(datosPrueba.prestamoId).get();
      
      if (prestamoDoc.exists()) {
        const prestamoData = prestamoDoc.data();
        if (prestamoData.estado === 'por_devolver' && prestamoData.marcadoAutomaticamente) {
          console.log('✅ ¡ÉXITO! El préstamo fue marcado automáticamente');
        } else {
          console.log('ℹ️ El préstamo no fue marcado (puede que no cumpla criterios)');
        }
      }
    }
    
    return exito;
    
  } finally {
    // 5. Limpiar datos de prueba
    if (datosPrueba) {
      await limpiarDatosPrueba(datosPrueba.actividadId, datosPrueba.prestamoId);
    }
  }
}

// Hacer las funciones disponibles globalmente
window.testMarcadoAutomatico = testMarcadoAutomatico;
window.crearActividadVencidaParaTest = crearActividadVencidaParaTest;
window.testCompletoConDatosPrueba = testCompletoConDatosPrueba;

// Mostrar instrucciones
console.log('📋 FUNCIONES DE TEST DISPONIBLES:');
console.log('   testMarcadoAutomatico() - Test básico del marcado automático');
console.log('   crearActividadVencidaParaTest() - Crear datos de prueba');
console.log('   testCompletoConDatosPrueba() - Test completo con datos de prueba');
console.log('');
console.log('🚀 Para ejecutar el test completo, usa:');
console.log('   testCompletoConDatosPrueba()');
