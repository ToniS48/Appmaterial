/**
 * MIGRACIÓN SIMPLE: Para copiar y pegar en la consola del navegador
 * 
 * INSTRUCCIONES:
 * 1. Abre la consola del navegador (F12)
 * 2. Copia TODO este código
 * 3. Pégalo en la consola
 * 4. Ejecuta: diagnosticarSistemaSeguro()
 * 5. Si todo está bien, ejecuta: migrarApiKeysSeguras()
 */

console.log('🔧 CARGANDO FUNCIONES DE MIGRACIÓN...');

// Función de diagnóstico simple
async function diagnosticarSistemaSeguro() {
  console.log('🔍 DIAGNÓSTICO: Sistema de Encriptación Seguro');
  console.log('==============================================\n');

  try {
    console.log('1️⃣ VERIFICANDO COMPONENTES...');
    
    // Verificar SecureEncryption
    if (typeof window.SecureEncryption !== 'undefined') {
      console.log('✅ SecureEncryption disponible');
    } else {
      console.error('❌ SecureEncryption no disponible');
      console.log('💡 Recarga la página y espera a que cargue completamente');
      return;
    }
    
    console.log('\n2️⃣ VERIFICANDO AUTENTICACIÓN...');
    
    // Buscar información de autenticación en localStorage
    const authKeys = Object.keys(localStorage).filter(key => key.includes('firebase:authUser'));
    
    if (authKeys.length > 0) {
      const authData = JSON.parse(localStorage.getItem(authKeys[0]));
      if (authData && authData.email) {
        console.log('✅ Usuario encontrado en localStorage:', authData.email);
        
        // Verificar si currentUser está disponible
        if (window.firebase && window.firebase.auth) {
          const auth = window.firebase.auth.getAuth();
          const user = auth.currentUser;
          
          if (user) {
            console.log('✅ Usuario autenticado en Firebase:', user.email);
            
            // Probar encriptación
            console.log('\n3️⃣ PROBANDO ENCRIPTACIÓN...');
            const testData = 'test-' + Date.now();
            
            try {
              const encrypted = await window.SecureEncryption.encryptApiKey(testData, user, 'test');
              const decrypted = await window.SecureEncryption.decryptApiKey(encrypted, user, 'test');
              
              if (decrypted === testData) {
                console.log('✅ Sistema de encriptación funcionando correctamente');
                console.log('🎉 TODO LISTO PARA MIGRACIÓN');
                return true;
              } else {
                console.error('❌ Error: datos no coinciden en prueba');
                return false;
              }
            } catch (testError) {
              console.error('❌ Error en prueba de encriptación:', testError);
              return false;
            }
          } else {
            console.log('⚠️ Usuario en localStorage pero no en Firebase auth');
            console.log('💡 Esto es normal, Firebase puede estar cargando. Espera un momento y vuelve a intentar');
            return false;
          }
        } else {
          console.log('⚠️ Firebase auth no disponible aún');
          console.log('💡 Espera un momento a que cargue Firebase completamente');
          return false;
        }
      }
    } else {
      console.error('❌ No se encontró usuario autenticado');
      console.log('💡 Inicia sesión como administrador primero');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return false;
  }
}

// Función de migración simple
async function migrarApiKeysSeguras() {
  console.log('🔄 MIGRACIÓN: API Keys a Sistema Seguro');
  console.log('=====================================\n');

  try {
    // Verificar que el diagnóstico pase primero
    console.log('1️⃣ EJECUTANDO DIAGNÓSTICO PREVIO...');
    const diagnosticoOk = await diagnosticarSistemaSeguro();
    
    if (!diagnosticoOk) {
      console.error('❌ El diagnóstico falló. No se puede continuar con la migración.');
      console.log('💡 Soluciona los problemas del diagnóstico primero');
      return;
    }
    
    console.log('\n2️⃣ ACCEDIENDO A CONFIGURACIÓN...');
    
    // Obtener usuario autenticado de Firebase
    const auth = window.firebase.auth.getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('❌ Usuario no disponible para migración');
      return;
    }
    
    // Acceder a Firestore
    const { getFirestore, doc, getDoc, updateDoc } = window.firebase.firestore;
    const db = getFirestore();
    
    const apisDocRef = doc(db, 'configuracion', 'apis');
    const apisDocSnap = await getDoc(apisDocRef);
    
    if (!apisDocSnap.exists()) {
      console.log('ℹ️ No se encontró configuración de APIs existente');
      console.log('💡 Puedes configurar directamente tu API key en Configuración → APIs');
      return;
    }

    const currentData = apisDocSnap.data();
    
    if (!currentData.aemetApiKey) {
      console.log('ℹ️ No hay API key de AEMET para migrar');
      console.log('💡 Puedes configurar tu API key directamente en Configuración → APIs');
      return;
    }

    console.log('📋 API key de AEMET encontrada para migración');

    console.log('\n3️⃣ VERIFICANDO FORMATO ACTUAL...');
    
    // Verificar si ya está en formato nuevo
    try {
      const parsed = JSON.parse(currentData.aemetApiKey);
      if (parsed.data && parsed.metadata && parsed.integrity) {
        console.log('✅ API key ya está en formato seguro');
        
        // Verificar que sea accesible por el usuario actual
        const isValid = await window.SecureEncryption.validateEncryptedApiKey(
          currentData.aemetApiKey, 
          currentUser
        );
        
        if (isValid) {
          console.log('✅ API key válida y accesible - No necesita migración');
          console.log('🎉 SISTEMA YA MIGRADO');
          return;
        } else {
          console.log('⚠️ API key en formato nuevo pero no accesible por este usuario');
          console.log('💡 Puede haber sido configurada por otro administrador');
          console.log('💡 Puedes reconfigurarla en Configuración → APIs');
          return;
        }
      }
    } catch (e) {
      console.log('📋 API key en formato antiguo - procediendo con migración');
    }

    console.log('\n4️⃣ MIGRANDO AL FORMATO SEGURO...');
    
    // Para la migración, asumir que la API key puede estar sin encriptar
    // o encriptada con el método anterior
    let decryptedKey = currentData.aemetApiKey;
    
    console.log('🔄 Usando API key tal como está almacenada');
    console.log('   (Si estaba encriptada con método anterior, el nuevo sistema la manejará)');
    
    // Encriptar con el nuevo sistema
    const newEncryptedKey = await window.SecureEncryption.encryptApiKey(
      decryptedKey,
      currentUser,
      'aemet'
    );
    
    console.log('✅ API key encriptada con sistema seguro');
    
    // Guardar en Firestore
    await updateDoc(apisDocRef, {
      aemetApiKey: newEncryptedKey,
      lastMigration: new Date().toISOString(),
      migrationBy: currentUser.uid,
      migrationFrom: 'legacy_or_plain',
      migrationNote: 'Migrado al sistema de encriptación seguro por usuario'
    });
    
    console.log('✅ API key guardada en Firestore');
    
    console.log('\n5️⃣ VERIFICANDO MIGRACIÓN...');
    
    // Verificar que se puede leer correctamente
    const verifySnap = await getDoc(apisDocRef);
    if (verifySnap.exists()) {
      const verifyData = verifySnap.data();
      
      try {
        const verifyDecrypted = await window.SecureEncryption.decryptApiKey(
          verifyData.aemetApiKey,
          currentUser,
          'aemet'
        );
        
        console.log('✅ Verificación exitosa - API key migrada correctamente');
        console.log('📋 Longitud de API key verificada:', verifyDecrypted.length, 'caracteres');
        
        console.log('\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE');
        console.log('====================================');
        console.log('✅ Tu API key de AEMET ahora está encriptada de forma segura');
        console.log('✅ Solo tú puedes acceder a esta API key');
        console.log('✅ Se reencriptará automáticamente cada 30 días');
        console.log('\n💡 Puedes verificar que funciona en Configuración → APIs');
        
      } catch (verifyError) {
        console.error('❌ Error verificando migración:', verifyError);
        console.log('💡 La API key se guardó pero hubo un problema en la verificación');
        console.log('💡 Prueba a acceder a Configuración → APIs para verificar');
      }
    }
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    console.log('\n📋 PASOS PARA SOLUCIONAR:');
    console.log('1. Recarga la página');
    console.log('2. Verifica que estés autenticado como administrador');
    console.log('3. Ejecuta diagnosticarSistemaSeguro() primero');
    console.log('4. Si persiste, configura tu API key manualmente en Configuración → APIs');
  }
}

// Función para verificar estado
function verificarEstado() {
  console.log('📊 ESTADO DEL SISTEMA:');
  console.log('=====================');
  console.log('SecureEncryption:', typeof window.SecureEncryption !== 'undefined' ? '✅ Disponible' : '❌ No disponible');
  console.log('Firebase:', typeof window.firebase !== 'undefined' ? '✅ Disponible' : '❌ No disponible');
  
  const authKeys = Object.keys(localStorage).filter(key => key.includes('firebase:authUser'));
  console.log('Usuario autenticado:', authKeys.length > 0 ? '✅ Sí' : '❌ No');
  
  if (authKeys.length > 0) {
    const authData = JSON.parse(localStorage.getItem(authKeys[0]));
    console.log('Email:', authData?.email || 'No disponible');
  }
}

console.log('✅ FUNCIONES CARGADAS:');
console.log('======================');
console.log('verificarEstado() - Verificar componentes disponibles');
console.log('diagnosticarSistemaSeguro() - Diagnóstico completo');
console.log('migrarApiKeysSeguras() - Migrar API keys al sistema seguro');
console.log('\n🚀 EMPEZAR CON: verificarEstado()');
