/**
 * Repositorio base que implementa patrones comunes de acceso a datos
 * Proporciona abstracción sobre Firebase Firestore con gestión de errores y caché
 */
import { 
  CollectionReference, 
  DocumentReference, 
  DocumentSnapshot, 
  QuerySnapshot,
  Query,
  Transaction,
  WriteBatch,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp,
  collection,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { handleFirebaseError } from '../utils/errorHandling';
import { logger } from '../utils/loggerUtils';

export interface BaseEntity {
  id?: string;
  fechaCreacion?: Timestamp;
  fechaActualizacion?: Timestamp;
}

export interface QueryOptions {
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  where?: { field: string; operator: any; value: any }[];
  limit?: number;
}

export interface RepositoryConfig {
  collectionName: string;
  enableCache?: boolean;
  cacheTTL?: number;
}

/**
 * Repositorio base genérico para operaciones CRUD
 */
export abstract class BaseRepository<T extends BaseEntity> {
  protected collectionName: string;
  protected enableCache: boolean;
  protected cacheTTL: number;
  private cache = new Map<string, { data: T; timestamp: number }>();

  constructor(config: RepositoryConfig) {
    this.collectionName = config.collectionName;
    this.enableCache = config.enableCache ?? false;
    this.cacheTTL = config.cacheTTL ?? 10 * 60 * 1000; // 10 minutos por defecto
  }
  /**
   * Obtiene la referencia de la colección
   */
  protected getCollectionRef(): CollectionReference<any> {
    return collection(db, this.collectionName) as CollectionReference<any>;
  }

  /**
   * Obtiene la referencia de un documento
   */
  protected getDocRef(id: string): DocumentReference {
    return doc(db, this.collectionName, id);
  }  /**
   * Valida una entidad antes de guardarla (método abstracto)
   */
  protected abstract validateEntity(entity: Partial<T>): Promise<void>;
  /**
   * Transforma los datos antes de guardarlos en Firebase
   */
  protected transformForFirestore(entity: Partial<T> | Omit<T, 'id'>): any {
    const now = Timestamp.now();
    const { id, ...dataWithoutId } = entity as any;
    
    return {
      ...dataWithoutId,
      fechaActualizacion: now,
      ...(('id' in entity && entity.id) ? {} : { fechaCreacion: now })
    };
  }

  /**
   * Transforma los datos desde Firebase
   */
  protected transformFromFirestore(doc: DocumentSnapshot): T | null {
    if (!doc.exists()) return null;
    
    return {
      id: doc.id,
      ...doc.data()
    } as T;
  }

  /**
   * Gestión de caché
   */
  private getCachedEntity(id: string): T | null {
    if (!this.enableCache) return null;
    
    const cached = this.cache.get(id);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.cacheTTL;
    if (isExpired) {
      this.cache.delete(id);
      return null;
    }
    
    return cached.data;
  }
  private setCachedEntity(id: string, entity: T): void {
    if (!this.enableCache) return;
    
    // Limitar tamaño del caché
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(id, {
      data: entity,
      timestamp: Date.now()
    });
  }

  private invalidateCache(id?: string): void {
    if (!this.enableCache) return;
    
    if (id) {
      this.cache.delete(id);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Crear una nueva entidad
   */  async create(entity: Omit<T, 'id'>): Promise<T> {
    try {
      await this.validateEntity(entity as Partial<T>);
      
      const dataToSave = this.transformForFirestore(entity);
      const docRef = await addDoc(this.getCollectionRef(), dataToSave);
        const newEntity = {
        id: docRef.id,
        ...dataToSave
      } as T;

      this.setCachedEntity(docRef.id, newEntity);
      this.invalidateCache(); // Invalidar caché de listas
      
      logger.info(`Entidad creada en ${this.collectionName}`, { id: docRef.id });
      return newEntity;
    } catch (error) {
      logger.error(`Error creando entidad en ${this.collectionName}`, error);
      handleFirebaseError(error, `Error al crear entidad en ${this.collectionName}`);
      throw error;
    }
  }

  /**
   * Obtener una entidad por ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      // Comprobar caché primero
      const cached = this.getCachedEntity(id);
      if (cached) {
        return cached;
      }

      const docRef = this.getDocRef(id);
      const docSnap = await getDoc(docRef);
      
      const entity = this.transformFromFirestore(docSnap);
      if (entity) {
        this.setCachedEntity(id, entity);
      }
      
      return entity;
    } catch (error) {
      logger.error(`Error obteniendo entidad ${id} de ${this.collectionName}`, error);
      handleFirebaseError(error, `Error al obtener entidad de ${this.collectionName}`);
      throw error;
    }
  }
  /**
   * Actualizar una entidad
   */
  async update(id: string, updates: Partial<T>): Promise<T> {
    try {
      await this.validateEntity({ ...updates, id } as Partial<T>);
      
      const docRef = this.getDocRef(id);
      const dataToUpdate = this.transformForFirestore(updates);
      
      await updateDoc(docRef, dataToUpdate);
      
      // Obtener la entidad actualizada
      const updatedDoc = await getDoc(docRef);
      const updatedEntity = this.transformFromFirestore(updatedDoc);
      
      if (updatedEntity) {
        this.setCachedEntity(id, updatedEntity);
        this.invalidateCache(); // Invalidar caché de listas
        logger.info(`Entidad actualizada en ${this.collectionName}`, { id });
        return updatedEntity;
      }
      
      throw new Error('No se pudo obtener la entidad actualizada');
    } catch (error) {
      logger.error(`Error actualizando entidad ${id} en ${this.collectionName}`, error);
      handleFirebaseError(error, `Error al actualizar entidad en ${this.collectionName}`);
      throw error;
    }
  }

  /**
   * Eliminar una entidad
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = this.getDocRef(id);
      await deleteDoc(docRef);
      
      this.invalidateCache(id);
      logger.info(`Entidad eliminada de ${this.collectionName}`, { id });
    } catch (error) {
      logger.error(`Error eliminando entidad ${id} de ${this.collectionName}`, error);
      handleFirebaseError(error, `Error al eliminar entidad de ${this.collectionName}`);
      throw error;
    }
  }

  /**
   * Buscar entidades con opciones de consulta
   */
  async find(options: QueryOptions = {}): Promise<T[]> {
    try {
      let q: Query = this.getCollectionRef();

      // Aplicar filtros WHERE
      if (options.where) {
        options.where.forEach(filter => {
          q = query(q, where(filter.field, filter.operator, filter.value));
        });
      }

      // Aplicar ordenamiento
      if (options.orderBy) {
        options.orderBy.forEach(order => {
          q = query(q, orderBy(order.field, order.direction));
        });
      }

      // Aplicar límite
      if (options.limit) {
        q = query(q, firestoreLimit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => this.transformFromFirestore(doc))
        .filter((entity): entity is T => entity !== null);
    } catch (error) {
      logger.error(`Error buscando entidades en ${this.collectionName}`, error);
      handleFirebaseError(error, `Error al buscar entidades en ${this.collectionName}`);
      throw error;
    }
  }

  /**
   * Buscar una sola entidad
   */
  async findOne(options: QueryOptions = {}): Promise<T | null> {
    const results = await this.find({ ...options, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Contar entidades
   */
  async count(options: Omit<QueryOptions, 'limit' | 'orderBy'> = {}): Promise<number> {
    try {
      let q: Query = this.getCollectionRef();

      if (options.where) {
        options.where.forEach(filter => {
          q = query(q, where(filter.field, filter.operator, filter.value));
        });
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.length;
    } catch (error) {
      logger.error(`Error contando entidades en ${this.collectionName}`, error);
      handleFirebaseError(error, `Error al contar entidades en ${this.collectionName}`);
      throw error;
    }
  }

  /**
   * Operaciones en lote
   */
  async batchWrite(operations: Array<{
    type: 'create' | 'update' | 'delete';
    id?: string;
    data?: Partial<T>;
  }>): Promise<void> {
    try {
      const batch = writeBatch(db);

      for (const operation of operations) {
        switch (operation.type) {
          case 'create':
            if (!operation.data) throw new Error('Data requerido para crear');
            const createRef = doc(this.getCollectionRef());
            const createData = this.transformForFirestore(operation.data);
            batch.set(createRef, createData);
            break;

          case 'update':
            if (!operation.id || !operation.data) throw new Error('ID y data requeridos para actualizar');
            const updateRef = this.getDocRef(operation.id);
            const updateData = this.transformForFirestore(operation.data);
            batch.update(updateRef, updateData);
            break;

          case 'delete':
            if (!operation.id) throw new Error('ID requerido para eliminar');
            const deleteRef = this.getDocRef(operation.id);
            batch.delete(deleteRef);
            break;
        }
      }

      await batch.commit();
      this.invalidateCache(); // Invalidar todo el caché tras operaciones en lote
      logger.info(`Operación en lote completada en ${this.collectionName}`, { operationsCount: operations.length });
    } catch (error) {
      logger.error(`Error en operación en lote en ${this.collectionName}`, error);
      handleFirebaseError(error, `Error en operación en lote en ${this.collectionName}`);
      throw error;
    }
  }

  /**
   * Ejecutar en transacción
   */
  async runTransaction<R>(
    updateFunction: (transaction: Transaction, repository: this) => Promise<R>
  ): Promise<R> {
    try {
      return await runTransaction(db, async (transaction) => {
        return await updateFunction(transaction, this);
      });
    } catch (error) {
      logger.error(`Error en transacción en ${this.collectionName}`, error);
      handleFirebaseError(error, `Error en transacción en ${this.collectionName}`);
      throw error;
    }
  }

  /**
   * Limpiar caché
   */
  clearCache(): void {
    this.invalidateCache();
    logger.info(`Caché limpiado para ${this.collectionName}`);
  }
}
