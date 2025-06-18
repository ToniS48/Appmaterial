/**
 * Script de testing para AEMET desde consola del navegador
 * Copiar y pegar en la consola de DevTools para probar AEMET
 */

// Configuración de ciudades españolas para testing
const SPANISH_CITIES = [
  { name: 'Madrid', lat: 40.4168, lon: -3.7038, region: 'Centro' },
  { name: 'Barcelona', lat: 41.3851, lon: 2.1734, region: 'Cataluña' },
  { name: 'Valencia', lat: 39.4699, lon: -0.3763, region: 'Valencia' },
  { name: 'Sevilla', lat: 37.3891, lon: -5.9845, region: 'Andalucía' },
  { name: 'Bilbao', lat: 43.2627, lon: -2.9253, region: 'País Vasco' },
  { name: 'Zaragoza', lat: 41.6488, lon: -0.8891, region: 'Aragón' },
  { name: 'Málaga', lat: 36.7213, lon: -4.4217, region: 'Andalucía' },
  { name: 'Las Palmas', lat: 28.1, lon: -15.4167, region: 'Canarias' },
  { name: 'Palma', lat: 39.5696, lon: 2.6502, region: 'Baleares' },
  { name: 'Santander', lat: 43.4647, lon: -3.8044, region: 'Cantabria' }
];

// Función para probar AEMET específicamente
async function testAEMET() {
  console.log('🇪🇸 ========== TESTING AEMET ========== 🇪🇸');
  console.log('📅 Fecha:', new Date().toLocaleString());
  
  // Verificar que el servicio esté disponible
  if (typeof window.weatherService === 'undefined') {
    console.error('❌ weatherService no está disponible en window');
    console.log('💡 Asegúrate de que la aplicación esté cargada completamente');
    return;
  }
  
  console.log('✅ Servicio meteorológico disponible');
  
  // Verificar configuración
  const config = window.weatherService.getConfig();
  console.log('🔧 Configuración actual:', config);
  
  if (!config.enabled) {
    console.warn('⚠️ El servicio meteorológico está DESHABILITADO');
    console.log('💡 Ir a Configuración → Clima para habilitarlo');
    return;
  }
  
  if (!config.aemet.enabled) {
    console.warn('⚠️ AEMET está DESHABILITADO');
    console.log('💡 Ir a Configuración → Clima → Habilitar AEMET');
    return;
  }
  
  if (!config.aemet.apiKey) {
    console.warn('⚠️ No hay API Key de AEMET configurada');
    console.log('💡 Obtener API key en: https://opendata.aemet.es/centrodedescargas/inicio');
    return;
  }
  
  console.log('✅ AEMET habilitado con API Key');
  
  // Probar ciudades españolas
  console.log('🌍 Iniciando pruebas por ciudades...');
  const results = [];
  
  for (let i = 0; i < SPANISH_CITIES.length; i++) {
    const city = SPANISH_CITIES[i];
    
    console.log(`\n🏙️ [${i + 1}/${SPANISH_CITIES.length}] Probando ${city.name} (${city.region})...`);
    
    try {
      const startTime = Date.now();
      const forecast = await window.weatherService.getWeatherForecast(city, 3);
      const duration = Date.now() - startTime;
      
      if (forecast) {
        console.log(`✅ ${city.name}: Datos obtenidos en ${duration}ms`);
        console.log(`   📊 ${forecast.daily.length} días de pronóstico`);
        
        if (forecast.current) {
          console.log(`   🌡️ Temperatura actual: ${forecast.current.temperature.current}°C`);
        }
        
        if (forecast.daily[0]) {
          const today = forecast.daily[0];
          console.log(`   📈 Hoy: ${today.temperature.min}° - ${today.temperature.max}°C | ${today.description}`);
        }
        
        results.push({
          city: city.name,
          region: city.region,
          success: true,
          duration,
          daysCount: forecast.daily.length,
          currentTemp: forecast.current?.temperature.current
        });
      } else {
        console.log(`❌ ${city.name}: No se obtuvieron datos`);
        results.push({
          city: city.name,
          region: city.region,
          success: false,
          duration,
          error: 'No data received'
        });
      }
      
    } catch (error) {
      console.error(`💥 ${city.name}: Error -`, error.message);
      results.push({
        city: city.name,
        region: city.region,
        success: false,
        duration: Date.now() - Date.now(),
        error: error.message
      });
    }
    
    // Pausa entre peticiones para no saturar la API
    if (i < SPANISH_CITIES.length - 1) {
      console.log('⏳ Esperando 1s antes de la siguiente petición...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Resumen de resultados
  console.log('\n🇪🇸 ========== RESUMEN DE RESULTADOS ========== 🇪🇸');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Exitosas: ${successful.length}/${results.length}`);
  console.log(`❌ Fallidas: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    console.log(`⏱️ Tiempo promedio: ${Math.round(avgDuration)}ms`);
  }
  
  // Resultados por región
  const regions = {};
  results.forEach(r => {
    if (!regions[r.region]) regions[r.region] = { success: 0, total: 0 };
    regions[r.region].total++;
    if (r.success) regions[r.region].success++;
  });
  
  console.log('\n📍 Resultados por región:');
  Object.entries(regions).forEach(([region, data]) => {
    const percentage = Math.round((data.success / data.total) * 100);
    console.log(`   ${region}: ${data.success}/${data.total} (${percentage}%)`);
  });
  
  // Errores comunes
  if (failed.length > 0) {
    console.log('\n🚨 Errores encontrados:');
    const errorTypes = {};
    failed.forEach(r => {
      const errorType = r.error || 'Unknown error';
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
    });
    
    Object.entries(errorTypes).forEach(([error, count]) => {
      console.log(`   • ${error}: ${count} veces`);
    });
  }
  
  // Recomendaciones
  console.log('\n💡 Recomendaciones:');
  
  if (successful.length === 0) {
    console.log('   🔧 Verificar configuración de AEMET');
    console.log('   🔑 Comprobar que la API Key es válida');
    console.log('   🌐 Revisar conexión a internet');
  } else if (successful.length < results.length) {
    console.log('   ⚡ Algunas ciudades fallaron - normal con AEMET');
    console.log('   📱 El fallback a Open-Meteo debería funcionar');
  } else {
    console.log('   🎉 ¡AEMET funcionando perfectamente!');
    console.log('   🚀 Listo para uso en producción');
  }
  
  console.log('\n🔗 Enlaces útiles:');
  console.log('   📊 Panel de AEMET: https://opendata.aemet.es/centrodedescargas/inicio');
  console.log('   ⚙️ Configuración: http://localhost:3000/admin/settings');
  console.log('   📝 Documentación: Ver docs/TESTING-AEMET-GUIA-COMPLETA.md');
  
  return results;
}

// Función auxiliar para probar solo una ciudad
async function testCity(cityName) {
  const city = SPANISH_CITIES.find(c => 
    c.name.toLowerCase().includes(cityName.toLowerCase())
  );
  
  if (!city) {
    console.error(`❌ Ciudad "${cityName}" no encontrada`);
    console.log('🏙️ Ciudades disponibles:', SPANISH_CITIES.map(c => c.name).join(', '));
    return;
  }
  
  console.log(`🔍 Probando solo ${city.name}...`);
  
  try {
    const forecast = await window.weatherService.getWeatherForecast(city, 5);
    
    if (forecast) {
      console.log(`✅ ${city.name}: Datos obtenidos exitosamente`);
      console.log('📊 Pronóstico:', forecast);
      return forecast;
    } else {
      console.log(`❌ ${city.name}: No se obtuvieron datos`);
      return null;
    }
    
  } catch (error) {
    console.error(`💥 ${city.name}: Error -`, error);
    return null;
  }
}

// Función para verificar solo el estado
function checkAemetStatus() {
  console.log('🔍 Verificando estado de AEMET...');
  
  if (typeof window.weatherService === 'undefined') {
    console.error('❌ weatherService no disponible');
    return false;
  }
  
  const config = window.weatherService.getConfig();
  
  console.log('⚙️ Estado del servicio:', config.enabled ? '✅ Habilitado' : '❌ Deshabilitado');
  console.log('🇪🇸 Estado de AEMET:', config.aemet.enabled ? '✅ Habilitado' : '❌ Deshabilitado');
  console.log('🔑 API Key:', config.aemet.apiKey ? '✅ Configurada' : '❌ Falta');
  console.log('🌍 Usar para España:', config.aemet.useForSpain ? '✅ Sí' : '❌ No');
  
  return config.enabled && config.aemet.enabled && config.aemet.apiKey;
}

// Exponer funciones globalmente para fácil acceso
window.testAEMET = testAEMET;
window.testCity = testCity;
window.checkAemetStatus = checkAemetStatus;

console.log('🇪🇸 Scripts de testing AEMET cargados!');
console.log('📋 Funciones disponibles:');
console.log('   • testAEMET() - Test completo de todas las ciudades');
console.log('   • testCity("Madrid") - Test de una ciudad específica');
console.log('   • checkAemetStatus() - Verificar configuración');
console.log('');
console.log('💡 Para empezar: testAEMET()');
