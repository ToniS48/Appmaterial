/**
 * Ejemplo de implementación de variables del sistema en PrestamoService
 * 
 * Este archivo muestra cómo integrar las variables configurables
 * en la lógica de negocio existente.
 */

import { systemConfig } from '../services/SystemConfigService';

// Tipos de estado de préstamo mejorados
export type EstadoPrestamo = 
  | 'ACTIVO' 
  | 'EN_GRACIA' 
  | 'VENCIDO' 
  | 'VENCIDO_GRAVE' 
  | 'DEVUELTO' 
  | 'DEVUELTO_TEMPRANO';

export interface PrestamoConVariables {
  id: string;
  materialId: string;
  usuarioId: string;
  fechaInicio: Date;
  fechaFinActividad: Date;
  fechaDevolucion?: Date;
  estado: EstadoPrestamo;
  diasRetraso: number;
  fechaLimiteDevolucion: Date;
  penalizacionAplicada: number;
  bonificacionAplicada: number;
}

class PrestamoServiceConVariables {
  
  /**
   * Calcula el estado actual de un préstamo basado en las variables del sistema
   */
  static calcularEstadoPrestamo(prestamo: any): PrestamoConVariables {
    const fechaLimite = systemConfig.calculateReturnDeadline(prestamo.fechaFinActividad);
    const ahora = new Date();
    const diasRetraso = Math.max(0, Math.floor((ahora.getTime() - fechaLimite.getTime()) / (1000 * 60 * 60 * 24)));
    
    let estado: EstadoPrestamo = 'ACTIVO';
    let penalizacionAplicada = 0;
    let bonificacionAplicada = 0;

    if (prestamo.fechaDevolucion) {
      // Ya fue devuelto
      const fechaDevolucion = new Date(prestamo.fechaDevolucion);
      if (fechaDevolucion <= fechaLimite) {
        estado = 'DEVUELTO_TEMPRANO';
        bonificacionAplicada = systemConfig.getVariable('bonificacionDevolucionTemprana');
      } else {
        estado = 'DEVUELTO';
        const diasRetrasoDevolucion = Math.floor((fechaDevolucion.getTime() - fechaLimite.getTime()) / (1000 * 60 * 60 * 24));
        if (systemConfig.shouldApplyPenalty(diasRetrasoDevolucion)) {
          penalizacionAplicada = systemConfig.getVariable('penalizacionRetraso');
        }
      }
    } else {
      // Aún no devuelto
      if (systemConfig.isWithinGracePeriod(prestamo.fechaFinActividad)) {
        estado = 'EN_GRACIA';
      } else if (diasRetraso > 0) {
        if (systemConfig.shouldApplyBlock(diasRetraso)) {
          estado = 'VENCIDO_GRAVE';
          penalizacionAplicada = systemConfig.getVariable('penalizacionRetraso') * 2; // Doble penalización
        } else if (systemConfig.shouldApplyPenalty(diasRetraso)) {
          estado = 'VENCIDO';
          penalizacionAplicada = systemConfig.getVariable('penalizacionRetraso');
        }
      }
    }

    return {
      ...prestamo,
      estado,
      diasRetraso,
      fechaLimiteDevolucion: fechaLimite,
      penalizacionAplicada,
      bonificacionAplicada
    };
  }

  /**
   * Verifica si un usuario puede realizar un nuevo préstamo
   */
  static async puedeRealizarPrestamo(usuarioId: string, materialId: string): Promise<{ puede: boolean; razon?: string }> {
    // Verificar tiempo mínimo entre préstamos del mismo material
    const tiempoMinimo = systemConfig.getVariable('tiempoMinimoEntrePrestamos');
    
    if (tiempoMinimo > 0) {
      // Buscar último préstamo del mismo material por el usuario
      const ultimoPrestamo = await this.obtenerUltimoPrestamo(usuarioId, materialId);
      
      if (ultimoPrestamo) {
        const fechaUltimoPrestamo = new Date(ultimoPrestamo.fechaInicio);
        const fechaMinima = new Date();
        fechaMinima.setDate(fechaMinima.getDate() - tiempoMinimo);
        
        if (fechaUltimoPrestamo > fechaMinima) {
          return {
            puede: false,
            razon: `Debe esperar ${tiempoMinimo} día(s) desde el último préstamo de este material`
          };
        }
      }
    }

    // Verificar si el usuario tiene retrasos graves
    const prestamosActivos = await this.obtenerPrestamosActivos(usuarioId);
    const tieneRetrasoGrave = prestamosActivos.some(prestamo => {
      const prestamoConVariables = this.calcularEstadoPrestamo(prestamo);
      return prestamoConVariables.estado === 'VENCIDO_GRAVE';
    });

    if (tieneRetrasoGrave) {
      return {
        puede: false,
        razon: 'Tiene préstamos con retraso grave. Debe devolver el material antes de solicitar nuevo préstamo.'
      };
    }

    return { puede: true };
  }
  /**
   * Obtiene notificaciones automáticas basadas en variables del sistema
   */
  static obtenerNotificacionesPendientes(prestamos: any[]): Array<{
    tipo: 'RECORDATORIO' | 'RETRASO' | 'GRAVE';
    prestamo: PrestamoConVariables;
    mensaje: string;
  }> {
    const notificaciones: Array<{
      tipo: 'RECORDATORIO' | 'RETRASO' | 'GRAVE';
      prestamo: PrestamoConVariables;
      mensaje: string;
    }> = [];
    const recordatorioDevolucion = systemConfig.getVariable('recordatorioDevolucion');
    const notificacionRetraso = systemConfig.getVariable('notificacionRetrasoDevolucion');

    for (const prestamo of prestamos) {
      const prestamoConVariables = this.calcularEstadoPrestamo(prestamo);
      const { fechaLimiteDevolucion, estado, diasRetraso } = prestamoConVariables;
      
      const ahora = new Date();
      const diasHastaVencimiento = Math.floor((fechaLimiteDevolucion.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));

      // Recordatorio antes del vencimiento
      if (estado === 'ACTIVO' && diasHastaVencimiento <= recordatorioDevolucion && diasHastaVencimiento > 0) {
        notificaciones.push({
          tipo: 'RECORDATORIO' as const,
          prestamo: prestamoConVariables,
          mensaje: `Recuerda devolver el material en ${diasHastaVencimiento} día(s)`
        });
      }

      // Notificación de retraso
      if (estado === 'VENCIDO' && diasRetraso === notificacionRetraso) {
        notificaciones.push({
          tipo: 'RETRASO' as const,
          prestamo: prestamoConVariables,
          mensaje: `Material vencido hace ${diasRetraso} día(s). Devuelve lo antes posible.`
        });
      }

      // Notificación de retraso grave
      if (estado === 'VENCIDO_GRAVE') {
        notificaciones.push({
          tipo: 'GRAVE' as const,
          prestamo: prestamoConVariables,
          mensaje: `Retraso grave de ${diasRetraso} días. Tu cuenta será bloqueada para nuevos préstamos.`
        });
      }
    }

    return notificaciones;
  }

  /**
   * Calcula estadísticas de rendimiento basadas en variables
   */
  static calcularEstadisticasRendimiento(prestamos: any[]) {
    const prestamosConVariables = prestamos.map(p => this.calcularEstadoPrestamo(p));
    
    const totalPrestamos = prestamosConVariables.length;
    const devolucionesTempranas = prestamosConVariables.filter(p => p.estado === 'DEVUELTO_TEMPRANO').length;
    const devolucionesEnTiempo = prestamosConVariables.filter(p => 
      p.estado === 'DEVUELTO' && p.penalizacionAplicada === 0
    ).length;
    const devolucionesConRetraso = prestamosConVariables.filter(p => 
      p.estado === 'DEVUELTO' && p.penalizacionAplicada > 0
    ).length;
    const prestamosVencidos = prestamosConVariables.filter(p => 
      p.estado === 'VENCIDO' || p.estado === 'VENCIDO_GRAVE'
    ).length;

    const puntajeTotal = prestamosConVariables.reduce((total, p) => 
      total + p.bonificacionAplicada - p.penalizacionAplicada, 0
    );

    return {
      totalPrestamos,
      devolucionesTempranas,
      devolucionesEnTiempo,
      devolucionesConRetraso,
      prestamosVencidos,
      puntajeTotal,
      porcentajeDevolucionesTempranas: (devolucionesTempranas / totalPrestamos) * 100,
      porcentajePuntualidad: ((devolucionesTempranas + devolucionesEnTiempo) / totalPrestamos) * 100
    };
  }
  /**
   * Genera alertas de stock basadas en variables
   */
  static verificarAlertasStock(materiales: any[]): Array<{
    material: any;
    alerta: 'STOCK_BAJO' | 'REVISION_PENDIENTE';
    mensaje: string;
  }> {
    const alertas: Array<{
      material: any;
      alerta: 'STOCK_BAJO' | 'REVISION_PENDIENTE';
      mensaje: string;
    }> = [];
    const porcentajeMinimo = systemConfig.getVariable('porcentajeStockMinimo');
    const diasRevision = systemConfig.getVariable('diasRevisionPeriodica');

    for (const material of materiales) {
      // Alerta de stock bajo
      if (systemConfig.isStockBelowMinimum(material.disponible, material.total)) {
        const porcentajeActual = Math.round((material.disponible / material.total) * 100);
        alertas.push({
          material,
          alerta: 'STOCK_BAJO' as const,
          mensaje: `Stock bajo: ${porcentajeActual}% (mínimo: ${porcentajeMinimo}%)`
        });
      }

      // Alerta de revisión pendiente
      if (material.fechaUltimaRevision) {
        const fechaRevision = new Date(material.fechaUltimaRevision);
        const diasDesdeRevision = Math.floor((new Date().getTime() - fechaRevision.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasDesdeRevision >= diasRevision) {
          alertas.push({
            material,
            alerta: 'REVISION_PENDIENTE' as const,
            mensaje: `Revisión pendiente: ${diasDesdeRevision} días desde la última revisión`
          });
        }
      }
    }

    return alertas;
  }

  // Métodos privados auxiliares (implementar según la estructura actual)
  private static async obtenerUltimoPrestamo(usuarioId: string, materialId: string): Promise<any> {
    // Implementar búsqueda en Firebase
    return null;
  }

  private static async obtenerPrestamosActivos(usuarioId: string): Promise<any[]> {
    // Implementar búsqueda en Firebase
    return [];
  }
}

export default PrestamoServiceConVariables;

/**
 * Ejemplo de uso en un componente React:
 * 
 * ```tsx
 * import PrestamoServiceConVariables from './PrestamoServiceConVariables';
 * import { useSystemConfig } from '../services/SystemConfigService';
 * 
 * const MisPrestamos = () => {
 *   const { loading } = useSystemConfig();
 *   const [prestamos, setPrestamos] = useState([]);
 *   const [notificaciones, setNotificaciones] = useState([]);
 * 
 *   useEffect(() => {
 *     if (!loading) {
 *       // Cargar préstamos con variables aplicadas
 *       const prestamosConVariables = prestamos.map(p => 
 *         PrestamoServiceConVariables.calcularEstadoPrestamo(p)
 *       );
 *       
 *       // Obtener notificaciones automáticas
 *       const notifs = PrestamoServiceConVariables.obtenerNotificacionesPendientes(prestamos);
 *       setNotificaciones(notifs);
 *     }
 *   }, [loading, prestamos]);
 * 
 *   return (
 *     // Renderizar componente...
 *   );
 * };
 * ```
 */
