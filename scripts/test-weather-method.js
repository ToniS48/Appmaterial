// 🧪 TEST DIRECTO del método get7DayForecastForActivity
// Copiar y pegar en la consola del navegador DESPUÉS de recargar la página

console.log('🧪 TESTING DIRECTO: get7DayForecastForActivity');

// Función para probar directamente el método
window.testWeatherMethod = async () => {
  if (!window.weatherService) {
    console.log('❌ weatherService no disponible');
    return;
  }
  
  console.log('🌤️ Probando get7DayForecastForActivity...');
  
  // Usar fecha de mañana para test
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  try {
    const result = await window.weatherService.get7DayForecastForActivity(
      tomorrow,
      'Madrid, España',
      tomorrow
    );
    
    console.log('✅ Resultado del test:', {
      length: result?.length || 0,
      data: result?.slice(0, 2) // Solo primeros 2 elementos
    });
    
    if (result && result.length > 0) {
      console.log('🎉 ¡FUNCIONÓ! Los datos meteorológicos se obtienen correctamente');
      console.log('📋 Primer elemento:', result[0]);
    } else {
      console.log('❌ No se obtuvieron datos meteorológicos');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error en el test:', error);
    return null;
  }
};

// Función para probar getWeatherForecast directamente  
window.testBasicWeatherMethod = async () => {
  if (!window.weatherService) {
    console.log('❌ weatherService no disponible');
    return;
  }
  
  console.log('🌤️ Probando getWeatherForecast básico...');
  
  try {
    const result = await window.weatherService.getWeatherForecast('Madrid, España', 7);
    
    console.log('✅ Resultado del test básico:', {
      hasData: !!result,
      hasDaily: !!(result?.daily),
      dailyLength: result?.daily?.length || 0,
      data: result
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Error en el test básico:', error);
    return null;
  }
};

console.log('📋 Funciones de test disponibles:');
console.log('   - testWeatherMethod() - Test completo get7DayForecastForActivity');
console.log('   - testBasicWeatherMethod() - Test básico getWeatherForecast');

console.log('\n🚀 Ejecutar: await testWeatherMethod()');
console.log('🚀 Ejecutar: await testBasicWeatherMethod()');
