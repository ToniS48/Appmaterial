import { db } from '../../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  DocumentData,
  QueryConstraint,
  QuerySnapshot,
  DocumentSnapshot,
  Timestamp 
} from 'firebase/firestore';

/**
 * Servicio base que proporciona operaciones CRUD estándar para cualquier colección
 * Elimina la duplicación de código de gestión de datos de Firebase
 */
export abstract class BaseService<T extends { id?: string }> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Obtener todos los documentos de la colección
   */
  protected async getAll(constraints?: QueryConstraint[]): Promise<T[]> {
    try {
      const collectionRef = collection(db, this.collectionName);
      let q = query(collectionRef);
      
      if (constraints && constraints.length > 0) {
        q = query(collectionRef, ...constraints);
      }
      
      const querySnapshot = await getDocs(q);
      return this.mapQuerySnapshot(querySnapshot);
    } catch (error) {
      throw this.handleError('getAll', error);
    }
  }

  /**
   * Obtener un documento por ID
   */
  protected async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return this.mapDocumentSnapshot(docSnap);
      }
      return null;
    } catch (error) {
      throw this.handleError('getById', error);
    }
  }

  /**
   * Crear un nuevo documento
   */
  protected async create(data: Omit<T, 'id'>): Promise<T> {
    try {
      const collectionRef = collection(db, this.collectionName);
      const processedData = this.processDataForCreate(data);
      const docRef = await addDoc(collectionRef, processedData);
      
      const newDoc = await getDoc(docRef);
      return this.mapDocumentSnapshot(newDoc);
    } catch (error) {
      throw this.handleError('create', error);
    }
  }

  /**
   * Actualizar un documento existente
   */
  protected async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const processedData = this.processDataForUpdate(data);
      await updateDoc(docRef, processedData);
      
      const updatedDoc = await getDoc(docRef);
      return this.mapDocumentSnapshot(updatedDoc);
    } catch (error) {
      throw this.handleError('update', error);
    }
  }

  /**
   * Eliminar un documento
   */
  protected async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      throw this.handleError('delete', error);
    }
  }

  /**
   * Buscar documentos con filtros personalizados
   */
  protected async search(filters: Record<string, any>): Promise<T[]> {
    try {
      const collectionRef = collection(db, this.collectionName);
      const constraints: QueryConstraint[] = [];

      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          constraints.push(where(field, '==', value));
        }
      });

      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      return this.mapQuerySnapshot(querySnapshot);
    } catch (error) {
      throw this.handleError('search', error);
    }
  }

  /**
   * Mapear QuerySnapshot a array de objetos
   */
  protected mapQuerySnapshot(snapshot: QuerySnapshot<DocumentData>): T[] {
    return snapshot.docs.map(doc => this.mapDocumentSnapshot(doc));
  }

  /**
   * Mapear DocumentSnapshot a objeto
   */
  protected mapDocumentSnapshot(doc: DocumentSnapshot<DocumentData>): T {
    const data = doc.data() as DocumentData;
    return {
      id: doc.id,
      ...data,
      // Convertir Timestamps a Date objects para facilitar el manejo
      ...this.convertTimestamps(data)
    } as T;
  }

  /**
   * Convertir Timestamps de Firestore a Date objects
   */
  protected convertTimestamps(data: DocumentData): Record<string, any> {
    const converted: Record<string, any> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof Timestamp) {
        converted[key] = value.toDate();
      } else if (value && typeof value === 'object' && value.seconds) {
        // Manejar timestamps que no son instancias de Timestamp
        converted[key] = new Date(value.seconds * 1000);
      }
    });
    
    return converted;
  }

  /**
   * Procesar datos antes de crear (hook virtual)
   */
  protected processDataForCreate(data: Omit<T, 'id'>): DocumentData {
    return {
      ...data,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };
  }

  /**
   * Procesar datos antes de actualizar (hook virtual)
   */
  protected processDataForUpdate(data: Partial<T>): DocumentData {
    return {
      ...data,
      fechaActualizacion: new Date()
    };
  }

  /**
   * Manejar errores de manera consistente
   */
  protected handleError(operation: string, error: any): Error {
    console.error(`Error en ${this.collectionName}.${operation}:`, error);
    
    if (error.code) {
      switch (error.code) {
        case 'permission-denied':
          return new Error('No tienes permisos para realizar esta operación');
        case 'not-found':
          return new Error('El documento solicitado no existe');
        case 'unavailable':
          return new Error('Servicio temporalmente no disponible');
        default:
          return new Error(`Error en ${operation}: ${error.message}`);
      }
    }
    
    return new Error(`Error inesperado en ${operation}`);
  }

  /**
   * Validar datos antes de operaciones (hook virtual)
   */
  protected validateData(data: Partial<T>): string[] {
    const errors: string[] = [];
    // Implementar en clases derivadas
    return errors;
  }
}
