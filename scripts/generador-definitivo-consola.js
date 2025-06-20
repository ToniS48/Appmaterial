/**
 * GENERADOR DEFINITIVO DE DATOS HISTÓRICOS
 * Usa el MaterialHistorialService expuesto para generar datos reales
 * 
 * INSTRUCCIONES:
 * 1. Abrir http://localhost:3000
 * 2. Ir a "Seguimiento de Materiales" (para cargar el servicio)
 * 3. Abrir DevTools (F12) → Console
 * 4. Copiar y pegar TODO este código
 * 5. Presionar Enter y esperar
 */

(async function generadorDefinitivo() {
  console.log('🚀 GENERADOR DEFINITIVO DE DATOS HISTÓRICOS');
  console.log('===========================================');
  console.log('⏰ Iniciado:', new Date().toLocaleString());

  try {
    // 1. VERIFICAR SERVICIOS DISPONIBLES
    console.log('\n🔍 Verificando servicios disponibles...');
    
    if (typeof window.materialHistorialService === 'undefined') {
      console.log('❌ MaterialHistorialService no disponible');
      console.log('💡 SOLUCIÓN: Ve a la pestaña "Seguimiento de Materiales" primero');
      console.log('   Esto cargará el servicio y lo expondrá globalmente');
      return { error: 'Servicio no disponible' };
    }

    console.log('✅ MaterialHistorialService disponible');
    const service = window.materialHistorialService;

    // 2. VERIFICAR DATOS EXISTENTES
    console.log('\n📊 Verificando datos existentes...');
    const añoActual = new Date().getFullYear();
    
    try {
      const estadisticasExistentes = await service.obtenerEstadisticasAnuales(añoActual);
      console.log(`📈 Eventos existentes para ${añoActual}: ${estadisticasExistentes.eventosReales}`);
      
      if (estadisticasExistentes.eventosReales > 0) {
        console.log('✅ Ya existen datos en la base');
        console.log('🔄 Continuando para agregar más datos...');
      }
    } catch (error) {
      console.log('📝 No hay datos existentes, creando desde cero...');
    }

    // 3. PREPARAR DATOS PARA GENERAR
    console.log('\n🏭 Preparando datos para generar...');
    
    const materialesBase = [
      { id: 'MAT001', nombre: 'Cemento Portland' },
      { id: 'MAT002', nombre: 'Acero Corrugado' },
      { id: 'MAT003', nombre: 'Ladrillo Común' },
      { id: 'MAT004', nombre: 'Pintura Acrílica' },
      { id: 'MAT005', nombre: 'Tubo PVC' },
      { id: 'MAT006', nombre: 'Arena Gruesa' },
      { id: 'MAT007', nombre: 'Grava' },
      { id: 'MAT008', nombre: 'Cables Eléctricos' }
    ];

    const tiposEvento = [
      'mantenimiento',
      'reparacion', 
      'inspeccion',
      'reemplazo',
      'calibracion',
      'revision_anual',
      'incidencia_menor',
      'incidencia_mayor'
    ];

    const gravedades = ['baja', 'media', 'alta'];
    const responsables = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martín', 'Luis Rodríguez'];

    // 4. GENERAR EVENTOS
    console.log('\n📦 Generando 75 eventos históricos...');
    
    const eventosAGenerar = [];
    const fechaInicio = new Date('2024-01-01');
    const fechaFin = new Date();

    for (let i = 0; i < 75; i++) {
      const material = materialesBase[Math.floor(Math.random() * materialesBase.length)];
      const tipoEvento = tiposEvento[Math.floor(Math.random() * tiposEvento.length)];
      
      // Fecha aleatoria en el rango
      const fechaEvento = new Date(
        fechaInicio.getTime() + Math.random() * (fechaFin.getTime() - fechaInicio.getTime())
      );

      const evento = {
        materialId: material.id,
        nombreMaterial: material.nombre,
        tipoEvento: tipoEvento,
        descripcion: `${tipoEvento.replace('_', ' ')} de ${material.nombre} - Evento generado ${i + 1}`,
        fecha: fechaEvento, // El servicio convertirá a Timestamp
        responsable: responsables[Math.floor(Math.random() * responsables.length)],
        gravedad: gravedades[Math.floor(Math.random() * gravedades.length)],
        costoAsociado: Math.random() > 0.3 ? Math.floor(Math.random() * 2500) + 100 : 0,
        estado: Math.random() > 0.2 ? 'completado' : 'pendiente',
        observaciones: `Observaciones del evento ${i + 1}: ${tipoEvento} realizado correctamente`,
        duracionMinutos: Math.floor(Math.random() * 300) + 30,
        requiereAprobacion: Math.random() > 0.7,
        metadatos: {
          generadoEn: 'consola-definitiva',
          version: '3.0',
          timestamp: new Date().toISOString(),
          lote: Math.floor(i / 25) + 1
        }
      };

      eventosAGenerar.push(evento);
    }

    // 5. INSERTAR USANDO EL SERVICIO
    console.log('💾 Insertando eventos usando MaterialHistorialService...');
    
    let insertados = 0;
    const total = eventosAGenerar.length;
    
    for (const evento of eventosAGenerar) {
      try {
        await service.registrarEvento(evento);
        insertados++;
        
        if (insertados % 15 === 0) {
          console.log(`📈 Progreso: ${insertados}/${total} eventos insertados`);
        }
      } catch (error) {
        console.error(`❌ Error insertando evento ${insertados + 1}:`, error.message);
      }
    }

    console.log(`✅ ${insertados} eventos insertados exitosamente`);

    // 6. VERIFICACIÓN FINAL
    console.log('\n🔍 Verificación final...');
    
    try {
      const estadisticasFinales = await service.obtenerEstadisticasAnuales(añoActual);
      console.log('📊 ESTADÍSTICAS FINALES:');
      console.log(`📦 Total de eventos: ${estadisticasFinales.eventosReales}`);
      console.log(`🏷️ Materiales únicos: ${estadisticasFinales.totalMateriales}`);
      console.log(`💰 Inversión total: $${estadisticasFinales.inversionTotal?.toLocaleString() || 0}`);
      console.log(`⚠️ Incidencias: ${estadisticasFinales.totalIncidencias || 0}`);
      
      // Obtener muestra de eventos recientes
      const eventosRecientes = await service.obtenerHistorial({ años: [añoActual], limite: 5 });
      console.log(`📝 Eventos recientes: ${eventosRecientes.length}`);
      
      if (eventosRecientes.length > 0) {
        console.log('🔍 Muestra de eventos:');
        eventosRecientes.slice(0, 3).forEach((evento, index) => {
          console.log(`  ${index + 1}. ${evento.tipoEvento} - ${evento.nombreMaterial} - ${evento.fecha?.toDate?.()?.toLocaleDateString() || 'Sin fecha'}`);
        });
      }

    } catch (error) {
      console.error('⚠️ Error en verificación final:', error);
    }

    console.log('\n🎉 GENERACIÓN COMPLETADA EXITOSAMENTE');
    console.log('🎯 Los datos deberían aparecer en el dashboard ahora');
    console.log('🔄 Si no ves cambios inmediatos, recarga la página (Ctrl+F5)');
    console.log('📍 Verifica en: "Seguimiento de Materiales" → Gráficas y métricas');

    return {
      exito: true,
      eventosGenerados: insertados,
      metodo: 'MaterialHistorialService',
      recomendacion: 'Recargar página para ver cambios'
    };

  } catch (error) {
    console.error('❌ ERROR EN LA GENERACIÓN:', error);
    console.log('\n💡 SOLUCIONES:');
    console.log('1. Asegúrate de estar en la pestaña "Seguimiento de Materiales"');
    console.log('2. Verifica que la aplicación esté funcionando correctamente');
    console.log('3. Intenta recargar la página y volver a ejecutar');
    console.log('4. Si persiste el error, usa el método de terminal');
    
    return {
      exito: false,
      error: error.message,
      solucion: 'Ir a Seguimiento de Materiales primero'
    };
  }
})();

console.log('📝 Generador definitivo cargado. Ejecutándose automáticamente...');
