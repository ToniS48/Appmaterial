import { Material } from '../../types/material';
import { materialRepository } from '../../repositories';
import { Timestamp } from 'firebase/firestore';
import { toTimestamp, timestampToDate } from '../../utils/dateUtils';

export interface MaterialSearchParams {
  nombre?: string;
  tipo?: Material['tipo'];
  estado?: Material['estado'];
  disponible?: boolean;
  limit?: number;
}

export class MaterialService {
  /**
   * Crear nuevo material con validaciones de negocio
   */
  async crearMaterial(materialData: Omit<Material, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<string> {
    // Validaciones de negocio
    this.validarDatosMaterial(materialData);

    // Verificar duplicados por nombre y tipo
    const existente = await materialRepository.findMateriales({
      searchText: materialData.nombre
    });

    if (existente.some(m => m.nombre === materialData.nombre && m.tipo === materialData.tipo)) {
      throw new Error(`Ya existe un material con el nombre "${materialData.nombre}" del tipo "${materialData.tipo}"`);
    }

    // Establecer valores por defecto
    const material: Omit<Material, 'id'> = {
      ...materialData,
      estado: materialData.estado || 'disponible',
      fechaCreacion: Timestamp.now(),
      fechaActualizacion: Timestamp.now(),
      fechaUltimaRevision: materialData.fechaUltimaRevision || Timestamp.now(),
      proximaRevision: materialData.proximaRevision || Timestamp.fromDate(this.calcularProximaRevision(new Date()))
    };

    const nuevoMaterial = await materialRepository.create(material);
    return nuevoMaterial.id;
  }

  /**
   * Actualizar material con validaciones
   */
  async actualizarMaterial(id: string, updates: Partial<Material>): Promise<void> {
    const material = await materialRepository.findById(id);
    if (!material) {
      throw new Error('Material no encontrado');
    }
    
    await materialRepository.update(id, {
      ...updates,
      fechaActualizacion: Timestamp.now()
    });
  }

  /**
   * Buscar materiales con filtros
   */
  async buscarMateriales(params: MaterialSearchParams): Promise<Material[]> {
    return await materialRepository.findMateriales({
      tipo: params.tipo,
      estado: params.estado,
      disponible: params.disponible,
      searchText: params.nombre,
      limit: params.limit
    });
  }

  /**
   * Obtener materiales disponibles para préstamo
   */
  async obtenerMaterialesDisponibles(): Promise<Material[]> {
    return await materialRepository.findMaterialesDisponibles();
  }

  /**
   * Verificar disponibilidad de material para préstamo
   */
  async verificarDisponibilidad(materialId: string, cantidadSolicitada: number): Promise<boolean> {
    const material = await materialRepository.findById(materialId);
    
    if (!material) {
      throw new Error('Material no encontrado');
    }

    if (material.estado !== 'disponible') {
      return false;
    }

    return (material.cantidad || 0) >= cantidadSolicitada;
  }

  /**
   * Reservar material para préstamo
   */
  async reservarMaterial(materialId: string, cantidad: number): Promise<void> {
    const material = await materialRepository.findById(materialId);
    
    if (!material) {
      throw new Error('Material no encontrado');
    }

    if (!await this.verificarDisponibilidad(materialId, cantidad)) {
      throw new Error('Material no disponible en la cantidad solicitada');
    }

    const nuevaCantidad = (material.cantidad || 0) - cantidad;
    const nuevoEstado = nuevaCantidad === 0 ? 'prestado' : material.estado;

    await materialRepository.update(materialId, {
      cantidad: nuevaCantidad,
      estado: nuevoEstado,
      fechaActualizacion: Timestamp.now()
    });
  }

  /**
   * Liberar material de préstamo
   */
  async liberarMaterial(materialId: string, cantidad: number, estadoDevolucion?: Material['estado']): Promise<void> {
    const material = await materialRepository.findById(materialId);
    
    if (!material) {
      throw new Error('Material no encontrado');
    }

    const nuevaCantidad = (material.cantidad || 0) + cantidad;
    let nuevoEstado = estadoDevolucion || material.estado;

    // Si no se especifica estado y el material estaba prestado, volver a disponible
    if (!estadoDevolucion && material.estado === 'prestado') {
      nuevoEstado = 'disponible';
    }

    await materialRepository.update(materialId, {
      cantidad: nuevaCantidad,
      estado: nuevoEstado,
      fechaActualizacion: Timestamp.now()
    });
  }
  /**
   * Obtener materiales que requieren revisión
   */  async obtenerMaterialesParaRevision(): Promise<Material[]> {
    const fechaLimite = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Próximos 30 días

    return await materialRepository.findMateriales({
      estado: 'disponible'
    }).then(materiales => 
      materiales.filter(m => {
        if (!m.proximaRevision) return false;
        
        // NUEVA ESTRATEGIA: Usar timestampToDate para conversión segura
        const fechaProximaRevision = timestampToDate(toTimestamp(m.proximaRevision));
        if (!fechaProximaRevision) return false;
          
        return fechaProximaRevision <= fechaLimite;
      })
    );
  }

  /**
   * Eliminar material con validaciones
   */
  async eliminarMaterial(id: string): Promise<void> {
    const material = await materialRepository.findById(id);
    if (!material) {
      throw new Error('Material no encontrado');
    }

    // Verificar que no tenga préstamos activos
    await this.verificarPrestamosActivos(id);

    await materialRepository.delete(id);
  }

  /**
   * Validaciones de datos de material
   */
  private validarDatosMaterial(material: Partial<Material>): void {
    if (!material.nombre?.trim()) {
      throw new Error('El nombre del material es obligatorio');
    }

    if (!material.tipo) {
      throw new Error('El tipo de material es obligatorio');
    }

    if (material.cantidad !== undefined && material.cantidad < 0) {
      throw new Error('La cantidad no puede ser negativa');
    }    // Validar fechas (usar Timestamp si está disponible)
    if (material.proximaRevision) {
      // NUEVA ESTRATEGIA: Usar timestampToDate para conversión segura
      const fechaProximaRevision = timestampToDate(toTimestamp(material.proximaRevision));
      
      if (fechaProximaRevision && fechaProximaRevision < new Date()) {
        throw new Error('La próxima revisión no puede ser en el pasado');
      }
    }
  }

  /**
   * Calcular próxima fecha de revisión (por defecto 1 año)
   */
  private calcularProximaRevision(fechaBase: Date): Date {
    const proximaRevision = new Date(fechaBase);
    proximaRevision.setFullYear(proximaRevision.getFullYear() + 1);
    return proximaRevision;
  }

  /**
   * Verificar si el material tiene préstamos activos
   */
  private async verificarPrestamosActivos(materialId: string): Promise<void> {
    // Esta funcionalidad se implementará cuando esté disponible el PrestamoRepository
    // Por ahora, asumimos que no hay préstamos activos
    console.warn('Verificación de préstamos activos pendiente de implementar');
  }
}

// Instancia singleton
export const materialService = new MaterialService();
export default materialService;
