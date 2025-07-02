/**
 * Script de corrección inmediata para el servicio meteorológico
 * Copiar y pegar en la consola del navegador
 */

// Función para recargar el servicio meteorológico con la configuración correcta
window.repararServicioMeteorologico = async () => {
  try {
    console.log('🔧 REPARANDO SERVICIO METEOROLÓGICO...');
    console.log('===================================\n');
    
    console.log('1️⃣ Cargando configuración de Firestore...');
    
    // Cargar configuración meteorológica
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('./src/config/firebase');
    
    const weatherDocRef = doc(db, 'configuracion', 'weather');
    const weatherDocSnap = await getDoc(weatherDocRef);
    
    if (!weatherDocSnap.exists()) {
      console.error('❌ No existe configuración meteorológica');
      return;
    }
    
    const weatherConfig = weatherDocSnap.data();
    console.log('✅ Configuración cargada:', {
      weatherEnabled: weatherConfig.weatherEnabled,
      aemetEnabled: weatherConfig.aemetEnabled,
      aemetUseForSpain: weatherConfig.aemetUseForSpain
    });
    
    console.log('\n2️⃣ Transformando configuración...');
    
    // Transformar a formato OpenMeteoConfig
    const openMeteoConfig = {
      enabled: weatherConfig.weatherEnabled,
      defaultLocation: {
        lat: 40.4168,
        lon: -3.7038,
        name: 'Madrid, España'
      },
      temperatureUnit: weatherConfig.temperatureUnit || 'celsius',
      windSpeedUnit: weatherConfig.windSpeedUnit || 'kmh',
      precipitationUnit: weatherConfig.precipitationUnit || 'mm',
      aemet: {
        enabled: weatherConfig.aemetEnabled,
        apiKey: '',
        useForSpain: weatherConfig.aemetUseForSpain
      }
    };
    
    console.log('✅ Configuración transformada');
    
    console.log('\n3️⃣ Cargando API key de AEMET...');
    
    // Cargar API key de AEMET si está habilitado
    if (weatherConfig.aemetEnabled) {
      const apisDocRef = doc(db, 'configuracion', 'apis');
      const apisDocSnap = await getDoc(apisDocRef);
      
      if (apisDocSnap.exists()) {
        const apisData = apisDocSnap.data();
        if (apisData.aemetApiKey) {
          // Intentar desencriptar si está disponible SecureEncryption
          if (typeof window.SecureEncryption !== 'undefined') {
            try {
              // Necesitamos el usuario autenticado
              const { auth } = await import('./src/config/firebase');
              if (auth.currentUser) {
                const decryptedKey = await window.SecureEncryption.decryptApiKey(
                  apisData.aemetApiKey,
                  auth.currentUser,
                  'aemet'
                );
                openMeteoConfig.aemet.apiKey = decryptedKey;
                console.log('✅ API key de AEMET desencriptada');
              } else {
                console.log('⚠️ Usuario no autenticado, usando API key sin desencriptar');
                openMeteoConfig.aemet.apiKey = apisData.aemetApiKey;
              }
            } catch (decryptError) {
              console.log('⚠️ Error desencriptando, usando API key sin desencriptar');
              openMeteoConfig.aemet.apiKey = apisData.aemetApiKey;
            }
          } else {
            openMeteoConfig.aemet.apiKey = apisData.aemetApiKey;
          }
        } else {
          console.log('⚠️ No hay API key de AEMET configurada');
        }
      } else {
        console.log('⚠️ No existe configuración de APIs');
      }
    } else {
      console.log('ℹ️ AEMET deshabilitado, no se carga API key');
    }
    
    console.log('\n4️⃣ Reconfigurando servicio meteorológico...');
    
    // Verificar que weatherService está disponible
    if (!window.weatherService) {
      console.error('❌ weatherService no disponible');
      console.log('💡 Importando weatherService...');
      
      try {
        const { weatherService } = await import('./src/services/weatherService');
        window.weatherService = weatherService;
        console.log('✅ weatherService importado');
      } catch (importError) {
        console.error('❌ Error importando weatherService:', importError);
        return;
      }
    }
    
    // Configurar el servicio
    await window.weatherService.configure(openMeteoConfig);
    
    console.log('\n5️⃣ Verificando resultado...');
    console.log('🎯 isEnabled():', window.weatherService.isEnabled());
    console.log('🎯 isAemetEnabled():', window.weatherService.isAemetEnabled());
    console.log('🎯 getConfig():', window.weatherService.getConfig());
    
    if (window.weatherService.isEnabled()) {
      console.log('\n✅ ¡SERVICIO METEOROLÓGICO REPARADO!');
      console.log('====================================');
      console.log('🌤️ El servicio está ahora habilitado y funcionando');
    } else {
      console.log('\n❌ EL SERVICIO SIGUE DESHABILITADO');
      console.log('==================================');
      console.log('🎯 weatherEnabled en config:', weatherConfig.weatherEnabled);
      console.log('🎯 enabled en openMeteoConfig:', openMeteoConfig.enabled);
    }
    
  } catch (error) {
    console.error('❌ Error reparando servicio:', error);
  }
};

// Función simplificada para diagnóstico rápido
window.verificarEstadoMeteorologico = () => {
  console.log('📊 ESTADO ACTUAL DEL SERVICIO METEOROLÓGICO');
  console.log('==========================================');
  
  if (window.weatherService) {
    console.log('✅ weatherService disponible');
    console.log('🎯 isEnabled():', window.weatherService.isEnabled());
    console.log('🎯 isAemetEnabled():', window.weatherService.isAemetEnabled());
    console.log('🎯 Configuración completa:', window.weatherService.getConfig());
  } else {
    console.log('❌ weatherService no disponible');
  }
};

console.log('🛠️ HERRAMIENTAS DE REPARACIÓN METEOROLÓGICA CARGADAS');
console.log('====================================================');
console.log('');
console.log('🚀 REPARACIÓN: await repararServicioMeteorologico()');
console.log('📊 ESTADO: verificarEstadoMeteorologico()');
console.log('');
console.log('💡 Esto debería solucionar el problema sin necesidad de recargar la página');
