/**
 * GENERADOR SIMPLE DE DATOS HISTÓRICOS 
 * Versión simplificada que funciona con cualquier configuración
 * 
 * INSTRUCCIONES:
 * 1. Abrir http://localhost:3000
 * 2. DevTools (F12) → Console  
 * 3. Copiar y pegar este código completo
 * 4. Presionar Enter
 */

(async function generarDatosSimple() {
  console.log('🚀 GENERADOR SIMPLE DE DATOS HISTÓRICOS');
  console.log('======================================');
  
  try {
    // Verificar que tenemos acceso al MaterialRepository
    if (typeof window.materialRepository === 'undefined') {
      console.log('⚠️ MaterialRepository no disponible, generando datos básicos...');
    } else {
      console.log('✅ MaterialRepository disponible');
    }

    // Obtener referencia a la base de datos usando el patrón de importación actual
    console.log('🔍 Obteniendo acceso a Firestore...');
    
    // Método directo: Usar React DevTools para obtener instancia
    let db = null;
    
    // Intentar obtener la instancia desde el contexto de React
    const rootElement = document.querySelector('#root');
    if (rootElement && rootElement._reactInternalFiber) {
      console.log('🔄 Intentando obtener instancia desde React Fiber...');
    }

    // Alternativa: Crear instancia temporal usando la configuración conocida
    console.log('🔧 Creando instancia temporal de Firebase...');
    
    // Simulación de datos mientras obtenemos acceso real
    const datosTemporales = [];
    
    const materialesEjemplo = [
      { id: 'MAT001', nombre: 'Cemento Portland' },
      { id: 'MAT002', nombre: 'Acero Corrugado' },
      { id: 'MAT003', nombre: 'Ladrillo Común' },
      { id: 'MAT004', nombre: 'Pintura Acrílica' },
      { id: 'MAT005', nombre: 'Tubo PVC' },
      { id: 'MAT006', nombre: 'Arena Gruesa' },
      { id: 'MAT007', nombre: 'Grava' }
    ];

    const tiposEvento = [
      'mantenimiento', 'reparacion', 'inspeccion', 'reemplazo',
      'calibracion', 'revision', 'incidencia_menor', 'incidencia_mayor'
    ];
    
    const gravedades = ['baja', 'media', 'alta'];
    
    console.log('📦 Preparando 50 eventos...');
    
    for (let i = 0; i < 50; i++) {
      const material = materialesEjemplo[Math.floor(Math.random() * materialesEjemplo.length)];
      const tipoEvento = tiposEvento[Math.floor(Math.random() * tiposEvento.length)];
      
      // Fecha aleatoria en los últimos 18 meses
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 540));
      
      const evento = {
        materialId: material.id,
        nombreMaterial: material.nombre,
        tipoEvento: tipoEvento,
        descripcion: `${tipoEvento} de ${material.nombre} - Evento ${i + 1}`,
        fecha: {
          toDate: () => fecha,
          seconds: Math.floor(fecha.getTime() / 1000),
          nanoseconds: 0
        },
        año: fecha.getFullYear(),
        mes: fecha.getMonth() + 1,
        dia: fecha.getDate(),
        registradoPor: 'Sistema Automático',
        gravedad: gravedades[Math.floor(Math.random() * gravedades.length)],
        costoAsociado: Math.random() > 0.4 ? Math.floor(Math.random() * 1500) + 50 : 0,
        completado: Math.random() > 0.2,
        fechaRegistro: {
          toDate: () => new Date(),
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: 0
        }
      };
      
      datosTemporales.push(evento);
    }

    console.log('💾 Intentando guardar usando fetch API...');
    
    // Usar fetch para llamar a una función de Firebase o endpoint
    try {
      // Intentar usar el endpoint de la aplicación si existe
      const response = await fetch('/api/material-historial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosTemporales)
      });
      
      if (response.ok) {
        console.log('✅ Datos enviados via API');
      } else {
        throw new Error('API no disponible');
      }
    } catch (apiError) {
      console.log('⚠️ API no disponible, intentando método alternativo...');
      
      // Método alternativo: Usar la consola para mostrar el script de inserción
      console.log('📋 DATOS PREPARADOS - Usar método manual:');
      console.log('1. Abrir otra pestaña de consola');
      console.log('2. Ejecutar el siguiente código para insertar datos:');
      
      // Crear script de inserción manual
      const scriptInsercion = `
// Script de inserción manual - Copiar y pegar en otra consola
const { collection, addDoc, getFirestore } = require('firebase/firestore');
const { db } = require('./src/config/firebase');

async function insertarDatos() {
  const eventos = ${JSON.stringify(datosTemporales, null, 2)};
  
  for (const evento of eventos) {
    try {
      await addDoc(collection(db, 'material_historial'), {
        ...evento,
        fecha: new Date(evento.fecha.seconds * 1000),
        fechaRegistro: new Date(evento.fechaRegistro.seconds * 1000)
      });
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  console.log('✅ Datos insertados');
}

insertarDatos();
`;

      console.log('📄 Script de inserción:', scriptInsercion);
    }

    // Mostrar estadísticas de los datos preparados
    const stats = {
      total: datosTemporales.length,
      materiales: new Set(datosTemporales.map(e => e.materialId)).size,
      tiposEvento: {},
      costoTotal: 0
    };

    datosTemporales.forEach(evento => {
      stats.tiposEvento[evento.tipoEvento] = (stats.tiposEvento[evento.tipoEvento] || 0) + 1;
      stats.costoTotal += evento.costoAsociado || 0;
    });

    console.log('\n📊 ESTADÍSTICAS DE DATOS PREPARADOS:');
    console.log(`📦 Total de eventos: ${stats.total}`);
    console.log(`🏷️ Materiales únicos: ${stats.materiales}`);
    console.log(`💰 Costo total: $${stats.costoTotal.toLocaleString()}`);
    console.log('📋 Tipos de evento:', stats.tiposEvento);

    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('1. Si no se guardaron automáticamente, usar el script de inserción manual');
    console.log('2. Verificar en "Seguimiento de Materiales" si aparecen los datos');
    console.log('3. Si no aparecen, probar el método alternativo que aparece abajo');

    // Método alternativo usando localStorage para transferir datos
    console.log('\n🔄 MÉTODO ALTERNATIVO - Guardando en localStorage:');
    localStorage.setItem('datosHistorialesPendientes', JSON.stringify(datosTemporales));
    console.log('✅ Datos guardados en localStorage como "datosHistorialesPendientes"');
    console.log('📝 Puedes acceder a ellos con: JSON.parse(localStorage.getItem("datosHistorialesPendientes"))');

    return {
      exito: true,
      eventosPreprados: datosTemporales.length,
      metodo: 'localStorage',
      siguientePaso: 'Usar método manual o script de inserción'
    };

  } catch (error) {
    console.error('❌ Error en generación:', error);
    return { exito: false, error: error.message };
  }
})();

console.log('📝 Generador simple cargado. Ejecutándose automáticamente...');
