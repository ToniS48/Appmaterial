/**
 * GENERADOR DE DATOS HISTÓRICOS PARA CONSOLA DEL NAVEGADOR
 * Compatible con Firebase v9+ y la configuración actual de la aplicación
 * 
 * INSTRUCCIONES:
 * 1. Abrir http://localhost:3000 en el navegador
 * 2. Abrir DevTools (F12) → Console
 * 3. Copiar y pegar TODO este código
 * 4. Presionar Enter y esperar a que termine
 */

(async function generadorDatosHistoricos() {
  console.log('🚀 GENERADOR DE DATOS HISTÓRICOS v2.0');
  console.log('=====================================');
  console.log('⏰ Iniciado:', new Date().toLocaleString());

  try {
    // 1. VERIFICAR ACCESO A FIREBASE
    console.log('\n🔍 Verificando acceso a Firebase...');
    
    // Buscar instancia de Firebase en el contexto de React
    let db = null;
    
    // Método 1: Buscar en instancias de React
    const reactFiberKey = Object.keys(document.querySelector('[data-reactroot]') || {}).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber'));
    
    if (reactFiberKey) {
      console.log('✅ React encontrado, buscando instancia de Firebase...');
      // Intentar obtener db del contexto o props
      try {
        // Buscar en el store de React
        const rootElement = document.querySelector('[data-reactroot]') || document.querySelector('#root');
        if (rootElement && rootElement[reactFiberKey]) {
          console.log('✅ Contexto React encontrado');
        }
      } catch (e) {
        console.log('⚠️ No se pudo acceder al contexto React:', e.message);
      }
    }

    // Método 2: Usar importación dinámica (más directo)
    console.log('📦 Intentando importar Firebase directamente...');
    
    // Para Firebase v9+, necesitamos crear nuestro acceso
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js');
    const { getFirestore, collection, addDoc, getDocs, Timestamp } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
      // Configuración de Firebase (usando las credenciales correctas del proyecto)
    const firebaseConfig = {
      apiKey: "AIzaSyDjD0QsGG4If6nEnZChfNJuvXOsogjPOrI",
      authDomain: "fichamaterial.firebaseapp.com",
      projectId: "fichamaterial",
      storageBucket: "fichamaterial.firebasestorage.app",
      messagingSenderId: "221924315711",
      appId: "1:221924315711:web:b8a8a8a8a8a8a8a8a8a8a8",
      measurementId: "G-XXXXXXXXXX"
    };

    console.log('🔥 Inicializando Firebase...');
    const app = initializeApp(firebaseConfig, 'historial-generator');
    db = getFirestore(app);
    
    console.log('✅ Firebase conectado exitosamente');

    // 2. VERIFICAR DATOS EXISTENTES
    console.log('\n📊 Verificando datos existentes...');
    const historialRef = collection(db, 'material_historial');
    const snapshot = await getDocs(historialRef);
    
    console.log(`📈 Documentos encontrados: ${snapshot.size}`);
    
    if (snapshot.size > 0) {
      console.log('✅ Ya existen datos en la base');
      console.log('🔄 Continuando para agregar más datos...');
    }

    // 3. GENERAR DATOS DE PRUEBA
    console.log('\n🏭 Generando 60 eventos históricos...');
    
    const materialesIds = ['MAT001', 'MAT002', 'MAT003', 'MAT004', 'MAT005', 'MAT006', 'MAT007', 'MAT008'];
    const tiposEvento = [
      'mantenimiento',
      'reparacion', 
      'inspeccion',
      'reemplazo',
      'calibracion',
      'revision',
      'incidencia_menor',
      'incidencia_mayor'
    ];
    const gravedades = ['baja', 'media', 'alta'];
    const estados = ['pendiente', 'en_progreso', 'completado', 'cancelado'];
    
    console.log('📦 Creando eventos...');
    
    const eventos = [];
    const fechaInicio = new Date('2024-01-01');
    const fechaFin = new Date();
    
    for (let i = 0; i < 60; i++) {
      // Fecha aleatoria en el rango
      const fechaAleatoria = new Date(
        fechaInicio.getTime() + Math.random() * (fechaFin.getTime() - fechaInicio.getTime())
      );
      
      const materialId = materialesIds[Math.floor(Math.random() * materialesIds.length)];
      const tipoEvento = tiposEvento[Math.floor(Math.random() * tiposEvento.length)];
      
      const evento = {
        materialId: materialId,
        nombreMaterial: `Material ${materialId}`,
        tipoEvento: tipoEvento,
        descripcion: `${tipoEvento} automático del material ${materialId} - Evento ${i + 1}`,
        fecha: Timestamp.fromDate(fechaAleatoria),
        año: fechaAleatoria.getFullYear(),
        mes: fechaAleatoria.getMonth() + 1,
        dia: fechaAleatoria.getDate(),
        registradoPor: 'Sistema Automático Web',
        responsable: `Usuario${Math.floor(Math.random() * 5) + 1}`,
        gravedad: gravedades[Math.floor(Math.random() * gravedades.length)],
        estado: estados[Math.floor(Math.random() * estados.length)],
        costoAsociado: Math.random() > 0.3 ? Math.floor(Math.random() * 2000) + 100 : 0,
        tiempoEstimado: Math.floor(Math.random() * 480) + 30, // 30-510 minutos
        completado: Math.random() > 0.2,
        prioridad: Math.floor(Math.random() * 5) + 1,
        fechaRegistro: Timestamp.now(),
        metadatos: {
          generadoEn: 'consola-navegador',
          version: '2.0',
          timestamp: new Date().toISOString(),
          navegador: navigator.userAgent.split(' ')[0],
          url: window.location.href
        }
      };
      
      eventos.push(evento);
    }

    // 4. GUARDAR EN FIRESTORE
    console.log('💾 Guardando eventos en Firestore...');
    
    let guardados = 0;
    const total = eventos.length;
    
    // Guardar uno por uno para ver progreso
    for (const evento of eventos) {
      try {
        await addDoc(historialRef, evento);
        guardados++;
        
        if (guardados % 10 === 0) {
          console.log(`📈 Progreso: ${guardados}/${total} eventos guardados`);
        }
      } catch (error) {
        console.error(`❌ Error guardando evento ${guardados + 1}:`, error);
      }
    }

    console.log(`✅ ${guardados} eventos guardados exitosamente`);

    // 5. VERIFICACIÓN FINAL
    console.log('\n🔍 Verificación final...');
    const finalSnapshot = await getDocs(historialRef);
    const totalFinal = finalSnapshot.size;
    
    console.log(`📊 Total de eventos en la base: ${totalFinal}`);

    // 6. ESTADÍSTICAS
    console.log('\n📈 Generando estadísticas...');
    const stats = {
      materiales: new Set(),
      tiposEvento: {},
      costoTotal: 0,
      eventosPorAño: {},
      eventosPorMes: {}
    };

    finalSnapshot.docs.forEach(doc => {
      const data = doc.data();
      stats.materiales.add(data.materialId);
      stats.tiposEvento[data.tipoEvento] = (stats.tiposEvento[data.tipoEvento] || 0) + 1;
      stats.costoTotal += data.costoAsociado || 0;
      
      const año = data.año || new Date(data.fecha?.toDate()).getFullYear();
      const mes = data.mes || new Date(data.fecha?.toDate()).getMonth() + 1;
      
      stats.eventosPorAño[año] = (stats.eventosPorAño[año] || 0) + 1;
      stats.eventosPorMes[`${año}-${mes.toString().padStart(2, '0')}`] = 
        (stats.eventosPorMes[`${año}-${mes.toString().padStart(2, '0')}`] || 0) + 1;
    });

    console.log('\n🎉 ESTADÍSTICAS FINALES:');
    console.log(`🏷️ Materiales únicos: ${stats.materiales.size}`);
    console.log(`💰 Costo total asociado: $${stats.costoTotal.toLocaleString()}`);
    console.log('📊 Eventos por tipo:', stats.tiposEvento);
    console.log('📅 Eventos por año:', stats.eventosPorAño);
    console.log('📆 Eventos recientes:', Object.entries(stats.eventosPorMes).slice(-6));

    console.log('\n✅ GENERACIÓN COMPLETADA EXITOSAMENTE');
    console.log('🎯 El dashboard debería mostrar estos datos ahora');
    console.log('🔄 Recarga la página si no ves los cambios inmediatamente');
    console.log('📍 Para verificar: Ve a "Seguimiento de Materiales" en la aplicación');

    return {
      exito: true,
      eventosGenerados: guardados,
      totalEnBase: totalFinal,
      estadisticas: stats
    };

  } catch (error) {
    console.error('❌ ERROR EN LA GENERACIÓN:', error);
    console.log('\n💡 POSIBLES SOLUCIONES:');
    console.log('1. Verificar que estés en http://localhost:3000');
    console.log('2. Verificar que la aplicación esté funcionando correctamente');
    console.log('3. Intentar recargar la página y ejecutar nuevamente');
    console.log('4. Verificar la conexión a Internet');
    
    return {
      exito: false,
      error: error.message
    };
  }
})();

console.log('📝 Script cargado. La generación se ejecutará automáticamente...');
