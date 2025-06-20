/**
 * VERIFICADOR Y GENERADOR AUTOMÁTICO PARA CONSOLA DEL NAVEGADOR
 * 
 * INSTRUCCIONES:
 * 1. Abrir http://localhost:3000 en el navegador
 * 2. Abrir DevTools (F12)
 * 3. Ir a la pestaña Console
 * 4. Copiar y pegar TODO este código y presionar Enter
 * 5. El script verificará los datos y generará automáticamente si no existen
 */

(async function verificadorAutomatico() {
  console.log('🚀 INICIANDO VERIFICACIÓN Y GENERACIÓN AUTOMÁTICA...');
  console.log('⏰ Tiempo:', new Date().toLocaleString());

  try {
    // Verificar que Firebase está disponible
    if (!window.firebase) {
      console.error('❌ Firebase no está disponible. Asegúrate de estar en la aplicación.');
      return;
    }

    const db = window.firebase.firestore();
    console.log('✅ Firebase conectado correctamente');

    // 1. VERIFICAR DATOS EXISTENTES
    console.log('\n📊 VERIFICANDO DATOS EXISTENTES...');
    
    const snapshot = await db.collection('material_historial').limit(10).get();
    const totalDocumentos = snapshot.size;
    
    console.log(`📈 Documentos encontrados: ${totalDocumentos}`);
    
    if (totalDocumentos === 0) {
      console.log('⚠️ No hay datos. Generando datos de prueba...');
      await generarDatosPrueba(db);
    } else {
      console.log('✅ Datos existentes encontrados');
      mostrarMuestraDatos(snapshot);
    }

    // 2. VERIFICAR ESTADO FINAL
    await verificarEstadoFinal(db);

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }

  // Función para generar datos de prueba
  async function generarDatosPrueba(db) {
    console.log('📦 Generando 30 eventos de prueba...');
    
    const materialesEjemplo = ['MAT001', 'MAT002', 'MAT003', 'MAT004', 'MAT005'];
    const tiposEvento = ['mantenimiento', 'reparacion', 'inspeccion', 'reemplazo', 'calibracion'];
    const gravedades = ['baja', 'media', 'alta'];
    
    const eventos = [];
    
    // Generar eventos para los últimos 2 años
    for (let i = 0; i < 30; i++) {
      const fechaAleatoria = new Date();
      fechaAleatoria.setDate(fechaAleatoria.getDate() - Math.floor(Math.random() * 730));
      
      const evento = {
        materialId: materialesEjemplo[Math.floor(Math.random() * materialesEjemplo.length)],
        nombreMaterial: `Material ${materialesEjemplo[Math.floor(Math.random() * materialesEjemplo.length)]}`,
        tipoEvento: tiposEvento[Math.floor(Math.random() * tiposEvento.length)],
        descripcion: `Evento automático generado para pruebas - ${i + 1}`,
        fecha: window.firebase.firestore.Timestamp.fromDate(fechaAleatoria),
        año: fechaAleatoria.getFullYear(),
        mes: fechaAleatoria.getMonth() + 1,
        registradoPor: 'Sistema Automático',
        gravedad: gravedades[Math.floor(Math.random() * gravedades.length)],
        costoAsociado: Math.random() > 0.5 ? Math.floor(Math.random() * 1000) + 100 : 0,
        completado: Math.random() > 0.2,
        fechaRegistro: window.firebase.firestore.Timestamp.now()
      };
      
      eventos.push(evento);
    }
    
    // Guardar en lotes
    const batch = db.batch();
    eventos.forEach(evento => {
      const ref = db.collection('material_historial').doc();
      batch.set(ref, evento);
    });
    
    await batch.commit();
    console.log('✅ Datos generados correctamente');
  }

  // Función para mostrar muestra de datos
  function mostrarMuestraDatos(snapshot) {
    console.log('\n📋 MUESTRA DE DATOS:');
    snapshot.docs.slice(0, 3).forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. Material: ${data.materialId} | Evento: ${data.tipoEvento} | Fecha: ${data.fecha?.toDate?.()?.toLocaleDateString() || 'N/A'}`);
    });
  }

  // Función para verificar estado final
  async function verificarEstadoFinal(db) {
    console.log('\n🔍 VERIFICACIÓN FINAL...');
    
    const finalSnapshot = await db.collection('material_historial').get();
    const total = finalSnapshot.size;
    
    console.log(`📊 Total de eventos: ${total}`);
    
    if (total > 0) {
      // Análisis por tipo de evento
      const eventTypes = {};
      const materials = new Set();
      let totalCost = 0;
      
      finalSnapshot.docs.forEach(doc => {
        const data = doc.data();
        eventTypes[data.tipoEvento] = (eventTypes[data.tipoEvento] || 0) + 1;
        materials.add(data.materialId);
        totalCost += data.costoAsociado || 0;
      });
      
      console.log('\n📈 ESTADÍSTICAS:');
      console.log(`🏷️ Materiales únicos: ${materials.size}`);
      console.log(`💰 Costo total: $${totalCost.toLocaleString()}`);
      console.log('📊 Eventos por tipo:', eventTypes);
      
      console.log('\n✅ VERIFICACIÓN COMPLETA');
      console.log('🎯 El dashboard debería mostrar estos datos ahora');
      console.log('🔄 Si no ves los datos, recarga la página (Ctrl+F5)');
    } else {
      console.log('❌ No se encontraron datos después de la generación');
    }
  }
})();

console.log('📝 Script cargado. La verificación se ejecutará automáticamente...');
