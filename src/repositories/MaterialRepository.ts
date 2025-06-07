/**
 * Repositorio para Materiales
 * Gestiona el acceso a datos de material deportivo con funcionalidades específicas
 */
import { BaseRepository, QueryOptions } from './BaseRepository';
import { Material } from '../types/material';

export interface MaterialQueryOptions extends QueryOptions {
  estado?: Material['estado'];
  tipo?: Material['tipo'];
  categoria?: string;
  disponible?: boolean;
  searchText?: string;
}

export class MaterialRepository extends BaseRepository<Material> {
  constructor() {
    super({
      collectionName: 'material_deportivo',
      enableCache: true,
      cacheTTL: 15 * 60 * 1000 // 15 minutos
    });
  }

  protected async validateEntity(entity: Partial<Material>): Promise<void> {
    // Crear función de validación básica si no existe
    if (!entity.nombre?.trim()) {
      throw new Error('El nombre del material es obligatorio');
    }
    if (!entity.tipo) {
      throw new Error('El tipo de material es obligatorio');
    }
    if (entity.cantidad !== undefined && entity.cantidad < 0) {
      throw new Error('La cantidad no puede ser negativa');
    }
  }

  /**
   * Buscar materiales con filtros específicos
   */
  async findMateriales(options: MaterialQueryOptions = {}): Promise<Material[]> {
    const queryOptions: QueryOptions = {
      orderBy: options.orderBy || [{ field: 'nombre', direction: 'asc' }],
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

    // Filtro por tipo
    if (options.tipo) {
      queryOptions.where!.push({
        field: 'tipo',
        operator: '==',
        value: options.tipo
      });
    }

    // Filtro por categoría
    if (options.categoria) {
      queryOptions.where!.push({
        field: 'categoria',
        operator: '==',
        value: options.categoria
      });
    }

    // Filtro por disponibilidad (materiales con cantidad > 0 y estado disponible)
    if (options.disponible) {
      queryOptions.where!.push({
        field: 'estado',
        operator: '==',
        value: 'disponible'
      });
      queryOptions.where!.push({
        field: 'cantidadDisponible',
        operator: '>',
        value: 0
      });
    }

    // Aplicar filtros WHERE adicionales
    if (options.where) {
      queryOptions.where!.push(...options.where);
    }

    const materiales = await this.find(queryOptions);    // Filtrar por texto de búsqueda si se proporciona
    if (options.searchText) {
      const searchLower = options.searchText.toLowerCase();
      return materiales.filter(material => 
        material.nombre.toLowerCase().includes(searchLower) ||
        material.descripcion?.toLowerCase().includes(searchLower) ||
        material.codigo?.toLowerCase().includes(searchLower)
      );
    }

    return materiales;
  }
  /**
   * Obtener materiales disponibles para préstamo
   * Versión simplificada que evita índices complejos
   */
  async findMaterialesDisponibles(): Promise<Material[]> {
    try {
      console.log('🔍 [DEBUG] findMaterialesDisponibles - Usando consulta simplificada');
      
      // Opción 1: Solo filtrar por cantidadDisponible > 0 (más simple)
      const queryOptions: QueryOptions = {
        where: [
          {
            field: 'cantidadDisponible',
            operator: '>',
            value: 0
          }
        ],
        orderBy: [{ field: 'nombre', direction: 'asc' }]
      };
      
      console.log('🔍 [DEBUG] findMaterialesDisponibles - Opciones de consulta:', queryOptions);
      const materiales = await this.find(queryOptions);
        // Filtrar manualmente por estado si es necesario
      const materialesFiltrados = materiales.filter(material => 
        material.estado && material.estado.toLowerCase() === 'disponible'
      );
      
      console.log('🔍 [DEBUG] findMaterialesDisponibles - Materiales encontrados:', materiales.length);
      console.log('🔍 [DEBUG] findMaterialesDisponibles - Materiales filtrados:', materialesFiltrados.length);
      
      return materialesFiltrados;
      
    } catch (error) {
      console.error('❌ [DEBUG] findMaterialesDisponibles - Error:', error);
      
      // Fallback: consulta aún más simple - obtener todos y filtrar en memoria
      console.log('🔄 [DEBUG] findMaterialesDisponibles - Intentando fallback...');
      try {
        const todosMateriales = await this.find({
          orderBy: [{ field: 'nombre', direction: 'asc' }]
        });
          const materialesDisponibles = todosMateriales.filter(material => 
          (material.cantidadDisponible ?? 0) > 0 && 
          material.estado && 
          material.estado.toLowerCase() === 'disponible'
        );
        
        console.log('✅ [DEBUG] findMaterialesDisponibles - Fallback exitoso:', materialesDisponibles.length);
        return materialesDisponibles;
        
      } catch (fallbackError) {
        console.error('❌ [DEBUG] findMaterialesDisponibles - Fallback falló:', fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Obtener materiales por tipo
   */
  async findByTipo(tipo: Material['tipo']): Promise<Material[]> {
    return this.findMateriales({
      tipo
    });
  }

  /**
   * Buscar materiales por texto
   */
  async search(searchText: string): Promise<Material[]> {
    return this.findMateriales({
      searchText
    });
  }

  /**
   * Actualizar cantidad disponible de un material
   */
  async updateCantidadDisponible(materialId: string, delta: number): Promise<Material> {
    const material = await this.findById(materialId);
    if (!material) {
      throw new Error('Material no encontrado');
    }

    const nuevaCantidad = (material.cantidadDisponible || 0) + delta;
    
    if (nuevaCantidad < 0) {
      throw new Error('No hay suficiente cantidad disponible');
    }

    // Actualizar estado basado en la nueva cantidad
    let nuevoEstado = material.estado;
    if (nuevaCantidad === 0 && material.estado === 'disponible') {
      nuevoEstado = 'prestado';
    } else if (nuevaCantidad > 0 && material.estado === 'prestado') {
      nuevoEstado = 'disponible';
    }

    return this.update(materialId, {
      cantidadDisponible: nuevaCantidad,
      estado: nuevoEstado
    });
  }

  /**
   * Obtener estadísticas de materiales
   */  async getEstadisticas(): Promise<{
    total: number;
    porEstado: Record<Material['estado'], number>;
    porTipo: Record<Material['tipo'], number>;
    valorTotal: number;
    cantidadTotal: number;
  }> {
    const todosMateriales = await this.find();
      const estadisticas = {
      total: todosMateriales.length,
      porEstado: {} as Record<Material['estado'], number>,
      porTipo: {} as Record<Material['tipo'], number>,
      valorTotal: 0,
      cantidadTotal: 0
    };    // Inicializar contadores
    const estados: Material['estado'][] = ['disponible', 'prestado', 'mantenimiento', 'baja', 'perdido'];
    estados.forEach(estado => {
      estadisticas.porEstado[estado] = 0;
    });    const tipos: Material['tipo'][] = ['cuerda', 'anclaje', 'varios'];
    tipos.forEach(tipo => {
      estadisticas.porTipo[tipo] = 0;
    });

    // Calcular estadísticas
    todosMateriales.forEach(material => {
      // Por estado
      estadisticas.porEstado[material.estado]++;

      // Por tipo
      estadisticas.porTipo[material.tipo]++;      // Valor y cantidad total
      // estadisticas.valorTotal += material.precio || 0; // Campo precio no existe en Material
      estadisticas.cantidadTotal += material.cantidad || 1;
    });

    return estadisticas;
  }

  /**
   * Verificar disponibilidad para préstamo
   */
  async checkDisponibilidad(materialId: string, cantidadSolicitada: number): Promise<boolean> {
    const material = await this.findById(materialId);
    if (!material) return false;

    if (material.estado !== 'disponible') return false;

    const cantidadDisponible = material.cantidadDisponible || 0;
    return cantidadDisponible >= cantidadSolicitada;
  }

  /**
   * Obtener materiales que requieren mantenimiento
   */
  async findMaterialesMantenimiento(): Promise<Material[]> {
    return this.findMateriales({
      estado: 'mantenimiento'
    });
  }

  /**
   * Marcar material como perdido
   */
  async marcarComoPerdido(materialId: string, observaciones?: string): Promise<Material> {
    return this.update(materialId, {
      estado: 'perdido',
      observaciones: observaciones || 'Material reportado como perdido',
      fechaActualizacion: new Date() as any
    });
  }

  /**
   * Dar de baja un material
   */  async darDeBaja(materialId: string, motivo: string): Promise<Material> {
    return this.update(materialId, {
      estado: 'baja',
      observaciones: `Dado de baja: ${motivo}`,
      fechaActualizacion: new Date() as any
    });
  }

  /**
   * Obtener materiales próximos a vencimiento (si aplica)
   */
  async findMaterialesProximosVencimiento(diasAnticipacion: number = 30): Promise<Material[]> {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);

    return this.find({
      where: [
        { field: 'fechaVencimiento', operator: '<=', value: fechaLimite },
        { field: 'fechaVencimiento', operator: '>', value: new Date() }
      ],
      orderBy: [{ field: 'fechaVencimiento', direction: 'asc' }]
    });
  }
}
