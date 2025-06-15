/**
 * SCRIPT DE CORRECCIÓN DE VALORES NaN EN MATERIAL_DEPORTIVO
 * 
 * Este script identifica y corrige valores NaN en los campos cantidad y cantidadDisponible
 * de la colección material_deportivo en Firestore.
 * 
 * INSTRUCCIONES DE USO:
 * 1. Abrir la consola del navegador en la aplicación
 * 2. Pegar y ejecutar este script
 * 3. Seguir las instrucciones que aparecen en consola
 */

console.log('🔧 INICIANDO CORRECCIÓN DE VALORES NaN EN MATERIAL_DEPORTIVO');
console.log('================================================');

// Importar Firebase
const { collection, getDocs, doc, updateDoc, getFirestore } = window.firebase.firestore;
const db = getFirestore();

/**
 * Función para diagnosticar materiales con valores NaN
 */
async function diagnosticarMaterialesNaN() {
  console.log('🔍 DIAGNÓSTICO: Buscando materiales con valores NaN...');
  
  try {
    const materialesRef = collection(db, 'material_deportivo');
    const snapshot = await getDocs(materialesRef);
    
    const materialesProblematicos = [];
    
    snapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const id = docSnapshot.id;
      
      const cantidad = data.cantidad;
      const cantidadDisponible = data.cantidadDisponible;
      
      // Detectar valores NaN o problemáticos
      const cantidadEsNaN = (cantidad !== undefined && (isNaN(cantidad) || cantidad === null));
      const cantidadDispEsNaN = (cantidadDisponible !== undefined && (isNaN(cantidadDisponible) || cantidadDisponible === null));
      
      if (cantidadEsNaN || cantidadDispEsNaN) {
        materialesProblematicos.push({
          id,
          nombre: data.nombre,
          tipo: data.tipo,
          cantidad: cantidad,
          cantidadDisponible: cantidadDisponible,
          cantidadEsNaN,
          cantidadDispEsNaN
        });
      }
    });
    
    console.log(`📊 RESULTADO DEL DIAGNÓSTICO:`);
    console.log(`   Total materiales: ${snapshot.docs.length}`);
    console.log(`   Materiales con NaN: ${materialesProblematicos.length}`);
    
    if (materialesProblematicos.length > 0) {
      console.log('\n❌ MATERIALES PROBLEMÁTICOS ENCONTRADOS:');
      materialesProblematicos.forEach((material, index) => {
        console.log(`${index + 1}. ${material.nombre} (${material.tipo})`);
        console.log(`   - ID: ${material.id}`);
        console.log(`   - Cantidad: ${material.cantidad} ${material.cantidadEsNaN ? '❌ NaN' : '✅'}`);
        console.log(`   - Cantidad Disponible: ${material.cantidadDisponible} ${material.cantidadDispEsNaN ? '❌ NaN' : '✅'}`);
        console.log('');
      });
    } else {
      console.log('✅ No se encontraron materiales con valores NaN');
    }
    
    return materialesProblematicos;
    
  } catch (error) {
    console.error('❌ Error en el diagnóstico:', error);
    return [];
  }
}

/**
 * Función para corregir valores NaN en los materiales
 */
async function corregirMaterialesNaN(materialesProblematicos) {
  console.log('\n🔧 CORRECCIÓN: Iniciando corrección de valores NaN...');
  
  if (materialesProblematicos.length === 0) {
    console.log('✅ No hay materiales que corregir');
    return;
  }
  
  const correcciones = [];
  
  for (const material of materialesProblematicos) {
    try {
      const nuevosValores = {};
      
      // Determinar valores correctos según el tipo de material
      if (material.tipo === 'cuerda') {
        // Para cuerdas: cantidad = 1, cantidadDisponible = 1
        if (material.cantidadEsNaN) {
          nuevosValores.cantidad = 1;
        }
        if (material.cantidadDispEsNaN) {
          nuevosValores.cantidadDisponible = 1;
        }
      } else {
        // Para anclajes y varios: usar valores por defecto razonables
        if (material.cantidadEsNaN) {
          nuevosValores.cantidad = material.tipo === 'anclaje' ? 10 : 1;
        }
        if (material.cantidadDispEsNaN) {
          // Si cantidad está disponible y es válida, usar ese valor, sino usar el mismo que cantidad
          const cantidadBase = nuevosValores.cantidad || (material.cantidad && !isNaN(material.cantidad) ? material.cantidad : (material.tipo === 'anclaje' ? 10 : 1));
          nuevosValores.cantidadDisponible = cantidadBase;
        }
      }
      
      // Actualizar el documento en Firestore
      if (Object.keys(nuevosValores).length > 0) {
        const docRef = doc(db, 'material_deportivo', material.id);
        await updateDoc(docRef, nuevosValores);
        
        correcciones.push({
          id: material.id,
          nombre: material.nombre,
          tipo: material.tipo,
          valoresAnteriores: {
            cantidad: material.cantidad,
            cantidadDisponible: material.cantidadDisponible
          },
          valoresNuevos: nuevosValores
        });
        
        console.log(`✅ Corregido: ${material.nombre}`);
        console.log(`   - Valores anteriores: cantidad=${material.cantidad}, cantidadDisponible=${material.cantidadDisponible}`);
        console.log(`   - Valores nuevos: ${JSON.stringify(nuevosValores)}`);
      }
      
    } catch (error) {
      console.error(`❌ Error al corregir material ${material.nombre}:`, error);
    }
  }
  
  console.log(`\n📈 RESUMEN DE CORRECCIONES:`);
  console.log(`   Materiales corregidos: ${correcciones.length}`);
  
  return correcciones;
}

/**
 * Función principal que ejecuta el diagnóstico y ofrece corrección
 */
async function ejecutarCorreccionNaN() {
  try {
    // Paso 1: Diagnóstico
    const materialesProblematicos = await diagnosticarMaterialesNaN();
    
    if (materialesProblematicos.length > 0) {
      console.log('\n⚠️  SE ENCONTRARON MATERIALES CON VALORES NaN');
      console.log('¿Desea proceder con la corrección automática?');
      console.log('Para continuar, ejecute: await corregirMaterialesNaN(materialesProblematicos)');
      
      // Guardar en variable global para poder usar desde consola
      window.materialesProblematicos = materialesProblematicos;
      window.corregirMaterialesNaN = corregirMaterialesNaN;
      
    } else {
      console.log('✅ DIAGNÓSTICO COMPLETADO: No se requieren correcciones');
    }
    
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  }
}

/**
 * Función para validar las correcciones realizadas
 */
async function validarCorrecciones() {
  console.log('\n🔍 VALIDACIÓN: Verificando que las correcciones se aplicaron correctamente...');
  
  const materialesProblematicos = await diagnosticarMaterialesNaN();
  
  if (materialesProblematicos.length === 0) {
    console.log('✅ VALIDACIÓN EXITOSA: No quedan valores NaN en la base de datos');
  } else {
    console.log('⚠️  VALIDACIÓN: Aún quedan algunos valores NaN por corregir');
  }
  
  return materialesProblematicos.length === 0;
}

// Exponer funciones globalmente para uso desde consola
window.diagnosticarMaterialesNaN = diagnosticarMaterialesNaN;
window.corregirMaterialesNaN = corregirMaterialesNaN;
window.validarCorrecciones = validarCorrecciones;
window.ejecutarCorreccionNaN = ejecutarCorreccionNaN;

// Ejecutar diagnóstico automáticamente
console.log('🚀 Ejecutando diagnóstico automático...');
ejecutarCorreccionNaN();

console.log('\n📋 FUNCIONES DISPONIBLES EN CONSOLA:');
console.log('- diagnosticarMaterialesNaN(): Ejecutar solo el diagnóstico');
console.log('- corregirMaterialesNaN(materialesProblematicos): Corregir materiales problemáticos');
console.log('- validarCorrecciones(): Validar que las correcciones se aplicaron');
console.log('- ejecutarCorreccionNaN(): Ejecutar proceso completo');
