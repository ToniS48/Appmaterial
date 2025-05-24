/**
 * Este archivo contiene pruebas manuales para verificar el rendimiento
 * del componente MaterialSelector antes y después de las optimizaciones.
 * 
 * Esta prueba debe ejecutarse en la consola del navegador mientras
 * se visualiza el componente MaterialSelector.
 */

(function() {
  console.log('Iniciando pruebas de rendimiento para MaterialSelector...');
  
  // Medir eventos de clic y sus tiempos de respuesta
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const clickEvents = [];
  const violationMessages = [];
  
  // Monitorear violaciones de tiempo
  const observer = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'longtask' || entry.name === 'longtask') {
        violationMessages.push({
          time: new Date().toISOString(),
          duration: entry.duration,
          name: entry.name
        });
        console.warn(`[VIOLATION] Tarea larga detectada: ${entry.duration.toFixed(2)}ms`);
      }
    }
  });
  
  try {
    // Observar tareas largas (bloqueos de UI)
    observer.observe({ entryTypes: ['longtask'] });
    
    // Interceptar eventos de clic
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === 'click') {
        const wrappedListener = function(event) {
          const start = performance.now();
          const result = listener.apply(this, arguments);
          const end = performance.now();
          clickEvents.push({
            target: event.target.tagName,
            time: new Date().toISOString(),
            duration: end - start
          });
          return result;
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    // Función para imprimir estadísticas después de un tiempo
    setTimeout(() => {
      console.log('=== Resultados de prueba de MaterialSelector ===');
      console.log(`Total eventos click monitoreados: ${clickEvents.length}`);
      
      if (clickEvents.length > 0) {
        const totalDuration = clickEvents.reduce((sum, event) => sum + event.duration, 0);
        const avgDuration = totalDuration / clickEvents.length;
        const maxDuration = Math.max(...clickEvents.map(event => event.duration));
        
        console.log(`Duración promedio de handlers: ${avgDuration.toFixed(2)}ms`);
        console.log(`Duración máxima de handlers: ${maxDuration.toFixed(2)}ms`);
      }
      
      console.log(`Total violaciones de tiempo: ${violationMessages.length}`);
      
      if (violationMessages.length > 0) {
        const totalViolationDuration = violationMessages.reduce((sum, msg) => sum + msg.duration, 0);
        console.log(`Duración total de violaciones: ${totalViolationDuration.toFixed(2)}ms`);
        
        // Violaciones recientes (últimos 30 segundos)
        const recentTime = Date.now() - 30000;
        const recentViolations = violationMessages.filter(
          msg => new Date(msg.time).getTime() > recentTime
        );
        console.log(`Violaciones en los últimos 30 segundos: ${recentViolations.length}`);
      }
      
      console.log('=== Fin de resultados ===');
    }, 60000); // Monitorear durante 1 minuto
    
    console.log('Prueba de rendimiento iniciada. Se mostrarán resultados en 60 segundos.');
  } catch (error) {
    console.error('Error al configurar prueba de rendimiento:', error);
  }
})();
