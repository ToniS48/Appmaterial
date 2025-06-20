/**
 * Script simplificado para generar historial de materiales
 * Usa el SDK cliente en modo administrativo local
 */

// Importaciones de Firebase v9
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  query,
  limit
} from 'firebase/firestore';

// Configuración desde variables de entorno
const firebaseConfig = {
  projectId: "espemo-2d07f"  // Proyecto conocido
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    
    // 1. Obtener materiales del inventario
    console.log('📋 [Debug] Obteniendo materiales del inventario...');
    const inventarioRef = collection(db, 'inventario_materiales');
    const inventarioSnapshot = await getDocs(inventarioRef);
    
    if (inventarioSnapshot.empty) {
      console.log('⚠️ [Debug] No se encontraron materiales en el inventario');
      console.log('💡 [Sugerencia] Asegúrate de que existe la colección "inventario_materiales"');
      return;
    }
    
    console.log(`✅ [Debug] Encontrados ${inventarioSnapshot.size} materiales`);
    
    // 2. Para cada material, generar eventos históricos
    const historialRef = collection(db, 'material_historial');
    let totalEventos = 0;
    
    for (const materialDoc of inventarioSnapshot.docs) {
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
        } catch (error) {
          console.error(`❌ [Error] No se pudo crear evento para ${materialId}:`, error.message);
        }
      }
    }
    
    console.log(`🎉 [Éxito] Se generaron ${totalEventos} eventos históricos`);
    console.log('🎯 [Debug] Script finalizado - Recarga el dashboard de materiales');
    
  } catch (error) {
    console.error('❌ [Error] Error en el script:', error);
    console.log('💡 [Sugerencia] Verifica la configuración de Firebase y permisos');
  }
}

// Ejecutar el script
generarHistorialMateriales();
