/**
 * GENERADOR DE DATOS CON AUTENTICACIÓN FORZADA
 * Este script intenta usar el token almacenado directamente
 */

(async function generadorConAuth() {
  console.log('🔐 GENERADOR CON AUTENTICACIÓN FORZADA');
  console.log('====================================');
  
  try {
    // 1. Intentar obtener auth desde localStorage
    const authKey = Object.keys(localStorage).find(key => 
      key.includes('firebase:authUser') && key.includes('AIzaSyDjD0QsGG4If6nEnZChfNJuvXOsogjPOrI')
    );
    
    if (authKey) {
      console.log('🔑 Token encontrado en localStorage:', authKey);
      const authData = JSON.parse(localStorage.getItem(authKey));
      console.log('👤 Email del token:', authData?.email);
      console.log('🆔 UID del token:', authData?.uid);
    } else {
      console.log('❌ No se encontró token de autenticación');
      return;
    }
    
    // 2. Forzar autenticación en Firebase
    const auth = window.firebase.auth();
    
    // Esperar a que se restaure la sesión
    await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          console.log('✅ Usuario autenticado:', user.email);
          unsubscribe();
          resolve(user);
        }
      });
      
      // Forzar recarga después de un momento
      setTimeout(() => {
        auth.currentUser?.reload();
        setTimeout(() => {
          unsubscribe();
          resolve(auth.currentUser);
        }, 1000);
      }, 500);
    });
    
    // 3. Verificar que ahora estamos autenticados
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('❌ No se pudo restaurar la autenticación');
      console.log('💡 ACCIÓN: Cerrar sesión e iniciar sesión nuevamente en la app');
      return;
    }
    
    console.log('✅ Autenticación confirmada:', currentUser.email);
    
    // 4. Ahora generar datos usando el servicio
    if (!window.materialHistorialService) {
      console.log('❌ MaterialHistorialService no disponible');
      return;
    }
    
    const service = window.materialHistorialService;
    
    // 5. Generar algunos eventos de prueba
    console.log('📦 Generando eventos de prueba...');
    
    const eventos = [
      {
        materialId: 'MAT001',
        nombreMaterial: 'Cemento Portland Tipo I',
        tipoEvento: 'mantenimiento',
        descripcion: 'Mantenimiento preventivo del cemento',
        fecha: new Date(2025, 0, 15),
        responsable: 'Juan Pérez',
        costoAsociado: 250,
        estado: 'completado'
      },
      {
        materialId: 'MAT002', 
        nombreMaterial: 'Acero Corrugado',
        tipoEvento: 'inspeccion',
        descripcion: 'Inspección de calidad del acero',
        fecha: new Date(2025, 1, 20),
        responsable: 'María García',
        costoAsociado: 180,
        estado: 'completado'
      },
      {
        materialId: 'MAT003',
        nombreMaterial: 'Ladrillo Común',
        tipoEvento: 'reparacion',
        descripcion: 'Reparación de almacén de ladrillos',
        fecha: new Date(2025, 2, 10),
        responsable: 'Carlos López',
        costoAsociado: 320,
        estado: 'pendiente'
      }
    ];
    
    let insertados = 0;
    
    for (const evento of eventos) {
      try {
        await service.registrarEvento(evento);
        insertados++;
        console.log(`✅ Evento ${insertados} insertado: ${evento.nombreMaterial}`);
        
        // Pausa pequeña
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error insertando evento:`, error.message);
      }
    }
    
    console.log(`\n📊 RESULTADO: ${insertados}/${eventos.length} eventos insertados`);
    
    // 6. Verificar datos
    const stats = await service.obtenerEstadisticasAnuales(2025);
    console.log(`📈 Total eventos en base: ${stats.eventosReales || 0}`);
    
    if (stats.eventosReales > 0) {
      console.log('🎉 ¡ÉXITO! Datos generados correctamente');
      console.log('🔄 Recarga la página para ver las gráficas actualizadas');
    }
    
    return { insertados, total: stats.eventosReales };
    
  } catch (error) {
    console.error('❌ Error general:', error);
    return { error: error.message };
  }
})();
