/**
 * Repositorio para Usuarios
 * Gestiona el acceso a datos de usuarios con funcionalidades específicas del dominio
 */
import { BaseRepository, QueryOptions } from './BaseRepository';
import { Usuario, RolUsuario } from '../types/usuario';
import { EstadoAprobacion, EstadoActividad } from '../types/usuarioHistorial';
import { getEstadoActivoLegacy } from '../utils/migracionUsuarios';

export interface UsuarioQueryOptions extends QueryOptions {
  rol?: RolUsuario;
  estadoAprobacion?: EstadoAprobacion;
  estadoActividad?: EstadoActividad;
  // Mantener temporalmente para migración gradual
  activo?: boolean;
  pendienteVerificacion?: boolean;
  searchText?: string;
}

export class UsuarioRepository extends BaseRepository<Usuario> {
  constructor() {
    super({
      collectionName: 'usuarios',
      enableCache: true,
      cacheTTL: 30 * 60 * 1000 // 30 minutos
    });
  }

  protected async validateEntity(entity: Partial<Usuario>): Promise<void> {
    if (!entity.email?.trim()) {
      throw new Error('El email es obligatorio');
    }
    if (!entity.nombre?.trim()) {
      throw new Error('El nombre es obligatorio');
    }
    if (!entity.apellidos?.trim()) {
      throw new Error('Los apellidos son obligatorios');
    }
    if (entity.rol && !['invitado', 'socio', 'vocal', 'admin'].includes(entity.rol)) {
      throw new Error('Rol no válido');
    }
  }

  /**
   * Buscar usuarios con filtros específicos
   */
  async findUsuarios(options: UsuarioQueryOptions = {}): Promise<Usuario[]> {
    const queryOptions: QueryOptions = {
      orderBy: options.orderBy || [{ field: 'nombre', direction: 'asc' }],
      limit: options.limit,
      where: []
    };

    // Filtro por rol
    if (options.rol) {
      queryOptions.where!.push({
        field: 'rol',
        operator: '==',
        value: options.rol
      });
    }    // Filtro por estado de aprobación
    if (options.estadoAprobacion) {
      queryOptions.where!.push({
        field: 'estadoAprobacion',
        operator: '==',
        value: options.estadoAprobacion
      });
    }

    // Filtro por estado de actividad
    if (options.estadoActividad) {
      queryOptions.where!.push({
        field: 'estadoActividad',
        operator: '==',
        value: options.estadoActividad
      });
    }

    // Filtro por estado activo legacy (solo para compatibilidad temporal)
    if (options.activo !== undefined) {
      // No podemos filtrar directamente en la consulta, necesitamos filtrar en memoria
      console.warn('Usando filtro legacy "activo". Considere migrar a estadoAprobacion/estadoActividad');
    }

    // Filtro por verificación pendiente
    if (options.pendienteVerificacion !== undefined) {
      queryOptions.where!.push({
        field: 'pendienteVerificacion',
        operator: '==',
        value: options.pendienteVerificacion
      });
    }

    // Excluir usuarios eliminados por defecto
    queryOptions.where!.push({
      field: 'eliminado',
      operator: '!=',
      value: true
    });

    // Aplicar filtros WHERE adicionales
    if (options.where) {
      queryOptions.where!.push(...options.where);
    }    const usuarios = await this.find(queryOptions);

    // Aplicar filtros adicionales en memoria
    let usuariosFiltrados = usuarios;

    // Filtro por estado activo legacy (temporal)
    if (options.activo !== undefined) {
      usuariosFiltrados = usuariosFiltrados.filter(usuario => 
        getEstadoActivoLegacy(usuario) === options.activo
      );
    }

    // Filtrar por texto de búsqueda si se proporciona
    if (options.searchText) {
      const searchLower = options.searchText.toLowerCase();
      usuariosFiltrados = usuariosFiltrados.filter(usuario => 
        usuario.nombre.toLowerCase().includes(searchLower) ||
        usuario.apellidos.toLowerCase().includes(searchLower) ||
        usuario.email.toLowerCase().includes(searchLower) ||
        (usuario.telefono && usuario.telefono.includes(options.searchText!))
      );
    }

    return usuariosFiltrados;
  }

  /**
   * Buscar usuario por email
   */
  async findByEmail(email: string): Promise<Usuario | null> {
    const usuarios = await this.find({
      where: [
        { field: 'email', operator: '==', value: email.toLowerCase() }
      ],
      limit: 1
    });

    return usuarios.length > 0 ? usuarios[0] : null;
  }

  /**
   * Obtener usuarios activos
   */
  async findUsuariosActivos(): Promise<Usuario[]> {
    return this.findUsuarios({
      activo: true
    });
  }

  /**
   * Obtener usuarios por rol
   */
  async findByRol(rol: RolUsuario): Promise<Usuario[]> {
    return this.findUsuarios({
      rol
    });
  }

  /**
   * Obtener administradores y vocales
   */
  async findAdminsYVocales(): Promise<Usuario[]> {
    const admins = await this.findByRol('admin');
    const vocales = await this.findByRol('vocal');
    return [...admins, ...vocales];
  }

  /**
   * Obtener usuarios pendientes de verificación
   */
  async findPendientesVerificacion(): Promise<Usuario[]> {
    return this.findUsuarios({
      pendienteVerificacion: true,
      activo: true
    });
  }

  /**
   * Buscar usuarios por texto
   */
  async search(searchText: string): Promise<Usuario[]> {
    return this.findUsuarios({
      searchText
    });
  }

  /**
   * Verificar si un email ya existe
   */
  async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const usuarios = await this.find({
      where: [
        { field: 'email', operator: '==', value: email.toLowerCase() }
      ]
    });    if (excludeUserId) {
      return usuarios.some(usuario => usuario.uid !== excludeUserId);
    }

    return usuarios.length > 0;
  }
  /**
   * Activar un usuario (aprobar y activar)
   */
  async activar(usuarioId: string): Promise<Usuario> {
    return this.update(usuarioId, {
      estadoAprobacion: EstadoAprobacion.APROBADO,
      estadoActividad: EstadoActividad.ACTIVO,
      pendienteVerificacion: false
    });
  }
  /**
   * Desactivar un usuario
   */
  async desactivar(usuarioId: string): Promise<Usuario> {
    return this.update(usuarioId, {
      estadoActividad: EstadoActividad.INACTIVO
    });
  }

  /**
   * Cambiar rol de un usuario
   */
  async cambiarRol(usuarioId: string, nuevoRol: RolUsuario): Promise<Usuario> {
    return this.update(usuarioId, {
      rol: nuevoRol
    });
  }
  /**
   * Marcar como eliminado (soft delete)
   */
  async marcarComoEliminado(usuarioId: string): Promise<Usuario> {
    return this.update(usuarioId, {
      estadoAprobacion: EstadoAprobacion.RECHAZADO,
      estadoActividad: EstadoActividad.INACTIVO,
      eliminado: true,
      fechaEliminacion: new Date() as any
    });
  }

  /**
   * Actualizar última conexión
   */
  async updateUltimaConexion(usuarioId: string): Promise<void> {
    await this.update(usuarioId, {
      ultimaConexion: new Date() as any
    });
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getEstadisticas(): Promise<{
    total: number;
    activos: number;
    inactivos: number;
    pendientesVerificacion: number;
    porRol: Record<RolUsuario, number>;
    ultimosRegistros: Usuario[];
  }> {
    const todosUsuarios = await this.find();
    
    const estadisticas = {
      total: todosUsuarios.length,
      activos: 0,
      inactivos: 0,
      pendientesVerificacion: 0,
      porRol: {} as Record<RolUsuario, number>,
      ultimosRegistros: [] as Usuario[]
    };

    // Inicializar contadores por rol
    const roles: RolUsuario[] = ['invitado', 'socio', 'vocal', 'admin'];
    roles.forEach(rol => {
      estadisticas.porRol[rol] = 0;
    });    // Calcular estadísticas
    todosUsuarios.forEach(usuario => {
      // Estados generales (usando lógica de migración)
      if (getEstadoActivoLegacy(usuario)) {
        estadisticas.activos++;
      } else {
        estadisticas.inactivos++;
      }

      if (usuario.pendienteVerificacion) {
        estadisticas.pendientesVerificacion++;
      }

      // Por rol
      estadisticas.porRol[usuario.rol]++;
    });

    // Últimos registros (últimos 10)
    estadisticas.ultimosRegistros = todosUsuarios
      .sort((a, b) => {
        const fechaA = a.fechaRegistro instanceof Date ? a.fechaRegistro : new Date(a.fechaRegistro as any);
        const fechaB = b.fechaRegistro instanceof Date ? b.fechaRegistro : new Date(b.fechaRegistro as any);
        return fechaB.getTime() - fechaA.getTime();
      })
      .slice(0, 10);

    return estadisticas;
  }

  /**
   * Obtener usuarios por IDs
   */
  async findByIds(userIds: string[]): Promise<Usuario[]> {
    if (userIds.length === 0) return [];

    // Firebase no soporta consultas IN con más de 10 elementos
    // Dividir en lotes si es necesario
    const batchSize = 10;
    const batches: string[][] = [];
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      batches.push(userIds.slice(i, i + batchSize));
    }

    const resultados: Usuario[] = [];
    
    for (const batch of batches) {
      const usuarios = await this.find({
        where: [
          { field: '__name__', operator: 'in', value: batch }
        ]
      });
      resultados.push(...usuarios);
    }

    return resultados;
  }
  /**
   * Verificar permisos de un usuario
   */
  async hasPermission(usuarioId: string, permission: 'admin' | 'vocal' | 'socio'): Promise<boolean> {
    const usuario = await this.findById(usuarioId);
    if (!usuario || !getEstadoActivoLegacy(usuario)) return false;

    switch (permission) {
      case 'admin':
        return usuario.rol === 'admin';
      case 'vocal':
        return usuario.rol === 'admin' || usuario.rol === 'vocal';
      case 'socio':
        return ['admin', 'vocal', 'socio'].includes(usuario.rol);
      default:
        return false;
    }
  }
}
