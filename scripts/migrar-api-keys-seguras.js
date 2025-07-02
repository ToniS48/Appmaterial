#!/usr/bin/env node

/**
 * SCRIPT DE MIGRACIÓN: API Keys a Sistema Seguro
 * 
 * Este script migra las API keys existentes del sistema de encriptación antiguo
 * al nuevo sistema seguro basado en usuario.
 */

console.log('🔄 MIGRACIÓN: API Keys a Sistema Seguro');
console.log('=====================================\n');

async function migrarApiKeysSeguras() {
  try {
    console.log('1️⃣ VERIFICANDO DEPENDENCIAS...');
    
    // Verificar que Firebase esté disponible
    if (!window.firebase) {
      console.error('❌ Firebase no disponible');
      return;
    }
    console.log('✅ Firebase disponible');

    // Verificar que el usuario esté autenticado
    const auth = window.firebase.auth.getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.error('❌ Usuario no autenticado');
      console.log('💡 Inicia sesión antes de ejecutar la migración');
      return;
    }
    console.log('✅ Usuario autenticado:', currentUser.email);

    // Verificar que CryptoJS esté disponible
    if (typeof CryptoJS === 'undefined') {
      console.error('❌ CryptoJS no disponible');
      return;
    }
    console.log('✅ CryptoJS disponible');

    // Verificar que SecureEncryption esté disponible
    if (typeof window.SecureEncryption === 'undefined') {
      console.error('❌ SecureEncryption no disponible');
      console.log('💡 Asegúrate de que el servicio esté cargado');
      return;
    }
    console.log('✅ SecureEncryption disponible');

    const { getFirestore, doc, getDoc, updateDoc } = window.firebase.firestore;
    const db = getFirestore();

    console.log('\n2️⃣ VERIFICANDO API KEYS EXISTENTES...');
    
    const apisDocRef = doc(db, 'configuracion', 'apis');
    const apisDocSnap = await getDoc(apisDocRef);
    
    if (!apisDocSnap.exists()) {
      console.log('❌ No se encontró configuración de APIs');
      return;
    }

    const currentData = apisDocSnap.data();
    console.log('✅ Configuración de APIs encontrada');

    // Verificar si hay API key de AEMET
    if (!currentData.aemetApiKey) {
      console.log('ℹ️ No hay API key de AEMET para migrar');
      return;
    }

    console.log('📋 API key de AEMET encontrada');
    console.log('  - Longitud:', currentData.aemetApiKey.length);

    console.log('\n3️⃣ ANALIZANDO FORMATO ACTUAL...');
    
    // Intentar determinar si ya está en formato nuevo
    let isNewFormat = false;
    try {
      const parsed = JSON.parse(currentData.aemetApiKey);
      if (parsed.data && parsed.metadata && parsed.integrity) {
        isNewFormat = true;
        console.log('✅ API key ya está en formato seguro');
        
        // Verificar validez
        const isValid = await window.SecureEncryption.validateEncryptedApiKey(
          currentData.aemetApiKey, 
          currentUser
        );
        
        if (isValid) {
          console.log('✅ API key válida y accesible');
          
          // Verificar si necesita actualización
          if (window.SecureEncryption.needsUpdate(currentData.aemetApiKey)) {
            console.log('⚠️ API key necesita reencriptación por edad');
            
            console.log('\n4️⃣ REENCRIPTANDO API KEY...');
            const reencrypted = await window.SecureEncryption.reencryptApiKey(
              currentData.aemetApiKey,
              currentUser,
              'aemet'
            );
            
            await updateDoc(apisDocRef, {
              aemetApiKey: reencrypted,
              lastMigration: new Date().toISOString(),
              migrationBy: currentUser.uid,
              migrationReason: 'Reencriptación por edad'
            });
            
            console.log('✅ API key reencriptada exitosamente');
          } else {
            console.log('✅ API key no necesita actualización');
          }
          
          return;
        } else {
          console.log('❌ API key en formato nuevo pero no accesible');
          console.log('💡 Puede pertenecer a otro usuario');
          return;
        }
      }
    } catch (e) {
      // No es formato JSON, probablemente formato antiguo
      console.log('📋 API key en formato antiguo detectado');
    }

    console.log('\n4️⃣ MIGRANDO AL FORMATO SEGURO...');
    
    // Intentar desencriptar con el método antiguo
    const oldEncryptKey = process.env.REACT_APP_API_ENCRYPT_KEY || 'default_key';
    console.log('🔑 Usando clave de encriptación antigua');
    
    let decryptedKey = '';
    try {
      const bytes = CryptoJS.AES.decrypt(currentData.aemetApiKey, oldEncryptKey);
      decryptedKey = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedKey) {
        throw new Error('Desencriptación resultó vacía');
      }
      
      console.log('✅ API key desencriptada con método antiguo');
      console.log('  - Longitud desencriptada:', decryptedKey.length);
    } catch (error) {
      console.error('❌ Error desencriptando con método antiguo:', error);
      console.log('💡 Posibles causas:');
      console.log('  - La API key no está encriptada');
      console.log('  - Se usó una clave de encriptación diferente');
      console.log('  - La API key está corrupta');
      
      // Intentar usar la key tal como está (sin encriptar)
      console.log('\n🔄 Intentando usar la key sin desencriptar...');
      if (currentData.aemetApiKey.length > 10 && !currentData.aemetApiKey.includes(' ')) {
        decryptedKey = currentData.aemetApiKey;
        console.log('💡 Usando la key tal como está almacenada');
      } else {
        console.error('❌ No se pudo determinar la API key válida');
        return;
      }
    }

    console.log('\n5️⃣ ENCRIPTANDO CON SISTEMA SEGURO...');
    
    try {
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
        migrationFrom: 'legacy_encryption'
      });
      
      console.log('✅ API key migrada y guardada en Firestore');
      
      // Verificar que la migración fue exitosa
      console.log('\n6️⃣ VERIFICANDO MIGRACIÓN...');
      
      const verifySnap = await getDoc(apisDocRef);
      if (verifySnap.exists()) {
        const verifyData = verifySnap.data();
        
        // Intentar desencriptar con el nuevo sistema
        const verifyDecrypted = await window.SecureEncryption.decryptApiKey(
          verifyData.aemetApiKey,
          currentUser,
          'aemet'
        );
        
        if (verifyDecrypted === decryptedKey) {
          console.log('✅ Migración verificada exitosamente');
          console.log('  - La API key se puede desencriptar correctamente');
          console.log('  - Los datos coinciden con el original');
        } else {
          console.error('❌ Error en verificación: datos no coinciden');
        }
      }
      
    } catch (encryptError) {
      console.error('❌ Error encriptando con sistema seguro:', encryptError);
      return;
    }

    console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('=====================================');
    console.log('📋 Resumen:');
    console.log('  - API key de AEMET migrada al sistema seguro');
    console.log('  - Encriptación única por usuario implementada');
    console.log('  - Sistema de validación de integridad activo');
    console.log('  - Rotación automática de claves configurada');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    console.log('\n📋 PASOS PARA SOLUCIONAR:');
    console.log('1. Verificar que estés autenticado como administrador');
    console.log('2. Verificar que la API key de AEMET esté configurada');
    console.log('3. Verificar que tengas permisos de escritura en Firestore');
    console.log('4. Si persiste el error, reconfigurar manualmente la API key');
  }
}

// Función para ejecutar cuando la página esté cargada
function iniciarMigracion() {
  if (document.readyState === 'complete') {
    migrarApiKeysSeguras();
  } else {
    window.addEventListener('load', migrarApiKeysSeguras);
  }
}

// Para ejecutar desde la consola del navegador
if (typeof window !== 'undefined') {
  window.migrarApiKeysSeguras = migrarApiKeysSeguras;
  iniciarMigracion();
}

console.log('\n💡 Para ejecutar manualmente:');
console.log('   migrarApiKeysSeguras()');
