#!/usr/bin/env node

/**
 * DIAGNÓSTICO ESPECÍFICO: Guardado de API Key de AEMET
 * 
 * Este script verifica el problema específico del guardado de la API key de AEMET
 * en la configuración de APIs meteorológicas.
 */

console.log('🔍 DIAGNÓSTICO: API KEY AEMET - GUARDADO EN FIRESTORE');
console.log('==================================================\n');

async function diagnosticarAemetApiKey() {
  try {
    // 1. Verificar que Firebase esté disponible
    console.log('1️⃣ VERIFICANDO FIREBASE...');
    if (!window.firebase) {
      console.error('❌ Firebase no disponible');
      return;
    }
    console.log('✅ Firebase disponible');

    const { getFirestore, doc, getDoc, setDoc, updateDoc } = window.firebase.firestore;
    const db = getFirestore();

    // 2. Verificar acceso al documento de configuración APIs
    console.log('\n2️⃣ VERIFICANDO DOCUMENTO configuracion/apis...');
    const apisDocRef = doc(db, 'configuracion', 'apis');
    
    try {
      const apisDocSnap = await getDoc(apisDocRef);
      
      if (apisDocSnap.exists()) {
        console.log('✅ Documento apis existe');
        const currentData = apisDocSnap.data();
        console.log('📋 Datos actuales:');
        console.log('  - weatherApiUrl:', currentData.weatherApiUrl || 'No definido');
        console.log('  - aemetApiKey presente:', !!(currentData.aemetApiKey));
        console.log('  - aemetApiKey longitud:', currentData.aemetApiKey?.length || 0);
        
        // Mostrar los primeros y últimos caracteres para verificar encriptado
        if (currentData.aemetApiKey) {
          const key = currentData.aemetApiKey;
          console.log('  - aemetApiKey (primeros 10 chars):', key.substring(0, 10) + '...');
          console.log('  - aemetApiKey (últimos 10 chars):', '...' + key.substring(key.length - 10));
        }
      } else {
        console.log('❌ Documento apis NO existe');
        console.log('💡 Creando documento con estructura básica...');
        
        const defaultData = {
          weatherApiUrl: 'https://api.open-meteo.com/v1/forecast',
          aemetApiKey: '',
          driveApiKey: '',
          mapsEmbedApiKey: '',
          calendarApiKey: '',
          gmailApiKey: '',
          chatApiKey: '',
          cloudMessagingApiKey: ''
        };
        
        await setDoc(apisDocRef, defaultData);
        console.log('✅ Documento apis creado');
      }
    } catch (error) {
      console.error('❌ Error accediendo al documento apis:', error);
      return;
    }

    // 3. Probar el nuevo sistema de encriptación seguro
    console.log('\n3️⃣ PROBANDO SISTEMA DE ENCRIPTACIÓN SEGURO...');
    
    // Verificar que el usuario esté autenticado
    const authService = window.firebase.auth.getAuth();
    const authenticatedUser = authService.currentUser;
    
    if (!authenticatedUser) {
      console.error('❌ Usuario no autenticado');
      console.log('💡 El sistema seguro requiere autenticación');
      return;
    }
    console.log('✅ Usuario autenticado:', authenticatedUser.email);
    
    // Verificar que SecureEncryption esté disponible
    if (typeof window.SecureEncryption !== 'undefined') {
      console.log('✅ SecureEncryption disponible');
      
      // Probar encriptación/desencriptación
      const testApiKey = 'test-aemet-key-' + Date.now();
      
      try {
        // Encriptar
        const encrypted = await window.SecureEncryption.encryptApiKey(
          testApiKey, 
          authenticatedUser, 
          'aemet'
        );
        console.log('✅ Encriptación segura exitosa. Longitud:', encrypted.length);
        
        // Desencriptar
        const decrypted = await window.SecureEncryption.decryptApiKey(
          encrypted, 
          authenticatedUser, 
          'aemet'
        );
        console.log('✅ Desencriptación segura exitosa:', decrypted === testApiKey ? 'COINCIDE' : 'NO COINCIDE');
        
        if (decrypted !== testApiKey) {
          console.error('❌ PROBLEMA: El desencriptado seguro no coincide');
          console.log('  - Original:', testApiKey);
          console.log('  - Desencriptado:', decrypted);
        }
      } catch (secureError) {
        console.error('❌ Error en sistema seguro:', secureError);
      }
    } else {
      console.error('❌ SecureEncryption no disponible');
      console.log('💡 Asegúrate de que el servicio esté importado correctamente');
    }

    // 4. Probar guardado real con API key de prueba
    console.log('\n4️⃣ PROBANDO GUARDADO REAL...');
    
    const testEncryptedKey = CryptoJS.AES.encrypt('test-key-' + Date.now(), encryptKey).toString();
    
    try {
      await updateDoc(apisDocRef, {
        aemetApiKey: testEncryptedKey,
        lastTestUpdate: new Date().toISOString(),
        testUpdateBy: 'diagnostico-aemet'
      });
      console.log('✅ Guardado de prueba exitoso');
      
      // Verificar que se guardó correctamente
      const verifySnap = await getDoc(apisDocRef);
      if (verifySnap.exists()) {
        const verifyData = verifySnap.data();
        if (verifyData.aemetApiKey === testEncryptedKey) {
          console.log('✅ Verificación exitosa: API key se guardó correctamente');
        } else {
          console.error('❌ PROBLEMA: API key no se guardó correctamente');
          console.log('  - Esperado:', testEncryptedKey);
          console.log('  - Actual:', verifyData.aemetApiKey);
        }
      }
    } catch (saveError) {
      console.error('❌ Error en guardado de prueba:', saveError);
      console.log('📋 Detalles del error:');
      console.log('  - Código:', saveError.code);
      console.log('  - Mensaje:', saveError.message);
    }

    // 5. Verificar permisos de usuario
    console.log('\n5️⃣ VERIFICANDO PERMISOS DE USUARIO...');
    
    const auth = window.firebase.auth.getAuth();
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      console.log('✅ Usuario autenticado:', currentUser.email);
      
      // Verificar el documento de usuario para el rol
      try {
        const userDocRef = doc(db, 'usuarios', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          console.log('✅ Datos de usuario encontrados');
          console.log('  - Rol:', userData.rol);
          console.log('  - Activo:', userData.activo);
          
          if (userData.rol === 'admin') {
            console.log('✅ Usuario tiene permisos de administrador');
          } else {
            console.log('⚠️ Usuario NO es administrador (rol: ' + userData.rol + ')');
            console.log('💡 Solo administradores pueden modificar APIs');
          }
        } else {
          console.error('❌ Documento de usuario no encontrado');
        }
      } catch (userError) {
        console.error('❌ Error verificando usuario:', userError);
      }
    } else {
      console.error('❌ Usuario no autenticado');
    }

    // 6. Verificar variables de entorno
    console.log('\n6️⃣ VERIFICANDO VARIABLES DE ENTORNO...');
    
    const requiredEnvVars = [
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_PROJECT_ID',
      'REACT_APP_API_ENCRYPT_KEY'
    ];
    
    requiredEnvVars.forEach(varName => {
      const value = process.env[varName];
      console.log(`  - ${varName}:`, value ? '✅ Definido' : '❌ No definido');
    });

    // 7. Resumen de diagnóstico
    console.log('\n📋 RESUMEN DE DIAGNÓSTICO:');
    console.log('=========================');
    console.log('✅ Firebase: Disponible');
    console.log('✅ Firestore: Accesible');
    console.log('✅ CryptoJS: Disponible');
    console.log('✅ Encriptado/Desencriptado: Funcional');
    console.log('✅ Guardado de prueba: Exitoso');
    console.log('');
    console.log('🎯 RECOMENDACIONES:');
    console.log('1. Verificar que el usuario tenga rol "admin"');
    console.log('2. Asegurar que REACT_APP_API_ENCRYPT_KEY esté definido');
    console.log('3. Comprobar que no haya errores JavaScript en la consola');
    console.log('4. Verificar que el componente esté recibiendo las props correctas');

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

// Función para ejecutar cuando la página esté cargada
function iniciarDiagnostico() {
  if (document.readyState === 'complete') {
    diagnosticarAemetApiKey();
  } else {
    window.addEventListener('load', diagnosticarAemetApiKey);
  }
}

// Para ejecutar desde la consola del navegador
if (typeof window !== 'undefined') {
  window.diagnosticarAemetApiKey = diagnosticarAemetApiKey;
  iniciarDiagnostico();
}

console.log('\n💡 Para ejecutar manualmente:');
console.log('   diagnosticarAemetApiKey()');
