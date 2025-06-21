import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const diagnosticarFirestore = async (userId: string, conversacionId: string) => {
  console.log('🔍 [DIAGNÓSTICO] Iniciando diagnóstico de Firestore...');
  
  try {
    // 1. Verificar conectividad básica leyendo una colección simple
    console.log('1️⃣ [DIAGNÓSTICO] Probando conectividad básica...');
    const testQuery = query(collection(db, 'conversaciones'), where('id', '==', 'test'));
    await getDocs(testQuery);
    console.log('✅ [DIAGNÓSTICO] Conectividad básica: OK');
      // 2. Verificar que la conversación existe
    console.log('2️⃣ [DIAGNÓSTICO] Verificando conversación...');
    const conversacionRef = doc(db, 'conversaciones', conversacionId);
    const conversacionSnapshot = await getDoc(conversacionRef);
    console.log('📊 [DIAGNÓSTICO] Conversación existe:', conversacionSnapshot.exists());
    
    if (!conversacionSnapshot.exists()) {
      console.error('❌ [DIAGNÓSTICO] La conversación no existe en Firestore');
      return false;
    }
    
    const conversacionData = conversacionSnapshot.data();
    console.log('📄 [DIAGNÓSTICO] Datos de conversación:', conversacionData);
    
    // 3. Verificar participantes
    console.log('3️⃣ [DIAGNÓSTICO] Verificando participantes...');
    const participantes = conversacionData.participantes || [];
    const esParticipante = participantes.includes(userId);
    console.log('👥 [DIAGNÓSTICO] Participantes:', participantes);
    console.log('🔑 [DIAGNÓSTICO] Usuario actual:', userId);
    console.log('✅ [DIAGNÓSTICO] Es participante:', esParticipante);
    
    // 4. Intentar crear un mensaje de prueba simplificado
    console.log('4️⃣ [DIAGNÓSTICO] Probando creación de mensaje simplificado...');
    const mensajePrueba = {
      texto: 'MENSAJE DE PRUEBA - DIAGNÓSTICO',
      autorId: userId,
      conversacionId: conversacionId,
      fechaCreacion: new Date(),
      leido: false
    };
    
    console.log('📝 [DIAGNÓSTICO] Mensaje de prueba:', mensajePrueba);
    
    // Timeout para esta operación también
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('DIAGNÓSTICO: Timeout en addDoc'));
      }, 15000);
    });
    
    const savePromise = addDoc(collection(db, 'mensajes'), mensajePrueba);
    const docRef = await Promise.race([savePromise, timeoutPromise]) as any;
    
    console.log('✅ [DIAGNÓSTICO] Mensaje de prueba guardado con ID:', docRef.id);
    return true;
    
  } catch (error) {
    console.error('❌ [DIAGNÓSTICO] Error en diagnóstico:', {
      error,
      message: error instanceof Error ? error.message : 'Mensaje no disponible',
      code: (error as any)?.code || 'Código no disponible'
    });
    return false;
  }
};
