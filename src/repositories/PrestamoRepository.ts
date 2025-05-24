/**
 * Repositorio para Préstamos
 * Gestiona el acceso a datos de préstamos con lógica de negocio específica
 */
import { BaseRepository, QueryOptions } from './BaseRepository';
import { Prestamo, EstadoPrestamo } from '../types/prestamo';
import { Timestamp } from 'firebase/firestore';

export interface PrestamoQueryOptions extends QueryOptions {
  estado?: EstadoPrestamo;
  usuarioId?: string;
  materialId?: string;
  actividadId?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  vencidos?: boolean;
}

export class PrestamoRepository extends BaseRepository<Prestamo> {
  constructor() {
    super({
      collectionName: 'prestamos',
      enableCache: true,
      cacheTTL: 5 * 60 * 1000 // 5 minutos (datos más dinámicos)
    });
  }

  protected async validateEntity(entity: Partial<Prestamo>): Promise<void> {
    if (!entity.materialId) {
      throw new Error('ID del material es obligatorio');
    }
    if (!entity.usuarioId) {
      throw new Error('ID del usuario es obligatorio');
    }
    if (entity.cantidadPrestada !== undefined && entity.cantidadPrestada <= 0) {
      throw new Error('La cantidad prestada debe ser mayor a 0');
    }
  }

  /**
   * Buscar préstamos con filtros específicos
   */
  async findPrestamos(options: PrestamoQueryOptions = {}): Promise<Prestamo[]> {
    const queryOptions: QueryOptions = {
      orderBy: options.orderBy || [{ field: 'fechaPrestamo', direction: 'desc' }],
      limit: options.limit,
      where: []
    };

    // Filtro por estado
    if (options.estado) {
      queryOptions.where!.push({
        field: 'estado',
        operator: '==',
        value: options.estado
      });
    }

    // Filtro por usuario
    if (options.usuarioId) {
      queryOptions.where!.push({
        field: 'usuarioId',
        operator: '==',
        value: options.usuarioId
      });
    }

    // Filtro por material
    if (options.materialId) {
      queryOptions.where!.push({
        field: 'materialId',
        operator: '==',
        value: options.materialId
      });
    }

    // Filtro por actividad
    if (options.actividadId) {
      queryOptions.where!.push({
        field: 'actividadId',
        operator: '==',
        value: options.actividadId
      });
    }

    // Aplicar filtros WHERE adicionales
    if (options.where) {
      queryOptions.where!.push(...options.where);
    }

    const prestamos = await this.find(queryOptions);

    // Filtros adicionales que requieren procesamiento en memoria
    let resultado = prestamos;

    // Filtro por rango de fechas
    if (options.fechaInicio || options.fechaFin) {
      resultado = resultado.filter(prestamo => {
        const fechaPrestamo = prestamo.fechaPrestamo instanceof Timestamp ?
          prestamo.fechaPrestamo.toDate() : new Date(prestamo.fechaPrestamo);
        
        if (options.fechaInicio && fechaPrestamo < options.fechaInicio) return false;
        if (options.fechaFin && fechaPrestamo > options.fechaFin) return false;
        
        return true;
      });
    }

    // Filtro por préstamos vencidos
    if (options.vencidos) {
      const ahora = new Date();
      resultado = resultado.filter(prestamo => {
        if (prestamo.estado === 'devuelto') return false;
        
        const fechaVencimiento = prestamo.fechaDevolucionPrevista instanceof Timestamp ?
          prestamo.fechaDevolucionPrevista.toDate() : new Date(prestamo.fechaDevolucionPrevista);
        
        return fechaVencimiento < ahora;
      });
    }

    return resultado;
  }

  /**
   * Obtener préstamos activos (no devueltos)
   */
  async findPrestamosActivos(): Promise<Prestamo[]> {
    return this.find({
      where: [
        { field: 'estado', operator: '!=', value: 'devuelto' }
      ],
      orderBy: [{ field: 'fechaPrestamo', direction: 'desc' }]
    });
  }

  /**
   * Obtener préstamos de un usuario
   */
  async findPrestamosByUsuario(usuarioId: string, incluirDevueltos: boolean = false): Promise<Prestamo[]> {
    if (incluirDevueltos) {
      return this.findPrestamos({
        usuarioId,
        orderBy: [{ field: 'fechaPrestamo', direction: 'desc' }]
      });
    } else {
      return this.findPrestamos({
        usuarioId,
        where: [{ field: 'estado', operator: '!=', value: 'devuelto' }]
      });
    }
  }

  /**
   * Obtener préstamos de una actividad
   */
  async findPrestamosByActividad(actividadId: string): Promise<Prestamo[]> {
    return this.findPrestamos({
      actividadId
    });
  }

  /**
   * Obtener préstamos de un material
   */
  async findPrestamosByMaterial(materialId: string): Promise<Prestamo[]> {
    return this.findPrestamos({
      materialId,
      orderBy: [{ field: 'fechaPrestamo', direction: 'desc' }]
    });
  }

  /**
   * Obtener préstamos vencidos
   */
  async findPrestamosVencidos(): Promise<Prestamo[]> {
    return this.findPrestamos({
      vencidos: true,
      where: [{ field: 'estado', operator: '!=', value: 'devuelto' }]
    });
  }

  /**
   * Verificar si un material está prestado actualmente
   */
  async isMaterialPrestado(materialId: string): Promise<boolean> {
    const prestamosActivos = await this.findPrestamos({
      materialId,
      where: [{ field: 'estado', operator: '!=', value: 'devuelto' }],
      limit: 1
    });

    return prestamosActivos.length > 0;
  }

  /**
   * Obtener cantidad total prestada de un material
   */
  async getCantidadPrestada(materialId: string): Promise<number> {
    const prestamosActivos = await this.findPrestamos({
      materialId,
      where: [{ field: 'estado', operator: '!=', value: 'devuelto' }]
    });

    return prestamosActivos.reduce((total, prestamo) => 
      total + (prestamo.cantidadPrestada || 1), 0
    );
  }

  /**
   * Marcar préstamo como devuelto
   */
  async marcarComoDevuelto(prestamoId: string, observaciones?: string): Promise<Prestamo> {
    return this.update(prestamoId, {
      estado: 'devuelto',
      fechaDevolucion: Timestamp.now(),
      observaciones: observaciones || 'Material devuelto'
    });
  }

  /**
   * Extender fecha de devolución
   */
  async extenderFechaDevolucion(prestamoId: string, nuevaFecha: Date): Promise<Prestamo> {
    return this.update(prestamoId, {
      fechaDevolucionPrevista: Timestamp.fromDate(nuevaFecha)
    });
  }

  /**
   * Obtener estadísticas de préstamos
   */
  async getEstadisticas(): Promise<{
    total: number;
    activos: number;
    devueltos: number;
    vencidos: number;
    porEstado: Record<EstadoPrestamo, number>;
    promedioRetraso: number;
  }> {
    const todosPrestamos = await this.find();
    const ahora = new Date();
    
    const estadisticas = {
      total: todosPrestamos.length,
      activos: 0,
      devueltos: 0,
      vencidos: 0,
      porEstado: {} as Record<EstadoPrestamo, number>,
      promedioRetraso: 0
    };

    // Inicializar contadores por estado
    const estados: EstadoPrestamo[] = ['en_uso', 'pendiente', 'devuelto', 'perdido', 'estropeado'];
    estados.forEach(estado => {
      estadisticas.porEstado[estado] = 0;
    });

    let totalRetrasos = 0;
    let countRetrasos = 0;

    todosPrestamos.forEach(prestamo => {
      // Contar por estado
      estadisticas.porEstado[prestamo.estado]++;

      if (prestamo.estado === 'devuelto') {
        estadisticas.devueltos++;

        // Calcular retraso si aplica
        const fechaDevolucionPrevista = prestamo.fechaDevolucionPrevista instanceof Timestamp ?
          prestamo.fechaDevolucionPrevista.toDate() : new Date(prestamo.fechaDevolucionPrevista);
          const fechaDevolucionReal = prestamo.fechaDevolucion instanceof Timestamp ?
          prestamo.fechaDevolucion.toDate() : null;

        if (fechaDevolucionReal && fechaDevolucionReal > fechaDevolucionPrevista) {
          const retraso = Math.ceil((fechaDevolucionReal.getTime() - fechaDevolucionPrevista.getTime()) / (1000 * 60 * 60 * 24));
          totalRetrasos += retraso;
          countRetrasos++;
        }
      } else {
        estadisticas.activos++;

        // Verificar si está vencido
        const fechaVencimiento = prestamo.fechaDevolucionPrevista instanceof Timestamp ?
          prestamo.fechaDevolucionPrevista.toDate() : new Date(prestamo.fechaDevolucionPrevista);
        
        if (fechaVencimiento < ahora) {
          estadisticas.vencidos++;
        }
      }
    });

    // Calcular promedio de retraso
    estadisticas.promedioRetraso = countRetrasos > 0 ? totalRetrasos / countRetrasos : 0;

    return estadisticas;
  }

  /**
   * Obtener préstamos próximos a vencer
   */
  async findProximosVencer(diasAnticipacion: number = 3): Promise<Prestamo[]> {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);

    const prestamosActivos = await this.findPrestamosActivos();
    
    return prestamosActivos.filter(prestamo => {
      const fechaVencimiento = prestamo.fechaDevolucionPrevista instanceof Timestamp ?
        prestamo.fechaDevolucionPrevista.toDate() : new Date(prestamo.fechaDevolucionPrevista);
      
      return fechaVencimiento <= fechaLimite && fechaVencimiento >= new Date();
    });
  }
}
