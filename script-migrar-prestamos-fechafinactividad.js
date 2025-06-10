/**
 * SCRIPT DE MIGRACIÓN: Añadir campo fechaFinActividad a préstamos existentes
 * 
 * Este script migra los préstamos existentes para añadir el campo optimizado
 * fechaFinActividad, que simplifica la detección de actividades finalizadas.
 * 
 * EJECUTAR DESDE CONSOLA DEL NAVEGADOR:
 * 1. Abrir herramientas de desarrollador (F12)
 * 2. Ir a la pestaña Console
 * 3. Copiar y pegar este script
 * 4. Ejecutar la función: migrarPrestamosConFechaFinActividad()
 */

// Función principal de migración
async function migrarPrestamosConFechaFinActividad() {
    console.log('🚀 Iniciando migración de préstamos para añadir fechaFinActividad...');
    
    try {
        // Verificar que Firebase esté disponible
        if (!window.firebase || !window.firebase.firestore) {
            throw new Error('Firebase no está disponible. Asegúrate de estar en la aplicación.');
        }
        
        const db = window.firebase.firestore();
        console.log('✅ Conexión a Firebase establecida');
        
        // PASO 1: Obtener todos los préstamos que tienen actividadId pero no fechaFinActividad
        console.log('📋 Obteniendo préstamos para migrar...');
        
        const prestamosQuery = await db.collection('prestamos')
            .where('actividadId', '!=', null)
            .get();
        
        console.log(`📊 Préstamos encontrados con actividad: ${prestamosQuery.size}`);
        
        if (prestamosQuery.empty) {
            console.log('✅ No hay préstamos para migrar');
            return;
        }
        
        // PASO 2: Procesar cada préstamo
        let prestamosActualizados = 0;
        let errores = 0;
        
        console.log('🔄 Iniciando procesamiento...');
        
        for (const prestamoDoc of prestamosQuery.docs) {
            const prestamoData = prestamoDoc.data();
            const prestamoId = prestamoDoc.id;
            
            // Verificar si ya tiene fechaFinActividad
            if (prestamoData.fechaFinActividad) {
                console.log(`⏭️ Préstamo ${prestamoId} ya tiene fechaFinActividad, saltando...`);
                continue;
            }
            
            console.log(`🔧 Procesando préstamo: ${prestamoId} (actividad: ${prestamoData.actividadId})`);
            
            try {
                // Obtener información de la actividad
                const actividadDoc = await db.collection('actividades')
                    .doc(prestamoData.actividadId)
                    .get();
                
                if (!actividadDoc.exists) {
                    console.warn(`⚠️ Actividad ${prestamoData.actividadId} no encontrada para préstamo ${prestamoId}`);
                    errores++;
                    continue;
                }
                
                const actividadData = actividadDoc.data();
                
                // Verificar que la actividad tenga fechaFin
                if (!actividadData.fechaFin) {
                    console.warn(`⚠️ Actividad ${prestamoData.actividadId} no tiene fechaFin`);
                    errores++;
                    continue;
                }
                
                // Actualizar el préstamo con fechaFinActividad
                await db.collection('prestamos').doc(prestamoId).update({
                    fechaFinActividad: actividadData.fechaFin
                });
                
                prestamosActualizados++;
                console.log(`✅ Préstamo ${prestamoId} actualizado (${prestamosActualizados}/${prestamosQuery.size})`);
                
            } catch (error) {
                console.error(`❌ Error procesando préstamo ${prestamoId}:`, error);
                errores++;
            }
        }
        
        // PASO 3: Resumen final
        console.log('\n🎉 MIGRACIÓN COMPLETADA');
        console.log(`📊 Estadísticas:`);
        console.log(`  ✅ Préstamos actualizados: ${prestamosActualizados}`);
        console.log(`  ❌ Errores: ${errores}`);
        console.log(`  📋 Total procesados: ${prestamosQuery.size}`);
        
        if (errores > 0) {
            console.warn(`⚠️ Se encontraron ${errores} errores durante la migración`);
        } else {
            console.log('🎉 ¡Migración completada exitosamente sin errores!');
        }
        
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
        throw error;
    }
}

// Función para verificar la migración
async function verificarMigracion() {
    console.log('🔍 Verificando estado de la migración...');
    
    try {
        const db = window.firebase.firestore();
        
        // Contar préstamos con actividad
        const prestamosConActividad = await db.collection('prestamos')
            .where('actividadId', '!=', null)
            .get();
        
        // Contar préstamos con fechaFinActividad
        const prestamosConFechaFin = await db.collection('prestamos')
            .where('fechaFinActividad', '!=', null)
            .get();
        
        console.log('📊 Estado de la migración:');
        console.log(`  📋 Préstamos con actividad: ${prestamosConActividad.size}`);
        console.log(`  ✅ Préstamos con fechaFinActividad: ${prestamosConFechaFin.size}`);
        
        const pendientes = prestamosConActividad.size - prestamosConFechaFin.size;
        console.log(`  ⏳ Préstamos pendientes de migrar: ${pendientes}`);
        
        if (pendientes === 0) {
            console.log('🎉 ¡Todos los préstamos están migrados!');
        } else {
            console.log(`⚠️ Quedan ${pendientes} préstamos por migrar`);
        }
        
    } catch (error) {
        console.error('❌ Error verificando migración:', error);
    }
}

// Hacer funciones disponibles globalmente
window.migrarPrestamosConFechaFinActividad = migrarPrestamosConFechaFinActividad;
window.verificarMigracion = verificarMigracion;

console.log('📋 Script de migración cargado. Funciones disponibles:');
console.log('  • migrarPrestamosConFechaFinActividad() - Ejecutar migración');
console.log('  • verificarMigracion() - Verificar estado');
