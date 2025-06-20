/**
 * GENERADOR FINAL SIN PROBLEMAS DE CACHE
 * Evita el cache y genera datos correctamente
 */

(async function generadorSinCache() {
  console.clear();
  console.log('🚀 GENERADOR FINAL - SIN CACHE');
  console.log('==============================');
  
  try {
    if (!window.materialHistorialService) {
      console.log('❌ MaterialHistorialService no disponible');
      return;
    }
    
    const service = window.materialHistorialService;
    console.log('✅ MaterialHistorialService disponible');
    
    // 1. Limpiar cache primero
    console.log('🧹 Limpiando cache del repositorio...');
    if (service.materialHistorialRepository && service.materialHistorialRepository.clearCache) {
      service.materialHistorialRepository.clearCache();
    }
    
    // 2. Generar eventos directamente (ya sabemos que la inserción funciona)
    console.log('📦 Generando lote de eventos históricos...');
    
    const eventos = [
      {
        materialId: 'MAT001',
        nombreMaterial: 'Cemento Portland',
        tipoEvento: 'mantenimiento',
        descripcion: 'Mantenimiento preventivo del cemento',
        fecha: new Date(2025, 0, 15),
        responsable: 'Juan Pérez',
        registradoPor: 'tonisoler@espemo.org',
        costoAsociado: 250,
        estado: 'completado',
        observaciones: 'Mantenimiento programado completado',
        duracionMinutos: 120
      },
      {
        materialId: 'MAT002',
        nombreMaterial: 'Acero Corrugado',
        tipoEvento: 'inspeccion',
        descripcion: 'Inspección de calidad del acero',
        fecha: new Date(2025, 1, 20),
        responsable: 'María García',
        registradoPor: 'tonisoler@espemo.org',
        costoAsociado: 180,
        estado: 'completado',
        observaciones: 'Material en excelente estado',
        duracionMinutos: 90
      },
      {
        materialId: 'MAT003',
        nombreMaterial: 'Ladrillo Común',
        tipoEvento: 'reparacion',
        descripcion: 'Reparación de almacén de ladrillos',
        fecha: new Date(2025, 2, 10),
        responsable: 'Carlos López',
        registradoPor: 'tonisoler@espemo.org',
        costoAsociado: 320,
        estado: 'pendiente',
        observaciones: 'Pendiente de autorización final',
        duracionMinutos: 180
      },
      {
        materialId: 'MAT004',
        nombreMaterial: 'Pintura Acrílica',
        tipoEvento: 'reemplazo',
        descripcion: 'Reemplazo de pintura vencida',
        fecha: new Date(2025, 3, 5),
        responsable: 'Ana Martín',
        registradoPor: 'tonisoler@espemo.org',
        costoAsociado: 150,
        estado: 'en_progreso',
        observaciones: 'Reemplazo 50% completado',
        duracionMinutos: 240
      },
      {
        materialId: 'MAT001',
        nombreMaterial: 'Cemento Portland',
        tipoEvento: 'incidencia_menor',
        descripcion: 'Humedad detectada en almacén',
        fecha: new Date(2025, 4, 8),
        responsable: 'Juan Pérez',
        registradoPor: 'tonisoler@espemo.org',
        costoAsociado: 80,
        estado: 'completado',
        observaciones: 'Problema solucionado, ventilación mejorada',
        duracionMinutos: 45
      },
      {
        materialId: 'MAT005',
        nombreMaterial: 'Tubo PVC',
        tipoEvento: 'calibracion',
        descripcion: 'Calibración de medidas',
        fecha: new Date(2025, 5, 1),
        responsable: 'Roberto Silva',
        registradoPor: 'tonisoler@espemo.org',
        costoAsociado: 200,
        estado: 'completado',
        observaciones: 'Calibración exitosa, tolerancias OK',
        duracionMinutos: 75
      },
      {
        materialId: 'MAT002',
        nombreMaterial: 'Acero Corrugado',
        tipoEvento: 'incidencia_mayor',
        descripcion: 'Oxidación detectada en lote',
        fecha: new Date(2025, 5, 15),
        responsable: 'María García',
        registradoPor: 'tonisoler@espemo.org',
        costoAsociado: 500,
        estado: 'pendiente',
        observaciones: 'Requiere tratamiento anti-corrosión urgente',
        duracionMinutos: 300
      },
      {
        materialId: 'MAT006',
        nombreMaterial: 'Arena Gruesa',
        tipoEvento: 'mantenimiento',
        descripcion: 'Limpieza y clasificación de arena',
        fecha: new Date(2025, 5, 18),
        responsable: 'Pedro Morales',
        registradoPor: 'tonisoler@espemo.org',
        costoAsociado: 120,
        estado: 'completado',
        observaciones: 'Arena clasificada correctamente',
        duracionMinutos: 150
      },
      {
        materialId: 'MAT007',
        nombreMaterial: 'Grava',
        tipoEvento: 'revision',
        descripcion: 'Revisión de granulometría',
        fecha: new Date(2025, 5, 19),
        responsable: 'Luis Fernández',
        registradoPor: 'tonisoler@espemo.org',
        costoAsociado: 90,
        estado: 'completado',
        observaciones: 'Granulometría conforme a especificaciones',
        duracionMinutos: 60
      },
      {
        materialId: 'MAT008',
        nombreMaterial: 'Adhesivo Cerámico',
        tipoEvento: 'inspeccion',
        descripcion: 'Control de fecha de vencimiento',
        fecha: new Date(2025, 5, 20),
        responsable: 'Carmen Ruiz',
        registradoPor: 'tonisoler@espemo.org',
        costoAsociado: 50,
        estado: 'completado',
        observaciones: 'Productos dentro de vigencia',
        duracionMinutos: 30
      },
      {
        materialId: 'MAT003',
        nombreMaterial: 'Ladrillo Común',
        tipoEvento: 'incidencia_menor',
        descripcion: 'Rotura en transporte',
        fecha: new Date(2025, 4, 25),
        responsable: 'Carlos López',
        registradoPor: 'tonisoler@espemo.org',
        costoAsociado: 75,
        estado: 'completado',
        observaciones: 'Pérdida menor, reemplazado',
        duracionMinutos: 20
      },
      {
        materialId: 'MAT009',
        nombreMaterial: 'Mortero',
        tipoEvento: 'mantenimiento',
        descripcion: 'Revisión de consistencia',
        fecha: new Date(2025, 3, 12),
        responsable: 'Antonio Serrano',
        registradoPor: 'tonisoler@espemo.org',
        costoAsociado: 110,
        estado: 'completado',
        observaciones: 'Consistencia óptima',
        duracionMinutos: 85
      },
      {
        materialId: 'MAT010',
        nombreMaterial: 'Impermeabilizante',
        tipoEvento: 'reemplazo',
        descripcion: 'Cambio por mejora técnica',
        fecha: new Date(2025, 2, 28),
        responsable: 'Elena Vázquez',
        registradoPor: 'tonisoler@espemo.org',
        costoAsociado: 380,
        estado: 'completado',
        observaciones: 'Upgrade a nueva fórmula',
        duracionMinutos: 200
      },
      {
        materialId: 'MAT004',
        nombreMaterial: 'Pintura Acrílica',
        tipoEvento: 'incidencia_menor',
        descripcion: 'Separación de componentes',
        fecha: new Date(2025, 1, 14),
        responsable: 'Ana Martín',
        registradoPor: 'tonisoler@espemo.org',
        costoAsociado: 25,
        estado: 'completado',
        observaciones: 'Remezclado exitoso',
        duracionMinutos: 15
      },
      {
        materialId: 'MAT005',
        nombreMaterial: 'Tubo PVC',
        tipoEvento: 'revision',
        descripcion: 'Control de diámetros',
        fecha: new Date(2025, 0, 30),
        responsable: 'Roberto Silva',
        registradoPor: 'tonisoler@espemo.org',
        costoAsociado: 65,
        estado: 'completado',
        observaciones: 'Medidas dentro de tolerancia',
        duracionMinutos: 40
      }
    ];
    
    let insertados = 0;
    let errores = 0;
    
    console.log(`🔄 Insertando ${eventos.length} eventos...`);
    
    for (let i = 0; i < eventos.length; i++) {
      const evento = eventos[i];
      try {
        await service.registrarEvento(evento);
        insertados++;
        console.log(`✅ ${insertados}/${eventos.length}: ${evento.nombreMaterial} - ${evento.tipoEvento}`);
        
        // Pausa más larga para asegurar persistencia
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        errores++;
        console.error(`❌ Error ${errores}: ${evento.nombreMaterial}:`, error.message);
      }
    }
    
    console.log(`\n📊 RESULTADOS DE INSERCIÓN:`);
    console.log(`✅ Eventos insertados exitosamente: ${insertados}`);
    console.log(`❌ Errores encontrados: ${errores}`);
    console.log(`📈 Tasa de éxito: ${((insertados / eventos.length) * 100).toFixed(1)}%`);
    
    // 3. Esperar y limpiar cache antes de verificar
    console.log('\n⏳ Esperando propagación de datos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Limpiar cache nuevamente
    if (service.materialHistorialRepository && service.materialHistorialRepository.clearCache) {
      service.materialHistorialRepository.clearCache();
      console.log('🧹 Cache limpiado');
    }
    
    // 4. Verificación final forzando consulta fresca
    console.log('\n🔍 Verificación final (sin cache)...');
    
    try {
      // Forzar consulta con timestamp para evitar cache
      const filtroSinCache = { 
        años: [2025],
        _timestamp: Date.now() // Para evitar cache
      };
      
      const eventosFinales = await service.obtenerHistorial(filtroSinCache);
      console.log(`📈 Total eventos verificados: ${eventosFinales.length}`);
      
      if (eventosFinales.length > 0) {
        // Estadísticas detalladas
        const stats = await service.obtenerEstadisticasAnuales(2025);
        
        console.log('\n🎉 ¡GENERACIÓN EXITOSA!');
        console.log(`📊 Eventos reales en estadísticas: ${stats.eventosReales || 0}`);
        console.log(`💰 Inversión total: $${(stats.inversionTotal || 0).toLocaleString()}`);
        console.log(`📋 Materiales diferentes: ${stats.totalMateriales || 0}`);
        
        // Análisis por tipo de evento
        const tipoCount = {};
        const estadoCount = {};
        const materialCount = {};
        let costoTotal = 0;
        
        eventosFinales.forEach(evento => {
          tipoCount[evento.tipoEvento] = (tipoCount[evento.tipoEvento] || 0) + 1;
          estadoCount[evento.estado] = (estadoCount[evento.estado] || 0) + 1;
          materialCount[evento.materialId] = (materialCount[evento.materialId] || 0) + 1;
          costoTotal += evento.costoAsociado || 0;
        });
        
        console.log('\n📊 DISTRIBUCIÓN POR TIPO:');
        Object.entries(tipoCount).forEach(([tipo, count]) => {
          console.log(`  🔧 ${tipo}: ${count} eventos`);
        });
        
        console.log('\n📋 DISTRIBUCIÓN POR ESTADO:');
        Object.entries(estadoCount).forEach(([estado, count]) => {
          console.log(`  📌 ${estado}: ${count} eventos`);
        });
        
        console.log('\n🏗️ MATERIALES MÁS ACTIVOS:');
        Object.entries(materialCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .forEach(([material, count]) => {
            console.log(`  📦 ${material}: ${count} eventos`);
          });
        
        console.log(`\n💰 COSTO TOTAL CALCULADO: $${costoTotal.toLocaleString()}`);
        
        console.log('\n🎯 SIGUIENTE PASO:');
        console.log('🔄 RECARGA LA PÁGINA COMPLETA (Ctrl+F5 o Cmd+Shift+R)');
        console.log('📊 Ve al dashboard "Seguimiento de Materiales"');
        console.log('✨ ¡Las gráficas deberían mostrar todos los datos ahora!');
        
        return {
          exito: true,
          eventosInsertados: insertados,
          totalEnBase: eventosFinales.length,
          errores: errores,
          costoTotal: costoTotal,
          distribucion: {
            tipos: tipoCount,
            estados: estadoCount,
            materiales: materialCount
          }
        };
        
      } else {
        console.log('⚠️ No se detectaron eventos en la verificación');
        console.log('💡 Esto puede ser por cache - recarga la página manualmente');
        
        return {
          exito: 'parcial',
          eventosInsertados: insertados,
          mensaje: 'Insertados pero no verificados (posible cache)'
        };
      }
      
    } catch (verifyError) {
      console.error('❌ Error en verificación:', verifyError);
      return {
        exito: 'parcial',
        eventosInsertados: insertados,
        errorVerificacion: verifyError.message
      };
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
    return { exito: false, error: error.message };
  }
})();
