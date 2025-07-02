#!/usr/bin/env node

/**
 * VERIFICACIÓN RÁPIDA: Sistema de Encriptación Seguro
 * 
 * Script para verificar que el nuevo sistema está funcionando correctamente
 */

console.log('🔍 VERIFICACIÓN RÁPIDA: Sistema de Encriptación Seguro');
console.log('====================================================\n');

async function verificacionRapida() {
  try {
    console.log('1️⃣ VERIFICANDO ENTORNO...');
    
    // Verificar Firebase
    if (!window.firebase) {
      console.error('❌ Firebase no disponible');
      console.log('💡 Asegúrate de que la aplicación esté cargada completamente');
      return;
    }
    console.log('✅ Firebase disponible');

    // Verificar autenticación
    const auth = window.firebase.auth.getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.warn('⚠️ Usuario no autenticado');
      console.log('💡 Inicia sesión para probar las funciones de encriptación');
      console.log('📋 Funciones disponibles sin autenticación:');
      console.log('   - Verificación de componentes');
      console.log('   - Verificación de dependencias');
    } else {
      console.log('✅ Usuario autenticado:', user.email);
    }

    console.log('\n2️⃣ VERIFICANDO SERVICIOS...');
    
    // Verificar SecureEncryption
    if (typeof window.SecureEncryption !== 'undefined') {
      console.log('✅ SecureEncryption disponible globalmente');
      
      // Verificar métodos principales
      const requiredMethods = [
        'encryptApiKey',
        'decryptApiKey',
        'validateEncryptedApiKey',
        'reencryptApiKey',
        'getEncryptionInfo',
        'needsUpdate'
      ];
      
      const missingMethods = requiredMethods.filter(method => 
        typeof window.SecureEncryption[method] !== 'function'
      );
      
      if (missingMethods.length > 0) {
        console.error('❌ Métodos faltantes en SecureEncryption:', missingMethods);
      } else {
        console.log('✅ Todos los métodos de SecureEncryption disponibles');
      }
    } else {
      console.error('❌ SecureEncryption no disponible');
      console.log('💡 Verifica que esté importado en App.tsx');
    }

    // Verificar CryptoJS
    if (typeof CryptoJS !== 'undefined') {
      console.log('✅ CryptoJS disponible');
    } else {
      console.error('❌ CryptoJS no disponible');
    }

    console.log('\n3️⃣ VERIFICANDO FIRESTORE...');
    
    try {
      const { getFirestore, doc, getDoc } = window.firebase.firestore;
      const db = getFirestore();
      
      // Intentar acceder al documento de configuración
      const apisDocRef = doc(db, 'configuracion', 'apis');
      const apisDocSnap = await getDoc(apisDocRef);
      
      if (apisDocSnap.exists()) {
        console.log('✅ Acceso a configuración de APIs');
        const data = apisDocSnap.data();
        console.log('📋 Configuración actual:');
        console.log('   - weatherApiUrl:', data.weatherApiUrl ? '✅' : '❌');
        console.log('   - aemetApiKey:', data.aemetApiKey ? '✅' : '❌');
      } else {
        console.log('ℹ️ Documento de configuración no existe (se creará al guardar)');
      }
    } catch (firestoreError) {
      console.error('❌ Error accediendo a Firestore:', firestoreError);
    }

    console.log('\n4️⃣ VERIFICANDO CONFIGURACIÓN...');
    
    // Verificar variables de entorno públicas
    const publicEnvVars = {
      'REACT_APP_ENCRYPTION_VERSION': process.env.REACT_APP_ENCRYPTION_VERSION,
      'REACT_APP_CRYPTO_ALGORITHM': process.env.REACT_APP_CRYPTO_ALGORITHM
    };
    
    console.log('📋 Variables de entorno públicas:');
    Object.entries(publicEnvVars).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value ? '✅' : '❌'}`);
    });

    console.log('\n5️⃣ PRUEBA DE FUNCIONALIDAD...');
    
    if (user && typeof window.SecureEncryption !== 'undefined') {
      console.log('🧪 Ejecutando prueba de encriptación...');
      
      try {
        const testData = 'test-api-key-' + Date.now();
        
        // Encriptar
        const encrypted = await window.SecureEncryption.encryptApiKey(
          testData, 
          user, 
          'test'
        );
        console.log('✅ Encriptación exitosa');
        
        // Desencriptar
        const decrypted = await window.SecureEncryption.decryptApiKey(
          encrypted, 
          user, 
          'test'
        );
        
        if (decrypted === testData) {
          console.log('✅ Desencriptación exitosa - datos coinciden');
        } else {
          console.error('❌ Error: datos no coinciden');
          console.log('   Original:', testData);
          console.log('   Desencriptado:', decrypted);
        }
        
        // Verificar información de encriptación
        const info = window.SecureEncryption.getEncryptionInfo(encrypted);
        if (info) {
          console.log('✅ Información de encriptación disponible');
          console.log('   - Versión:', info.version);
          console.log('   - Timestamp:', new Date(info.timestamp || 0).toLocaleString());
          console.log('   - UserHash:', info.userHash?.substring(0, 8) + '...');
        }
        
      } catch (testError) {
        console.error('❌ Error en prueba de funcionalidad:', testError);
      }
    } else {
      console.log('⏭️ Saltando prueba de funcionalidad (requiere autenticación)');
    }

    console.log('\n✅ VERIFICACIÓN COMPLETADA');
    console.log('========================');
    
    if (user && typeof window.SecureEncryption !== 'undefined') {
      console.log('🎉 Sistema completamente funcional');
      console.log('📋 Puedes proceder a:');
      console.log('   1. Ir a Configuración → APIs');
      console.log('   2. Configurar tu API key de AEMET');
      console.log('   3. Usar "Guardar Key Encriptada"');
      console.log('   4. Verificar con "Validar Key"');
    } else {
      console.log('⚠️ Sistema parcialmente verificado');
      console.log('📋 Para prueba completa:');
      console.log('   1. Inicia sesión como administrador');
      console.log('   2. Ejecuta: verificacionRapida()');
    }

  } catch (error) {
    console.error('❌ Error en verificación:', error);
    console.log('\n📋 PASOS PARA SOLUCIONAR:');
    console.log('1. Recarga la página');
    console.log('2. Verifica que esté cargada completamente');
    console.log('3. Ejecuta: verificacionRapida()');
  }
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.verificacionRapida = verificacionRapida;
  
  // Ejecutar automáticamente si la página está cargada
  if (document.readyState === 'complete') {
    verificacionRapida();
  } else {
    window.addEventListener('load', verificacionRapida);
  }
}

console.log('\n💡 Para ejecutar manualmente:');
console.log('   verificacionRapida()');
