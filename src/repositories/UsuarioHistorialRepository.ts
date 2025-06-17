/**
 * Repository para el historial y seguimiento de usuarios
 * Gestiona eventos, estadísticas y análisis de usuarios
 */
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  startAfter,
  Timestamp,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { BaseRepository } from './BaseRepository';
import { 
  EventoUsuario, 
  ResumenAnualUsuarios, 
  FiltroHistorialUsuarios,
  TipoEventoUsuario,
  EstadoAprobacion,
  EstadoActividad
} from '../types/usuarioHistorial';

export class UsuarioHistorialRepository extends BaseRepository<EventoUsuario> {
  protected collectionName = 'usuarioHistorial';
  private resumenCollection = 'resumenAnualUsuarios';

  constructor() {
    super({
      collectionName: 'usuarioHistorial',
      enableCache: true,
      cacheTTL: 5 * 60 * 1000 // 5 minutos
    });
  }

  /**
   * Validación de entidad para BaseRepository
   */
  protected async validateEntity(evento: Partial<EventoUsuario>): Promise<void> {
    if (!evento.usuarioId) {
      throw new Error('usuarioId es requerido');
    }
    if (!evento.tipoEvento) {
      throw new Error('tipoEvento es requerido');
    }
    if (!evento.descripcion) {
      throw new Error('descripcion es requerida');
    }
  }

  /**
   * Registrar un evento en el historial de usuario
   */
  async registrarEvento(evento: Omit<EventoUsuario, 'id' | 'fechaRegistro'>): Promise<EventoUsuario> {
    try {
      const eventoCompleto = {
        ...evento,
        fechaRegistro: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.collectionName), eventoCompleto);
      
      return {
        id: docRef.id,
        ...eventoCompleto
      } as EventoUsuario;
    } catch (error) {
      console.error('Error al registrar evento de usuario:', error);
      throw new Error('No se pudo registrar el evento del usuario');
    }
  }

  /**
   * Registrar múltiples eventos en batch
   */
  async registrarEventosBulk(eventos: Omit<EventoUsuario, 'id' | 'fechaRegistro'>[]): Promise<string[]> {
    try {
      const batch = writeBatch(db);
      const ids: string[] = [];

      for (const evento of eventos) {
        const docRef = doc(collection(db, this.collectionName));
        const eventoCompleto = {
          ...evento,
          fechaRegistro: Timestamp.now()
        };
        
        batch.set(docRef, eventoCompleto);
        ids.push(docRef.id);
      }

      await batch.commit();
      return ids;
    } catch (error) {
      console.error('Error al registrar eventos bulk:', error);
      throw new Error('No se pudieron registrar los eventos');
    }
  }

  /**
   * Obtener eventos de usuario por filtros
   */
  async obtenerEventosPorFiltros(filtros: FiltroHistorialUsuarios): Promise<EventoUsuario[]> {
    try {
      let q = collection(db, this.collectionName);
      let queryConstraints: any[] = [];

      // Aplicar filtros
      if (filtros.usuarioId) {
        queryConstraints.push(where('usuarioId', '==', filtros.usuarioId));
      }

      if (filtros.tipoEvento) {
        if (Array.isArray(filtros.tipoEvento)) {
          queryConstraints.push(where('tipoEvento', 'in', filtros.tipoEvento));
        } else {
          queryConstraints.push(where('tipoEvento', '==', filtros.tipoEvento));
        }
      }

      if (filtros.año) {
        queryConstraints.push(where('año', '==', filtros.año));
      }

      if (filtros.mes) {
        queryConstraints.push(where('mes', '==', filtros.mes));
      }

      if (filtros.responsableId) {
        queryConstraints.push(where('responsableId', '==', filtros.responsableId));
      }

      if (filtros.gravedad) {
        queryConstraints.push(where('gravedad', '==', filtros.gravedad));
      }

      // Ordenar por fecha descendente
      queryConstraints.push(orderBy('fecha', 'desc'));

      // Limitar resultados
      if (filtros.limit) {
        queryConstraints.push(firestoreLimit(filtros.limit));
      }

      const consultaFinal = query(q, ...queryConstraints);
      const snapshot = await getDocs(consultaFinal);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventoUsuario[];

    } catch (error) {
      console.error('Error al obtener eventos filtrados:', error);
      throw new Error('No se pudieron obtener los eventos');
    }
  }

  /**
   * Obtener eventos de un año específico
   */
  async obtenerEventosPorAño(año: number): Promise<EventoUsuario[]> {
    return this.obtenerEventosPorFiltros({ año, limit: 1000 });
  }

  /**
   * Obtener eventos de un usuario específico
   */
  async obtenerEventosPorUsuario(usuarioId: string, limit?: number): Promise<EventoUsuario[]> {
    return this.obtenerEventosPorFiltros({ usuarioId, limit: limit || 100 });
  }

  /**
   * Obtener eventos recientes
   */
  async obtenerEventosRecientes(limit: number = 50): Promise<EventoUsuario[]> {
    return this.obtenerEventosPorFiltros({ limit });
  }

  /**
   * Obtener eventos por tipo
   */
  async obtenerEventosPorTipo(tipoEvento: TipoEventoUsuario | TipoEventoUsuario[], limit?: number): Promise<EventoUsuario[]> {
    return this.obtenerEventosPorFiltros({ tipoEvento, limit });
  }

  /**
   * Guardar resumen anual
   */
  async guardarResumenAnual(resumen: Omit<ResumenAnualUsuarios, 'id'>): Promise<string> {
    try {
      // Buscar si ya existe un resumen para ese año
      const q = query(
        collection(db, this.resumenCollection),
        where('año', '==', resumen.año)
      );
      
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        // Actualizar existente
        const docId = existing.docs[0].id;
        await updateDoc(doc(db, this.resumenCollection, docId), {
          ...resumen,
          fechaCalculo: Timestamp.now()
        });
        return docId;
      } else {
        // Crear nuevo
        const docRef = await addDoc(collection(db, this.resumenCollection), {
          ...resumen,
          fechaCalculo: Timestamp.now()
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('Error al guardar resumen anual:', error);
      throw new Error('No se pudo guardar el resumen anual');
    }
  }

  /**
   * Obtener resumen anual
   */
  async obtenerResumenAnual(año: number): Promise<ResumenAnualUsuarios | null> {
    try {
      const q = query(
        collection(db, this.resumenCollection),
        where('año', '==', año)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as ResumenAnualUsuarios;
      
    } catch (error) {
      console.error('Error al obtener resumen anual:', error);
      throw new Error('No se pudo obtener el resumen anual');
    }
  }

  /**
   * Obtener estadísticas rápidas de un usuario
   */
  async obtenerEstadisticasUsuario(usuarioId: string): Promise<{
    totalEventos: number;
    ultimoEvento?: EventoUsuario;
    eventosPorTipo: Record<TipoEventoUsuario, number>;
    diasDesdeUltimoEvento?: number;
  }> {
    try {
      const eventos = await this.obtenerEventosPorUsuario(usuarioId);
      
      const estadisticas = {
        totalEventos: eventos.length,
        ultimoEvento: eventos[0], // Ya están ordenados por fecha desc
        eventosPorTipo: {} as Record<TipoEventoUsuario, number>,
        diasDesdeUltimoEvento: undefined as number | undefined
      };

      // Contar eventos por tipo
      for (const evento of eventos) {
        estadisticas.eventosPorTipo[evento.tipoEvento] = 
          (estadisticas.eventosPorTipo[evento.tipoEvento] || 0) + 1;
      }

      // Calcular días desde último evento
      if (estadisticas.ultimoEvento) {
        const fechaUltimo = estadisticas.ultimoEvento.fecha instanceof Timestamp 
          ? estadisticas.ultimoEvento.fecha.toDate() 
          : new Date(estadisticas.ultimoEvento.fecha);
        
        estadisticas.diasDesdeUltimoEvento = Math.floor(
          (new Date().getTime() - fechaUltimo.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      return estadisticas;
    } catch (error) {
      console.error('Error al obtener estadísticas de usuario:', error);
      throw new Error('No se pudieron obtener las estadísticas del usuario');
    }
  }

  /**
   * Eliminar eventos antiguos (para limpieza de datos)
   */
  async limpiarEventosAntiguos(añosAtras: number): Promise<number> {
    try {
      const fechaLimite = new Date();
      fechaLimite.setFullYear(fechaLimite.getFullYear() - añosAtras);
      
      const q = query(
        collection(db, this.collectionName),
        where('fecha', '<', Timestamp.fromDate(fechaLimite))
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`🧹 Eliminados ${snapshot.docs.length} eventos antiguos`);
      return snapshot.docs.length;
      
    } catch (error) {
      console.error('Error al limpiar eventos antiguos:', error);
      throw new Error('No se pudieron limpiar los eventos antiguos');
    }
  }
}

// Instancia singleton del repositorio
export const usuarioHistorialRepository = new UsuarioHistorialRepository();
