/**
 * Servicio de dominio para Actividades
 * Contiene toda la lógica de negocio relacionada con actividades
 * Utiliza repositorios para acceso a datos y mantiene separación de responsabilidades
 */
import { Actividad, EstadoActividad, TipoActividad, SubtipoActividad, MaterialAsignado } from '../../types/actividad';
import { Prestamo } from '../../types/prestamo';
import { actividadRepository, prestamoRepository } from '../../repositories';
import { validateActividad, getUniqueParticipanteIds } from '../../utils/actividadUtils';
import { determinarEstadoActividad } from '../../utils/dateUtils';
import * as prestamoService from '../prestamoService';
import { crearPrestamosParaActividad } from '../actividadService';
import { logger } from '../../utils/loggerUtils';
import { Timestamp } from 'firebase/firestore';
import { NotificacionService } from './NotificacionService';

export interface CreateActividadRequest {
  nombre: string;
  lugar: string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin: Date;
  tipo: TipoActividad[];
  subtipo: SubtipoActividad[];
  dificultad: 'baja' | 'media' | 'alta';
  responsableActividadId: string;
  responsableMaterialId?: string;
  participanteIds: string[];
  materiales: MaterialAsignado[];
  necesidadMaterial: boolean;
  creadorId: string;
}

export interface UpdateActividadRequest {
  id: string;
  data: Partial<Actividad>;
}

export interface ActividadFilters {
  estado?: EstadoActividad;
  tipo?: TipoActividad;
  participanteId?: string;
  creadorId?: string;
  responsableId?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  necesidadMaterial?: boolean;
}

export class ActividadService {
  constructor(
    private notificacionService: NotificacionService
  ) {}

  /**
   * Crear una nueva actividad
   */
  async crearActividad(request: CreateActividadRequest): Promise<Actividad> {
    try {
      // Validar los datos de entrada
      const validationError = validateActividad(request);
      if (validationError) {
        throw new Error(validationError);
      }

      // Generar participantes únicos
      const participanteIds = getUniqueParticipanteIds(
        request.participanteIds,
        request.creadorId,
        request.responsableActividadId,
        request.responsableMaterialId
      );

      // Convertir fechas a Timestamp
      const actividadData: Omit<Actividad, 'id'> = {
        ...request,
        participanteIds,
        fechaInicio: Timestamp.fromDate(request.fechaInicio),
        fechaFin: Timestamp.fromDate(request.fechaFin),
        estado: determinarEstadoActividad(request.fechaInicio, request.fechaFin),
        nombreNormalizado: request.nombre.trim().toLowerCase(),
        responsableActividadId: request.responsableActividadId || request.creadorId,
        comentarios: [],
        enlaces: [],
        imagenesTopografia: [],
        archivosAdjuntos: [],
        enlacesWikiloc: [],
        enlacesTopografias: [],
        enlacesDrive: [],
        enlacesWeb: []
      };      // Crear la actividad
      const nuevaActividad = await actividadRepository.create(actividadData);

      // Gestionar préstamos si es necesario
      if (nuevaActividad.necesidadMaterial && nuevaActividad.materiales.length > 0) {
        await crearPrestamosParaActividad(nuevaActividad);
      }

      // Enviar notificaciones
      await this.notificacionService.notificarNuevaActividad(nuevaActividad, nuevaActividad.participanteIds);

      logger.info('Actividad creada exitosamente', { actividadId: nuevaActividad.id });
      return nuevaActividad;

    } catch (error) {
      logger.error('Error creando actividad', error);
      throw error;
    }
  }

  /**
   * Actualizar una actividad existente
   */
  async actualizarActividad(request: UpdateActividadRequest): Promise<Actividad> {
    try {
      const { id, data } = request;

      // Obtener actividad actual
      const actividadActual = await actividadRepository.findById(id);
      if (!actividadActual) {
        throw new Error('Actividad no encontrada');
      }

      // Validar los datos de actualización
      const validationError = validateActividad({ ...actividadActual, ...data });
      if (validationError) {
        throw new Error(validationError);
      }

      // Procesar cambios especiales
      let updateData = { ...data };

      // Gestionar cambios en participantes
      if (data.participanteIds) {
        updateData.participanteIds = getUniqueParticipanteIds(
          data.participanteIds,
          actividadActual.creadorId,
          data.responsableActividadId || actividadActual.responsableActividadId,
          data.responsableMaterialId || actividadActual.responsableMaterialId
        );
      }      // Convertir fechas si es necesario
      if (data.fechaInicio) {
        const fechaInicio = data.fechaInicio instanceof Date ? data.fechaInicio : 
          (data.fechaInicio instanceof Timestamp ? data.fechaInicio.toDate() : new Date(data.fechaInicio));
        updateData.fechaInicio = Timestamp.fromDate(fechaInicio);
      }
      if (data.fechaFin) {
        const fechaFin = data.fechaFin instanceof Date ? data.fechaFin : 
          (data.fechaFin instanceof Timestamp ? data.fechaFin.toDate() : new Date(data.fechaFin));
        updateData.fechaFin = Timestamp.fromDate(fechaFin);
      }      // Determinar estado automáticamente si cambiaron las fechas
      if (data.fechaInicio || data.fechaFin) {
        const fechaInicio = data.fechaInicio ? 
          (data.fechaInicio instanceof Date ? data.fechaInicio : 
           data.fechaInicio instanceof Timestamp ? data.fechaInicio.toDate() : new Date(data.fechaInicio)) :
          (actividadActual.fechaInicio instanceof Timestamp ? 
           actividadActual.fechaInicio.toDate() : 
           new Date(actividadActual.fechaInicio));
           
        const fechaFin = data.fechaFin ? 
          (data.fechaFin instanceof Date ? data.fechaFin : 
           data.fechaFin instanceof Timestamp ? data.fechaFin.toDate() : new Date(data.fechaFin)) :
          (actividadActual.fechaFin instanceof Timestamp ? 
           actividadActual.fechaFin.toDate() : 
           new Date(actividadActual.fechaFin));
        
        updateData.estado = determinarEstadoActividad(fechaInicio, fechaFin, data.estado);
      }

      // Actualizar nombre normalizado si cambió el nombre
      if (data.nombre) {
        updateData.nombreNormalizado = data.nombre.trim().toLowerCase();
      }

      // Actualizar la actividad
      const actividadActualizada = await actividadRepository.update(id, updateData);      // Gestionar cambios en materiales y préstamos
      if (data.materiales !== undefined || data.necesidadMaterial !== undefined) {
        // TODO: Implementar sincronización de préstamos para actividad
        // await prestamoService.sincronizarPrestamosActividad(actividadActualizada);
      }

      logger.info('Actividad actualizada exitosamente', { actividadId: id });
      return actividadActualizada;

    } catch (error) {
      logger.error('Error actualizando actividad', error);
      throw error;
    }
  }

  /**
   * Obtener una actividad por ID
   */
  async obtenerActividad(id: string): Promise<Actividad | null> {
    try {
      return await actividadRepository.findById(id);
    } catch (error) {
      logger.error('Error obteniendo actividad', error);
      throw error;
    }
  }

  /**
   * Listar actividades con filtros
   */
  async listarActividades(filters: ActividadFilters = {}): Promise<Actividad[]> {
    try {
      return await actividadRepository.findActividades(filters);
    } catch (error) {
      logger.error('Error listando actividades', error);
      throw error;
    }
  }

  /**
   * Obtener actividades próximas
   */
  async obtenerActividadesProximas(limit: number = 10): Promise<Actividad[]> {
    try {
      return await actividadRepository.findProximasActividades(limit);
    } catch (error) {
      logger.error('Error obteniendo actividades próximas', error);
      throw error;
    }
  }

  /**
   * Obtener actividades de un usuario
   */
  async obtenerActividadesUsuario(usuarioId: string): Promise<{
    participante: Actividad[];
    responsable: Actividad[];
    creador: Actividad[];
  }> {
    try {
      return await actividadRepository.findActividadesUsuario(usuarioId);
    } catch (error) {
      logger.error('Error obteniendo actividades del usuario', error);
      throw error;
    }
  }

  /**
   * Unirse a una actividad
   */
  async unirseActividad(actividadId: string, usuarioId: string): Promise<Actividad> {
    try {
      // Verificar si el usuario puede unirse
      const puedeUnirse = await actividadRepository.canUserJoin(actividadId, usuarioId);
      if (!puedeUnirse) {
        throw new Error('No es posible unirse a esta actividad');
      }

      // Unirse a la actividad
      const actividad = await actividadRepository.addParticipante(actividadId, usuarioId);

      // Notificar al responsable
      await this.notificacionService.notificarNuevoParticipante(actividad, usuarioId);

      logger.info('Usuario se unió a actividad', { actividadId, usuarioId });
      return actividad;

    } catch (error) {
      logger.error('Error uniéndose a actividad', error);
      throw error;
    }
  }

  /**
   * Abandonar una actividad
   */
  async abandonarActividad(actividadId: string, usuarioId: string): Promise<Actividad> {
    try {
      const actividad = await actividadRepository.removeParticipante(actividadId, usuarioId);

      // Notificar al responsable
      await this.notificacionService.notificarParticipanteAbandona(actividad, usuarioId);

      logger.info('Usuario abandonó actividad', { actividadId, usuarioId });
      return actividad;

    } catch (error) {
      logger.error('Error abandonando actividad', error);
      throw error;
    }
  }

  /**
   * Cancelar una actividad
   */
  async cancelarActividad(id: string, motivo: string): Promise<Actividad> {
    try {
      const actividad = await actividadRepository.update(id, {
        estado: 'cancelada'
      });      // Liberar préstamos asociados
      const prestamosActividad = await prestamoService.obtenerPrestamosPorActividad(id);
      for (const prestamo of prestamosActividad) {
        if (prestamo.estado !== 'devuelto') {
          await prestamoService.registrarDevolucion(prestamo.id!, 'Actividad cancelada');
        }
      }

      // Notificar a todos los participantes
      await this.notificacionService.notificarActividadCancelada(actividad, motivo);

      logger.info('Actividad cancelada', { actividadId: id, motivo });
      return actividad;

    } catch (error) {
      logger.error('Error cancelando actividad', error);
      throw error;
    }
  }

  /**
   * Finalizar una actividad
   */
  async finalizarActividad(id: string): Promise<Actividad> {
    try {
      const actividad = await actividadRepository.update(id, {
        estado: 'finalizada'
      });

      // Notificar sobre devolución de materiales si aplica
      if (actividad.necesidadMaterial && actividad.responsableMaterialId) {
        await this.notificacionService.notificarDevolucionMaterial(actividad);
      }

      logger.info('Actividad finalizada', { actividadId: id });
      return actividad;

    } catch (error) {
      logger.error('Error finalizando actividad', error);
      throw error;
    }
  }

  /**
   * Eliminar una actividad
   */
  async eliminarActividad(id: string): Promise<void> {
    try {      // Verificar que no tenga préstamos activos
      const prestamosActivos = await prestamoRepository.findPrestamosByActividad(id);
      const tieneActivos = prestamosActivos.some((p: Prestamo) => p.estado !== 'devuelto');
      
      if (tieneActivos) {
        throw new Error('No se puede eliminar una actividad con préstamos activos');
      }

      // Eliminar la actividad
      await actividadRepository.delete(id);

      logger.info('Actividad eliminada', { actividadId: id });

    } catch (error) {
      logger.error('Error eliminando actividad', error);
      throw error;
    }
  }

  /**
   * Buscar actividades por texto
   */
  async buscarActividades(searchText: string): Promise<Actividad[]> {
    try {
      return await actividadRepository.search(searchText);
    } catch (error) {
      logger.error('Error buscando actividades', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de actividades
   */
  async obtenerEstadisticas(): Promise<{
    total: number;
    porEstado: Record<EstadoActividad, number>;
    porTipo: Record<string, number>;
    conMaterial: number;
    sinMaterial: number;
  }> {
    try {
      return await actividadRepository.getEstadisticas();
    } catch (error) {
      logger.error('Error obteniendo estadísticas de actividades', error);
      throw error;
    }
  }

  /**
   * Obtener actividades por rango de fechas
   */
  async obtenerActividadesPorFechas(fechaInicio: Date, fechaFin: Date): Promise<Actividad[]> {
    try {
      return await actividadRepository.findByDateRange(fechaInicio, fechaFin);
    } catch (error) {
      logger.error('Error obteniendo actividades por fechas', error);
      throw error;
    }
  }

  /**
   * Verificar conflictos de horario para un usuario
   */
  async verificarConflictosHorario(
    usuarioId: string, 
    fechaInicio: Date, 
    fechaFin: Date, 
    excluirActividadId?: string
  ): Promise<Actividad[]> {
    try {
      const actividadesUsuario = await actividadRepository.findActividades({
        participanteId: usuarioId
      });

      return actividadesUsuario.filter(actividad => {
        // Excluir la actividad actual si se especifica
        if (excluirActividadId && actividad.id === excluirActividadId) {
          return false;
        }

        // Solo considerar actividades no canceladas
        if (actividad.estado === 'cancelada') {
          return false;
        }

        // Verificar solapamiento de fechas
        const actFechaInicio = actividad.fechaInicio instanceof Timestamp ? 
          actividad.fechaInicio.toDate() : new Date(actividad.fechaInicio);
        const actFechaFin = actividad.fechaFin instanceof Timestamp ? 
          actividad.fechaFin.toDate() : new Date(actividad.fechaFin);

        return (fechaInicio < actFechaFin && fechaFin > actFechaInicio);
      });
    } catch (error) {
      logger.error('Error verificando conflictos de horario', error);
      throw error;
    }
  }
}
