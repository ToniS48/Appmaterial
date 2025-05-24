/**
 * Script de utilidad para ejecutar pruebas automatizadas de rendimiento
 * y detectar posibles violaciones del scheduler
 */

// Importamos el módulo de performance monitor
const { performanceMonitor } = require('../utils/performanceMonitor');

// Constantes para la configuración
const TEST_DURATION_MS = 10000; // 10 segundos de prueba
const REPORT_INTERVAL_MS = 2000; // Reporte cada 2 segundos

/**
 * Función principal de prueba
 */
async function runPerformanceTest() {
  console.log('Iniciando prueba de rendimiento...');
  console.log('Presiona Ctrl+C para detener');
  
  // Iniciar monitor de rendimiento
  performanceMonitor.start({
    logToConsole: true,
    onViolation: (violation) => {
      console.log(`[${new Date().toISOString()}] Violación detectada: ${violation.type} - ${violation.duration}ms`);
    }
  });
  
  // Configurar intervalo para mostrar estadísticas periódicas
  const intervalId = setInterval(() => {
    const stats = performanceMonitor.getViolationSummary();
    console.log('\n--- Estadísticas actuales ---');
    console.log(`Violaciones: ${stats.count}`);
    if (stats.count > 0) {
      console.log(`Duración promedio: ${stats.averageDuration.toFixed(2)}ms`);
      console.log(`Duración máxima: ${stats.maxDuration.toFixed(2)}ms`);
      console.log('Tipos:', Object.entries(stats.byType).map(([k, v]) => `${k}: ${v}`).join(', '));
    }
  }, REPORT_INTERVAL_MS);
  
  // Detener automáticamente después del tiempo configurado
  setTimeout(() => {
    clearInterval(intervalId);
    performanceMonitor.stop();
    
    // Mostrar resumen final
    const finalStats = performanceMonitor.getViolationSummary();
    console.log('\n===== RESUMEN FINAL =====');
    console.log(`Total violaciones: ${finalStats.count}`);
    if (finalStats.count > 0) {
      console.log(`Duración promedio: ${finalStats.averageDuration.toFixed(2)}ms`);
      console.log(`Duración máxima: ${finalStats.maxDuration.toFixed(2)}ms`);
      console.log('Tipos:', Object.entries(finalStats.byType).map(([k, v]) => `${k}: ${v}`).join(', '));
    } else {
      console.log('¡No se detectaron violaciones! Las optimizaciones están funcionando correctamente.');
    }
    
    process.exit(0);
  }, TEST_DURATION_MS);
}

// Ejecutar la prueba si se invoca directamente
if (require.main === module) {
  runPerformanceTest();
}

// Exportar para uso en otros scripts
module.exports = {
  runPerformanceTest
};
