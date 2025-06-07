/**
 * Test directo para verificar la conexión con Firebase y la colección material_deportivo
 */
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../src/config/firebase';

const testMaterialRepository = async () => {
  console.log('🧪 INICIANDO TEST DE MATERIAL REPOSITORY');
  
  try {
    // Test 1: Verificar conexión a Firebase
    console.log('🔗 Test 1: Verificando conexión a Firebase...');
    console.log('DB instance:', db);
    
    // Test 2: Verificar colección material_deportivo
    console.log('📦 Test 2: Verificando colección material_deportivo...');
    const materialCollection = collection(db, 'material_deportivo');
    console.log('Collection reference:', materialCollection);
    
    // Test 3: Obtener todos los documentos
    console.log('📋 Test 3: Obteniendo documentos...');
    const snapshot = await getDocs(materialCollection);
    console.log('Snapshot size:', snapshot.size);
    console.log('Snapshot empty:', snapshot.empty);
    
    if (!snapshot.empty) {
      console.log('📄 Documentos encontrados:');
      snapshot.forEach((doc) => {
        console.log('Doc ID:', doc.id);
        console.log('Doc data:', doc.data());
      });
    } else {
      console.log('❌ No se encontraron documentos en la colección material_deportivo');
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  }
  
  console.log('🏁 TEST FINALIZADO');
};

// Ejecutar el test
testMaterialRepository();
