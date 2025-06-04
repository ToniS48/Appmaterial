/**
 * Repositorio específico para Actividades
 * Extiende BaseRepository con funcionalidades específicas del dominio
 */
import { where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { BaseRepository, QueryOptions } from './BaseRepository';
import { Actividad, EstadoActividad, TipoActividad } from '../types/actividad';
import { validateActividad } from '../utils/actividadUtils';

export interface ActividadQueryOptions extends QueryOptions {
  estado?: EstadoActividad;
  tipo?: TipoActividad;
  participanteId?: string;
  creadorId?: string;
  responsableId?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  necesidadMaterial?: boolean;
}

export class ActividadRepository extends BaseRepository<Actividad> {
  constructor() {
    super({
      collectionName: 'actividades',
      enableCache: true,
      cacheTTL: 10 * 60 * 1000 // 10 minutos
    });
  }

  protected async validateEntity(entity: Partial<Actividad>): Promise<void> {
    const validationError = validateActividad(entity);
    if (validationError) {
      throw new Error(validationError);
    }
  }

  /**
   * Buscar actividades con filtros específicos del dominio
   */
  async findActividades(options: ActividadQueryOptions = {}): Promise<Actividad[]> {
    const queryOptions: QueryOptions = {
      orderBy: options.orderBy || [{ field: 'fechaInicio', direction: 'desc' }],
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

    // Filtro por tipo (usando array-contains para arrays)
    if (options.tipo) {
      queryOptions.where!.push({
        field: 'tipo',
        operator: 'array-contains',
        value: options.tipo
      });
    }

    // Filtro por participante
    if (options.participanteId) {
      queryOptions.where!.push({
        field: 'participanteIds',
        operator: 'array-contains',
        value: options.participanteId
      });
    }

    // Filtro por creador
    if (options.creadorId) {
      queryOptions.where!.push({
        field: 'creadorId',
        operator: '==',
        value: options.creadorId
      });
    }

    // Filtro por responsable (actividad o material)
    if (options.responsableId) {
      // Este filtro es más complejo y puede requerir múltiples consultas
      // Por simplicidad, filtraremos por responsableActividadId primero
      queryOptions.where!.push({
        field: 'responsableActividadId',
        operator: '==',
        value: options.responsableId
      });
    }

    // Filtro por necesidad de material
    if (options.necesidadMaterial !== undefined) {
      queryOptions.where!.push({
        field: 'necesidadMaterial',
        operator: '==',
        value: options.necesidadMaterial
      });
    }

    // Aplicar filtros WHERE adicionales
    if (options.where) {
      queryOptions.where!.push(...options.where);
    }

    return this.find(queryOptions);
  }

  /**
   * Obtener actividades próximas
   */
  async findProximasActividades(limit: number = 10): Promise<Actividad[]> {
    const ahora = Timestamp.now();
    
    return this.find({
      where: [
        { field: 'fechaInicio', operator: '>=', value: ahora },
        { field: 'estado', operator: '!=', value: 'cancelada' }
      ],
      orderBy: [{ field: 'fechaInicio', direction: 'asc' }],
      limit
    });
  }

  /**
   * Obtener actividades de un usuario (como participante, responsable o creador)
   */
  async findActividadesUsuario(usuarioId: string): Promise<{
    participante: Actividad[];
    responsable: Actividad[];
    creador: Actividad[];
  }> {
    // Actividades como participante
    const participante = await this.findActividades({
      participanteId: usuarioId
    });

    // Actividades como creador
    const creador = await this.findActividades({
      creadorId: usuarioId
    });

    // Actividades como responsable
    const responsable = await this.findActividades({
      responsableId: usuarioId
    });

    return { participante, creador, responsable };
  }

  /**
   * Obtener actividades por rango de fechas
   */
  async findByDateRange(fechaInicio: Date, fechaFin: Date): Promise<Actividad[]> {
    const timestampInicio = Timestamp.fromDate(fechaInicio);
    const timestampFin = Timestamp.fromDate(fechaFin);

    return this.find({
      where: [
        { field: 'fechaInicio', operator: '>=', value: timestampInicio },
        { field: 'fechaInicio', operator: '<=', value: timestampFin }
      ],
      orderBy: [{ field: 'fechaInicio', direction: 'asc' }]
    });
  }

  /**
   * Buscar actividades por texto (nombre o descripción)
   */
  async search(searchText: string): Promise<Actividad[]> {
    const searchLower = searchText.toLowerCase();
    
    // Firebase no soporta búsqueda de texto completo nativamente
    // Esta es una implementación básica que busca por nombre normalizado
    return this.find({
      where: [
        { field: 'nombreNormalizado', operator: '>=', value: searchLower },
        { field: 'nombreNormalizado', operator: '<=', value: searchLower + '\uf8ff' }
      ],
      orderBy: [{ field: 'nombreNormalizado', direction: 'asc' }]
    });
  }

  /**
   * Obtener estadísticas de actividades
   */
  async getEstadisticas(): Promise<{
    total: number;
    porEstado: Record<EstadoActividad, number>;
    porTipo: Record<string, number>;
    conMaterial: number;
    sinMaterial: number;
  }> {
    const todasActividades = await this.find();
    
    const estadisticas = {
      total: todasActividades.length,
      porEstado: {} as Record<EstadoActividad, number>,
      porTipo: {} as Record<string, number>,
      conMaterial: 0,
      sinMaterial: 0
    };

    // Inicializar contadores
    const estados: EstadoActividad[] = ['planificada', 'en_curso', 'finalizada', 'cancelada'];
    estados.forEach(estado => {
      estadisticas.porEstado[estado] = 0;
    });

    // Contar por categorías
    todasActividades.forEach(actividad => {
      // Por estado
      estadisticas.porEstado[actividad.estado]++;

      // Por tipo
      actividad.tipo.forEach(tipo => {
        estadisticas.porTipo[tipo] = (estadisticas.porTipo[tipo] || 0) + 1;
      });

      // Por necesidad de material
      if (actividad.necesidadMaterial) {
        estadisticas.conMaterial++;
      } else {
        estadisticas.sinMaterial++;
      }
    });

    return estadisticas;
  }

  /**
   * Verificar si un usuario puede unirse a una actividad
   */
  async canUserJoin(actividadId: string, usuarioId: string): Promise<boolean> {
    const actividad = await this.findById(actividadId);
    if (!actividad) return false;

    // Verificar que no esté ya inscrito
    const yaInscrito = actividad.participanteIds?.includes(usuarioId) || false;
    if (yaInscrito) return false;

    // Verificar estado de la actividad
    if (actividad.estado === 'cancelada' || actividad.estado === 'finalizada') {
      return false;
    }

    // Verificar fecha (no puede unirse a actividades pasadas)
    const fechaInicio = actividad.fechaInicio instanceof Timestamp ? 
      actividad.fechaInicio.toDate() : new Date(actividad.fechaInicio);
    
    if (fechaInicio < new Date()) return false;

    return true;
  }

  /**
   * Añadir participante a una actividad
   */
  async addParticipante(actividadId: string, usuarioId: string): Promise<Actividad> {
    const canJoin = await this.canUserJoin(actividadId, usuarioId);
    if (!canJoin) {
      throw new Error('El usuario no puede unirse a esta actividad');
    }

    const actividad = await this.findById(actividadId);
    if (!actividad) {
      throw new Error('Actividad no encontrada');
    }

    const participantesActuales = actividad.participanteIds || [];
    const nuevosParticipantes = [...participantesActuales, usuarioId];

    return this.update(actividadId, {
      participanteIds: nuevosParticipantes
    });
  }

  /**
   * Remover participante de una actividad
   */
  async removeParticipante(actividadId: string, usuarioId: string): Promise<Actividad> {
    const actividad = await this.findById(actividadId);
    if (!actividad) {
      throw new Error('Actividad no encontrada');
    }

    const participantesActuales = actividad.participanteIds || [];
    const nuevosParticipantes = participantesActuales.filter(id => id !== usuarioId);

    return this.update(actividadId, {
      participanteIds: nuevosParticipantes
    });
  }
}
