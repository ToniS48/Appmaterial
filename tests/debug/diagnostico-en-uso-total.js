/**
 * DIAGNÓSTICO: PROBLEMA EN COLUMNA "EN USO / TOTAL" 
 * 
 * Este script verifica el cálculo correcto de las cantidades en uso vs total
 * después de reiniciar la base de datos y crear una primera actividad.
 * 
 * EJECUTAR EN CONSOLA DEL NAVEGADOR
 */

console.log('🔍 === DIAGNÓSTICO: EN USO / TOTAL ===');
console.log('Analizando discrepancias en el cálculo de cantidades...');

async function diagnosticarEnUsoTotal() {
  try {
    console.log('1️⃣ Verificando servicios disponibles...');
    
    // Verificar que los servicios estén disponibles
    if (!window.materialService) {
      console.error('❌ materialService no disponible');
      return;
    }
    
    console.log('2️⃣ Obteniendo datos de materiales...');
    const materiales = await window.materialService.listarMateriales();
    console.log(`📦 Total materiales encontrados: ${materiales.length}`);
    
    if (materiales.length === 0) {
      console.log('⚠️ No hay materiales en la base de datos');
      return;
    }
    
    console.log('3️⃣ Verificando estructura de datos de materiales...');
    materiales.slice(0, 3).forEach((material, index) => {
      console.log(`Material ${index + 1}:`, {
        nombre: material.nombre,
        tipo: material.tipo,
        cantidad: material.cantidad,
        cantidadDisponible: material.cantidadDisponible,
        estado: material.estado
      });
    });
    
    console.log('4️⃣ Verificando repositorio de préstamos...');
    
    // Crear instancia del repositorio de préstamos
    let prestamoRepo;
    try {
      if (window.PrestamoRepository) {
        prestamoRepo = new window.PrestamoRepository();
        console.log('✅ PrestamoRepository instanciado correctamente');
      } else {
        console.log('⚠️ PrestamoRepository no disponible directamente');
        // Verificar servicios alternativos
        await verificarServicios();
        return;
      }
    } catch (error) {
      console.error('❌ Error instanciando PrestamoRepository:', error);
      return;
    }
    
    console.log('5️⃣ Verificando cantidades prestadas por material...');
    
    const resultados = [];
    for (const material of materiales.slice(0, 5)) { // Solo los primeros 5 para testing
      try {
        console.log(`\n🔍 Analizando: ${material.nombre} (${material.tipo})`);
        
        // Obtener cantidad prestada usando el repositorio
        const cantidadPrestada = await prestamoRepo.getCantidadPrestada(material.id);
        console.log(`   📊 Cantidad prestada según repo: ${cantidadPrestada}`);
        
        // Verificar préstamos activos directamente
        const prestamosActivos = await prestamoRepo.findPrestamos({
          materialId: material.id,
          where: [{ field: 'estado', operator: '!=', value: 'devuelto' }]
        });
        console.log(`   📋 Préstamos activos encontrados: ${prestamosActivos.length}`);
        
        // Calcular manualmente la suma
        const sumaManual = prestamosActivos.reduce((sum, p) => sum + (p.cantidadPrestada || 1), 0);
        console.log(`   🧮 Suma manual de cantidades: ${sumaManual}`);
        
        // Determinar cantidad total según tipo
        const cantidadTotal = material.tipo === 'cuerda' ? 1 : (Number(material.cantidad) || 0);
        console.log(`   📏 Cantidad total: ${cantidadTotal}`);
        
        const calculoCorrector = `${cantidadPrestada} / ${cantidadTotal}`;
        console.log(`   📈 Cálculo "En uso / Total": ${calculoCorrector}`);
        
        resultados.push({
          nombre: material.nombre,
          tipo: material.tipo,
          cantidadTotal,
          cantidadPrestada,
          prestamosActivos: prestamosActivos.length,
          sumaManual,
          calculoEnUso: calculoCorrector,
          estado: material.estado,
          consistente: cantidadPrestada === sumaManual
        });
        
        // Mostrar detalles de préstamos si hay inconsistencias
        if (cantidadPrestada !== sumaManual || prestamosActivos.length > 0) {
          console.log(`   🔍 Detalles de préstamos:`);
          prestamosActivos.forEach((prestamo, i) => {
            console.log(`     ${i + 1}. Estado: ${prestamo.estado}, Cantidad: ${prestamo.cantidadPrestada}, Usuario: ${prestamo.nombreUsuario}`);
          });
        }
        
      } catch (error) {
        console.error(`❌ Error con material ${material.nombre}:`, error);
        resultados.push({
          nombre: material.nombre,
          tipo: material.tipo,
          error: error.message
        });
      }
    }
    
    console.log('\n6️⃣ Resumen de resultados:');
    console.table(resultados);
    
    // Análisis de problemas
    const problemasDetectados = resultados.filter(r => r.error || !r.consistente);
    if (problemasDetectados.length > 0) {
      console.log('\n🚨 PROBLEMAS DETECTADOS:');
      problemasDetectados.forEach(problema => {
        if (problema.error) {
          console.log(`❌ ${problema.nombre}: ${problema.error}`);
        } else if (!problema.consistente) {
          console.log(`⚠️ ${problema.nombre}: Inconsistencia en cálculo (repo: ${problema.cantidadPrestada}, manual: ${problema.sumaManual})`);
        }
      });
    } else {
      console.log('\n✅ No se detectaron problemas en los cálculos');
    }
    
    return resultados;
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

async function verificarServicios() {
  console.log('🔧 Verificando servicios alternativos...');
  
  // Verificar if prestamoService está disponible
  if (window.prestamoService) {
    console.log('✅ prestamoService disponible');
    // Probar obtener préstamos directamente
    try {
      const prestamos = await window.prestamoService.listarPrestamos();
      console.log(`📋 Total préstamos en sistema: ${prestamos.length}`);
      
      if (prestamos.length > 0) {
        console.log('📄 Ejemplo de préstamos:');
        prestamos.slice(0, 3).forEach((prestamo, i) => {
          console.log(`  ${i + 1}. ${prestamo.nombreMaterial} - Estado: ${prestamo.estado} - Cantidad: ${prestamo.cantidadPrestada}`);
        });
      }
    } catch (error) {
      console.error('❌ Error obteniendo préstamos:', error);
    }
  } else {
    console.log('❌ prestamoService no disponible');
  }
}

async function verificarColeccionesDirect() {
  try {
    console.log('🔍 Verificando colecciones directamente en Firestore...');
    
    // Verificar si Firebase está disponible
    if (!window.firebase || !window.firebase.firestore) {
      console.error('❌ Firebase/Firestore no disponible');
      return;
    }
    
    const { collection, getDocs, getFirestore, query, where } = window.firebase.firestore;
    const db = getFirestore();
    
    // Verificar colección de materiales
    const materialesRef = collection(db, 'material_deportivo');
    const materialesSnapshot = await getDocs(materialesRef);
    console.log(`📦 Materiales en Firestore: ${materialesSnapshot.docs.length}`);
    
    // Verificar colección de préstamos
    const prestamosRef = collection(db, 'prestamos');
    const prestamosSnapshot = await getDocs(prestamosRef);
    console.log(`📋 Préstamos en Firestore: ${prestamosSnapshot.docs.length}`);
    
    // Verificar colección de actividades
    const actividadesRef = collection(db, 'actividades');
    const actividadesSnapshot = await getDocs(actividadesRef);
    console.log(`🎯 Actividades en Firestore: ${actividadesSnapshot.docs.length}`);
    
    // Mostrar algunos datos de ejemplo
    if (prestamosSnapshot.docs.length > 0) {
      console.log('\n📋 Ejemplo de préstamos en Firestore:');
      prestamosSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. Material: ${data.materialId}, Cantidad: ${data.cantidadPrestada}, Estado: ${data.estado}`);
        console.log(`      Usuario: ${data.nombreUsuario}, Actividad: ${data.nombreActividad || 'N/A'}`);
      });
    } else {
      console.log('⚠️ No hay préstamos en Firestore');
    }
    
    if (actividadesSnapshot.docs.length > 0) {
      console.log('\n🎯 Ejemplo de actividades:');
      actividadesSnapshot.docs.slice(0, 2).forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ${data.nombre}, Materiales: ${data.materiales?.length || 0}`);
        if (data.materiales && data.materiales.length > 0) {
          data.materiales.forEach((mat, i) => {
            console.log(`    - ${mat.nombre}: cantidad ${mat.cantidad}`);
          });
        }
      });
    } else {
      console.log('⚠️ No hay actividades en Firestore');
    }
    
  } catch (error) {
    console.error('❌ Error verificando colecciones:', error);
  }
}

async function simularCalculoComponentes() {
  console.log('\n🧮 Simulando cálculo como en MaterialInventoryView y GestionMaterialPage...');
  
  try {
    const materiales = await window.materialService.listarMateriales();
    
    // Simular la lógica de los componentes actuales
    const prestamoRepo = new window.PrestamoRepository();
    
    console.log('\n🔍 Simulando carga de cantidades prestadas:');
    
    const cantidadesPrestadas = {};
    
    for (const material of materiales.slice(0, 3)) {
      try {
        const cantidadPrestada = await prestamoRepo.getCantidadPrestada(material.id);
        cantidadesPrestadas[material.id] = cantidadPrestada;
        
        console.log(`📊 ${material.nombre}: ${cantidadPrestada} prestado`);
        
        // Simular renderizado como en los componentes
        if (material.tipo === 'cuerda') {
          const resultado = `${cantidadPrestada}/1`;
          console.log(`   🔗 Cuerda - Resultado: ${resultado}`);
        } else {
          const cantidadTotal = Number(material.cantidad) || 0;
          const resultado = `${cantidadPrestada}/${cantidadTotal}`;
          console.log(`   📦 ${material.tipo} - Resultado: ${resultado}`);
        }
        
      } catch (error) {
        console.error(`❌ Error con ${material.nombre}:`, error);
        cantidadesPrestadas[material.id] = 0;
      }
    }
    
    console.log('\n📊 Cantidades prestadas calculadas:', cantidadesPrestadas);
    
  } catch (error) {
    console.error('❌ Error en simulación:', error);
  }
}

// Exponer funciones globalmente
window.diagnosticarEnUsoTotal = diagnosticarEnUsoTotal;
window.verificarColeccionesDirect = verificarColeccionesDirect;
window.simularCalculoComponentes = simularCalculoComponentes;
window.verificarServicios = verificarServicios;

// Ejecutar diagnóstico automático
console.log('🚀 Ejecutando diagnóstico automático...');
diagnosticarEnUsoTotal().then(() => {
  console.log('\n📋 FUNCIONES DISPONIBLES:');
  console.log('- diagnosticarEnUsoTotal(): Diagnóstico completo');
  console.log('- verificarColeccionesDirect(): Verificar Firestore directamente');  
  console.log('- simularCalculoComponentes(): Simular cálculo de componentes');
  console.log('- verificarServicios(): Verificar servicios alternativos');
  
  console.log('\n💡 SIGUIENTE PASO: Ejecuta verificarColeccionesDirect() para ver datos en Firestore');
});
