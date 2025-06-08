// TEST DEVOLUCIONES: Verificar que las devoluciones incrementan las cantidades disponibles
// Este script prueba el ciclo completo: préstamo → devolución → verificación

console.log('🔄 === TEST DEVOLUCIONES: INCREMENTO DE CANTIDADES ===');

// Configuración del test
const TEST_CONFIG = {
  waitTime: 2000, // 2 segundos entre operaciones
  debug: true
};

// Helper de logging
function logTest(emoji, message, data = null) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${timestamp} ${emoji} ${message}`);
  if (data && TEST_CONFIG.debug) {
    console.log(`${timestamp} 📋`, data);
  }
}

// Función principal para probar devoluciones
async function probarDevoluciones() {
  logTest('🚀', 'Iniciando test de devoluciones...');
  
  try {
    // 1. Verificar servicios
    logTest('🔧', 'Verificando servicios...');
    if (!window.prestamoService || !window.materialService) {
      throw new Error('Servicios no disponibles');
    }
    logTest('✅', 'Servicios verificados');
    
    // 2. Obtener un material para el test
    logTest('📦', 'Obteniendo material para el test...');
    const material = await obtenerMaterialParaTest();
    if (!material) {
      throw new Error('No se encontró material para el test');
    }
    logTest('✅', `Material seleccionado: ${material.nombre}`, {
      id: material.id,
      cantidadDisponible: material.cantidadDisponible,
      estado: material.estado
    });
    
    // 3. Crear un préstamo
    logTest('🏗️', 'Creando préstamo...');
    const prestamo = await crearPrestamoTest(material);
    logTest('✅', `Préstamo creado: ${prestamo.id}`);
    
    // Esperar a que se procese
    logTest('⏳', 'Esperando procesamiento...');
    await esperar(TEST_CONFIG.waitTime);
    
    // 4. Verificar que la cantidad disminuyó
    logTest('📉', 'Verificando disminución de cantidad...');
    const materialDespuesPrestamo = await window.materialService.obtenerMaterial(material.id);
    const exitoDisminucion = verificarDisminucion(material, materialDespuesPrestamo, prestamo);
    
    if (!exitoDisminucion) {
      logTest('⚠️', 'La cantidad no disminuyó correctamente, pero continuamos con el test');
    } else {
      logTest('✅', 'Cantidad disminuyó correctamente');
    }
    
    // 5. Registrar devolución
    logTest('🔄', 'Registrando devolución...');
    await window.prestamoService.registrarDevolucion(prestamo.id, 'Devolución de test');
    logTest('✅', 'Devolución registrada');
    
    // Esperar a que se procese
    logTest('⏳', 'Esperando procesamiento de devolución...');
    await esperar(TEST_CONFIG.waitTime);
    
    // 6. Verificar que la cantidad se incrementó
    logTest('📈', 'Verificando incremento de cantidad...');
    const materialDespuesDevolucion = await window.materialService.obtenerMaterial(material.id);
    const exitoIncremento = verificarIncremento(material, materialDespuesDevolucion, prestamo);
    
    if (exitoIncremento) {
      logTest('🎉', '¡ÉXITO! La devolución incrementó correctamente la cantidad');
      mostrarResumenExitoso(material, materialDespuesPrestamo, materialDespuesDevolucion, prestamo);
      return true;
    } else {
      logTest('❌', 'FALLO: La devolución no incrementó la cantidad correctamente');
      mostrarResumenFallido(material, materialDespuesPrestamo, materialDespuesDevolucion, prestamo);
      return false;
    }
    
  } catch (error) {
    logTest('💥', 'Error durante el test:', error);
    return false;
  }
}

// Obtener material apropiado para el test
async function obtenerMaterialParaTest() {
  try {
    const materiales = await window.materialService.listarMateriales();
    
    // Buscar material con cantidad disponible > 0
    const materialConCantidad = materiales.find(m => 
      m.estado === 'disponible' && 
      m.cantidadDisponible && 
      m.cantidadDisponible > 0
    );
    
    if (materialConCantidad) {
      return materialConCantidad;
    }
    
    // Si no hay con cantidad, buscar material único disponible
    const materialUnico = materiales.find(m => m.estado === 'disponible');
    return materialUnico;
    
  } catch (error) {
    logTest('❌', 'Error obteniendo material:', error);
    return null;
  }
}

// Crear préstamo de test
async function crearPrestamoTest(material) {
  const cantidadPrestamo = Math.min(1, material.cantidadDisponible || 1);
  
  const prestamoData = {
    materialId: material.id,
    nombreMaterial: material.nombre,
    usuarioId: 'test-user-devolucion',
    nombreUsuario: 'Usuario Test Devolución',
    cantidadPrestada: cantidadPrestamo,
    fechaPrestamo: new Date(),
    estado: 'activo',
    observaciones: 'Préstamo de test para verificar devoluciones'
  };
  
  return await window.prestamoService.crearPrestamo(prestamoData);
}

// Verificar que la cantidad disminuyó tras el préstamo
function verificarDisminucion(materialOriginal, materialDespues, prestamo) {
  if (materialOriginal.cantidadDisponible) {
    // Material con cantidad
    const esperado = materialOriginal.cantidadDisponible - prestamo.cantidadPrestada;
    const actual = materialDespues.cantidadDisponible;
    
    logTest('📊', 'Verificación disminución (cantidad):', {
      inicial: materialOriginal.cantidadDisponible,
      prestado: prestamo.cantidadPrestada,
      esperado: esperado,
      actual: actual
    });
    
    return actual === esperado;
  } else {
    // Material único - verificar estado
    logTest('📊', 'Verificación disminución (estado):', {
      estadoInicial: materialOriginal.estado,
      estadoEsperado: 'prestado',
      estadoActual: materialDespues.estado
    });
    
    return materialDespues.estado === 'prestado';
  }
}

// Verificar que la cantidad se incrementó tras la devolución
function verificarIncremento(materialOriginal, materialDespuesDevolucion, prestamo) {
  if (materialOriginal.cantidadDisponible) {
    // Material con cantidad - debería volver al valor original
    const esperado = materialOriginal.cantidadDisponible;
    const actual = materialDespuesDevolucion.cantidadDisponible;
    
    logTest('📊', 'Verificación incremento (cantidad):', {
      inicial: materialOriginal.cantidadDisponible,
      devuelto: prestamo.cantidadPrestada,
      esperado: esperado,
      actual: actual
    });
    
    return actual === esperado;
  } else {
    // Material único - debería volver a disponible
    logTest('📊', 'Verificación incremento (estado):', {
      estadoInicial: materialOriginal.estado,
      estadoEsperado: 'disponible',
      estadoActual: materialDespuesDevolucion.estado
    });
    
    return materialDespuesDevolucion.estado === 'disponible';
  }
}

// Mostrar resumen exitoso
function mostrarResumenExitoso(original, despuesPrestamo, despuesDevolucion, prestamo) {
  console.log('\n🎉 === RESUMEN EXITOSO - DEVOLUCIONES ===');
  console.log('✅ El ciclo préstamo → devolución funciona correctamente');
  console.log('📋 Detalles:');
  console.log(`   📦 Material: ${original.nombre} (${original.id})`);
  console.log(`   💼 Préstamo: ${prestamo.id}`);
  console.log(`   📊 Cantidad prestada: ${prestamo.cantidadPrestada}`);
  
  if (original.cantidadDisponible) {
    console.log(`   📈 Flujo de cantidad:`);
    console.log(`      Inicial: ${original.cantidadDisponible}`);
    console.log(`      Después préstamo: ${despuesPrestamo.cantidadDisponible}`);
    console.log(`      Después devolución: ${despuesDevolucion.cantidadDisponible}`);
  } else {
    console.log(`   🔄 Flujo de estado:`);
    console.log(`      Inicial: ${original.estado}`);
    console.log(`      Después préstamo: ${despuesPrestamo.estado}`);
    console.log(`      Después devolución: ${despuesDevolucion.estado}`);
  }
  
  console.log('🎯 CONCLUSIÓN: ¡Las devoluciones actualizan correctamente las cantidades!');
  console.log('================================================\n');
}

// Mostrar resumen fallido
function mostrarResumenFallido(original, despuesPrestamo, despuesDevolucion, prestamo) {
  console.log('\n❌ === RESUMEN FALLIDO - DEVOLUCIONES ===');
  console.log('💥 El ciclo de devoluciones tiene problemas');
  console.log('📋 Detalles:');
  console.log(`   📦 Material: ${original?.nombre || 'N/A'}`);
  console.log(`   💼 Préstamo: ${prestamo?.id || 'N/A'}`);
  
  if (original?.cantidadDisponible) {
    console.log(`   📊 Cantidades:`);
    console.log(`      Inicial: ${original.cantidadDisponible}`);
    console.log(`      Después préstamo: ${despuesPrestamo?.cantidadDisponible || 'N/A'}`);
    console.log(`      Después devolución: ${despuesDevolucion?.cantidadDisponible || 'N/A'}`);
  } else {
    console.log(`   🔄 Estados:`);
    console.log(`      Inicial: ${original?.estado || 'N/A'}`);
    console.log(`      Después préstamo: ${despuesPrestamo?.estado || 'N/A'}`);
    console.log(`      Después devolución: ${despuesDevolucion?.estado || 'N/A'}`);
  }
  
  console.log('================================================\n');
}

// Función helper para esperar
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función adicional para probar devolución con incidencia
async function probarDevolucionConIncidencia() {
  logTest('🚀', 'Iniciando test de devolución con incidencia...');
  
  try {
    // Crear préstamo primero
    const material = await obtenerMaterialParaTest();
    if (!material) {
      throw new Error('No se encontró material');
    }
    
    const prestamo = await crearPrestamoTest(material);
    await esperar(TEST_CONFIG.waitTime);
    
    // Registrar devolución con incidencia
    logTest('⚠️', 'Registrando devolución con incidencia...');
    await window.prestamoService.registrarDevolucionConIncidencia(
      prestamo.id,
      'Material devuelto con daños',
      {
        tipo: 'daño',
        gravedad: 'media',
        descripcion: 'Material con daños menores'
      }
    );
    
    logTest('✅', 'Devolución con incidencia registrada');
    await esperar(TEST_CONFIG.waitTime);
    
    // Verificar estado
    const materialFinal = await window.materialService.obtenerMaterial(material.id);
    logTest('📊', 'Material después de devolución con incidencia:', {
      estado: materialFinal.estado,
      cantidadDisponible: materialFinal.cantidadDisponible
    });
    
    return true;
    
  } catch (error) {
    logTest('❌', 'Error en test de incidencia:', error);
    return false;
  }
}

// Funciones de conveniencia para ejecutar desde consola
window.probarDevoluciones = probarDevoluciones;
window.probarDevolucionConIncidencia = probarDevolucionConIncidencia;

// Mostrar instrucciones
console.log('📝 === INSTRUCCIONES ===');
console.log('🔄 Para test completo de devoluciones: probarDevoluciones()');
console.log('⚠️ Para test de devolución con incidencia: probarDevolucionConIncidencia()');
console.log('📍 Ejecutar desde una página donde la app esté cargada');
console.log('========================');
