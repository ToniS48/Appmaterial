/**
 * GENERADOR CORREGIDO CON CAMPOS OBLIGATORIOS
 * Incluye todos los campos requeridos por la validación
 */

(async function generadorCorregido() {
  console.clear();
  console.log('🚀 GENERADOR CORREGIDO - CAMPOS COMPLETOS');
  console.log('=======================================');
  
  try {
    // 1. Verificar servicio disponible
    if (!window.materialHistorialService) {
      console.log('❌ MaterialHistorialService no disponible');
      console.log('💡 Asegúrate de estar en "Seguimiento de Materiales"');
      return;
    }
    
    const service = window.materialHistorialService;
    console.log('✅ MaterialHistorialService disponible');
    console.log('✅ Autenticación confirmada');
    
    // 2. Probar inserción con TODOS los campos requeridos
    console.log('\n🧪 Probando inserción con campos completos...');
    
    const eventoCompleto = {
      materialId: 'TEST001',
      nombreMaterial: 'Material de Prueba',
      tipoEvento: 'inspeccion',
      descripcion: 'Evento de prueba desde consola',
      fecha: new Date(),
      responsable: 'Sistema Consola',
      registradoPor: 'tonisoler@espemo.org', // Campo obligatorio identificado
      costoAsociado: 100,
      estado: 'completado',
      observaciones: 'Evento generado desde script de consola',
      duracionMinutos: 60
    };
    
    console.log('📋 Insertando evento con campos completos:', eventoCompleto);
    
    try {
      const resultado = await service.registrarEvento(eventoCompleto);
      console.log('✅ Inserción exitosa:', resultado);
      
      // Verificar inmediatamente
      const eventosActuales = await service.obtenerHistorial({ años: [2025] });
      console.log(`📊 Eventos después de inserción: ${eventosActuales.length}`);
      
      if (eventosActuales.length > 0) {
        console.log('🎉 ¡PERFECTO! Los campos están correctos');
        
        // 3. Generar lote completo con estructura correcta
        console.log('\n📦 Generando lote completo de eventos...');
        
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
            observaciones: 'Mantenimiento programado completado sin incidencias',
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
            observaciones: 'Inspección satisfactoria, material en buen estado',
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
            observaciones: 'Reemplazo en curso, 50% completado',
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
            observaciones: 'Calibración exitosa, tolerancias dentro de norma',
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
            descripcion: 'Limpieza y clasificación',
            fecha: new Date(2025, 5, 18),
            responsable: 'Pedro Morales',
            registradoPor: 'tonisoler@espemo.org',
            costoAsociado: 120,
            estado: 'completado',
            observaciones: 'Arena clasificada y almacenada correctamente',
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
            observaciones: 'Productos dentro de fecha de vencimiento',
            duracionMinutos: 30
          }
        ];
        
        let insertados = 0;
        let errores = 0;
        
        console.log(`🔄 Insertando ${eventos.length} eventos...`);
        
        for (const evento of eventos) {
          try {
            await service.registrarEvento(evento);
            insertados++;
            console.log(`✅ ${insertados}/${eventos.length}: ${evento.nombreMaterial} - ${evento.tipoEvento}`);
            
            // Pausa para no saturar
            await new Promise(resolve => setTimeout(resolve, 150));
            
          } catch (error) {
            errores++;
            console.error(`❌ Error ${errores}: ${evento.nombreMaterial}:`, error.message);
          }
        }
        
        console.log(`\n📊 RESULTADOS DEL LOTE:`);
        console.log(`✅ Insertados exitosamente: ${insertados}/${eventos.length}`);
        console.log(`❌ Errores encontrados: ${errores}`);
        
        // 4. Verificación final completa
        console.log('\n🔍 Verificación final...');
        const eventosFinales = await service.obtenerHistorial({ años: [2025] });
        const stats = await service.obtenerEstadisticasAnuales(2025);
        
        console.log(`📈 Total eventos en base: ${eventosFinales.length}`);
        console.log(`📊 Estadísticas reales: ${stats.eventosReales || 0} eventos`);
        console.log(`💰 Costo total: $${stats.inversionTotal || 0}`);
        
        if (eventosFinales.length > 0) {
          console.log('\n🎉 ¡ÉXITO COMPLETO!');
          console.log('📍 Distribución por tipo de evento:');
          
          const tipoCount = {};
          const estadoCount = {};
          let costoTotal = 0;
          
          eventosFinales.forEach(evento => {
            tipoCount[evento.tipoEvento] = (tipoCount[evento.tipoEvento] || 0) + 1;
            estadoCount[evento.estado] = (estadoCount[evento.estado] || 0) + 1;
            costoTotal += evento.costoAsociado || 0;
          });
          
          console.log('\n📊 Por tipo:');
          Object.entries(tipoCount).forEach(([tipo, count]) => {
            console.log(`  - ${tipo}: ${count} eventos`);
          });
          
          console.log('\n📋 Por estado:');
          Object.entries(estadoCount).forEach(([estado, count]) => {
            console.log(`  - ${estado}: ${count} eventos`);
          });
          
          console.log(`\n💰 Costo total asociado: $${costoTotal.toLocaleString()}`);
          
          console.log('\n🎯 SIGUIENTES PASOS:');
          console.log('1. 🔄 RECARGA LA PÁGINA (F5) para ver los datos actualizados');
          console.log('2. 📊 Ve al dashboard "Seguimiento de Materiales"');
          console.log('3. 📈 Las gráficas deberían mostrar datos ahora');
          console.log('4. 📋 Verifica que aparezcan estadísticas en las tarjetas superiores');
          
          return {
            exito: true,
            eventosInsertados: insertados,
            totalEnBase: eventosFinales.length,
            errores: errores,
            costoTotal: costoTotal,
            distribucionTipos: tipoCount
          };
        }
        
      } else {
        console.log('❌ La inserción no se persistió');
        return { exito: false, razon: 'No persistido' };
      }
      
    } catch (insertError) {
      console.error('❌ Error en inserción:', insertError);
      console.log('📋 Mensaje:', insertError.message);
      
      if (insertError.message.includes('obligatorio')) {
        console.log('📝 CAMPO FALTANTE detectado en el error');
        console.log('💡 Revisar qué otros campos son obligatorios');
      }
      
      return { exito: false, error: insertError.message };
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
    return { exito: false, error: error.message };
  }
})();
