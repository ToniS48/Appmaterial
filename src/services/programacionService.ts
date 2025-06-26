// Crear un nuevo servicio para manejar tareas programadas

// Iniciar las tareas programadas
export const iniciarTareasProgramadas = (): void => {
  try {
    // Tarea para recordatorios de devolución
    setInterval(async () => {
      try {
        // await enviarRecordatorioDevolucion(2); // 2 días antes - comentado por ahora
      } catch (error) {
        console.error('Error en tarea programada de recordatorios:', error);
      }
    }, 24 * 60 * 60 * 1000); // Ejecutar cada 24 horas
    
    // También ejecutarlo al iniciar la app
    setTimeout(async () => {
      try {
        // await enviarRecordatorioDevolucion(2); - comentado por ahora
      } catch (error) {
        console.error('Error al enviar recordatorio inicial:', error);
      }
    }, 5000); // Esperar 5 segundos después de iniciar la app
  } catch (error) {
    console.error('Error al inicializar tareas programadas:', error);
  }
};
