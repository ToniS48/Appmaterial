import { verificarYNotificarRetrasos } from './actividadRetrasoService';

/**
 * Servicio para programar verificaciones automáticas de actividades con retraso
 */
class SchedulerService {
  private intervalos: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  /**
   * Inicializar el scheduler con verificaciones periódicas
   */
  init(): void {
    if (this.isInitialized) {
      console.log('🔄 Scheduler ya está inicializado');
      return;
    }

    console.log('🚀 Inicializando scheduler de verificación de retrasos...');

    // Verificación diaria a las 9:00 AM
    this.programarVerificacionDiaria();
    
    // Verificación cada 6 horas durante horario laboral
    this.programarVerificacionesPeriodicas();

    this.isInitialized = true;
    console.log('✅ Scheduler inicializado correctamente');
  }

  /**
   * Detener todas las verificaciones programadas
   */
  stop(): void {
    console.log('🛑 Deteniendo scheduler...');
    
    this.intervalos.forEach((intervalo, nombre) => {
      clearInterval(intervalo);
      console.log(`✅ Intervalo "${nombre}" detenido`);
    });
    
    this.intervalos.clear();
    this.isInitialized = false;
    console.log('✅ Scheduler detenido completamente');
  }

  /**
   * Verificación diaria programada
   */
  private programarVerificacionDiaria(): void {
    const ejecutarVerificacionDiaria = async () => {
      try {
        console.log('📅 Ejecutando verificación diaria de retrasos...');
        const actividadesConRetraso = await verificarYNotificarRetrasos();
        
        if (actividadesConRetraso.length > 0) {
          console.log(`⚠️ Verificación diaria: ${actividadesConRetraso.length} actividades con retraso detectadas`);
        } else {
          console.log('✅ Verificación diaria: No se encontraron actividades con retraso');
        }
      } catch (error) {
        console.error('❌ Error en verificación diaria:', error);
      }
    };

    // Calcular tiempo hasta las 9:00 AM del próximo día
    const ahora = new Date();
    const proximaEjecucion = new Date();
    proximaEjecucion.setHours(9, 0, 0, 0);
    
    // Si ya pasó la hora de hoy, programar para mañana
    if (proximaEjecucion <= ahora) {
      proximaEjecucion.setDate(proximaEjecucion.getDate() + 1);
    }
    
    const tiempoEspera = proximaEjecucion.getTime() - ahora.getTime();
    
    console.log(`⏰ Próxima verificación diaria programada para: ${proximaEjecucion.toLocaleString()}`);
    
    // Programar primera ejecución
    const timeoutId = setTimeout(() => {
      ejecutarVerificacionDiaria();
      
      // Programar ejecuciones diarias subsecuentes
      const intervalId = setInterval(ejecutarVerificacionDiaria, 24 * 60 * 60 * 1000);
      this.intervalos.set('verificacion-diaria', intervalId);
    }, tiempoEspera);

    // Guardar el timeout inicial
    this.intervalos.set('verificacion-diaria-inicial', timeoutId);
  }

  /**
   * Verificaciones cada 6 horas durante horario laboral (9-21h)
   */
  private programarVerificacionesPeriodicas(): void {
    const ejecutarVerificacionPeriodica = async () => {
      const ahora = new Date();
      const hora = ahora.getHours();
      
      // Solo ejecutar durante horario laboral extendido (9-21)
      if (hora >= 9 && hora <= 21) {
        try {
          console.log('🔄 Ejecutando verificación periódica de retrasos...');
          const actividadesConRetraso = await verificarYNotificarRetrasos();
          
          if (actividadesConRetraso.length > 0) {
            console.log(`⚠️ Verificación periódica: ${actividadesConRetraso.length} actividades con retraso detectadas`);
          }
        } catch (error) {
          console.error('❌ Error en verificación periódica:', error);
        }
      }
    };

    // Verificación cada 6 horas
    const intervalId = setInterval(ejecutarVerificacionPeriodica, 6 * 60 * 60 * 1000);
    this.intervalos.set('verificacion-periodica', intervalId);
    
    console.log('⏰ Verificaciones periódicas programadas cada 6 horas');
  }

  /**
   * Ejecutar verificación manual inmediata
   */  /**
   * Ejecutar verificación manual
   */
  async ejecutarVerificacionManual(): Promise<void> {
    try {
      console.log('🔧 Ejecutando verificación manual de retrasos...');
      const actividadesConRetraso = await verificarYNotificarRetrasos();
      
      console.log(`✅ Verificación manual completada: ${actividadesConRetraso.length} actividades con retraso`);
    } catch (error) {
      console.error('❌ Error en verificación manual:', error);
      throw error;
    }
  }

  /**
   * Obtener estado del scheduler
   */
  getEstado(): { 
    isInitialized: boolean; 
    intervalosActivos: string[];
    proximaVerificacion?: string;
  } {
    const proximaVerificacion = new Date();
    proximaVerificacion.setHours(9, 0, 0, 0);
    if (proximaVerificacion <= new Date()) {
      proximaVerificacion.setDate(proximaVerificacion.getDate() + 1);
    }

    return {
      isInitialized: this.isInitialized,
      intervalosActivos: Array.from(this.intervalos.keys()),
      proximaVerificacion: this.isInitialized ? proximaVerificacion.toLocaleString() : undefined
    };
  }
}

// Instancia singleton
export const schedulerService = new SchedulerService();

// Inicializar automáticamente cuando se cargue el módulo
// Solo en entorno del navegador y si no estamos en modo de desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Esperar un poco para que la aplicación se inicialice completamente
  setTimeout(() => {
    schedulerService.init();
  }, 5000);
}

export default schedulerService;
