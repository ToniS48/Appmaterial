// Script para verificar las fechas de las actividades y debug específico
// Ejecutar en la consola del navegador cuando esté cargada la aplicación

console.log('🔍 Iniciando debug específico de fechas de actividades...');

async function debugActividadesFechas() {
  try {
    console.log('\n📅 Verificando actividades y sus fechas...');
    
    // Verificar si hay acceso a Firebase
    if (window.firebase && window.firebase.auth && window.firebase.firestore) {
      const auth = window.firebase.auth();
      const db = window.firebase.firestore();
      const user = auth.currentUser;
      
      if (!user) {
        console.log('❌ Usuario no autenticado');
        return;
      }
      
      console.log('✅ Usuario autenticado:', user.email);
      
      // Consultar actividades
      const actividadesSnapshot = await db.collection('actividades')
        .orderBy('fechaInicio', 'desc')
        .limit(10)
        .get();
      
      console.log(`📋 Encontradas ${actividadesSnapshot.docs.length} actividades en Firestore:`);
      
      const hoy = new Date();
      
      actividadesSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const fechaInicio = data.fechaInicio?.toDate();
        const fechaFin = data.fechaFin?.toDate() || fechaInicio;
        
        if (fechaInicio) {
          const diasDesdeFin = Math.ceil((hoy.getTime() - fechaFin.getTime()) / (1000 * 60 * 60 * 24));
          const diasHastaInicio = Math.ceil((fechaInicio.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
          
          const cumpleCriterios = diasDesdeFin <= 1 && diasHastaInicio <= 15;
          
          console.log(`\n${index + 1}. "${data.nombre}"`);
          console.log(`   📅 Inicio: ${fechaInicio.toLocaleDateString('es-ES')}`);
          console.log(`   🏁 Fin: ${fechaFin.toLocaleDateString('es-ES')}`);
          console.log(`   📍 Lugar: ${data.lugar || 'No especificado'}`);
          console.log(`   📊 Estado: ${data.estado}`);
          console.log(`   ⏰ Días desde fin: ${diasDesdeFin}`);
          console.log(`   ⏳ Días hasta inicio: ${diasHastaInicio}`);
          console.log(`   🌤️  Cumple criterios para mostrar clima: ${cumpleCriterios ? '✅ SÍ' : '❌ NO'}`);
          
          if (!cumpleCriterios) {
            if (data.estado === 'cancelada') {
              console.log(`   💡 No se muestra porque está cancelada`);
            } else if (diasDesdeFin > 1) {
              console.log(`   💡 No se muestra porque terminó hace más de 1 día`);
            } else if (diasHastaInicio > 15) {
              console.log(`   💡 No se muestra porque falta más de 15 días`);
            }
          }
        }
      });
      
      return actividadesSnapshot.docs.length;
      
    } else {
      console.log('❌ Firebase no disponible');
      return 0;
    }
    
  } catch (error) {
    console.error('❌ Error verificando actividades:', error);
    return 0;
  }
}

// Función para crear una actividad de prueba con fecha actual
async function crearActividadPrueba() {
  try {
    if (!window.firebase || !window.firebase.firestore || !window.firebase.auth) {
      console.log('❌ Firebase no disponible');
      return;
    }
    
    const auth = window.firebase.auth();
    const db = window.firebase.firestore();
    const user = auth.currentUser;
    
    if (!user) {
      console.log('❌ Usuario no autenticado');
      return;
    }
    
    // Crear actividad para mañana
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    mañana.setHours(10, 0, 0, 0);
    
    const finActividad = new Date(mañana);
    finActividad.setHours(16, 0, 0, 0);
    
    const nuevaActividad = {
      nombre: `🧪 Actividad de Prueba Meteorológica - ${new Date().toLocaleString('es-ES')}`,
      descripcion: 'Actividad creada para probar la visualización de datos meteorológicos en las tarjetas',
      lugar: 'Madrid, España',
      fechaInicio: window.firebase.firestore.Timestamp.fromDate(mañana),
      fechaFin: window.firebase.firestore.Timestamp.fromDate(finActividad),
      estado: 'planificada',
      creadorId: user.uid,
      responsableActividadId: user.uid,
      participanteIds: [user.uid],
      createdAt: window.firebase.firestore.Timestamp.now(),
      updatedAt: window.firebase.firestore.Timestamp.now()
    };
    
    const docRef = await db.collection('actividades').add(nuevaActividad);
    console.log('✅ Actividad de prueba creada con ID:', docRef.id);
    console.log('📅 Fecha de inicio:', mañana.toLocaleString('es-ES'));
    console.log('🏁 Fecha de fin:', finActividad.toLocaleString('es-ES'));
    console.log('📍 Lugar:', nuevaActividad.lugar);
    
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Error creando actividad de prueba:', error);
    return null;
  }
}

// Ejecutar cuando se cargue el script
setTimeout(() => {
  debugActividadesFechas().then(cantidad => {
    console.log(`\n📊 Total de actividades verificadas: ${cantidad}`);
    
    if (cantidad === 0) {
      console.log('💡 Sugerencia: Ejecutar crearActividadPrueba() para crear una actividad de prueba');
    }
  });
}, 2000);

// Exponer funciones
window.debugActividadesFechas = debugActividadesFechas;
window.crearActividadPrueba = crearActividadPrueba;

console.log('✅ Debug de fechas cargado. Funciones disponibles:');
console.log('   - debugActividadesFechas()');
console.log('   - crearActividadPrueba()');
