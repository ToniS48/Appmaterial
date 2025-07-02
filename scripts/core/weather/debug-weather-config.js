// Debug script para ejecutar en la consola del navegador
// Copia y pega esto en la consola de DevTools mientras estás en la aplicación

(async function debugWeatherConfig() {
  console.log('🔍 === DEBUG CONFIGURACIÓN METEOROLÓGICA ===');
  
  try {
    // Verificar Firebase
    if (!window.firebase || !window.firebase.firestore) {
      console.error('❌ Firebase no está disponible');
      return;
    }
    
    const db = window.firebase.firestore.getFirestore();
    
    // 1. Verificar documento de variables
    console.log('\n1️⃣ Verificando documento de variables...');
    const variablesRef = window.firebase.firestore.doc(db, 'configuracion', 'variables');
    const variablesSnap = await window.firebase.firestore.getDoc(variablesRef);
    
    if (variablesSnap.exists()) {
      const variablesData = variablesSnap.data();
      console.log('✅ Variables encontradas:', variablesData);
      console.log('📋 Weather fields:', {
        weatherEnabled: variablesData.weatherEnabled,
        aemetEnabled: variablesData.aemetEnabled,
        aemetUseForSpain: variablesData.aemetUseForSpain,
        temperatureUnit: variablesData.temperatureUnit,
        windSpeedUnit: variablesData.windSpeedUnit,
        precipitationUnit: variablesData.precipitationUnit
      });
    } else {
      console.log('❌ Documento de variables no existe');
    }
    
    // 2. Verificar documento de APIs
    console.log('\n2️⃣ Verificando documento de APIs...');
    const apisRef = window.firebase.firestore.doc(db, 'configuracion', 'apis');
    const apisSnap = await window.firebase.firestore.getDoc(apisRef);
    
    if (apisSnap.exists()) {
      const apisData = apisSnap.data();
      console.log('✅ APIs encontradas:', apisData);
      console.log('📋 Weather API fields:', {
        weatherApiUrl: apisData.weatherApiUrl,
        aemetApiKey: apisData.aemetApiKey ? '***OCULTA***' : 'VACÍA'
      });
    } else {
      console.log('❌ Documento de APIs no existe');
    }
    
    // 3. Inicializar campos faltantes si es necesario
    if (!variablesSnap.exists() || typeof variablesSnap.data().weatherEnabled === 'undefined') {
      console.log('\n3️⃣ Inicializando campos meteorológicos faltantes...');
      
      const defaultWeatherVariables = {
        weatherEnabled: false,
        aemetEnabled: false,
        aemetUseForSpain: false,
        temperatureUnit: 'celsius',
        windSpeedUnit: 'kmh',
        precipitationUnit: 'mm'
      };
      
      await window.firebase.firestore.setDoc(variablesRef, defaultWeatherVariables, { merge: true });
      console.log('✅ Campos meteorológicos inicializados en variables');
    }
    
    if (!apisSnap.exists() || typeof apisSnap.data().weatherApiUrl === 'undefined') {
      console.log('\n🔧 Inicializando APIs meteorológicas faltantes...');
      
      const defaultWeatherApis = {
        weatherApiUrl: 'https://api.open-meteo.com/v1/forecast',
        aemetApiKey: ''
      };
      
      await window.firebase.firestore.setDoc(apisRef, defaultWeatherApis, { merge: true });
      console.log('✅ APIs meteorológicas inicializadas');
    }
    
    console.log('\n🎉 Debug completado. Recarga la página si se inicializaron campos nuevos.');
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
})();
