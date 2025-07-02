// Debug específico para tarjetas de actividades y pronósticos meteorológicos
// Ejecutar en la consola del navegador

console.log('🔍 Iniciando debug de tarjetas de actividades...');

// Función para debug de actividades y clima
async function debugActividadesClima() {
  try {
    console.log('📋 Estado del servicio meteorológico:');
    if (window.weatherService) {
      console.log('- Servicio habilitado:', window.weatherService.isEnabled());
      console.log('- Configuración:', window.weatherService.getConfig());
    } else {
      console.log('❌ weatherService no disponible en window');
    }

    console.log('\n📅 Verificando actividades en la página...');
    
    // Buscar elementos de actividades en el DOM
    const activityCards = document.querySelectorAll('[data-testid*="actividad"], .actividad-card, [class*="actividad"]');
    console.log(`- Encontradas ${activityCards.length} tarjetas de actividades en el DOM`);

    // Buscar componentes weather específicos
    const weatherComponents = document.querySelectorAll('[class*="weather"], [data-testid*="weather"]');
    console.log(`- Encontrados ${weatherComponents.length} componentes weather en el DOM`);

    // Buscar iconos weather
    const weatherIcons = document.querySelectorAll('[data-icon*="cloud"], [data-icon*="sun"], [data-icon*="rain"]');
    console.log(`- Encontrados ${weatherIcons.length} iconos weather en el DOM`);

    return {
      activityCards: activityCards.length,
      weatherComponents: weatherComponents.length,
      weatherIcons: weatherIcons.length
    };

  } catch (error) {
    console.error('❌ Error en debug:', error);
    return null;
  }
}

// Función para simular datos de prueba
async function testWeatherDataDisplay() {
  console.log('\n🧪 Probando visualización de datos meteorológicos...');
  
  // Datos de prueba
  const testWeatherData = [
    {
      date: new Date().toISOString(),
      condition: 'clear',
      description: 'Soleado',
      temperature: { min: 15, max: 25 },
      precipitation: 0,
      windSpeed: 5
    },
    {
      date: new Date(Date.now() + 86400000).toISOString(),
      condition: 'rain',
      description: 'Lluvia ligera',
      temperature: { min: 12, max: 18 },
      precipitation: 5,
      windSpeed: 10
    }
  ];

  console.log('- Datos de prueba creados:', testWeatherData);
  
  // Intentar crear elemento de prueba
  try {
    const testDiv = document.createElement('div');
    testDiv.innerHTML = `
      <div style="position: fixed; top: 10px; right: 10px; background: white; border: 2px solid blue; padding: 10px; z-index: 9999;">
        <h4>🧪 Prueba Weather Component</h4>
        <div id="test-weather-container">Cargando...</div>
      </div>
    `;
    document.body.appendChild(testDiv);
    
    console.log('- Elemento de prueba añadido al DOM');
    
    setTimeout(() => {
      document.body.removeChild(testDiv);
    }, 5000);
    
  } catch (error) {
    console.error('Error creando elemento de prueba:', error);
  }
}

// Ejecutar debug automáticamente
debugActividadesClima().then(result => {
  console.log('\n📊 Resultado del debug:', result);
  
  if (result && result.activityCards > 0 && result.weatherComponents === 0) {
    console.log('⚠️  PROBLEMA DETECTADO: Hay tarjetas de actividades pero no componentes weather');
    console.log('💡 Posibles causas:');
    console.log('   1. shouldShowWeather está devolviendo false');
    console.log('   2. El hook use7DayWeather no está retornando datos');
    console.log('   3. WeatherCompactPreview no se está renderizando');
    console.log('   4. Error en el servicio meteorológico');
  } else if (result && result.activityCards === 0) {
    console.log('ℹ️  No se encontraron tarjetas de actividades en esta página');
  } else if (result && result.weatherComponents > 0) {
    console.log('✅ Se encontraron componentes weather en la página');
  }
});

// Exponer funciones para uso manual
window.debugActividadesClima = debugActividadesClima;
window.testWeatherDataDisplay = testWeatherDataDisplay;

console.log('✅ Script de debug cargado. Funciones disponibles:');
console.log('   - debugActividadesClima()');
console.log('   - testWeatherDataDisplay()');
