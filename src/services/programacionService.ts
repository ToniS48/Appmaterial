// Crear un nuevo servicio para manejar tareas programadas

import { enviarRecordatorioDevolucion } from './notificacionService';

// Iniciar las tareas programadas
export const iniciarTareasProgramadas = () => {
  // Verificar si estamos en el cliente (en el navegador)
  if (typeof window !== 'undefined') {
    // Programar recordatorios de devolución para ejecutarse diariamente
    setInterval(async () => {
      try {
        await enviarRecordatorioDevolucion(2); // 2 días antes
      } catch (error) {
        console.error('Error en tarea programada de recordatorios:', error);
      }
    }, 24 * 60 * 60 * 1000); // Ejecutar cada 24 horas
    
    // También ejecutarlo al iniciar la app
    setTimeout(async () => {
      try {
        await enviarRecordatorioDevolucion(2);
      } catch (error) {
        console.error('Error al enviar recordatorio inicial:', error);
      }
    }, 5000); // Esperar 5 segundos después de iniciar la app
  }
};