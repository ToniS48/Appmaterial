/**
 * GENERADOR DE HISTORIAL DIRECTO - CONSOLA DEL NAVEGADOR
 * 
 * INSTRUCCIONES:
 * 1. Abre la aplicación en http://localhost:3000
 * 2. Asegúrate de estar logueado como admin
 * 3. Abre DevTools (F12) y ve a Console
 * 4. Copia y pega este código completo
 * 5. Presiona Enter y espera
 */

(async function generarHistorialDirecto() {
  console.log('🚀 === INICIANDO GENERACIÓN DIRECTA DE HISTORIAL ===');
  
  try {
    // Verificar Firebase
    if (typeof window.firebase === 'undefined' || !window.firebase.db) {
      console.error('❌ Firebase no disponible. Asegúrate de estar en la aplicación.');
      return;
    }
    
    const db = window.firebase.db;
    console.log('✅ Firebase conectado');
    
    // Importar funciones necesarias
    const { collection, addDoc, getDocs, doc, setDoc, deleteDoc } = await import('firebase/firestore');
    
    // Tipos de eventos
    const TIPOS_EVENTO = [
      'entrada_inicial',
      'consumo_diario', 
      'reposicion',
      'ajuste_inventario',
      'transferencia',
      'caducidad'
    ];
    
    // Función para generar fecha aleatoria en los últimos 6 meses
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
    
    // 1. Verificar materiales en inventario
    console.log('📋 Verificando inventario...');
    const inventarioSnapshot = await getDocs(collection(db, 'inventario_materiales'));
    
    if (inventarioSnapshot.empty) {
      console.log('🔧 No hay materiales, creando ejemplos...');
      
      const materialesEjemplo = [
        { nombre: 'Cemento Portland', cantidad: 150, unidad: 'sacos', categoria: 'Cemento', precio: 12.50 },
        { nombre: 'Arena Fina', cantidad: 80, unidad: 'm³', categoria: 'Agregados', precio: 25.00 },
        { nombre: 'Grava 20mm', cantidad: 120, unidad: 'm³', categoria: 'Agregados', precio: 28.00 },
        { nombre: 'Acero #4', cantidad: 200, unidad: 'varillas', categoria: 'Acero', precio: 15.75 },
        { nombre: 'Ladrillo Rojo', cantidad: 5000, unidad: 'unidades', categoria: 'Mampostería', precio: 0.35 },
        { nombre: 'Cal Hidratada', cantidad: 100, unidad: 'sacos', categoria: 'Cemento', precio: 8.50 },
        { nombre: 'Tubería PVC 4"', cantidad: 50, unidad: 'metros', categoria: 'Plomería', precio: 12.00 }
      ];
      
      for (const material of materialesEjemplo) {
        const materialRef = doc(collection(db, 'inventario_materiales'));
        await setDoc(materialRef, {
          ...material,
          fechaCreacion: new Date(),
          estado: 'activo',
          ubicacion: 'Almacén Principal',
          stockMinimo: Math.floor(material.cantidad * 0.2),
          stockMaximo: Math.floor(material.cantidad * 1.5)
        });
        console.log(`✅ Creado: ${material.nombre}`);
      }
    }
    
    // 2. Obtener materiales finales
    const materialesSnapshot = await getDocs(collection(db, 'inventario_materiales'));
    const materiales = materialesSnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    
    console.log(`📦 Materiales encontrados: ${materiales.length}`);
    
    // 3. Generar eventos históricos
    console.log('📊 Generando eventos históricos...');
    const historialRef = collection(db, 'material_historial');
    let totalEventos = 0;
    const eventosPorMaterial = 25;
    
    for (let i = 0; i < materiales.length; i++) {
      const material = materiales[i];
      console.log(`🔄 Procesando ${material.nombre || `Material ${i + 1}`} (${i + 1}/${materiales.length})`);
      
      for (let j = 0; j < eventosPorMaterial; j++) {
        const tipoEvento = TIPOS_EVENTO[Math.floor(Math.random() * TIPOS_EVENTO.length)];
        const cantidad = generarCantidad(tipoEvento);
        const fecha = generarFechaAleatoria();
        
        const evento = {
          materialId: material.id,
          materialNombre: material.nombre || 'Material sin nombre',
          tipo: tipoEvento,
          cantidad: cantidad,
          cantidadAnterior: Math.max(0, (material.cantidad || 100) + Math.floor(Math.random() * 100)),
          cantidadNueva: Math.max(0, (material.cantidad || 100) + cantidad),
          timestamp: fecha,
          observaciones: `${tipoEvento.replace('_', ' ').toUpperCase()} - ${cantidad > 0 ? 'Entrada' : 'Salida'} de ${Math.abs(cantidad)} ${material.unidad || 'unidades'}`,
          usuario: 'Sistema Automático',
          origen: 'generador_directo',
          categoria: material.categoria || 'Sin categoría',
          ubicacion: material.ubicacion || 'Almacén Principal'
        };
        
        await addDoc(historialRef, evento);
        totalEventos++;
        
        // Progreso cada 25 eventos
        if (totalEventos % 25 === 0) {
          console.log(`📈 Progreso: ${totalEventos} eventos creados...`);
        }
      }
    }
    
    console.log('🎉 === GENERACIÓN COMPLETADA ===');
    console.log(`✅ Total de eventos creados: ${totalEventos}`);
    console.log(`📦 Materiales procesados: ${materiales.length}`);
    console.log(`📊 Eventos por material: ${eventosPorMaterial}`);
    
    // 4. Verificar resultado
    console.log('\n🔍 Verificando resultado...');
    const verificacionSnapshot = await getDocs(collection(db, 'material_historial'));
    console.log(`📈 Eventos totales en base de datos: ${verificacionSnapshot.size}`);
    
    if (verificacionSnapshot.size > 0) {
      console.log('\n🎯 === ÉXITO ===');
      console.log('✅ Historial generado correctamente');
      console.log('🔄 Recarga el dashboard de materiales: Material > Seguimiento');
      console.log('📊 Deberías ver gráficos y métricas con datos reales');
    } else {
      console.log('\n❌ === ERROR ===');
      console.log('No se pudieron crear los eventos');
    }
    
  } catch (error) {
    console.error('❌ Error en la generación:', error);
    console.log('💡 Asegúrate de estar logueado y tener permisos de administrador');
  }
})();

console.log('💡 Script cargado. La ejecución comenzará automáticamente...');
