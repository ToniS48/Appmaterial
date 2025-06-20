/**
 * Script simplificado para generar historial de materiales
 * Compatible con Node.js usando Firebase v9 CommonJS
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc,
  doc,
  setDoc
} = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
  projectId: "espemo-2d07f",
  authDomain: "espemo-2d07f.firebaseapp.com",
  apiKey: "demo-key" // Clave demo para testing local
};

// Tipos de eventos para el historial
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

// Función para generar cantidad aleatoria basada en el tipo de evento
function generarCantidad(tipo, stockActual = 100) {
  switch (tipo) {
    case 'entrada_inicial':
      return Math.floor(Math.random() * 500) + 100;
    case 'consumo_diario':
      return -(Math.floor(Math.random() * 20) + 1);
    case 'reposicion':
      return Math.floor(Math.random() * 200) + 50;
    case 'ajuste_inventario':
      return Math.floor(Math.random() * 21) - 10; // -10 a +10
    case 'transferencia':
      return -(Math.floor(Math.random() * 30) + 5);
    case 'caducidad':
      return -(Math.floor(Math.random() * 15) + 1);
    default:
      return Math.floor(Math.random() * 50);
  }
}

// Función principal
async function generarHistorialMateriales() {
  try {
    console.log('🚀 [Inicio] Generando historial de materiales...');
    
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // 1. Obtener materiales del inventario
    console.log('📋 [Debug] Obteniendo materiales del inventario...');
    const inventarioRef = collection(db, 'inventario_materiales');
    const inventarioSnapshot = await getDocs(inventarioRef);
    
    if (inventarioSnapshot.empty) {
      console.log('⚠️ [Debug] No se encontraron materiales en el inventario');
      console.log('💡 [Sugerencia] Asegúrate de que existe la colección "inventario_materiales"');
      
      // Crear algunos materiales de ejemplo
      console.log('🔧 [Debug] Creando materiales de ejemplo...');
      const materialesEjemplo = [
        { nombre: 'Cemento Portland', cantidad: 150, unidad: 'sacos', categoria: 'Cemento' },
        { nombre: 'Arena Fina', cantidad: 80, unidad: 'm³', categoria: 'Agregados' },
        { nombre: 'Grava 20mm', cantidad: 120, unidad: 'm³', categoria: 'Agregados' },
        { nombre: 'Acero #4', cantidad: 200, unidad: 'varillas', categoria: 'Acero' },
        { nombre: 'Ladrillo Rojo', cantidad: 5000, unidad: 'unidades', categoria: 'Mampostería' }
      ];
      
      for (const material of materialesEjemplo) {
        const materialRef = doc(inventarioRef);
        await setDoc(materialRef, {
          ...material,
          fechaCreacion: new Date(),
          estado: 'activo',
          ubicacion: 'Almacén Principal'
        });
        console.log(`✅ [Debug] Material creado: ${material.nombre}`);
      }
      
      // Obtener los nuevos materiales
      const nuevoSnapshot = await getDocs(inventarioRef);
      console.log(`✅ [Debug] Materiales creados: ${nuevoSnapshot.size}`);
    }
    
    // 2. Volver a obtener materiales (incluye los nuevos si se crearon)
    const finalSnapshot = await getDocs(inventarioRef);
    console.log(`✅ [Debug] Encontrados ${finalSnapshot.size} materiales`);
    
    // 3. Para cada material, generar eventos históricos
    const historialRef = collection(db, 'material_historial');
    let totalEventos = 0;
    
    for (const materialDoc of finalSnapshot.docs) {
      const materialData = materialDoc.data();
      const materialId = materialDoc.id;
      
      console.log(`🔄 [Debug] Procesando material: ${materialData.nombre || materialId}`);
      
      // Generar entre 15-30 eventos por material
      const numEventos = Math.floor(Math.random() * 16) + 15;
      
      for (let i = 0; i < numEventos; i++) {
        const tipoEvento = TIPOS_EVENTO[Math.floor(Math.random() * TIPOS_EVENTO.length)];
        const cantidad = generarCantidad(tipoEvento, materialData.cantidad || 100);
        const fecha = generarFechaAleatoria();
        
        const evento = {
          materialId: materialId,
          materialNombre: materialData.nombre || 'Material sin nombre',
          tipo: tipoEvento,
          cantidad: cantidad,
          cantidadAnterior: Math.max(0, (materialData.cantidad || 100) + Math.floor(Math.random() * 100)),
          cantidadNueva: Math.max(0, (materialData.cantidad || 100) + cantidad),
          timestamp: fecha,
          observaciones: `Evento ${tipoEvento} generado automáticamente`,
          usuario: 'Sistema Automático',
          origen: 'script_historial'
        };
        
        try {
          await addDoc(historialRef, evento);
          totalEventos++;
          
          // Log cada 50 eventos para mostrar progreso
          if (totalEventos % 50 === 0) {
            console.log(`📊 [Progreso] ${totalEventos} eventos creados...`);
          }
        } catch (error) {
          console.error(`❌ [Error] No se pudo crear evento para ${materialId}:`, error.message);
        }
      }
    }
    
    console.log(`🎉 [Éxito] Se generaron ${totalEventos} eventos históricos`);
    console.log('🎯 [Debug] Script finalizado - Recarga el dashboard de materiales');
    console.log('📖 [Info] Abre la consola del navegador y ejecuta: await verificarEstadoHistorial()');
    
  } catch (error) {
    console.error('❌ [Error] Error en el script:', error);
    console.log('💡 [Sugerencia] Verifica la configuración de Firebase y permisos');
  }
}

// Ejecutar el script
generarHistorialMateriales();
