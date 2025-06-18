/**
 * Script de prueba para el complemento meteorológico
 * Ejecutar en la consola del navegador después de configurar la API key
 */

console.log('🌤️ INICIANDO PRUEBAS DEL COMPLEMENTO METEOROLÓGICO');

// Función para probar el servicio meteorológico
async function probarServicioMeteorologico() {
  console.log('\n📡 Probando conexión con OpenWeatherMap...');
  
  try {
    // Importar el servicio (adaptar según el contexto de ejecución)
    const { weatherService } = await import('../src/services/weatherService.ts');
    
    // Verificar si está habilitado
    if (!weatherService.isEnabled()) {
      console.log('❌ El servicio meteorológico no está habilitado');
      console.log('💡 Ve a Configuración → Clima para habilitarlo');
      return;
    }
    
    console.log('✅ Servicio habilitado');
    
    // Probar obtención de pronóstico
    console.log('📊 Obteniendo pronóstico...');
    const forecast = await weatherService.getWeatherForecast();
    
    if (forecast) {
      console.log('✅ Pronóstico obtenido exitosamente:');
      console.log(`📍 Ubicación: ${forecast.location.name}`);
      console.log(`🗓️ Días disponibles: ${forecast.daily.length}`);
      
      // Mostrar primer día
      const today = forecast.daily[0];
      if (today) {
        console.log(`🌡️ Hoy: ${today.description}, ${today.temperature.min}°-${today.temperature.max}°C`);
        console.log(`💧 Humedad: ${today.humidity}%, Viento: ${today.windSpeed} km/h`);
      }
    } else {
      console.log('❌ No se pudo obtener el pronóstico');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Función para probar datos para una actividad simulada
async function probarActividadSimulada() {
  console.log('\n🎯 Probando pronóstico para actividad simulada...');
  
  try {
    const { weatherService } = await import('../src/services/weatherService.ts');
    
    if (!weatherService.isEnabled()) {
      console.log('❌ Servicio no habilitado');
      return;
    }
    
    // Crear actividad simulada para mañana
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    
    const weather = await weatherService.getWeatherForActivity(
      mañana,
      undefined,
      'Madrid, España'
    );
    
    if (weather.length > 0) {
      console.log('✅ Pronóstico para actividad simulada:');
      weather.forEach((day, index) => {
        console.log(`📅 Día ${index + 1}: ${day.description}, ${day.temperature.min}°-${day.temperature.max}°C`);
      });
    } else {
      console.log('⚠️ No hay datos meteorológicos para la actividad');
    }
    
  } catch (error) {
    console.error('❌ Error probando actividad:', error);
  }
}

// Función para verificar configuración
function verificarConfiguracion() {
  console.log('\n⚙️ Verificando configuración...');
  
  try {
    const { weatherService } = require('../src/services/weatherService.ts');
    const config = weatherService.getConfig();
    
    console.log('📋 Configuración actual:');
    console.log(`✅ Habilitado: ${config.enabled ? 'Sí' : 'No'}`);
    console.log(`🔑 API Key: ${config.apiKey ? '***configurada***' : 'No configurada'}`);
    console.log(`📍 Ubicación: ${config.defaultLocation.name}`);
    console.log(`🌐 Coordenadas: ${config.defaultLocation.lat}, ${config.defaultLocation.lon}`);
    
  } catch (error) {
    console.error('❌ Error verificando configuración:', error);
  }
}

// Función para limpiar cache
function limpiarCache() {
  console.log('\n🧹 Limpiando cache meteorológico...');
  
  try {
    const { weatherService } = require('../src/services/weatherService.ts');
    weatherService.clearCache();
    console.log('✅ Cache limpiado exitosamente');
  } catch (error) {
    console.error('❌ Error limpiando cache:', error);
  }
}

// Función principal para ejecutar todas las pruebas
async function ejecutarPruebas() {
  console.log('🚀 EJECUTANDO PRUEBAS COMPLETAS DEL COMPLEMENTO METEOROLÓGICO\n');
  
  verificarConfiguracion();
  await probarServicioMeteorologico();
  await probarActividadSimulada();
  limpiarCache();
  
  console.log('\n✅ PRUEBAS COMPLETADAS');
  console.log('\n💡 CONSEJOS:');
  console.log('- Si hay errores, verifica la API key en Configuración → Clima');
  console.log('- Los datos se actualizan cada 10 minutos automáticamente');
  console.log('- Solo se muestran pronósticos para actividades futuras (7 días máximo)');
}

// Exponer funciones globalmente para uso en consola
window.pruebasClima = {
  ejecutarPruebas,
  probarServicioMeteorologico,
  probarActividadSimulada,
  verificarConfiguracion,
  limpiarCache
};

console.log('📋 FUNCIONES DISPONIBLES:');
console.log('- pruebasClima.ejecutarPruebas() - Ejecutar todas las pruebas');
console.log('- pruebasClima.probarServicioMeteorologico() - Probar conexión con API');
console.log('- pruebasClima.verificarConfiguracion() - Ver configuración actual');
console.log('- pruebasClima.limpiarCache() - Limpiar cache');

// Ejecutar pruebas automáticamente al cargar
// ejecutarPruebas();
