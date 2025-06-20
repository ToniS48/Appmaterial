/**
 * GENERADOR DE HISTORIAL MEJORADO - VERSIÓN ROBUSTA
 * Con manejo de errores y timeouts mejorado
 */

(async function generarHistorialRobusto() {
  console.log('🚀 === GENERADOR DE HISTORIAL ROBUSTO ===');
  
  try {
    // Verificar Firebase con timeout
    if (typeof window.firebase === 'undefined' || !window.firebase.db) {
      console.error('❌ Firebase no disponible');
      return;
    }
    
    const db = window.firebase.db;
    console.log('✅ Firebase conectado');
    
    // Verificar autenticación
    if (!window.firebase.auth?.currentUser) {
      console.error('❌ Usuario no autenticado');
      return;
    }
    
    console.log(`👤 Usuario: ${window.firebase.auth.currentUser.email}`);
    
    // Importar funciones con timeout
    console.log('📦 Importando funciones de Firestore...');
    const { collection, addDoc, getDocs, doc, setDoc } = await Promise.race([
      import('firebase/firestore'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout en import')), 5000))
    ]);
    console.log('✅ Funciones importadas');
    
    // Función helper para agregar delay
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Tipos de eventos
    const TIPOS_EVENTO = [
      'entrada_inicial',
      'consumo_diario', 
      'reposicion',
      'ajuste_inventario',
      'transferencia',
      'caducidad'
    ];
    
    // Función para generar fecha aleatoria
    function generarFechaAleatoria() {
      const ahora = new Date();
      const seiseMesesAtras = new Date(ahora.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
      const tiempo = seiseMesesAtras.getTime() + Math.random() * (ahora.getTime() - seiseMesesAtras.getTime());
      return new Date(tiempo);
    }
    
    // Función para generar cantidad
    function generarCantidad(tipo) {
      switch (tipo) {
        case 'entrada_inicial': return Math.floor(Math.random() * 500) + 100;
        case 'consumo_diario': return -(Math.floor(Math.random() * 20) + 1);
        case 'reposicion': return Math.floor(Math.random() * 200) + 50;
        case 'ajuste_inventario': return Math.floor(Math.random() * 21) - 10;
        case 'transferencia': return -(Math.floor(Math.random() * 30) + 5);
        case 'caducidad': return -(Math.floor(Math.random() * 15) + 1);
        default: return Math.floor(Math.random() * 50);
      }
    }
    
    // 1. Verificar inventario con timeout
    console.log('📋 Verificando inventario...');
    const inventarioSnapshot = await Promise.race([
      getDocs(collection(db, 'inventario_materiales')),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout inventario')), 10000))
    ]);
    
    console.log(`📦 Materiales encontrados: ${inventarioSnapshot.size}`);
    
    // Si no hay materiales, crear algunos rápidamente
    if (inventarioSnapshot.empty) {
      console.log('🔧 Creando materiales de ejemplo...');
      
      const materialesBasicos = [
        { nombre: 'Cemento Portland', cantidad: 150, unidad: 'sacos', categoria: 'Cemento' },
        { nombre: 'Arena Fina', cantidad: 80, unidad: 'm³', categoria: 'Agregados' },
        { nombre: 'Acero #4', cantidad: 200, unidad: 'varillas', categoria: 'Acero' }
      ];
      
      for (const material of materialesBasicos) {
        try {
          const materialRef = doc(collection(db, 'inventario_materiales'));
          await setDoc(materialRef, {
            ...material,
            fechaCreacion: new Date(),
            estado: 'activo',
            ubicacion: 'Almacén Principal'
          });
          console.log(`✅ ${material.nombre}`);
          await delay(200); // Pausa para evitar rate limiting
        } catch (error) {
          console.warn(`⚠️ Error creando ${material.nombre}:`, error.message);
        }
      }
    }
    
    // 2. Obtener materiales finales
    console.log('📦 Obteniendo materiales...');
    const materialesSnapshot = await getDocs(collection(db, 'inventario_materiales'));
    const materiales = materialesSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    
    console.log(`📊 Total materiales: ${materiales.length}`);
    
    if (materiales.length === 0) {
      console.error('❌ No se pudieron obtener materiales');
      return;
    }
    
    // 3. Generar eventos con progreso
    console.log('📈 Iniciando generación de eventos...');
    const historialRef = collection(db, 'material_historial');
    let totalEventos = 0;
    const eventosPorMaterial = 15; // Reducido para ir más rápido
    const totalEventosEsperados = materiales.length * eventosPorMaterial;
    
    for (let i = 0; i < materiales.length; i++) {
      const material = materiales[i];
      console.log(`🔄 ${material.nombre || `Material ${i + 1}`} (${i + 1}/${materiales.length})`);
      
      // Generar eventos en lotes pequeños
      for (let j = 0; j < eventosPorMaterial; j++) {
        try {
          const tipoEvento = TIPOS_EVENTO[Math.floor(Math.random() * TIPOS_EVENTO.length)];
          const cantidad = generarCantidad(tipoEvento);
          const fecha = generarFechaAleatoria();
          
          const evento = {
            materialId: material.id,
            materialNombre: material.nombre || 'Material sin nombre',
            tipo: tipoEvento,
            cantidad: cantidad,
            cantidadAnterior: Math.max(0, (material.cantidad || 100) + Math.floor(Math.random() * 50)),
            cantidadNueva: Math.max(0, (material.cantidad || 100) + cantidad),
            timestamp: fecha,
            observaciones: `${tipoEvento.replace('_', ' ').toUpperCase()}`,
            usuario: 'Sistema Automático',
            origen: 'generador_robusto',
            categoria: material.categoria || 'General',
            ubicacion: material.ubicacion || 'Almacén'
          };
          
          await addDoc(historialRef, evento);
          totalEventos++;
          
          // Progreso cada 10 eventos
          if (totalEventos % 10 === 0) {
            const progreso = ((totalEventos / totalEventosEsperados) * 100).toFixed(1);
            console.log(`📊 Progreso: ${totalEventos}/${totalEventosEsperados} (${progreso}%)`);
          }
          
          // Pausa cada 5 eventos para evitar problemas
          if (totalEventos % 5 === 0) {
            await delay(100);
          }
          
        } catch (error) {
          console.warn(`⚠️ Error en evento ${j + 1} para ${material.nombre}:`, error.message);
        }
      }
    }
    
    console.log('🎉 === GENERACIÓN COMPLETADA ===');
    console.log(`✅ Eventos creados: ${totalEventos}`);
    console.log(`📦 Materiales procesados: ${materiales.length}`);
    
    // Verificación final
    console.log('🔍 Verificación final...');
    try {
      const verificacionSnapshot = await getDocs(collection(db, 'material_historial'));
      console.log(`📈 Total eventos en BD: ${verificacionSnapshot.size}`);
      
      if (verificacionSnapshot.size > 0) {
        console.log('\n🎯 === ÉXITO ===');
        console.log('✅ Historial generado correctamente');
        console.log('🔄 RECARGA el dashboard: Material > Seguimiento');
        console.log('📊 Deberías ver gráficos con datos');
        
        // Función para recargar automáticamente
        console.log('\n💡 Para recargar automáticamente el dashboard:');
        console.log('window.location.href = "/material/seguimiento"');
      }
    } catch (error) {
      console.warn('⚠️ Error en verificación:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
    console.log('💡 Sugerencias:');
    console.log('1. Verifica que estés logueado como admin');
    console.log('2. Recarga la página y vuelve a intentar');
    console.log('3. Verifica la conexión a internet');
  }
})();

console.log('🔄 Ejecutando generador robusto...');
