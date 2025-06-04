import { where, orderBy } from 'firebase/firestore';
import { Material } from '../types/material';
import { Usuario } from '../types/usuario';
import { BaseService } from './core/BaseService';
import { validationService } from './core/ValidationService';
import { enviarNotificacionMasiva } from './notificacionService';
import { obtenerUsuarioPorId, listarUsuarios } from './usuarioService';

/**
 * Servicio refactorizado de Material que usa BaseService
 * Elimina la duplicación de código CRUD y mejora la gestión de datos
 */
class MaterialService extends BaseService<Material> {
  constructor() {
    super('material_deportivo');
  }

  /**
   * Implementar validación específica para Material
   */
  protected validateData(data: Partial<Material>): string[] {
    const result = validationService.validate('material', data);
    return result.isValid ? [] : Object.values(result.errors);
  }

  /**
   * Procesar datos antes de crear con validaciones específicas
   */
  protected processDataForCreate(data: Omit<Material, 'id'>): any {
    const errors = this.validateData(data);
    if (errors.length > 0) {
      throw new Error(`Datos inválidos: ${errors.join(', ')}`);
    }

    return {
      ...super.processDataForCreate(data),
      cantidadDisponible: data.cantidad || 1,
      estado: 'disponible'
    };
  }

  /**
   * Crear material con lógica específica
   */
  async crearMaterial(materialData: Omit<Material, 'id'>): Promise<Material> {
    try {
      const material = await this.create(materialData);
      
      // Notificar a usuarios relevantes sobre nuevo material
      await this.notificarNuevoMaterial(material);
      
      return material;
    } catch (error) {
      throw this.handleError('crearMaterial', error);
    }
  }

  /**
   * Listar materiales con filtros mejorados
   */
  async listarMateriales(filters?: { estado?: string; tipo?: string }): Promise<Material[]> {
    try {
      const constraints = [];
      
      if (filters?.estado) {
        constraints.push(where('estado', '==', filters.estado));
      }
      
      if (filters?.tipo) {
        constraints.push(where('tipo', '==', filters.tipo));
      }
      
      // Ordenar por fecha de creación (más recientes primero)
      constraints.push(orderBy('fechaCreacion', 'desc'));
      
      return await this.getAll(constraints);
    } catch (error) {
      throw this.handleError('listarMateriales', error);
    }
  }

  /**
   * Obtener material por ID con validación
   */
  async obtenerMaterial(materialId: string): Promise<Material> {
    try {
      const material = await this.getById(materialId);
      if (!material) {
        throw new Error('Material no encontrado');
      }
      return material;
    } catch (error) {
      throw this.handleError('obtenerMaterial', error);
    }
  }

  /**
   * Actualizar material con validaciones
   */
  async actualizarMaterial(materialId: string, materialData: Partial<Material>): Promise<Material> {
    try {
      // Validar antes de actualizar
      const errors = this.validateData(materialData);
      if (errors.length > 0) {
        throw new Error(`Datos inválidos: ${errors.join(', ')}`);
      }

      return await this.update(materialId, materialData);
    } catch (error) {
      throw this.handleError('actualizarMaterial', error);
    }
  }

  /**
   * Eliminar material con verificaciones de seguridad
   */
  async eliminarMaterial(materialId: string): Promise<void> {
    try {
      const material = await this.obtenerMaterial(materialId);
      
      // Verificar que no esté prestado
      if (material.estado === 'prestado') {
        throw new Error('No se puede eliminar material que está prestado');
      }
      
      await this.delete(materialId);
      
      // Notificar eliminación
      await this.notificarEliminacionMaterial(material);
    } catch (error) {
      throw this.handleError('eliminarMaterial', error);
    }
  }

  /**
   * Registrar incidencia con validación mejorada
   */
  async registrarIncidenciaMaterial(
    materialId: string,
    incidencia: {
      descripcion: string;
      reportadoPor: string;
      tipo: 'daño' | 'perdida' | 'mantenimiento' | 'otro';
      gravedad?: 'baja' | 'media' | 'alta' | 'critica';
    }
  ): Promise<void> {
    try {
      // Validar incidencia
      if (!incidencia.descripcion?.trim()) {
        throw new Error('La descripción de la incidencia es obligatoria');
      }      const material = await this.obtenerMaterial(materialId);
      
      // Crear incidencia en colección separada  
      // TODO: Implementar servicio de incidencias cuando esté disponible
      console.warn('Registro de incidencia pendiente de implementar');
      
      // Actualizar estado del material
      const nuevoEstado = this.determinarEstadoPorIncidencia(incidencia.tipo);
      await this.actualizarMaterial(materialId, { estado: nuevoEstado as Material['estado'] });
      
      // Enviar notificaciones
      await this.enviarNotificacionIncidencia(material, incidencia);
      
    } catch (error) {
      throw this.handleError('registrarIncidenciaMaterial', error);
    }
  }

  /**
   * Actualizar cantidad disponible con validaciones
   */
  async actualizarCantidadDisponible(materialId: string, cantidadDelta: number): Promise<void> {
    try {
      const material = await this.obtenerMaterial(materialId);
      
      // Validar material con cantidad
      if (!material.cantidad) {
        // Material único, cambiar estado
        const nuevoEstado = cantidadDelta < 0 ? 'prestado' : 'disponible';
        await this.actualizarMaterial(materialId, { estado: nuevoEstado });
        return;
      }
      
      // Material con cantidad, calcular nueva disponibilidad
      const cantidadActual = material.cantidadDisponible || 0;
      const nuevaCantidad = Math.max(0, cantidadActual + cantidadDelta);
      
      // Validar límites
      if (nuevaCantidad > material.cantidad) {
        throw new Error('La cantidad disponible no puede superar la cantidad total');
      }
      
      const nuevoEstado = nuevaCantidad > 0 ? 'disponible' : 'prestado';
      
      await this.actualizarMaterial(materialId, {
        cantidadDisponible: nuevaCantidad,
        estado: nuevoEstado
      });
      
    } catch (error) {
      throw this.handleError('actualizarCantidadDisponible', error);
    }
  }

  /**
   * Obtener estadísticas de material
   */
  async obtenerEstadisticasMaterial(): Promise<{
    buenEstado: number;
    enMantenimiento: number;
    prestados: number;
    bajaOPerdido: number;
    total: number;
  }> {
    try {
      const materiales = await this.listarMateriales();
      
      return {
        buenEstado: materiales.filter(m => m.estado === 'disponible').length,
        enMantenimiento: materiales.filter(m => m.estado === 'mantenimiento').length,
        prestados: materiales.filter(m => m.estado === 'prestado').length,
        bajaOPerdido: materiales.filter(m => m.estado === 'baja' || m.estado === 'perdido').length,
        total: materiales.length
      };
    } catch (error) {
      throw this.handleError('obtenerEstadisticasMaterial', error);
    }
  }

  /**
   * Buscar materiales disponibles para préstamo
   */
  async buscarMaterialesDisponibles(filtros?: { tipo?: string; cantidad?: number }): Promise<Material[]> {
    try {
      const constraints = [where('estado', '==', 'disponible')];
      
      if (filtros?.tipo) {
        constraints.push(where('tipo', '==', filtros.tipo));
      }
      
      const materiales = await this.getAll(constraints);
        // Filtrar por cantidad disponible si se especifica
      if (filtros?.cantidad) {
        return materiales.filter((m: Material) => 
          (m.cantidadDisponible || 1) >= filtros.cantidad!
        );
      }
      
      return materiales;
    } catch (error) {
      throw this.handleError('buscarMaterialesDisponibles', error);
    }
  }

  // Métodos privados de utilidad

  private determinarEstadoPorIncidencia(tipo: string): string {
    switch (tipo) {
      case 'daño':
        return 'revision';
      case 'perdida':
        return 'perdido';
      case 'mantenimiento':
        return 'mantenimiento';
      default:
        return 'revision';
    }
  }

  private async notificarNuevoMaterial(material: Material): Promise<void> {
    try {
      const usuarios = await listarUsuarios();
      const vocalesYAdmins = usuarios.filter((u: Usuario) => 
        u.rol === 'admin' || u.rol === 'vocal'
      );
      
      if (vocalesYAdmins.length > 0) {        await enviarNotificacionMasiva(
          vocalesYAdmins.map((u: Usuario) => u.uid),
          'material',
          `Nuevo material agregado: ${material.nombre}`,
          material.id!,
          'material',
          '/material'
        );
      }
    } catch (error) {
      console.error('Error al notificar nuevo material:', error);
    }
  }

  private async notificarEliminacionMaterial(material: Material): Promise<void> {
    try {
      const usuarios = await listarUsuarios();
      const vocalesYAdmins = usuarios.filter((u: Usuario) => 
        u.rol === 'admin' || u.rol === 'vocal'
      );
      
      if (vocalesYAdmins.length > 0) {        await enviarNotificacionMasiva(
          vocalesYAdmins.map((u: Usuario) => u.uid),
          'material',
          `Material eliminado: ${material.nombre}`,
          material.id!,
          'material',
          '/material'
        );
      }
    } catch (error) {
      console.error('Error al notificar eliminación de material:', error);
    }
  }

  private async enviarNotificacionIncidencia(
    material: Material,
    incidencia: { 
      descripcion: string;
      reportadoPor: string;
      tipo: string;
      gravedad?: string;
    }
  ): Promise<void> {
    try {
      const usuario = await obtenerUsuarioPorId(incidencia.reportadoPor);
      const nombreUsuario = usuario ? `${usuario.nombre} ${usuario.apellidos}` : 'Usuario desconocido';
      
      const usuarios = await listarUsuarios();
      const adminsYVocales = usuarios.filter((u: Usuario) => u.rol === 'admin' || u.rol === 'vocal');
      
      if (adminsYVocales.length > 0) {
        const gravedadTexto = incidencia.gravedad ? `[${incidencia.gravedad.toUpperCase()}] ` : '';
        const mensaje = `${gravedadTexto}Incidencia en ${material.nombre}: ${incidencia.tipo}. Reportado por ${nombreUsuario}`;
        
        await enviarNotificacionMasiva(
          adminsYVocales.map((u: Usuario) => u.uid),
          'incidencia',
          mensaje,
          material.id!,
          'material',
          '/material'
        );
      }
    } catch (error) {
      console.error('Error al enviar notificaciones de incidencia:', error);
    }
  }
}

// Crear instancia singleton
const materialService = new MaterialService();

// Exportar métodos públicos para mantener compatibilidad
export const crearMaterial = (data: Omit<Material, 'id'>) => materialService.crearMaterial(data);
export const listarMateriales = (filters?: { estado?: string; tipo?: string }) => materialService.listarMateriales(filters);
export const obtenerMaterial = (id: string) => materialService.obtenerMaterial(id);
export const actualizarMaterial = (id: string, data: Partial<Material>) => materialService.actualizarMaterial(id, data);
export const eliminarMaterial = (id: string) => materialService.eliminarMaterial(id);
export const registrarIncidenciaMaterial = materialService.registrarIncidenciaMaterial.bind(materialService);
export const actualizarCantidadDisponible = materialService.actualizarCantidadDisponible.bind(materialService);
export const obtenerEstadisticasMaterial = () => materialService.obtenerEstadisticasMaterial();
export const buscarMaterialesDisponibles = (filtros?: { tipo?: string; cantidad?: number }) => materialService.buscarMaterialesDisponibles(filtros);

// Exportar servicio para uso avanzado
export { materialService };
