/**
 * Script de diagnóstico y corrección para configuración meteorológica
 * Copiar y pegar en la consola del navegador
 */

window.diagnosticoMeteorologico = async () => {
  console.log('🌤️ DIAGNÓSTICO: Configuración Meteorológica');
  console.log('=============================================\n');

  try {
    // 1. Verificar estado actual en Firestore
    console.log('1️⃣ LEYENDO DESDE FIRESTORE...');
    
    // Usar las funciones que ya están expuestas en la app
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../src/config/firebase');
    
    const weatherDocRef = doc(db, 'configuracion', 'weather');
    const weatherDocSnap = await getDoc(weatherDocRef);
    
    if (weatherDocSnap.exists()) {
      const data = weatherDocSnap.data();
      console.log('✅ Documento de configuración meteorológica encontrado:');
      console.log('📋 Datos actuales:', data);
      console.log('🎯 weatherEnabled:', data.weatherEnabled);
      console.log('🎯 aemetEnabled:', data.aemetEnabled);
      console.log('🎯 aemetUseForSpain:', data.aemetUseForSpain);
      
      // Analizar el problema
      if (!data.weatherEnabled && !data.aemetEnabled) {
        console.log('\n⚠️ PROBLEMA DETECTADO: Servicios meteorológicos deshabilitados');
        console.log('💡 Usar: await solucionarProblema() para corregir automáticamente');
      } else if (data.weatherEnabled && !data.aemetEnabled) {
        console.log('\n⚠️ SERVICIO METEOROLÓGICO HABILITADO pero AEMET deshabilitado');
        console.log('💡 Usar: await habilitarAemet() para habilitar AEMET');
      } else if (data.weatherEnabled && data.aemetEnabled) {
        console.log('\n✅ CONFIGURACIÓN CORRECTA - Servicios habilitados');
        console.log('💡 Si aún no funciona, usar: await forzarRecarga()');
      }
    } else {
      console.log('❌ No existe documento de configuración meteorológica');
      console.log('💡 Usar: await crearConfiguracion() para crear configuración inicial');
    }
    
    // 2. Verificar API Keys
    console.log('\n2️⃣ VERIFICANDO API KEYS...');
    
    const apisDocRef = doc(db, 'configuracion', 'apis');
    const apisDocSnap = await getDoc(apisDocRef);
    
    if (apisDocSnap.exists()) {
      const apisData = apisDocSnap.data();
      console.log('✅ Documento de APIs encontrado');
      console.log('🔑 API key de AEMET:', apisData.aemetApiKey ? 'Presente' : 'Ausente');
      
      if (!apisData.aemetApiKey) {
        console.log('⚠️ FALTA API KEY DE AEMET');
        console.log('💡 Ve a Configuración → APIs para configurar la API key');
      }
    } else {
      console.log('❌ No existe documento de APIs');
      console.log('💡 Ve a Configuración → APIs para configurar las APIs');
    }
    
    // 3. Comprobar servicio meteorológico en memoria
    console.log('\n3️⃣ VERIFICANDO SERVICIO EN MEMORIA...');
    
    if (window.weatherService) {
      console.log('✅ weatherService disponible globalmente');
      console.log('🎯 isEnabled():', window.weatherService.isEnabled());
      console.log('🎯 getConfig():', window.weatherService.getConfig());
    } else {
      console.log('❌ weatherService no disponible globalmente');
      console.log('💡 El servicio se expondrá después de habilitarlo');
    }
    
    // 4. Funciones de corrección disponibles
    console.log('\n4️⃣ FUNCIONES DE CORRECCIÓN DISPONIBLES:');
    console.log('• await solucionarProblema() - Corrección automática completa');
    console.log('• await crearConfiguracion() - Crear configuración inicial');
    console.log('• await habilitarMeteorologico() - Solo habilitar servicio meteorológico');
    console.log('• await habilitarAemet() - Solo habilitar AEMET');
    console.log('• await forzarRecarga() - Forzar recarga del servicio');
    console.log('• await verificarConfiguracion() - Ver configuración actual');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    console.log('💡 Asegúrate de estar en la página de Material App');
  }
};

// Función de corrección automática completa
window.solucionarProblema = async () => {
  try {
    console.log('🔧 SOLUCIONANDO PROBLEMA AUTOMÁTICAMENTE...');
    console.log('==========================================\n');
    
    const { getFirestore, doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('../src/config/firebase');
    
    // 1. Crear/actualizar configuración meteorológica
    console.log('1️⃣ Habilitando configuración meteorológica...');
    await setDoc(doc(db, 'configuracion', 'weather'), {
      weatherEnabled: true,
      aemetEnabled: true,
      aemetUseForSpain: true,
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      precipitationUnit: 'mm',
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('✅ Configuración meteorológica habilitada');
    
    // 2. Verificar que se guardó correctamente
    console.log('\n2️⃣ Verificando que se guardó...');
    const weatherDocRef = doc(db, 'configuracion', 'weather');
    const weatherDocSnap = await getDoc(weatherDocRef);
    
    if (weatherDocSnap.exists()) {
      const data = weatherDocSnap.data();
      console.log('✅ Configuración verificada:', {
        weatherEnabled: data.weatherEnabled,
        aemetEnabled: data.aemetEnabled,
        aemetUseForSpain: data.aemetUseForSpain
      });
    }
    
    console.log('\n✅ PROBLEMA SOLUCIONADO');
    console.log('======================');
    console.log('💡 RECARGA LA PÁGINA para ver los cambios');
    console.log('💡 Ve a Configuración → APIs para configurar la API key de AEMET si no la tienes');
    
  } catch (error) {
    console.error('❌ Error solucionando problema:', error);
  }
};

// Función para crear configuración inicial
window.crearConfiguracion = async () => {
  try {
    console.log('📝 Creando configuración inicial...');
    
    const { getFirestore, doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('../src/config/firebase');
    
    await setDoc(doc(db, 'configuracion', 'weather'), {
      weatherEnabled: false,
      aemetEnabled: false,
      aemetUseForSpain: false,
      temperatureUnit: 'celsius',
      windSpeedUnit: 'kmh',
      precipitationUnit: 'mm',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Configuración inicial creada');
    console.log('💡 Usa await habilitarMeteorologico() para habilitar');
    
  } catch (error) {
    console.error('❌ Error creando configuración:', error);
  }
};

// Función para habilitar servicio meteorológico
window.habilitarMeteorologico = async () => {
  try {
    console.log('🔄 Habilitando servicio meteorológico...');
    
    const { getFirestore, doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('../src/config/firebase');
    
    await setDoc(doc(db, 'configuracion', 'weather'), {
      weatherEnabled: true,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('✅ Servicio meteorológico habilitado');
    console.log('💡 Recarga la página para ver los cambios');
    
  } catch (error) {
    console.error('❌ Error habilitando servicio:', error);
  }
};

// Función para habilitar AEMET
window.habilitarAemet = async () => {
  try {
    console.log('🔄 Habilitando AEMET...');
    
    const { getFirestore, doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('../src/config/firebase');
    
    await setDoc(doc(db, 'configuracion', 'weather'), {
      weatherEnabled: true,
      aemetEnabled: true,
      aemetUseForSpain: true,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('✅ AEMET habilitado');
    console.log('💡 Recarga la página para ver los cambios');
    
  } catch (error) {
    console.error('❌ Error habilitando AEMET:', error);
  }
};

// Función para forzar recarga del servicio
window.forzarRecarga = async () => {
  try {
    console.log('🔄 Forzando recarga del servicio meteorológico...');
    
    if (window.weatherService) {
      // Si el servicio está disponible, reconfigurar
      const { obtenerConfiguracionMeteorologica } = await import('../src/services/configuracionService');
      const config = await obtenerConfiguracionMeteorologica();
      await window.weatherService.configure(config);
      console.log('✅ Servicio reconfigurado');
      console.log('🎯 Nuevo estado:', window.weatherService.isEnabled());
    } else {
      console.log('⚠️ Servicio no disponible, recarga la página');
    }
    
  } catch (error) {
    console.error('❌ Error forzando recarga:', error);
  }
};

// Función para verificar configuración
window.verificarConfiguracion = async () => {
  try {
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../src/config/firebase');
    
    const weatherDocRef = doc(db, 'configuracion', 'weather');
    const weatherDocSnap = await getDoc(weatherDocRef);
    
    if (weatherDocSnap.exists()) {
      console.log('📋 Configuración actual:', weatherDocSnap.data());
    } else {
      console.log('❌ No hay configuración guardada');
    }
  } catch (error) {
    console.error('❌ Error verificando:', error);
  }
};

console.log('🛠️ HERRAMIENTAS DE DIAGNÓSTICO METEOROLÓGICO CARGADAS');
console.log('===================================================');
console.log('✨ VERSIÓN MEJORADA con corrección automática');
console.log('');
console.log('🚀 CORRECCIÓN RÁPIDA: await solucionarProblema()');
console.log('🔍 DIAGNÓSTICO: await diagnosticoMeteorologico()');
console.log('');
console.log('Todas las funciones disponibles:');
console.log('• await diagnosticoMeteorologico() - Diagnóstico completo');
console.log('• await solucionarProblema() - Corrección automática');
console.log('• await crearConfiguracion() - Crear configuración inicial');
console.log('• await habilitarMeteorologico() - Habilitar servicio');
console.log('• await habilitarAemet() - Habilitar AEMET');
console.log('• await forzarRecarga() - Forzar recarga');
console.log('• await verificarConfiguracion() - Ver configuración');
