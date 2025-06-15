/**
 * DIAGNÓSTICO FINAL: PROBLEMA "EN USO / TOTAL" 
 * 
 * Este script verifica el estado real de la base de datos y los cálculos
 * después de reiniciar la base de datos.
 * 
 * EJECUTAR EN CONSOLA DEL NAVEGADOR DESPUÉS DE CREAR UNA ACTIVIDAD
 */

console.log('🔍 === DIAGNÓSTICO FINAL: EN USO / TOTAL ===');

// Función principal de diagnóstico
async function diagnosticarProblemaEnUsoTotal() {
  try {
    console.log('1️⃣ Verificando servicios Firebase...');
    
    if (!window.firebase || !window.firebase.firestore) {
      console.error('❌ Firebase no está disponible');
      return;
    }
    
    const db = window.firebase.firestore();
    console.log('✅ Firebase conectado');
    
    console.log('2️⃣ Verificando colecciones básicas...');
    
    // Verificar materiales
    const materialesSnapshot = await db.collection('materiales').get();
    console.log(`📦 Materiales en BD: ${materialesSnapshot.size}`);
    
    if (materialesSnapshot.size === 0) {
      console.log('⚠️ NO HAY MATERIALES - Este es el problema!');
      console.log('💡 Solución: Crear materiales primero');
      return;
    }
    
    // Verificar préstamos
    const prestamosSnapshot = await db.collection('prestamos').get();
    console.log(`🔄 Préstamos totales en BD: ${prestamosSnapshot.size}`);
    
    if (prestamosSnapshot.size === 0) {
      console.log('⚠️ NO HAY PRÉSTAMOS - Este es el comportamiento esperado después de reiniciar BD');
      console.log('✅ La columna "En uso / Total" mostrará 0/X correctamente');
    }
    
    // Verificar préstamos por estado
    const estadosCount = {};
    prestamosSnapshot.forEach(doc => {
      const data = doc.data();
      estadosCount[data.estado] = (estadosCount[data.estado] || 0) + 1;
    });
    
    console.log('📊 Préstamos por estado:', estadosCount);
    
    // Verificar préstamos NO devueltos
    const prestamosActivosSnapshot = await db.collection('prestamos')
      .where('estado', '!=', 'devuelto')
      .get();
    
    console.log(`🔴 Préstamos activos (no devueltos): ${prestamosActivosSnapshot.size}`);
    
    if (prestamosActivosSnapshot.size === 0) {
      console.log('✅ CORRECTO: No hay préstamos activos');
      console.log('✅ Por tanto, "En uso" = 0 es el valor correcto');
    }
    
    console.log('3️⃣ Verificando actividades...');
    
    const actividadesSnapshot = await db.collection('actividades').get();
    console.log(`🎯 Actividades en BD: ${actividadesSnapshot.size}`);
    
    if (actividadesSnapshot.size > 0) {
      console.log('📋 Estados de actividades:');
      const estadosActividades = {};
      actividadesSnapshot.forEach(doc => {
        const data = doc.data();
        estadosActividades[data.estado] = (estadosActividades[data.estado] || 0) + 1;
      });
      console.log(estadosActividades);
    }
    
    console.log('4️⃣ Simulando cálculo de getCantidadPrestada...');
    
    // Obtener primer material para simular
    const primerMaterial = materialesSnapshot.docs[0];
    if (primerMaterial) {
      const materialData = primerMaterial.data();
      const materialId = primerMaterial.id;
      
      console.log(`🔍 Simulando cálculo para material: ${materialData.nombre} (${materialId})`);
      
      // Buscar préstamos de este material
      const prestamosDelMaterialSnapshot = await db.collection('prestamos')
        .where('materialId', '==', materialId)
        .get();
      
      console.log(`📦 Préstamos totales del material: ${prestamosDelMaterialSnapshot.size}`);
      
      // Filtrar solo no devueltos
      let cantidadPrestada = 0;
      prestamosDelMaterialSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.estado !== 'devuelto') {
          cantidadPrestada += (data.cantidadPrestada || 1);
        }
      });
      
      console.log(`🧮 Cantidad prestada calculada: ${cantidadPrestada}`);
      console.log(`📊 Cantidad total del material: ${materialData.cantidad || 'sin cantidad'}`);
      console.log(`✅ Resultado esperado "En uso / Total": ${cantidadPrestada}/${materialData.cantidad || '?'}`);
    }
    
    console.log('5️⃣ Recomendaciones...');
    
    if (prestamosSnapshot.size === 0) {
      console.log('💡 ESTADO NORMAL: Después de reiniciar BD, no hay préstamos');
      console.log('💡 ACCIÓN: Crear una actividad con materiales para generar préstamos');
      console.log('💡 RESULTADO: La columna "En uso / Total" se actualizará automáticamente');
    } else if (prestamosActivosSnapshot.size === 0) {
      console.log('💡 ESTADO: Todos los préstamos están devueltos');
      console.log('💡 CORRECTO: "En uso" = 0 es el valor esperado');
    } else {
      console.log('💡 HAY PRÉSTAMOS ACTIVOS: Verificar cálculo en componente');
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

// Función para probar específicamente un material
async function probarCalculoMaterial(materialId) {
  try {
    console.log(`🧪 === PRUEBA ESPECÍFICA PARA MATERIAL: ${materialId} ===`);
    
    const db = window.firebase.firestore();
    
    // Obtener datos del material
    const materialDoc = await db.collection('materiales').doc(materialId).get();
    if (!materialDoc.exists) {
      console.error('❌ Material no encontrado');
      return;
    }
    
    const materialData = materialDoc.data();
    console.log('📦 Material:', materialData.nombre);
    console.log('📊 Cantidad total:', materialData.cantidad);
    
    // Obtener préstamos del material
    const prestamosSnapshot = await db.collection('prestamos')
      .where('materialId', '==', materialId)
      .get();
    
    console.log(`🔄 Préstamos totales: ${prestamosSnapshot.size}`);
    
    let cantidadPrestada = 0;
    prestamosSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  - Estado: ${data.estado}, Cantidad: ${data.cantidadPrestada || 1}`);
      
      if (data.estado !== 'devuelto') {
        cantidadPrestada += (data.cantidadPrestada || 1);
      }
    });
    
    console.log(`📊 Resultado: ${cantidadPrestada}/${materialData.cantidad}`);
    
  } catch (error) {
    console.error('❌ Error probando material:', error);
  }
}

// Ejecutar automáticamente
console.log('🚀 Ejecutando diagnóstico automático...');
diagnosticarProblemaEnUsoTotal();

// Exponer funciones globalmente para uso manual
window.diagnosticarProblemaEnUsoTotal = diagnosticarProblemaEnUsoTotal;
window.probarCalculoMaterial = probarCalculoMaterial;

console.log('💡 Funciones disponibles:');
console.log('   - diagnosticarProblemaEnUsoTotal()');
console.log('   - probarCalculoMaterial(materialId)');
