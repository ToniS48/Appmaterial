/**
 * Script de debugging para verificar el estado del servicio meteorológico
 * Ejecutar en la consola del navegador cuando la aplicación esté corriendo
 */

console.log('🌤️ VERIFICANDO ESTADO DEL SERVICIO METEOROLÓGICO');

// Función para verificar el estado del servicio
async function verificarEstadoClima() {
  try {
    console.log('\n📡 Verificando configuración del servicio...');
    
    // Verificar si existe en el contexto global
    if (window.weatherService) {
      const service = window.weatherService;
      console.log('✅ Servicio encontrado en window.weatherService');
      console.log('🔧 Habilitado:', service.isEnabled());
      console.log('⚙️ Configuración:', service.getConfig());
    } else {
      console.log('❌ Servicio no encontrado en window.weatherService');
    }

    // Verificar localStorage para configuración
    console.log('\n💾 Verificando configuración en localStorage...');
    const configKeys = Object.keys(localStorage).filter(key => 
      key.includes('weather') || key.includes('clima') || key.includes('config')
    );
    
    if (configKeys.length > 0) {
      console.log('📋 Claves relacionadas encontradas:', configKeys);
      configKeys.forEach(key => {
        console.log(`🔑 ${key}:`, localStorage.getItem(key));
      });
    } else {
      console.log('❌ No se encontraron configuraciones de clima en localStorage');
    }

    // Verificar en Firebase (si está disponible)
    console.log('\n🔥 Verificando configuración en Firebase...');
    if (window.firebase && window.firebase.firestore) {
      try {
        const db = window.firebase.firestore();
        const configDoc = await db.collection('configuracion').doc('global').get();
        
        if (configDoc.exists) {
          const data = configDoc.data();
          console.log('📄 Configuración global encontrada');
          console.log('🌤️ Configuración de clima:', data.weather || 'No configurada');
        } else {
          console.log('❌ No se encontró documento de configuración global');
        }
      } catch (err) {
        console.log('⚠️ Error accediendo a Firebase:', err.message);
      }
    } else {
      console.log('❌ Firebase no disponible en el contexto global');
    }

  } catch (error) {
    console.error('❌ Error verificando estado:', error);
  }
}

// Función para probar datos meteorológicos para una actividad simulada
async function probarClimaMadrid() {
  try {
    console.log('\n🎯 Probando obtener clima para Madrid...');
    
    // Crear una actividad simulada para mañana
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    
    const respuesta = await fetch('https://api.open-meteo.com/v1/forecast?latitude=40.4168&longitude=-3.7038&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=1&timezone=Europe/Madrid');
    
    if (respuesta.ok) {
      const datos = await respuesta.json();
      console.log('✅ API Open-Meteo accesible');
      console.log('🌡️ Temperatura para mañana:', datos.daily?.temperature_2m_min?.[0], '°C -', datos.daily?.temperature_2m_max?.[0], '°C');
      console.log('☁️ Código meteorológico:', datos.daily?.weathercode?.[0]);
    } else {
      console.log('❌ No se pudo acceder a API Open-Meteo');
    }
    
  } catch (error) {
    console.error('❌ Error probando clima:', error);
  }
}

// Función para verificar si hay actividades con información meteorológica
function verificarActividadesConClima() {
  try {
    console.log('\n📅 Verificando actividades con información meteorológica...');
    
    // Buscar elementos con clase weather en el DOM
    const weatherElements = document.querySelectorAll('[class*="weather" i]');
    console.log('🌤️ Elementos relacionados con clima encontrados:', weatherElements.length);
    
    if (weatherElements.length > 0) {
      console.log('📋 Detalles:');
      weatherElements.forEach((el, index) => {
        console.log(`  ${index + 1}. ${el.tagName} - ${el.className}`);
      });
    }
    
    // Buscar actividades en el DOM
    const activityCards = document.querySelectorAll('[class*="card" i], [class*="actividad" i]');
    console.log('📇 Cards de actividades encontradas:', activityCards.length);
    
  } catch (error) {
    console.error('❌ Error verificando actividades:', error);
  }
}

// Función principal
async function ejecutarVerificacion() {
  await verificarEstadoClima();
  await probarClimaMadrid();
  verificarActividadesConClima();
  
  console.log('\n💡 RESUMEN:');
  console.log('1. Verifica que el servicio esté habilitado en Configuración → Clima');
  console.log('2. Asegúrate de que hay actividades futuras (próximos 15 días)');
  console.log('3. Las actividades deben tener estado "planificada" o "en_curso"');
  console.log('4. La información meteorológica aparece automáticamente en las cards');
}

// Exponer funciones globalmente
window.debugWeather = {
  verificarEstadoClima,
  probarClimaMadrid,
  verificarActividadesConClima,
  ejecutarVerificacion
};

console.log('\n🔧 Funciones disponibles:');
console.log('- debugWeather.ejecutarVerificacion()');
console.log('- debugWeather.verificarEstadoClima()');
console.log('- debugWeather.probarClimaMadrid()');
console.log('- debugWeather.verificarActividadesConClima()');

// Ejecutar verificación automáticamente
setTimeout(ejecutarVerificacion, 1000);
