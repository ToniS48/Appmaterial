/**
 * DIAGNÓSTICO ESPECÍFICO: INSTANCIACIÓN DE PRESTAMOREPOSITORY
 * 
 * Este script verifica si el problema está en cómo se instancia y usa
 * el PrestamoRepository en los componentes MaterialInventoryView y GestionMaterialPage
 */

console.log('🔍 === DIAGNÓSTICO: INSTANCIACIÓN PRESTAMOREPOSITORY ===');

async function diagnosticarInstanciacionRepo() {
  console.log('1️⃣ Verificando disponibilidad de PrestamoRepository...');
  
  // Verificar si la clase está disponible globalmente
  if (typeof window.PrestamoRepository === 'undefined') {
    console.error('❌ window.PrestamoRepository no está disponible');
    console.log('💡 Esto explica por qué no funciona en los componentes');
    
    // Verificar otras formas de acceso
    console.log('🔍 Verificando formas alternativas de acceso...');
    
    if (window.prestamoRepository) {
      console.log('✅ window.prestamoRepository (instancia) está disponible');
    } else {
      console.log('❌ window.prestamoRepository no está disponible');
    }
    
    // Verificar si está en imports de módulos
    console.log('🔍 Verificando si PrestamoRepository está importado en algún lugar...');
    console.log('💡 Buscar en:', Object.keys(window).filter(key => key.toLowerCase().includes('prestamo')));
    
    return false;
  }
  
  console.log('✅ window.PrestamoRepository está disponible');
  
  // Intentar instanciar
  console.log('2️⃣ Intentando instanciar PrestamoRepository...');
  try {
    const repo = new window.PrestamoRepository();
    console.log('✅ Instanciación exitosa');
    
    // Probar métodos básicos
    console.log('3️⃣ Probando métodos básicos...');
    
    if (typeof repo.getCantidadPrestada === 'function') {
      console.log('✅ getCantidadPrestada está disponible');
      
      // Probar con un material de prueba
      try {
        const materiales = await window.materialService.listarMateriales();
        if (materiales.length > 0) {
          const material = materiales[0];
          console.log(`4️⃣ Probando con material: ${material.nombre} (${material.id})`);
          
          const cantidad = await repo.getCantidadPrestada(material.id);
          console.log(`✅ getCantidadPrestada funciona: ${cantidad}`);
          
          return { success: true, repo, cantidad, material };
        }
      } catch (error) {
        console.error('❌ Error al probar getCantidadPrestada:', error);
        return { success: false, error: error.message };
      }
    } else {
      console.error('❌ getCantidadPrestada no está disponible en la instancia');
      console.log('🔍 Métodos disponibles:', Object.getOwnPropertyNames(repo.__proto__));
      return { success: false, error: 'getCantidadPrestada no disponible' };
    }
    
  } catch (error) {
    console.error('❌ Error al instanciar PrestamoRepository:', error);
    return { success: false, error: error.message };
  }
}

async function verificarImportacionComponentes() {
  console.log('\n🔍 === VERIFICACIÓN: IMPORTACIÓN EN COMPONENTES ===');
  
  // Verificar si los componentes pueden acceder al repositorio
  console.log('1️⃣ Simulando importación como en MaterialInventoryView...');
  
  try {
    // Simular la lógica de importación
    const { PrestamoRepository } = window;
    
    if (!PrestamoRepository) {
      console.error('❌ No se puede acceder a PrestamoRepository como en los componentes');
      console.log('💡 PROBLEMA IDENTIFICADO: Los componentes no pueden importar PrestamoRepository');
      console.log('📋 SOLUCIÓN: Verificar que PrestamoRepository esté exportado globalmente o disponible en el contexto correcto');
      return false;
    }
    
    const prestamoRepo = new PrestamoRepository();
    console.log('✅ Simulación de importación exitosa');
    
    // Simular la lógica de carga de cantidades como en los componentes
    console.log('2️⃣ Simulando lógica de carga de cantidades...');
    
    const materiales = await window.materialService.listarMateriales();
    if (materiales.length === 0) {
      console.log('⚠️ No hay materiales para probar');
      return true;
    }
    
    const cantidadesPrestadas = {};
    
    console.log('3️⃣ Cargando cantidades como en useEffect de los componentes...');
    
    // Simular Promise.all como en los componentes
    await Promise.all(
      materiales.slice(0, 3).map(async (material) => {
        if (material.id) {
          try {
            const cantidadPrestada = await prestamoRepo.getCantidadPrestada(material.id);
            cantidadesPrestadas[material.id] = cantidadPrestada;
            console.log(`✅ ${material.nombre}: ${cantidadPrestada}`);
          } catch (error) {
            console.error(`❌ Error con ${material.nombre}:`, error);
            cantidadesPrestadas[material.id] = 0;
          }
        }
      })
    );
    
    console.log('4️⃣ Resultado de simulación:', cantidadesPrestadas);
    
    // Verificar si hay valores no cero
    const valoresNoCero = Object.values(cantidadesPrestadas).filter(v => v > 0);
    if (valoresNoCero.length === 0) {
      console.log('⚠️ Todas las cantidades prestadas son 0');
      console.log('💡 Esto podría explicar por qué "En uso / Total" muestra 0/X');
      
      // Verificar si realmente hay préstamos
      console.log('5️⃣ Verificando si realmente hay préstamos en Firestore...');
      await verificarPrestamosEnFirestore();
    } else {
      console.log('✅ Se encontraron cantidades prestadas > 0');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error en verificación de importación:', error);
    return false;
  }
}

async function verificarPrestamosEnFirestore() {
  try {
    if (!window.firebase || !window.firebase.firestore) {
      console.log('❌ Firebase no disponible');
      return;
    }
    
    const { collection, getDocs, getFirestore, query, where } = window.firebase.firestore;
    const db = getFirestore();
    
    // Obtener todos los préstamos
    const prestamosRef = collection(db, 'prestamos');
    const snapshot = await getDocs(prestamosRef);
    
    console.log(`📊 Total préstamos en Firestore: ${snapshot.docs.length}`);
    
    if (snapshot.docs.length === 0) {
      console.log('⚠️ No hay préstamos en Firestore');
      console.log('💡 Esto explica por qué todas las cantidades son 0');
      return;
    }
    
    // Analizar estados de préstamos
    const estadosCount = {};
    const materialesCount = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Contar por estado
      estadosCount[data.estado] = (estadosCount[data.estado] || 0) + 1;
      
      // Contar por material
      if (data.materialId) {
        materialesCount[data.materialId] = (materialesCount[data.materialId] || 0) + (data.cantidadPrestada || 1);
      }
    });
    
    console.log('📊 Distribución por estado:', estadosCount);
    console.log('📊 Cantidades por material:', materialesCount);
    
    // Verificar préstamos activos (no devueltos)
    const prestamosActivos = snapshot.docs.filter(doc => doc.data().estado !== 'devuelto');
    console.log(`📋 Préstamos activos (no devueltos): ${prestamosActivos.length}`);
    
    if (prestamosActivos.length === 0) {
      console.log('⚠️ No hay préstamos activos');
      console.log('💡 Todos los préstamos están marcados como "devuelto"');
    } else {
      console.log('✅ Hay préstamos activos, el problema podría estar en el filtrado');
      
      // Mostrar ejemplos de préstamos activos
      console.log('📄 Ejemplos de préstamos activos:');
      prestamosActivos.slice(0, 3).forEach((doc, i) => {
        const data = doc.data();
        console.log(`  ${i + 1}. Material: ${data.materialId}, Estado: ${data.estado}, Cantidad: ${data.cantidadPrestada}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando préstamos en Firestore:', error);
  }
}

async function diagnosticoCompleto() {
  console.log('🚀 === DIAGNÓSTICO COMPLETO ===\n');
  
  // Paso 1: Verificar instanciación
  const resultadoInstanciacion = await diagnosticarInstanciacionRepo();
  
  if (!resultadoInstanciacion || !resultadoInstanciacion.success) {
    console.log('\n🚨 PROBLEMA CRÍTICO: No se puede instanciar PrestamoRepository');
    console.log('💡 SOLUCIÓN: Asegurar que PrestamoRepository esté disponible globalmente');
    return;
  }
  
  // Paso 2: Verificar importación en componentes
  const resultadoImportacion = await verificarImportacionComponentes();
  
  if (!resultadoImportacion) {
    console.log('\n🚨 PROBLEMA: Error en simulación de importación');
    return;
  }
  
  console.log('\n✅ DIAGNÓSTICO COMPLETO EXITOSO');
  console.log('📋 RESUMEN: El PrestamoRepository funciona correctamente');
  console.log('💡 Si aún hay problemas, verificar:');
  console.log('  1. Los componentes están importando correctamente');
  console.log('  2. useEffect se está ejecutando');
  console.log('  3. Los estados se están actualizando');
}

// Exponer funciones
window.diagnosticarInstanciacionRepo = diagnosticarInstanciacionRepo;
window.verificarImportacionComponentes = verificarImportacionComponentes;
window.verificarPrestamosEnFirestore = verificarPrestamosEnFirestore;
window.diagnosticoCompleto = diagnosticoCompleto;

// Ejecutar automáticamente
console.log('🚀 Ejecutando diagnóstico automático...');
diagnosticoCompleto();
