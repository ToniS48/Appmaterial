/**
 * GENERADOR USANDO EL CONTEXTO DE REACT EXISTENTE
 * Este script aprovecha que MaterialHistorialService ya está expuesto y autenticado
 */

(async function generadorContextoReact() {
  console.clear();
  console.log('🚀 GENERADOR USANDO CONTEXTO DE REACT');
  console.log('====================================');
  
  try {
    // 1. Verificar servicio disponible
    if (!window.materialHistorialService) {
      console.log('❌ MaterialHistorialService no disponible');
      console.log('💡 Asegúrate de estar en "Seguimiento de Materiales"');
      return;
    }
    
    const service = window.materialHistorialService;
    console.log('✅ MaterialHistorialService disponible');
    
    // 2. Como el servicio está funcionando dentro de React, 
    //    significa que la autenticación está activa
    console.log('✅ Autenticación confirmada (servicio funcionando)');
    
    // 3. Probar una inserción simple primero
    console.log('\n🧪 Probando inserción simple...');
    
    const eventoSimple = {
      materialId: 'TEST001',
      nombreMaterial: 'Material de Prueba Simple',
      tipoEvento: 'inspeccion',
      descripcion: 'Evento de prueba desde consola',
      fecha: new Date(),
      responsable: 'Sistema Consola'
    };
    
    console.log('📋 Insertando evento simple:', eventoSimple);
    
    try {
      const resultado = await service.registrarEvento(eventoSimple);
      console.log('✅ Inserción simple exitosa:', resultado);
      
      // Verificar inmediatamente
      const eventosActuales = await service.obtenerHistorial({ años: [2025] });
      console.log(`📊 Eventos actuales después de inserción: ${eventosActuales.length}`);
      
      if (eventosActuales.length > 0) {
        console.log('🎉 ¡FUNCIONA! El problema de autenticación está resuelto');
        
        // 4. Ahora generar un lote completo de datos
        console.log('\n📦 Generando lote completo de eventos...');
        
        const eventos = [
          {
            materialId: 'MAT001',
            nombreMaterial: 'Cemento Portland',
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
            descripcion: 'Reparación de almacén',
            fecha: new Date(2025, 2, 10),
            responsable: 'Carlos López',
            costoAsociado: 320,
            estado: 'pendiente'
          },
          {
            materialId: 'MAT004',
            nombreMaterial: 'Pintura Acrílica',
            tipoEvento: 'reemplazo',
            descripcion: 'Reemplazo de pintura vencida',
            fecha: new Date(2025, 3, 5),
            responsable: 'Ana Martín',
            costoAsociado: 150,
            estado: 'en_progreso'
          },
          {
            materialId: 'MAT001',
            nombreMaterial: 'Cemento Portland',
            tipoEvento: 'incidencia_menor',
            descripcion: 'Humedad detectada en almacén',
            fecha: new Date(2025, 4, 8),
            responsable: 'Juan Pérez',
            costoAsociado: 80,
            estado: 'completado'
          },
          {
            materialId: 'MAT005',
            nombreMaterial: 'Tubo PVC',
            tipoEvento: 'calibracion',
            descripcion: 'Calibración de medidas',
            fecha: new Date(2025, 5, 1),
            responsable: 'Roberto Silva',
            costoAsociado: 200,
            estado: 'completado'
          },
          {
            materialId: 'MAT002',
            nombreMaterial: 'Acero Corrugado',
            tipoEvento: 'incidencia_mayor',
            descripcion: 'Oxidación detectada en lote',
            fecha: new Date(2025, 5, 15),
            responsable: 'María García',
            costoAsociado: 500,
            estado: 'pendiente'
          },
          {
            materialId: 'MAT006',
            nombreMaterial: 'Arena Gruesa',
            tipoEvento: 'mantenimiento',
            descripcion: 'Limpieza y clasificación',
            fecha: new Date(2025, 5, 18),
            responsable: 'Pedro Morales',
            costoAsociado: 120,
            estado: 'completado'
          }
        ];
        
        let insertados = 0;
        let errores = 0;
        
        for (const evento of eventos) {
          try {
            await service.registrarEvento(evento);
            insertados++;
            console.log(`✅ ${insertados}/${eventos.length}: ${evento.nombreMaterial} - ${evento.tipoEvento}`);
            
            // Pausa para no saturar
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            errores++;
            console.error(`❌ Error ${errores}: ${evento.nombreMaterial}:`, error.message);
          }
        }
        
        console.log(`\n📊 RESULTADOS DEL LOTE:`);
        console.log(`✅ Insertados: ${insertados}/${eventos.length}`);
        console.log(`❌ Errores: ${errores}`);
        
        // 5. Verificación final
        console.log('\n🔍 Verificación final...');
        const eventosFinales = await service.obtenerHistorial({ años: [2025] });
        const stats = await service.obtenerEstadisticasAnuales(2025);
        
        console.log(`📈 Total eventos en base: ${eventosFinales.length}`);
        console.log(`📊 Estadísticas calculadas: ${stats.eventosReales} eventos reales`);
        
        if (eventosFinales.length > 0) {
          console.log('\n🎉 ¡ÉXITO COMPLETO!');
          console.log('📍 Eventos por tipo:');
          
          const tipoCount = {};
          eventosFinales.forEach(evento => {
            tipoCount[evento.tipoEvento] = (tipoCount[evento.tipoEvento] || 0) + 1;
          });
          
          Object.entries(tipoCount).forEach(([tipo, count]) => {
            console.log(`  - ${tipo}: ${count} eventos`);
          });
          
          console.log('\n🔄 RECARGA LA PÁGINA para ver las gráficas actualizadas');
          console.log('📊 Ve al dashboard y deberías ver datos en todas las gráficas');
        }
        
        return {
          exito: true,
          eventosInsertados: insertados,
          totalEnBase: eventosFinales.length,
          errores: errores
        };
        
      } else {
        console.log('❌ La inserción no se reflejó en la base de datos');
        return { exito: false, razon: 'Inserción no persistida' };
      }
      
    } catch (insertError) {
      console.error('❌ Error en inserción simple:', insertError);
      console.log('📋 Mensaje de error:', insertError.message);
      console.log('📋 Stack:', insertError.stack);
      
      // Analizar el tipo de error
      if (insertError.message.includes('permission') || insertError.code === 'permission-denied') {
        console.log('🚫 PROBLEMA: Permisos de Firestore');
        console.log('💡 SOLUCIÓN: Revisar firestore.rules para el usuario autenticado');
      } else if (insertError.message.includes('validation')) {
        console.log('📝 PROBLEMA: Validación de datos');
        console.log('💡 SOLUCIÓN: Revisar estructura de datos requerida');
      } else if (insertError.message.includes('network')) {
        console.log('🌐 PROBLEMA: Conexión de red');
        console.log('💡 SOLUCIÓN: Verificar conectividad');
      } else {
        console.log('❓ PROBLEMA: Error desconocido');
        console.log('💡 Revisar implementación del servicio');
      }
      
      return { exito: false, error: insertError.message };
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
    return { exito: false, error: error.message };
  }
})();
