/**
 * SCRIPT DE CORRECCIÓN AUTOMÁTICA DE NaN EN FIRESTORE
 * 
 * Este script corrige automáticamente todos los valores NaN encontrados
 * en la colección material_deportivo.
 * 
 * USAR CON PRECAUCIÓN: Este script modifica directamente la base de datos.
 */

console.log('🚨 CORRECCIÓN AUTOMÁTICA DE VALORES NaN');
console.log('=====================================');

async function correccionAutomaticaNaN() {
  const { collection, getDocs, doc, updateDoc, getFirestore } = window.firebase.firestore;
  const db = getFirestore();
  
  try {
    console.log('🔍 Buscando materiales con valores NaN...');
    
    const materialesRef = collection(db, 'material_deportivo');
    const snapshot = await getDocs(materialesRef);
    
    let corregidos = 0;
    const errores = [];
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const id = docSnapshot.id;
      
      const updates = {};
      let requiereActualizacion = false;
      
      // Verificar y corregir cantidad
      if (data.cantidad !== undefined && (isNaN(data.cantidad) || data.cantidad === null)) {
        if (data.tipo === 'cuerda') {
          updates.cantidad = 1;
        } else if (data.tipo === 'anclaje') {
          updates.cantidad = 10; // Valor por defecto para anclajes
        } else {
          updates.cantidad = 1; // Valor por defecto para varios
        }
        requiereActualizacion = true;
        console.log(`🔧 Corrigiendo cantidad para ${data.nombre}: NaN → ${updates.cantidad}`);
      }
      
      // Verificar y corregir cantidadDisponible
      if (data.cantidadDisponible !== undefined && (isNaN(data.cantidadDisponible) || data.cantidadDisponible === null)) {
        if (data.tipo === 'cuerda') {
          updates.cantidadDisponible = 1;
        } else {
          // Usar la cantidad existente o la que acabamos de establecer
          const cantidadBase = updates.cantidad || data.cantidad || 1;
          updates.cantidadDisponible = cantidadBase;
        }
        requiereActualizacion = true;
        console.log(`🔧 Corrigiendo cantidadDisponible para ${data.nombre}: NaN → ${updates.cantidadDisponible}`);
      }
      
      // Aplicar actualizaciones si es necesario
      if (requiereActualizacion) {
        try {
          const docRef = doc(db, 'material_deportivo', id);
          await updateDoc(docRef, updates);
          corregidos++;
          console.log(`✅ Material actualizado: ${data.nombre} (${data.tipo})`);
        } catch (error) {
          errores.push({ id, nombre: data.nombre, error: error.message });
          console.error(`❌ Error actualizando ${data.nombre}:`, error);
        }
      }
    }
    
    console.log('\n📊 RESUMEN DE CORRECCIÓN AUTOMÁTICA:');
    console.log(`   Total documentos procesados: ${snapshot.docs.length}`);
    console.log(`   Materiales corregidos: ${corregidos}`);
    console.log(`   Errores: ${errores.length}`);
    
    if (errores.length > 0) {
      console.log('\n❌ ERRORES ENCONTRADOS:');
      errores.forEach(error => {
        console.log(`   - ${error.nombre} (${error.id}): ${error.error}`);
      });
    }
    
    if (corregidos > 0) {
      console.log('\n✅ CORRECCIÓN COMPLETADA EXITOSAMENTE');
      console.log('   Se recomienda recargar la aplicación para ver los cambios');
    } else {
      console.log('\n✅ NO SE ENCONTRARON VALORES NaN PARA CORREGIR');
    }
    
    return { corregidos, errores };
    
  } catch (error) {
    console.error('❌ Error en la corrección automática:', error);
    return { corregidos: 0, errores: [{ error: error.message }] };
  }
}

// Exponer función globalmente
window.correccionAutomaticaNaN = correccionAutomaticaNaN;

// Instrucciones
console.log('📋 PARA EJECUTAR LA CORRECCIÓN AUTOMÁTICA:');
console.log('await correccionAutomaticaNaN()');
console.log('');
console.log('⚠️  ADVERTENCIA: Esta función modificará directamente la base de datos.');
console.log('   Asegúrese de tener permisos y de que sea seguro proceder.');
