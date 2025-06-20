/**
 * Repositorio para el historial de materiales por años
 * Gestiona el almacenamiento de eventos, resumenes anuales y estadísticas
 */
import { BaseRepository, QueryOptions } from './BaseRepository';
import { EventoMaterial, ResumenAnualMaterial } from '../types/materialHistorial';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface MaterialHistorialQueryOptions extends QueryOptions {
  año?: number;
  materialId?: string;
  tipoEvento?: string;
  gravedad?: string;
}

export class MaterialHistorialRepository extends BaseRepository<EventoMaterial> {
  constructor() {
    super({
      collectionName: 'material_historial',
      enableCache: true,
      cacheTTL: 30 * 60 * 1000 // 30 minutos
    });
  }

  protected async validateEntity(entity: Partial<EventoMaterial>): Promise<void> {
    if (!entity.materialId?.trim()) {
      throw new Error('El ID del material es obligatorio');
    }
    if (!entity.tipoEvento?.trim()) {
      throw new Error('El tipo de evento es obligatorio');
    }
    if (!entity.descripcion?.trim()) {
      throw new Error('La descripción del evento es obligatoria');
    }
    if (!entity.registradoPor?.trim()) {
      throw new Error('El usuario que registra el evento es obligatorio');
    }
  }

  /**
   * Crear múltiples eventos en una sola operación
   */
  async createMany(eventos: Omit<EventoMaterial, 'id'>[]): Promise<EventoMaterial[]> {
    // Validar todos los eventos
    for (const evento of eventos) {
      await this.validateEntity(evento);
    }

    // Crear en batch
    const nuevosEventos: EventoMaterial[] = [];
    
    for (const evento of eventos) {
      const nuevoEvento = await this.create(evento);
      nuevosEventos.push(nuevoEvento);
    }

    return nuevosEventos;
  }

  /**
   * Buscar eventos de un material específico en un año
   */
  async findEventosByMaterialYear(materialId: string, año: number): Promise<EventoMaterial[]> {
    // TEMPORAL: Comentar orderBy para evitar problema de índices
    // TODO: Crear índice compuesto en Firestore para materialId + año + fecha
    return await this.find({
      where: [
        { field: 'materialId', operator: '==', value: materialId },
        { field: 'año', operator: '==', value: año }
      ]
      // orderBy: [{ field: 'fecha', direction: 'desc' }]
    });
  }

  /**
   * Buscar eventos por tipo en un rango de fechas
   */
  async findEventosByTipo(tipoEvento: string, añoInicio?: number, añoFin?: number): Promise<EventoMaterial[]> {
    const where: any[] = [
      { field: 'tipoEvento', operator: '==', value: tipoEvento }
    ];

    if (añoInicio) {
      where.push({ field: 'año', operator: '>=', value: añoInicio });
    }
    if (añoFin) {
      where.push({ field: 'año', operator: '<=', value: añoFin });
    }

    // TEMPORAL: Comentar orderBy para evitar problema de índices
    // TODO: Crear índice compuesto en Firestore para tipoEvento + año + fecha
    return await this.find({
      where
      // orderBy: [{ field: 'fecha', direction: 'desc' }]
    });
  }

  /**
   * Buscar eventos con costo asociado
   */
  async findEventosConCosto(año?: number): Promise<EventoMaterial[]> {
    const where: any[] = [
      { field: 'costoAsociado', operator: '>', value: 0 }
    ];

    if (año) {
      where.push({ field: 'año', operator: '==', value: año });
    }

    // TEMPORAL: Comentar orderBy para evitar problema de índices
    // TODO: Crear índice compuesto en Firestore para costoAsociado + año + costoAsociado
    return await this.find({
      where
      // orderBy: [{ field: 'costoAsociado', direction: 'desc' }]
    });
  }

  /**
   * Obtener estadísticas de eventos por año
   */
  async getEstadisticasEventos(año: number): Promise<{
    totalEventos: number;
    eventosPorTipo: Record<string, number>;
    costoTotal: number;
    eventosPorMes: number[];
  }> {
    const eventos = await this.find({
      where: [{ field: 'año', operator: '==', value: año }]
    });

    const estadisticas = {
      totalEventos: eventos.length,
      eventosPorTipo: {} as Record<string, number>,
      costoTotal: 0,
      eventosPorMes: new Array(12).fill(0)
    };

    eventos.forEach(evento => {
      // Contar por tipo
      estadisticas.eventosPorTipo[evento.tipoEvento] = 
        (estadisticas.eventosPorTipo[evento.tipoEvento] || 0) + 1;
      
      // Sumar costos
      estadisticas.costoTotal += evento.costoAsociado || 0;
      
      // Contar por mes
      if (evento.mes >= 1 && evento.mes <= 12) {
        estadisticas.eventosPorMes[evento.mes - 1]++;
      }
    });

    return estadisticas;
  }

  // Métodos para resumenes anuales
  /**
   * Buscar resumen anual de un material específico
   */
  async findResumenAnual(materialId: string, año: number): Promise<ResumenAnualMaterial | null> {
    try {
      const resumenes = await getDocs(
        query(
          collection(db, 'material_resumenes_anuales'),
          where('materialId', '==', materialId),
          where('año', '==', año)
        )
      );

      if (resumenes.empty) {
        return null;
      }

      const doc = resumenes.docs[0];
      return { id: doc.id, ...doc.data() } as ResumenAnualMaterial;
    } catch (error) {
      console.error('Error al buscar resumen anual:', error);
      throw error;
    }
  }

  /**
   * Buscar todos los resumenes anuales de un año
   */
  async findResumenesAnuales(año: number): Promise<ResumenAnualMaterial[]> {
    try {
      const resumenes = await getDocs(
        query(
          collection(db, 'material_resumenes_anuales'),
          where('año', '==', año)
        )
      );

      return resumenes.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as ResumenAnualMaterial[];
    } catch (error) {
      console.error('Error al buscar resumenes anuales:', error);
      throw error;
    }
  }

  /**
   * Guardar o actualizar resumen anual
   */
  async saveResumenAnual(resumen: ResumenAnualMaterial): Promise<void> {
    try {
      const existente = await this.findResumenAnual(resumen.materialId, resumen.año);
      
      if (existente && existente.id) {
        // Actualizar existente
        await updateDoc(
          doc(db, 'material_resumenes_anuales', existente.id),
          resumen as any
        );
      } else {
        // Crear nuevo
        await addDoc(
          collection(db, 'material_resumenes_anuales'),
          resumen as any
        );
      }
    } catch (error) {
      console.error('Error al guardar resumen anual:', error);
      throw error;
    }
  }

  /**
   * Eliminar resumenes anuales antiguos
   */
  async archivarResumenesAntiguos(añosAArchiv: number): Promise<number> {
    const añoLimite = new Date().getFullYear() - añosAArchiv;
    
    try {
      const resumenes = await getDocs(
        query(
          collection(db, 'material_resumenes_anuales'),
          where('año', '<', añoLimite)
        )
      );

      let archivados = 0;
      for (const docSnapshot of resumenes.docs) {
        await deleteDoc(docSnapshot.ref);
        archivados++;
      }

      console.log(`📦 ${archivados} resumenes anuales archivados (anteriores a ${añoLimite})`);
      return archivados;
    } catch (error) {
      console.error('Error al archivar resumenes antiguos:', error);
      throw error;
    }
  }
}

// Instancia singleton del repositorio
export const materialHistorialRepository = new MaterialHistorialRepository();
