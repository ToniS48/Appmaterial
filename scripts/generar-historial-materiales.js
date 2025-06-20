/**
 * Script para generar eventos históricos de materiales
 * Ejecutar con: node scripts/generar-historial-materiales.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin (ajusta la ruta al archivo de credenciales)
const serviceAccount = require('../firebase-adminsdk-key.json'); // Asegúrate de tener este archivo

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

const db = admin.firestore();

// Tipos de eventos posibles
const TIPOS_EVENTOS = [
  'adquisicion',
  'uso',
  'mantenimiento',
  'revision',
  'actualizacion'
];

// Eventos históricos template
const EVENTOS_TEMPLATE = [
  {
    tipo: 'adquisicion',
    descripcion: 'Adquisición inicial del material',
    costoAsociado: 100,
    mesesAtras: 12
  },
  {
    tipo: 'revision',
    descripcion: 'Revisión de estado y mantenimiento',
    costoAsociado: 0,
    mesesAtras: 8
  },
  {
    tipo: 'uso',
    descripcion: 'Uso en actividad de escalada',
    costoAsociado: 0,
    mesesAtras: 6
  },
  {
    tipo: 'mantenimiento',
    descripcion: 'Mantenimiento preventivo',
    costoAsociado: 25,
    mesesAtras: 4
  },
  {
    tipo: 'revision',
    descripcion: 'Inspección de seguridad',
    costoAsociado: 0,
    mesesAtras: 2
  },
  {
    tipo: 'uso',
    descripcion: 'Uso en curso de formación',
    costoAsociado: 0,
    mesesAtras: 1
  }
];

// Función para generar fecha hacia atrás
function generarFecha(mesesAtras) {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() - mesesAtras);
  return fecha;
}

// Función principal
async function generarHistorialMateriales() {
  try {
    console.log('🚀 Iniciando generación de historial de materiales...');
    
    // 1. Obtener todos los materiales
    console.log('📋 Obteniendo lista de materiales...');
    const materialesSnapshot = await db.collection('material_deportivo').get();
    
    if (materialesSnapshot.empty) {
      console.log('❌ No se encontraron materiales en la base de datos');
      return;
    }
    
    const materiales = [];
    materialesSnapshot.forEach(doc => {
      materiales.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Encontrados ${materiales.length} materiales`);
    
    // 2. Generar eventos para cada material
    const batch = db.batch();
    let eventosCreados = 0;
    
    for (const material of materiales) {
      console.log(`📝 Generando eventos para: ${material.nombre}`);
      
      // Crear eventos basados en el template
      for (const eventoTemplate of EVENTOS_TEMPLATE) {
        const fecha = generarFecha(eventoTemplate.mesesAtras);
        
        const evento = {
          materialId: material.id,
          nombreMaterial: material.nombre,
          tipoEvento: eventoTemplate.tipo,
          fecha: admin.firestore.Timestamp.fromDate(fecha),
          año: fecha.getFullYear(),
          mes: fecha.getMonth() + 1,
          descripcion: eventoTemplate.descripcion,
          costoAsociado: eventoTemplate.costoAsociado,
          usuarioResponsable: 'admin@espemo.org',
          nombreUsuarioResponsable: 'Administrador Sistema',
          registradoPor: 'system',
          nombreRegistrador: 'Generador Automático',
          fechaRegistro: admin.firestore.Timestamp.now(),
          activo: true,
          metadatos: {
            categoria: material.categoria || 'equipamiento',
            tipo: material.tipo || 'general',
            generadoAutomaticamente: true,
            scriptVersion: '1.0'
          }
        };
        
        // Agregar al batch
        const docRef = db.collection('material_historial').doc();
        batch.set(docRef, evento);
        eventosCreados++;
      }
    }
    
    // 3. Ejecutar el batch
    console.log(`💾 Guardando ${eventosCreados} eventos históricos...`);
    await batch.commit();
    
    console.log('✅ ¡Historial de materiales generado exitosamente!');
    console.log(`📊 Eventos creados: ${eventosCreados}`);
    console.log(`📋 Materiales procesados: ${materiales.length}`);
    console.log('');
    console.log('🎯 Ahora puedes:');
    console.log('1. Recargar el dashboard de materiales');
    console.log('2. Ver las métricas y gráficas con datos reales');
    console.log('3. Verificar las tablas de eventos históricos');
    
  } catch (error) {
    console.error('❌ Error generando historial:', error);
    
    if (error.code === 'ENOENT') {
      console.log('');
      console.log('💡 Para usar este script necesitas:');
      console.log('1. Instalar firebase-admin: npm install firebase-admin');
      console.log('2. Descargar el archivo de credenciales de Firebase');
      console.log('3. Guardarlo como firebase-adminsdk-key.json en la raíz del proyecto');
      console.log('');
      console.log('🔗 Obtener credenciales en:');
      console.log('Firebase Console > Configuración del proyecto > Cuentas de servicio');
    }
  } finally {
    process.exit(0);
  }
}

// Función para limpiar historial (útil para testing)
async function limpiarHistorial() {
  try {
    console.log('🧹 Limpiando historial existente...');
    
    const snapshot = await db.collection('material_historial').get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ Eliminados ${snapshot.size} eventos del historial`);
    
  } catch (error) {
    console.error('❌ Error limpiando historial:', error);
  }
}

// Función para verificar datos
async function verificarDatos() {
  try {
    console.log('🔍 Verificando datos...');
    
    // Contar materiales
    const materialesSnapshot = await db.collection('material_deportivo').get();
    console.log(`📋 Materiales: ${materialesSnapshot.size}`);
    
    // Contar eventos
    const eventosSnapshot = await db.collection('material_historial').get();
    console.log(`📊 Eventos históricos: ${eventosSnapshot.size}`);
    
    if (eventosSnapshot.size > 0) {
      console.log('');
      console.log('📈 Resumen de eventos:');
      
      const eventosPorTipo = {};
      eventosSnapshot.forEach(doc => {
        const evento = doc.data();
        eventosPorTipo[evento.tipoEvento] = (eventosPorTipo[evento.tipoEvento] || 0) + 1;
      });
      
      Object.entries(eventosPorTipo).forEach(([tipo, cantidad]) => {
        console.log(`  ${tipo}: ${cantidad} eventos`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
  }
}

// Manejo de argumentos de línea de comandos
const comando = process.argv[2];

switch (comando) {
  case 'generar':
    generarHistorialMateriales();
    break;
  case 'limpiar':
    limpiarHistorial();
    break;
  case 'verificar':
    verificarDatos();
    break;
  default:
    console.log('🎯 Generador de Historial de Materiales');
    console.log('');
    console.log('Uso:');
    console.log('  node scripts/generar-historial-materiales.js generar   # Generar eventos históricos');
    console.log('  node scripts/generar-historial-materiales.js limpiar   # Limpiar historial existente');
    console.log('  node scripts/generar-historial-materiales.js verificar # Verificar datos actuales');
    console.log('');
    console.log('💡 Asegúrate de tener el archivo firebase-adminsdk-key.json');
    process.exit(1);
}
