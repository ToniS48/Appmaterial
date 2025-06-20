/**
 * GENERADOR DEPURADO DE DATOS HISTÓRICOS
 * Versión con debugging detallado para identificar problemas
 * 
 * INSTRUCCIONES:
 * 1. Estar en "Seguimiento de Materiales"
 * 2. DevTools (F12) → Console
 * 3. Copiar y pegar este código completo
 * 4. Presionar Enter
 */

(async function generadorDepurado() {
  console.log('🚀 GENERADOR DEPURADO DE DATOS HISTÓRICOS');
  console.log('========================================');
  console.log('⏰ Iniciado:', new Date().toLocaleString());

  try {
    // 1. VERIFICAR SERVICIO
    console.log('\n🔍 Verificando MaterialHistorialService...');
    
    if (!window.materialHistorialService) {
      console.log('❌ MaterialHistorialService no disponible');
      console.log('💡 Asegúrate de estar en la pestaña "Seguimiento de Materiales"');
      return { error: 'Servicio no disponible' };
    }

    console.log('✅ MaterialHistorialService disponible');
    const service = window.materialHistorialService;
    
    // 2. VERIFICAR MÉTODOS DEL SERVICIO
    console.log('\n🔧 Verificando métodos disponibles...');
    console.log('- registrarEvento:', typeof service.registrarEvento);
    console.log('- registrarEventosBulk:', typeof service.registrarEventosBulk);
    console.log('- obtenerHistorial:', typeof service.obtenerHistorial);
    
    // 3. PRUEBA SIMPLE PRIMERO
    console.log('\n🧪 Ejecutando prueba simple...');
    
    const fechaPrueba = new Date();
    fechaPrueba.setDate(fechaPrueba.getDate() - 30);
    
    const eventoPrueba = {
      materialId: 'MAT001',
      nombreMaterial: 'Material de Prueba',
      tipoEvento: 'mantenimiento',
      descripcion: 'Evento de prueba para verificar funcionamiento',
      fecha: fechaPrueba,
      responsable: 'Sistema Debug',
      costoAsociado: 150,
      estado: 'completado',
      observaciones: 'Prueba de debugging'
    };

    console.log('📝 Datos del evento de prueba:', eventoPrueba);

    try {
      console.log('⏳ Insertando evento de prueba...');
      const resultadoPrueba = await service.registrarEvento(eventoPrueba);
      console.log('✅ Evento de prueba insertado:', resultadoPrueba);
    } catch (errorPrueba) {
      console.error('❌ Error en evento de prueba:', errorPrueba);
      console.error('Stack trace:', errorPrueba.stack);
      
      // Intentar con método alternativo
      console.log('\n🔄 Intentando método alternativo...');
      try {
        const resultadoAlternativo = await service.registrarEventosBulk([eventoPrueba]);
        console.log('✅ Método bulk funcionó:', resultadoAlternativo);
      } catch (errorBulk) {
        console.error('❌ Error en método bulk:', errorBulk);
        return { error: 'Ambos métodos fallaron', errorPrueba, errorBulk };
      }
    }

    // 4. GENERAR MÚLTIPLES EVENTOS
    console.log('\n🏭 Generando eventos en lote...');
    
    const materiales = [
      { id: 'MAT001', nombre: 'Cemento Portland' },
      { id: 'MAT002', nombre: 'Acero Corrugado' },
      { id: 'MAT003', nombre: 'Ladrillo Común' },
      { id: 'MAT004', nombre: 'Pintura Acrílica' },
      { id: 'MAT005', nombre: 'Tubo PVC' }
    ];

    const tipos = ['mantenimiento', 'reparacion', 'inspeccion', 'reemplazo', 'calibracion'];
    const responsables = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martín'];
    
    const eventosAGenerar = [];
    const cantidadEventos = 30;
    
    for (let i = 0; i < cantidadEventos; i++) {
      const material = materiales[Math.floor(Math.random() * materiales.length)];
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const responsable = responsables[Math.floor(Math.random() * responsables.length)];
      
      // Fecha aleatoria en los últimos 12 meses
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 365));
      
      const evento = {
        materialId: material.id,
        nombreMaterial: material.nombre,
        tipoEvento: tipo,
        descripcion: `${tipo} programado de ${material.nombre} - Evento ${i + 1}`,
        fecha: fecha,
        responsable: responsable,
        costoAsociado: Math.floor(Math.random() * 1200) + 50,
        estado: Math.random() > 0.2 ? 'completado' : 'pendiente',
        observaciones: `Observaciones del evento ${i + 1}: ${tipo} realizado correctamente`,
        duracionMinutos: Math.floor(Math.random() * 240) + 30,
        prioridad: Math.floor(Math.random() * 5) + 1,
        metadatos: {
          generadoEn: 'debug-console',
          lote: Math.floor(i / 10) + 1,
          timestamp: new Date().toISOString()
        }
      };
      
      eventosAGenerar.push(evento);
    }

    console.log(`📦 ${eventosAGenerar.length} eventos preparados`);
    
    // 5. INSERTAR EVENTOS UNO POR UNO CON DEBUGGING
    console.log('\n💾 Insertando eventos con debugging...');
    
    let insertadosExito = 0;
    let erroresInsercion = 0;
    
    for (let i = 0; i < eventosAGenerar.length; i++) {
      const evento = eventosAGenerar[i];
      
      try {
        console.log(`📝 Insertando evento ${i + 1}/${eventosAGenerar.length}: ${evento.tipoEvento} - ${evento.nombreMaterial}`);
        
        const resultado = await service.registrarEvento(evento);
        insertadosExito++;
        
        if (insertadosExito % 10 === 0) {
          console.log(`✅ Progreso: ${insertadosExito}/${eventosAGenerar.length} eventos insertados`);
        }
        
      } catch (error) {
        erroresInsercion++;
        console.error(`❌ Error insertando evento ${i + 1}:`, {
          evento: evento,
          error: error.message,
          stack: error.stack
        });
        
        // Si hay muchos errores, parar
        if (erroresInsercion > 5) {
          console.log('⚠️ Demasiados errores, deteniendo inserción');
          break;
        }
      }
      
      // Pequeña pausa para no saturar
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`\n📊 RESULTADOS DE INSERCIÓN:`);
    console.log(`✅ Eventos insertados exitosamente: ${insertadosExito}`);
    console.log(`❌ Errores de inserción: ${erroresInsercion}`);

    // 6. VERIFICACIÓN FINAL
    console.log('\n🔍 Verificación final...');
    
    try {
      const añoActual = new Date().getFullYear();
      const estadisticas = await service.obtenerEstadisticasAnuales(añoActual);
      
      console.log('📈 ESTADÍSTICAS FINALES:');
      console.log(`📦 Total de eventos: ${estadisticas.eventosReales}`);
      console.log(`🏷️ Total de materiales: ${estadisticas.totalMateriales}`);
      console.log(`💰 Inversión total: $${(estadisticas.inversionTotal || 0).toLocaleString()}`);
      
      if (estadisticas.eventosReales > 0) {
        console.log('\n🎉 ¡DATOS GENERADOS EXITOSAMENTE!');
        console.log('🔄 Recarga la página para ver los cambios en el dashboard');
        console.log('📍 Verifica las gráficas en "Seguimiento de Materiales"');
      } else {
        console.log('\n⚠️ No se detectaron eventos en las estadísticas');
        console.log('💡 Puede ser un problema de cache o timing');
      }
      
    } catch (errorStats) {
      console.error('❌ Error obteniendo estadísticas:', errorStats);
    }

    return {
      exito: insertadosExito > 0,
      eventosInsertados: insertadosExito,
      errores: erroresInsercion,
      metodo: 'debugging-detallado'
    };

  } catch (error) {
    console.error('❌ ERROR GENERAL:', error);
    console.error('Stack trace completo:', error.stack);
    
    return {
      exito: false,
      error: error.message,
      stack: error.stack
    };
  }
})();

console.log('📝 Generador depurado cargado. Ejecutándose automáticamente...');
