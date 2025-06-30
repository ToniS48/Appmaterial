/**
 * Servicio dinámico para manipular esquemas y datos de Firestore
 * Permite añadir/eliminar campos de forma segura manteniendo compatibilidad
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  getDocsFromServer 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FIRESTORE_CONVERTERS, getConverter } from './FirestoreConverters';

export interface FieldDefinition {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  required?: boolean;
  default?: any;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    options?: string[];
  };
  min?: number;
  max?: number;
  enum?: string[];
}

export interface SchemaField {
  name: string;
  definition: FieldDefinition;
  isCustom?: boolean;
}

export interface CollectionSchema {
  collectionName: string;
  typeName: string;
  baseFields: SchemaField[];
  customFields: SchemaField[];
  detectedFields: SchemaField[];
  lastModified: Date;
}

export interface FirestoreDocument {
  id: string;
  [key: string]: any;
}

export interface FieldAnalysisResult {
  name: string;
  types: Set<string>;
  examples: string[];
  documentCount: number;
  nullCount: number;
  documentIds: string[];
}

export interface ScanResult {
  mode: 'quick' | 'smart' | 'deep';
  fields: SchemaField[];
  timestamp: Date;
  documentsAnalyzed: number;
  collectionName: string;
}

/**
 * Servicio para gestión dinámica de esquemas de Firestore
 */
export class FirestoreDynamicService {
  private schemasCollection = collection(db, '_schemas');

  /**
   * Obtiene el esquema completo de una colección
   */
  async getCollectionSchema(collectionType: keyof typeof FIRESTORE_CONVERTERS): Promise<CollectionSchema> {
    try {
      console.log(`[DEBUG] Obteniendo esquema para: ${collectionType}`);
      
      const converter = getConverter(collectionType);
      const schemaObject = converter.getSchema();
      
      // Convertir el schema object a array de SchemaField
      const baseFields: SchemaField[] = Object.entries(schemaObject).map(([name, definition]) => ({
        name,
        definition: definition as FieldDefinition,
        isCustom: false
      }));
      
      // Obtener campos personalizados guardados
      const schemaDoc = await getDoc(doc(this.schemasCollection, collectionType));
      const customFields: SchemaField[] = schemaDoc.exists() && schemaDoc.data()?.customFields 
        ? schemaDoc.data().customFields 
        : [];

      // Obtener campos conocidos (base + personalizados)
      const knownFields = new Set([
        ...baseFields.map(f => f.name),
        ...customFields.map(f => f.name)
      ]);

      // Detectar campos usando Smart Sample Analysis
      console.log(`[SCHEMA] Ejecutando Smart Sample Analysis para ${collectionType}...`);
      let detectedFields: SchemaField[] = [];
      
      try {
        const smartAnalysis = await this.smartSampleAnalysis(collectionType, 50);
        
        // Filtrar solo los campos que NO están en los conocidos
        detectedFields = smartAnalysis.filter(field => !knownFields.has(field.name));
        
        console.log(`[SCHEMA] Smart Analysis encontró ${smartAnalysis.length} campos, ${detectedFields.length} son nuevos`);
        console.log(`[SCHEMA] Campos detectados nuevos:`, detectedFields.map(f => `${f.name}(${f.definition.type})`));
      } catch (analysisError) {
        console.warn(`[SCHEMA] Smart Analysis falló, usando detección tradicional:`, analysisError);
        
        // Fallback a detección tradicional
        const orphanFieldNames = await this.detectExistingFieldsWithKnownFields(collectionType, knownFields);
        
        detectedFields = orphanFieldNames.map(fieldName => ({
          name: fieldName,
          definition: {
            type: 'string' as const,
            required: false,
            description: 'Campo detectado automáticamente (método tradicional)'
          },
          isCustom: false
        }));
      }
      
      const schema: CollectionSchema = {
        collectionName: collectionType,
        typeName: converter.getTypeName(),
        baseFields,
        customFields,
        detectedFields,
        lastModified: new Date()
      };

      console.log(`[DEBUG] Esquema obtenido - Base: ${baseFields.length}, Custom: ${customFields.length}, Detected: ${detectedFields.length}`);
      
      return schema;
    } catch (error) {
      console.error(`Error obteniendo esquema de ${collectionType}:`, error);
      throw error;
    }
  }

  /**
   * Añade un campo personalizado a una colección
   */
  async addCustomField(
    collectionType: keyof typeof FIRESTORE_CONVERTERS,
    fieldName: string,
    fieldDefinition: FieldDefinition
  ): Promise<void> {
    try {
      // Validaciones
      if (!this.isValidFieldName(fieldName)) {
        throw new Error('Nombre de campo inválido');
      }

      const validation = this.validateFieldDefinition(fieldDefinition);
      if (!validation.isValid) {
        throw new Error(`Definición de campo inválida: ${validation.errors.join(', ')}`);
      }

      // Verificar que el campo no existe
      const currentSchema = await this.getCollectionSchema(collectionType);
      const fieldExists = [...currentSchema.baseFields, ...currentSchema.customFields]
        .some(field => field.name === fieldName);
      
      if (fieldExists) {
        throw new Error(`El campo '${fieldName}' ya existe en '${collectionType}'`);
      }

      console.log(`[DEBUG] Field definition original:`, fieldDefinition);
      const cleanedDefinition = this.cleanUndefinedValues(fieldDefinition);
      console.log(`[DEBUG] Field definition cleaned:`, cleanedDefinition);

      // Añadir el nuevo campo
      const newCustomField: SchemaField = {
        name: fieldName,
        definition: cleanedDefinition,
        isCustom: true
      };

      const updatedCustomFields = [...currentSchema.customFields, newCustomField];

      // Guardar esquema actualizado
      const dataToSave = this.cleanUndefinedValues({
        customFields: updatedCustomFields,
        lastModified: new Date()
      });
      
      await setDoc(doc(this.schemasCollection, collectionType), dataToSave, { merge: true });

      console.log(`Campo personalizado '${fieldName}' añadido a ${collectionType}`);
    } catch (error) {
      console.error(`Error añadiendo campo personalizado:`, error);
      throw error;
    }
  }

  /**
   * Elimina un campo personalizado de una colección
   */
  async removeCustomField(
    collectionType: keyof typeof FIRESTORE_CONVERTERS,
    fieldName: string
  ): Promise<void> {
    try {
      const currentSchema = await this.getCollectionSchema(collectionType);
      
      // Verificar que el campo existe y es personalizado
      const fieldExists = currentSchema.customFields.some(field => field.name === fieldName);
      if (!fieldExists) {
        throw new Error(`El campo personalizado '${fieldName}' no existe en '${collectionType}'`);
      }

      // No permitir eliminar campos base
      const isBaseField = currentSchema.baseFields.some(field => field.name === fieldName);
      if (isBaseField) {
        throw new Error(`No se puede eliminar el campo base '${fieldName}'`);
      }

      // Filtrar el campo a eliminar
      const updatedCustomFields = currentSchema.customFields.filter(field => field.name !== fieldName);

      // Guardar esquema actualizado
      const dataToSave = this.cleanUndefinedValues({
        customFields: updatedCustomFields,
        lastModified: new Date()
      });
      
      await setDoc(doc(this.schemasCollection, collectionType), dataToSave, { merge: true });

      console.log(`Campo personalizado '${fieldName}' eliminado de ${collectionType}`);
    } catch (error) {
      console.error(`Error eliminando campo personalizado:`, error);
      throw error;
    }
  }

  /**
   * Convierte un campo detectado a campo personalizado
   */
  async convertDetectedFieldToCustom(
    collectionType: keyof typeof FIRESTORE_CONVERTERS,
    fieldName: string,
    fieldDefinition: FieldDefinition
  ): Promise<void> {
    try {
      // Simplemente usar addCustomField ya que manejará las validaciones
      await this.addCustomField(collectionType, fieldName, fieldDefinition);
      console.log(`Campo detectado '${fieldName}' convertido a personalizado en ${collectionType}`);
    } catch (error) {
      console.error(`Error convirtiendo campo detectado:`, error);
      throw error;
    }
  }

  /**
   * Obtiene documentos de una colección
   */
  async getCollectionDocuments(
    collectionType: keyof typeof FIRESTORE_CONVERTERS,
    limitCount: number = 10
  ): Promise<FirestoreDocument[]> {
    try {
      console.log(`[DEBUG] Consultando ${collectionType} con límite ${limitCount}...`);
      const collectionRef = collection(db, collectionType);
      
      // Intentar con ordenamiento por updatedAt, si falla usar sin ordenar
      let querySnapshot;
      try {
        const q = query(collectionRef, orderBy('updatedAt', 'desc'), limit(limitCount));
        querySnapshot = await getDocs(q);
      } catch (orderError) {
        console.log(`[DEBUG] Ordenamiento fallido en ${collectionType}, usando consulta simple`);
        const q = query(collectionRef, limit(limitCount));
        querySnapshot = await getDocs(q);
      }
      
      const documents = querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      }));
      
      console.log(`[DEBUG] Consulta completada: ${documents.length} documentos encontrados en ${collectionType}`);
      if (documents.length > 0) {
        console.log(`[DEBUG] IDs encontrados:`, documents.map(d => d.id));
        console.log(`[DEBUG] Campos del primer documento:`, Object.keys(documents[0]).filter(k => k !== 'id'));
      }
      
      return documents;
    } catch (error) {
      console.error(`Error obteniendo documentos de ${collectionType}:`, error);
      return [];
    }
  }

  /**
   * Fuerza la recarga de documentos desde Firestore (bypass de cache)
   * Útil para casos de consistencia eventual
   */
  async forceReloadDocuments(
    collectionType: keyof typeof FIRESTORE_CONVERTERS,
    limitCount: number = 20
  ): Promise<FirestoreDocument[]> {
    try {
      console.log(`[DEBUG] Forzando recarga de documentos en ${collectionType}...`);
      
      const collectionRef = collection(db, collectionType);
      
      // Usar `getDocsFromServer` para obtener datos directamente del servidor
      let querySnapshot;
      try {
        const q = query(collectionRef, limit(limitCount));
        querySnapshot = await getDocsFromServer(q);
        console.log(`[DEBUG] Datos obtenidos directamente del servidor`);
      } catch (serverError) {
        console.log(`[DEBUG] Error obteniendo del servidor, usando cache:`, serverError);
        const q = query(collectionRef, limit(limitCount));
        querySnapshot = await getDocs(q);
      }
      
      const documents = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        console.log(`[DEBUG] Documento ${docSnapshot.id} campos:`, Object.keys(data));
        return {
          id: docSnapshot.id,
          ...data
        };
      });
      
      console.log(`[DEBUG] Recarga forzada completada: ${documents.length} documentos en ${collectionType}`);
      return documents;
    } catch (error) {
      console.error(`Error en recarga forzada de ${collectionType}:`, error);
      return [];
    }
  }

  /**
   * Actualiza un documento aplicando el esquema dinámico
   */
  async updateDocumentWithSchema(
    collectionType: keyof typeof FIRESTORE_CONVERTERS,
    documentId: string,
    updates: Record<string, any>
  ): Promise<void> {
    try {
      const schema = await this.getCollectionSchema(collectionType);
      
      // Validar que los campos existen en el esquema
      const allFields = [...schema.baseFields, ...schema.customFields];
      const validFields = Object.keys(updates).every(fieldName => 
        allFields.some(field => field.name === fieldName)
      );

      if (!validFields) {
        throw new Error('Algunos campos no están definidos en el esquema');
      }

      // Limpiar valores undefined
      const cleanData = this.cleanUndefinedValues(updates);
      
      await updateDoc(doc(db, collectionType, documentId), cleanData);
    } catch (error) {
      console.error(`Error actualizando documento con esquema:`, error);
      throw error;
    }
  }

  /**
   * Actualiza un documento sin validación de esquema (para testing)
   */
  async updateDocumentWithoutValidation(
    collectionType: keyof typeof FIRESTORE_CONVERTERS,
    documentId: string,
    updates: Record<string, any>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionType, documentId);
      
      // Limpiar valores undefined
      const cleanUpdates = this.cleanUndefinedValues(updates);
      
      // Verificar si el documento existe
      const docSnapshot = await getDoc(docRef);
      
      if (docSnapshot.exists()) {
        // Documento existe, usar updateDoc
        await updateDoc(docRef, cleanUpdates);
        console.log(`[DEBUG] Documento ${documentId} actualizado sin validación:`, Object.keys(cleanUpdates));
      } else {
        // Documento no existe, usar setDoc
        await setDoc(docRef, cleanUpdates);
        console.log(`[DEBUG] Documento ${documentId} creado sin validación:`, Object.keys(cleanUpdates));
      }
    } catch (error) {
      console.error(`Error actualizando/creando documento ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Método de test para verificar permisos de escritura y funcionalidad de esquemas
   */
  async testFirestoreAccess(): Promise<{ read: boolean; write: boolean; schema: boolean; error?: string }> {
    try {
      // Test de lectura
      console.log('[DEBUG] Testeando lectura de Firestore...');
      const testDocRef = doc(db, '_test', 'access-test');
      await getDoc(testDocRef);
      
      // Test de escritura
      console.log('[DEBUG] Testeando escritura de Firestore...');
      await setDoc(testDocRef, { 
        timestamp: new Date(), 
        test: true 
      });
      
      // Test de esquemas
      console.log('[DEBUG] Testeando funcionalidad de esquemas...');
      let schemaTest = false;
      try {
        await this.getCollectionSchema('usuarios');
        schemaTest = true;
        console.log('[DEBUG] Schema test EXITOSO - Schema obtenido correctamente');
      } catch (error) {
        console.error('[DEBUG] Schema test FALLÓ:', error);
        console.error('[DEBUG] Error completo:', error instanceof Error ? error.message : error);
        console.error('[DEBUG] Stack trace:', error instanceof Error ? error.stack : 'No stack');
      }
      
      return { read: true, write: true, schema: schemaTest };
    } catch (error) {
      console.error('[DEBUG] Error en testFirestoreAccess:', error);
      return { 
        read: false, 
        write: false, 
        schema: false,
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * Detecta campos existentes en documentos reales que no están en el esquema
   * @param collectionType Tipo de colección
   * @param knownFields Set de campos conocidos (base + personalizados)
   * @param retryCount Número de reintentos para manejar consistencia eventual
   */
  async detectExistingFieldsWithKnownFields(
    collectionType: keyof typeof FIRESTORE_CONVERTERS, 
    knownFields: Set<string>,
    retryCount: number = 0
  ): Promise<string[]> {
    try {
      console.log(`[DETECT-FIELDS] Iniciando detección inteligente en ${collectionType}...`);
      
      // Usar muestreo inteligente para mejor detección
      const detectedFields = await this.smartSampleAnalysis(collectionType, 50);
      
      if (detectedFields.length === 0) {
        console.log(`[DETECT-FIELDS] No se detectaron campos en ${collectionType} (intento ${retryCount + 1})`);
        
        // Si es el primer intento y no hay campos, esperar un poco y reintentar con método tradicional
        if (retryCount < 2) {
          console.log(`[DETECT-FIELDS] Reintentando con método tradicional en ${collectionType}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const documents = await this.getCollectionDocuments(collectionType, 20);
          const allFields = new Set<string>();
          
          documents.forEach((doc) => {
            Object.keys(doc).forEach(field => allFields.add(field));
          });
          
          const orphanFields = Array.from(allFields).filter(field => !knownFields.has(field));
          console.log(`[DETECT-FIELDS] Método tradicional encontró:`, orphanFields);
          return orphanFields;
        }
        
        return [];
      }
      
      // Filtrar campos que no están en los conocidos
      const orphanFields = detectedFields
        .map(field => field.name)
        .filter(fieldName => !knownFields.has(fieldName));
      
      console.log(`[DETECT-FIELDS] Total de campos únicos detectados: ${detectedFields.length}`);
      console.log(`[DETECT-FIELDS] Campos conocidos en esquema:`, Array.from(knownFields));
      
      if (orphanFields.length > 0) {
        console.log(`[DETECT-FIELDS] Campos huérfanos detectados en ${collectionType}:`, orphanFields);
      } else {
        console.log(`[DETECT-FIELDS] No se encontraron campos huérfanos en ${collectionType}`);
      }
      
      return orphanFields;
    } catch (error) {
      console.error(`Error detectando campos existentes (intento ${retryCount + 1}):`, error);
      
      // Reintentar una vez más en caso de error
      if (retryCount < 1) {
        console.log(`[DETECT-FIELDS] Reintentando detección después de error...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.detectExistingFieldsWithKnownFields(collectionType, knownFields, retryCount + 1);
      }
      
      return [];
    }
  }

  /**
   * Detecta campos existentes en documentos reales que no están en el esquema
   * Versión mejorada con mejor manejo de consistencia eventual
   */
  async detectExistingFields(collectionType: keyof typeof FIRESTORE_CONVERTERS): Promise<string[]> {
    try {
      console.log(`[DEBUG] Iniciando detección de campos existentes en ${collectionType}`);
      
      const documents = await this.getCollectionDocuments(collectionType, 20); // Más documentos
      const allFields = new Set<string>();
      
      console.log(`[DEBUG] Obtenidos ${documents.length} documentos de ${collectionType}`);
      
      // Recopilar todos los campos de los documentos
      documents.forEach((doc, index) => {
        const fields = Object.keys(doc);
        console.log(`[DEBUG] Documento ${index + 1} campos:`, fields);
        fields.forEach(field => allFields.add(field));
      });
      
      console.log(`[DEBUG] Total de campos únicos encontrados en documentos:`, Array.from(allFields));
      
      // Obtener esquema actual
      const schema = await this.getCollectionSchema(collectionType);
      const knownFields = new Set([
        ...schema.baseFields.map(f => f.name),
        ...schema.customFields.map(f => f.name)
      ]);
      
      console.log(`[DEBUG] Campos base en esquema:`, schema.baseFields.map(f => f.name));
      console.log(`[DEBUG] Campos personalizados en esquema:`, schema.customFields.map(f => f.name));
      console.log(`[DEBUG] Total campos conocidos en esquema:`, Array.from(knownFields));
      
      // Campos que existen en documentos pero no están en el esquema
      const orphanFields = Array.from(allFields).filter(field => !knownFields.has(field));
      
      console.log(`[DEBUG] Campos huérfanos detectados en ${collectionType}:`, orphanFields);
      
      return orphanFields;
    } catch (error) {
      console.error(`Error detectando campos existentes en ${collectionType}:`, error);
      return [];
    }
  }

  /**
   * Valida el nombre de un campo
   */
  private isValidFieldName(fieldName: string): boolean {
    // Solo letras, números, guiones bajos, no puede empezar con número
    const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    return regex.test(fieldName) && fieldName.length >= 2 && fieldName.length <= 50;
  }

  /**
   * Obtiene tipos de datos disponibles para campos personalizados
   */
  getAvailableFieldTypes(): Array<{ value: FieldDefinition['type'], label: string, description: string }> {
    return [
      { value: 'string', label: 'Texto', description: 'Cadena de texto' },
      { value: 'number', label: 'Número', description: 'Valor numérico' },
      { value: 'boolean', label: 'Booleano', description: 'Verdadero o falso' },
      { value: 'array', label: 'Array', description: 'Lista de elementos' },
      { value: 'object', label: 'Objeto', description: 'Objeto anidado' },
      { value: 'date', label: 'Fecha', description: 'Fecha y hora' }
    ];
  }

  /**
   * Obtiene las colecciones disponibles
   */
  getAvailableCollections(): string[] {
    return Object.keys(FIRESTORE_CONVERTERS);
  }

  /**
   * Valida una definición de campo
   */
  validateFieldDefinition(definition: FieldDefinition): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar tipo
    const validTypes = ['string', 'number', 'boolean', 'array', 'object', 'date'];
    if (!validTypes.includes(definition.type)) {
      errors.push('Tipo de campo inválido');
    }

    // Validar valor por defecto si existe
    if (definition.default !== undefined) {
      if (definition.type === 'string' && typeof definition.default !== 'string') {
        errors.push('El valor por defecto debe ser texto');
      }
      if (definition.type === 'number' && typeof definition.default !== 'number') {
        errors.push('El valor por defecto debe ser un número');
      }
      if (definition.type === 'boolean' && typeof definition.default !== 'boolean') {
        errors.push('El valor por defecto debe ser verdadero o falso');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Genera un valor por defecto apropiado para un tipo de campo
   */
  generateDefaultValue(type: FieldDefinition['type']): any {
    switch (type) {
      case 'string': return '';
      case 'number': return 0;
      case 'boolean': return false;
      case 'array': return [];
      case 'object': return {};
      case 'date': return new Date();
      default: return null;
    }
  }

  /**
   * Lista todos los esquemas guardados (para debug)
   */
  async listAllSchemas(): Promise<any[]> {
    try {
      const querySnapshot = await getDocs(this.schemasCollection);
      const schemas: any[] = [];
      querySnapshot.forEach((doc) => {
        schemas.push({
          id: doc.id,
          data: doc.data()
        });
      });
      console.log('[DEBUG] Todos los esquemas guardados:', schemas);
      return schemas;
    } catch (error) {
      console.error('[DEBUG] Error listando esquemas:', error);
      return [];
    }
  }

  /**
   * Limpia valores undefined de un objeto para Firestore
   */
  private cleanUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanUndefinedValues(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.cleanUndefinedValues(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  /**
   * Verifica directamente un documento específico (para debugging)
   */
  async verifyDocumentExists(
    collectionType: keyof typeof FIRESTORE_CONVERTERS,
    documentId: string
  ): Promise<any> {
    try {
      const docRef = doc(db, collectionType, documentId);
      const docSnapshot = await getDoc(docRef);
      
      console.log(`[DEBUG] Verificando documento ${documentId} en ${collectionType}:`);
      console.log(`[DEBUG] Existe:`, docSnapshot.exists());
      
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        console.log(`[DEBUG] Campos del documento:`, Object.keys(data));
        return data;
      }
      
      return null;
    } catch (error) {
      console.error(`Error verificando documento ${documentId}:`, error);
      return null;
    }
  }

  /**
   * Normaliza todos los documentos de una colección (método legacy simplificado)
   */
  async normalizeCollection(
    collectionType: keyof typeof FIRESTORE_CONVERTERS,
    limitCount: number = 50
  ): Promise<{ normalized: number; total: number; errors: string[] }> {
    try {
      console.log(`[LEGACY] Usando método de normalización simplificado para ${collectionType}`);
      
      // Usar el nuevo método con opciones por defecto
      const options: NormalizationOptions = {
        strategy: {
          addMissingFields: true,
          useDefaultValues: true,
          removeUnknownFields: false,
          updateExistingFields: false
        },
        batchSize: limitCount,
        dryRun: false,
        backupBeforeChange: false
      };
      
      const result = await this.normalizeCollectionDocuments(collectionType, options);
      
      return {
        normalized: result.documentsUpdated,
        total: result.totalDocuments,
        errors: result.errors.map(e => `${e.documentId}: ${e.error}`)
      };
    } catch (error) {
      console.error(`Error en normalización legacy:`, error);
      throw error;
    }
  }

  /**
   * Verifica si hay cambios significativos entre dos objetos (método helper legacy)
   */
  private hasSignificantChanges(original: any, normalized: any): boolean {
    const originalKeys = Object.keys(original);
    const normalizedKeys = Object.keys(normalized);
    
    // Verificar si hay nuevos campos
    for (let i = 0; i < normalizedKeys.length; i++) {
      const key = normalizedKeys[i];
      if (!originalKeys.includes(key) && normalized[key] !== undefined) {
        return true;
      }
    }
    
    // Verificar si hay cambios en valores existentes
    for (let i = 0; i < originalKeys.length; i++) {
      const key = originalKeys[i];
      if (normalizedKeys.includes(key)) {
        const originalValue = original[key];
        const normalizedValue = normalized[key];
        
        // Comparación simple para detectar cambios significativos
        if (JSON.stringify(originalValue) !== JSON.stringify(normalizedValue)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Sistema de Muestreo Inteligente para colecciones grandes
   * Usa múltiples estrategias para obtener una muestra representativa
   */
  async smartSampleAnalysis(
    collectionType: keyof typeof FIRESTORE_CONVERTERS, 
    sampleSize = 50
  ): Promise<SchemaField[]> {
    try {
      console.log(`[SMART-SAMPLE] Iniciando muestreo inteligente de ${collectionType}...`);
      
      const collectionRef = collection(db, collectionType);
      
      // Estrategia de muestreo múltiple
      const samplePromises = [
        // Muestra 1: Documentos más recientes (por createdAt)
        this.getSampleByField(collectionRef, 'createdAt', 'desc', Math.ceil(sampleSize / 4)),
        // Muestra 2: Documentos más antiguos (por createdAt)
        this.getSampleByField(collectionRef, 'createdAt', 'asc', Math.ceil(sampleSize / 4)),
        // Muestra 3: Documentos actualizados recientemente (por updatedAt)
        this.getSampleByField(collectionRef, 'updatedAt', 'desc', Math.ceil(sampleSize / 4)),
        // Muestra 4: Muestra aleatoria
        this.getRandomSample(collectionRef, Math.ceil(sampleSize / 4))
      ];
      
      const samples = await Promise.all(samplePromises);
      
      // Combinar todas las muestras y eliminar duplicados
      const allDocs = this.deduplicateDocuments(samples.flat());
      
      console.log(`[SMART-SAMPLE] Obtenidas ${allDocs.length} muestras únicas de ${collectionType}`);
      
      if (allDocs.length === 0) {
        console.log(`[SMART-SAMPLE] No se encontraron documentos en ${collectionType}`);
        return [];
      }
      
      return this.analyzeDocumentsSample(allDocs, collectionType);
      
    } catch (error) {
      console.error(`[SMART-SAMPLE] Error en muestreo de ${collectionType}:`, error);
      // Fallback a método tradicional
      const fallbackFields = await this.detectExistingFields(collectionType);
      return fallbackFields.map(fieldName => ({
        name: fieldName,
        definition: { type: 'string' as const, required: false, description: 'Campo detectado por método tradicional' },
        isCustom: false
      }));
    }
  }

  /**
   * Obtiene una muestra ordenada por un campo específico
   */
  private async getSampleByField(
    collectionRef: any, 
    field: string, 
    direction: 'asc' | 'desc', 
    limitCount: number
  ): Promise<any[]> {
    try {
      const q = query(collectionRef, orderBy(field, direction), limit(limitCount));
      const snapshot = await getDocs(q);
      console.log(`[SMART-SAMPLE] Muestra por ${field} (${direction}): ${snapshot.docs.length} documentos`);
      return snapshot.docs;
    } catch (error) {
      // Si el campo no existe o no tiene índice, usar método alternativo
      console.warn(`[SMART-SAMPLE] Campo ${field} no disponible para ordenación, usando muestra aleatoria`);
      return this.getRandomSample(collectionRef, limitCount);
    }
  }

  /**
   * Obtiene una muestra pseudo-aleatoria basada en IDs
   */
  private async getRandomSample(collectionRef: any, limitCount: number): Promise<any[]> {
    try {
      // Estrategia: obtener documentos sin orden específico
      const q = query(collectionRef, limit(limitCount * 2)); // Obtener más para luego filtrar
      const snapshot = await getDocs(q);
      
      // Seleccionar documentos de forma pseudo-aleatoria
      const docs = snapshot.docs;
      const randomDocs = [];
      const step = Math.max(1, Math.floor(docs.length / limitCount));
      
      for (let i = 0; i < docs.length && randomDocs.length < limitCount; i += step) {
        randomDocs.push(docs[i]);
      }
      
      console.log(`[SMART-SAMPLE] Muestra aleatoria: ${randomDocs.length} documentos`);
      return randomDocs;
    } catch (error) {
      console.error('[SMART-SAMPLE] Error en muestra aleatoria:', error);
      return [];
    }
  }

  /**
   * Elimina documentos duplicados basándose en el ID
   */
  private deduplicateDocuments(docs: any[]): any[] {
    const seenIds = new Set<string>();
    return docs.filter(doc => {
      if (seenIds.has(doc.id)) {
        return false;
      }
      seenIds.add(doc.id);
      return true;
    });
  }

  /**
   * Analiza una muestra de documentos para detectar campos
   */
  private analyzeDocumentsSample(docs: any[], collectionType: string): SchemaField[] {
    console.log(`[SMART-SAMPLE] Analizando ${docs.length} documentos de ${collectionType}...`);
    
    const fieldStats = new Map<string, FieldAnalysisResult>();
    
    // Analizar cada documento
    docs.forEach((doc, index) => {
      const data = doc.data();
      this.analyzeDocumentStructure(data, fieldStats, `${doc.id}`, '');
      
      if (index % 10 === 0) {
        console.log(`[SMART-SAMPLE] Procesados ${index + 1}/${docs.length} documentos`);
      }
    });
    
    // Convertir estadísticas a SchemaField[]
    const detectedFields = Array.from(fieldStats.entries()).map(([fieldName, stats]) => ({
      name: fieldName,
      definition: this.inferFieldDefinition(fieldName, stats),
      isCustom: false
    }));
    
    console.log(`[SMART-SAMPLE] Análisis completado: ${detectedFields.length} campos únicos detectados`);
    console.log(`[SMART-SAMPLE] Campos encontrados:`, detectedFields.map(f => `${f.name}(${f.definition.type})`));
    
    return detectedFields;
  }

  /**
   * Analiza recursivamente la estructura de un documento
   */
  private analyzeDocumentStructure(
    obj: any, 
    fieldStats: Map<string, FieldAnalysisResult>,
    docId: string,
    prefix = ''
  ): void {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      // Inicializar estadísticas del campo si no existe
      if (!fieldStats.has(fullKey)) {
        fieldStats.set(fullKey, {
          name: fullKey,
          types: new Set(),
          examples: [],
          documentCount: 0,
          nullCount: 0,
          documentIds: []
        });
      }
      
      const stats = fieldStats.get(fullKey)!;
      stats.documentCount++;
      stats.documentIds.push(docId);
      
      // Analizar el valor
      if (value === null || value === undefined) {
        stats.nullCount++;
      } else {
        const valueType = this.getDetailedValueType(value);
        stats.types.add(valueType);
        
        // Guardar ejemplos (máximo 5)
        if (stats.examples.length < 5) {
          stats.examples.push(this.serializeExample(value));
        }
        
        // Análisis recursivo para objetos anidados (máximo 3 niveles)
        if (valueType === 'object' && prefix.split('.').length < 3) {
          this.analyzeDocumentStructure(value, fieldStats, docId, fullKey);
        }
      }
    });
  }

  /**
   * Obtiene el tipo detallado de un valor
   */
  private getDetailedValueType(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (value && typeof value.toDate === 'function') return 'timestamp'; // Firestore Timestamp
    if (typeof value === 'object') return 'object';
    return 'unknown';
  }

  /**
   * Serializa un ejemplo para almacenamiento
   */
  private serializeExample(value: any): string {
    try {
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (value && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
      }
      if (typeof value === 'object') {
        return JSON.stringify(value).substring(0, 100) + '...';
      }
      return String(value).substring(0, 100);
    } catch (error) {
      return '[Error serializing]';
    }
  }

  /**
   * Infiere la definición del campo basándose en las estadísticas
   */
  private inferFieldDefinition(fieldName: string, stats: FieldAnalysisResult): FieldDefinition {
    const types = Array.from(stats.types);
    const isOptional = stats.nullCount > 0 || stats.documentCount < stats.documentIds.length;
    
    // Determinar tipo principal
    let primaryType: FieldDefinition['type'] = 'string';
    
    if (types.includes('number')) primaryType = 'number';
    else if (types.includes('boolean')) primaryType = 'boolean';
    else if (types.includes('array')) primaryType = 'array';
    else if (types.includes('date') || types.includes('timestamp')) primaryType = 'date';
    else if (types.includes('object')) primaryType = 'object';
    
    // Generar descripción
    const coverage = ((stats.documentCount / stats.documentIds.length) * 100).toFixed(1);
    const exampleText = stats.examples.length > 0 ? ` Ej: ${stats.examples.slice(0, 2).join(', ')}` : '';
    
    return {
      type: primaryType,
      required: !isOptional,
      description: `Campo detectado automáticamente. Cobertura: ${coverage}% (${stats.documentCount} docs).${exampleText}`,
      validation: this.generateValidationFromStats(stats, primaryType)
    };
  }

  /**
   * Genera reglas de validación basándose en las estadísticas
   */
  private generateValidationFromStats(stats: FieldAnalysisResult, type: FieldDefinition['type']): any {
    const validation: any = {};
    
    if (type === 'string' && stats.examples.length > 0) {
      const lengths = stats.examples.map(ex => ex.length);
      validation.minLength = Math.min(...lengths);
      validation.maxLength = Math.max(...lengths);
    }
    
    if (type === 'number' && stats.examples.length > 0) {
      const numbers = stats.examples
        .map(ex => parseFloat(ex))
        .filter(n => !isNaN(n));
      
      if (numbers.length > 0) {
        validation.min = Math.min(...numbers);
        validation.max = Math.max(...numbers);
      }
    }
    
    return Object.keys(validation).length > 0 ? validation : undefined;
  }

  /**
   * Ejecuta análisis inteligente en múltiples colecciones
   */
  async bulkSmartAnalysis(
    collections?: string[],
    sampleSize: number = 30
  ): Promise<{ [collectionName: string]: SchemaField[] }> {
    const targetCollections = collections || this.getAvailableCollections();
    const results: { [collectionName: string]: SchemaField[] } = {};
    
    console.log(`[BULK-ANALYSIS] Iniciando análisis masivo en ${targetCollections.length} colecciones...`);
    
    for (const collectionName of targetCollections) {
      try {
        console.log(`[BULK-ANALYSIS] Analizando ${collectionName}...`);
        const fields = await this.smartSampleAnalysis(collectionName as any, sampleSize);
        results[collectionName] = fields;
        console.log(`[BULK-ANALYSIS] ${collectionName}: ${fields.length} campos detectados`);
      } catch (error) {
        console.error(`[BULK-ANALYSIS] Error en ${collectionName}:`, error);
        results[collectionName] = [];
      }
    }
    
    console.log(`[BULK-ANALYSIS] Análisis masivo completado`);
    return results;
  }

  /**
   * Obtiene estadísticas de campos para una colección
   */
  async getFieldStatistics(collectionType: keyof typeof FIRESTORE_CONVERTERS): Promise<{
    totalDocuments: number;
    fieldCoverage: { [fieldName: string]: { count: number; percentage: number } };
    dataTypes: { [fieldName: string]: string[] };
  }> {
    try {
      const documents = await this.getCollectionDocuments(collectionType, 100);
      const totalDocuments = documents.length;
      const fieldCounts: { [fieldName: string]: number } = {};
      const fieldTypes: { [fieldName: string]: Set<string> } = {};
      
      documents.forEach(doc => {
        Object.keys(doc).forEach(fieldName => {
          fieldCounts[fieldName] = (fieldCounts[fieldName] || 0) + 1;
          
          if (!fieldTypes[fieldName]) {
            fieldTypes[fieldName] = new Set();
          }
          fieldTypes[fieldName].add(this.getDetailedValueType(doc[fieldName]));
        });
      });
      
      const fieldCoverage: { [fieldName: string]: { count: number; percentage: number } } = {};
      const dataTypes: { [fieldName: string]: string[] } = {};
      
      Object.keys(fieldCounts).forEach(fieldName => {
        const count = fieldCounts[fieldName];
        fieldCoverage[fieldName] = {
          count,
          percentage: Math.round((count / totalDocuments) * 100)
        };
        dataTypes[fieldName] = Array.from(fieldTypes[fieldName]);
      });
      
      return {
        totalDocuments,
        fieldCoverage,
        dataTypes
      };
    } catch (error) {
      console.error(`Error obteniendo estadísticas de ${collectionType}:`, error);
      return {
        totalDocuments: 0,
        fieldCoverage: {},
        dataTypes: {}
      };
    }
  }

  /**
   * Sugiere mejoras de esquema basándose en el análisis
   */
  async suggestSchemaImprovements(collectionType: keyof typeof FIRESTORE_CONVERTERS): Promise<{
    missingFields: SchemaField[];
    inconsistentTypes: { fieldName: string; detectedTypes: string[]; suggestedType: string }[];
    lowCoverageFields: { fieldName: string; coverage: number }[];
  }> {
    try {
      const schema = await this.getCollectionSchema(collectionType);
      const statistics = await this.getFieldStatistics(collectionType);
      const smartAnalysis = await this.smartSampleAnalysis(collectionType, 50);
      
      const knownFields = new Set([
        ...schema.baseFields.map(f => f.name),
        ...schema.customFields.map(f => f.name)
      ]);
      
      // Campos faltantes
      const missingFields = smartAnalysis.filter(field => !knownFields.has(field.name));
      
      // Tipos inconsistentes
      const inconsistentTypes: { fieldName: string; detectedTypes: string[]; suggestedType: string }[] = [];
      Object.keys(statistics.dataTypes).forEach(fieldName => {
        const types = statistics.dataTypes[fieldName];
        if (types.length > 1) {
          // Más de un tipo detectado, sugerir el más común
          const suggestedType = types.includes('string') ? 'string' : types[0];
          inconsistentTypes.push({
            fieldName,
            detectedTypes: types,
            suggestedType
          });
        }
      });
      
      // Campos con baja cobertura
      const lowCoverageFields: { fieldName: string; coverage: number }[] = [];
      Object.keys(statistics.fieldCoverage).forEach(fieldName => {
        const coverage = statistics.fieldCoverage[fieldName].percentage;
        if (coverage < 50) { // Menos del 50% de cobertura
          lowCoverageFields.push({
            fieldName,
            coverage
          });
        }
      });
      
      return {
        missingFields,
        inconsistentTypes,
        lowCoverageFields
      };
    } catch (error) {
      console.error(`Error sugiriendo mejoras para ${collectionType}:`, error);
      return {
        missingFields: [],
        inconsistentTypes: [],
        lowCoverageFields: []
      };
    }
  }

  /**
   * Analiza qué documentos necesitan normalización
   */
  async analyzeDocumentNormalizationNeeds(
    collectionType: keyof typeof FIRESTORE_CONVERTERS,
    limitDocuments?: number
  ): Promise<DocumentNormalizationNeeds[]> {
    try {
      console.log(`[NORMALIZATION] Analizando necesidades de normalización para ${collectionType}...`);
      
      const schema = await this.getCollectionSchema(collectionType);
      
      // Campos requeridos (obligatorios)
      const requiredFields = new Set([
        ...schema.baseFields.filter(f => f.definition.required).map(f => f.name),
        ...schema.customFields.filter(f => f.definition.required).map(f => f.name)
      ]);
      
      // MEJORA: Considerar TODOS los campos conocidos (base + custom + detectados)
      const allKnownFields = new Set([
        ...schema.baseFields.map(f => f.name),
        ...schema.customFields.map(f => f.name),
        ...schema.detectedFields.map(f => f.name) // ✅ CAMPOS DETECTADOS DINÁMICAMENTE
      ]);

      // Para detectar documentos desactualizados, usar el campo más común como referencia
      // ✅ CORREGIDO: Usar forceReloadDocuments en lugar de getCollectionDocuments
      console.log(`[NORMALIZATION] Obteniendo documentos con recarga forzada...`);
      const allDocuments = await this.forceReloadDocuments(collectionType, limitDocuments || 100);
      
      if (allDocuments.length === 0) {
        console.log(`[NORMALIZATION] ⚠️ No se encontraron documentos en ${collectionType} - intentando método alternativo...`);
        
        // Método alternativo usando Smart Sample Analysis
        const smartAnalysisFields = await this.smartSampleAnalysis(collectionType, 50);
        
        if (smartAnalysisFields.length > 0) {
          console.log(`[NORMALIZATION] ℹ️ Smart Analysis detectó campos pero getCollectionDocuments falló`);
          console.log(`[NORMALIZATION] Esto sugiere un problema de permisos o consulta en getCollectionDocuments`);
          
          // Usar una estrategia alternativa para obtener documentos
          const documentsFromSampleAnalysis = await this.getDocumentsFromSampleAnalysis(collectionType, limitDocuments || 100);
          
          if (documentsFromSampleAnalysis.length > 0) {
            console.log(`[NORMALIZATION] ✅ Documentos obtenidos via método alternativo: ${documentsFromSampleAnalysis.length}`);
            // Continuar con estos documentos
            return this.analyzeDocumentsForNormalization(documentsFromSampleAnalysis, schema, collectionType);
          }
        }
        
        console.log(`[NORMALIZATION] ❌ No se pudieron obtener documentos de ${collectionType}`);
        return [];
      }
      
      // ✅ USAR MÉTODO AUXILIAR PARA ANÁLISIS
      console.log(`[NORMALIZATION] ✅ Documentos obtenidos: ${allDocuments.length}, delegando análisis...`);
      return this.analyzeDocumentsForNormalization(allDocuments, schema, collectionType);
    } catch (error) {
      console.error(`Error analizando necesidades de normalización:`, error);
      throw error;
    }
  }

  /**
   * Normaliza todos los documentos de una colección
   */
  async normalizeCollectionDocuments(
    collectionType: keyof typeof FIRESTORE_CONVERTERS,
    options: NormalizationOptions
  ): Promise<NormalizationResult> {
    try {
      console.log(`[NORMALIZATION] Iniciando normalización de ${collectionType}...`);
      console.log(`[NORMALIZATION] Opciones:`, options);

      const schema = await this.getCollectionSchema(collectionType);
      const documents = await this.getCollectionDocuments(collectionType, 1000); // Máximo 1000 docs por operación
      
      const result: NormalizationResult = {
        totalDocuments: documents.length,
        documentsProcessed: 0,
        documentsUpdated: 0,
        documentsSkipped: 0,
        errors: [],
        changes: []
      };

      // Crear backup si se solicita
      if (options.backupBeforeChange && !options.dryRun) {
        result.backupId = await this.createCollectionBackup(collectionType, documents);
        console.log(`[NORMALIZATION] Backup creado: ${result.backupId}`);
      }

      const batchSize = options.batchSize || 50;
      
      // Procesar en lotes
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        for (const doc of batch) {
          try {
            const changes = await this.normalizeDocument(doc, schema, options);
            
            result.documentsProcessed++;
            
            if (changes.fieldsAdded.length > 0 || changes.fieldsRemoved.length > 0 || changes.fieldsUpdated.length > 0) {
              result.documentsUpdated++;
              result.changes.push(changes);
              
              console.log(`[NORMALIZATION] Documento ${doc.id} normalizado: +${changes.fieldsAdded.length} -${changes.fieldsRemoved.length} ~${changes.fieldsUpdated.length}`);
            } else {
              result.documentsSkipped++;
            }
          } catch (error) {
            result.errors.push({
              documentId: doc.id,
              error: error instanceof Error ? error.message : String(error)
            });
            console.error(`[NORMALIZATION] Error procesando documento ${doc.id}:`, error);
          }
        }
        
        // Pequeña pausa entre lotes para no sobrecargar Firestore
        if (i + batchSize < documents.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`[NORMALIZATION] Normalización completada:`, result);
      return result;
    } catch (error) {
      console.error(`Error en normalización masiva:`, error);
      throw error;
    }
  }

  /**
   * Normaliza un documento individual
   */
  private async normalizeDocument(
    doc: FirestoreDocument,
    schema: CollectionSchema,
    options: NormalizationOptions
  ): Promise<{
    documentId: string;
    fieldsAdded: string[];
    fieldsRemoved: string[];
    fieldsUpdated: string[];
  }> {
    const changes = {
      documentId: doc.id,
      fieldsAdded: [] as string[],
      fieldsRemoved: [] as string[],
      fieldsUpdated: [] as string[]
    };

    const updates: Record<string, any> = {};
    const allSchemaFields = [...schema.baseFields, ...schema.customFields];
    const allKnownFields = new Set(allSchemaFields.map(f => f.name));
    const docFields = new Set(Object.keys(doc).filter(key => key !== 'id'));

    // 1. Añadir campos faltantes
    if (options.strategy.addMissingFields) {
      for (const schemaField of allSchemaFields) {
        if (!docFields.has(schemaField.name)) {
          const defaultValue = options.strategy.useDefaultValues 
            ? this.getDefaultValueForField(schemaField.definition)
            : null;
          
          if (defaultValue !== null || schemaField.definition.required) {
            updates[schemaField.name] = defaultValue;
            changes.fieldsAdded.push(schemaField.name);
          }
        }
      }
    }

    // 2. Eliminar campos desconocidos
    if (options.strategy.removeUnknownFields) {
      Array.from(docFields).forEach(fieldName => {
        if (!allKnownFields.has(fieldName)) {
          updates[fieldName] = null; // Usar null para eliminar en Firestore
          changes.fieldsRemoved.push(fieldName);
        }
      });
    }

    // 3. Actualizar campos con tipo incorrecto
    if (options.strategy.updateExistingFields) {
      Array.from(docFields).forEach(fieldName => {
        const schemaField = allSchemaFields.find(f => f.name === fieldName);
        if (schemaField && doc[fieldName] !== null && doc[fieldName] !== undefined) {
          const convertedValue = this.convertFieldValue(doc[fieldName], schemaField.definition);
          if (convertedValue !== doc[fieldName]) {
            updates[fieldName] = convertedValue;
            changes.fieldsUpdated.push(fieldName);
          }
        }
      });
    }

    // Aplicar cambios si no es dry run y hay cambios
    if (!options.dryRun && Object.keys(updates).length > 0) {
      await this.updateDocumentWithoutValidation(schema.collectionName as keyof typeof FIRESTORE_CONVERTERS, doc.id, updates);
    }

    return changes;
  }

  /**
   * Verifica si dos tipos son compatibles
   */
  private isTypeCompatible(currentType: string, expectedType: string, value: any): boolean {
    if (currentType === expectedType) return true;
    
    // Casos especiales de compatibilidad
    if (expectedType === 'date' && (currentType === 'object' || value instanceof Date)) return true;
    if (expectedType === 'array' && Array.isArray(value)) return true;
    if (expectedType === 'number' && !isNaN(Number(value))) return true;
    
    return false;
  }

  /**
   * Obtiene el valor por defecto para un campo
   */
  private getDefaultValueForField(fieldDef: FieldDefinition): any {
    if (fieldDef.default !== undefined) {
      return fieldDef.default;
    }
    
    switch (fieldDef.type) {
      case 'string': return '';
      case 'number': return 0;
      case 'boolean': return false;
      case 'array': return [];
      case 'object': return {};
      case 'date': return new Date();
      default: return null;
    }
  }

  /**
   * Convierte un valor al tipo esperado
   */
  private convertFieldValue(value: any, fieldDef: FieldDefinition): any {
    try {
      switch (fieldDef.type) {
        case 'string': return String(value);
        case 'number': return Number(value);
        case 'boolean': return Boolean(value);
        case 'array': return Array.isArray(value) ? value : [value];
        case 'date': return value instanceof Date ? value : new Date(value);
        case 'object': return typeof value === 'object' ? value : {};
        default: return value;
      }
    } catch (error) {
      console.warn(`Error convirtiendo valor ${value} a tipo ${fieldDef.type}:`, error);
      return value;
    }
  }

  /**
   * Crea un backup de la colección
   */
  private async createCollectionBackup(
    collectionType: string,
    documents: FirestoreDocument[]
  ): Promise<string> {
    const backupId = `backup_${collectionType}_${Date.now()}`;
    const backupData = {
      collectionType,
      timestamp: new Date(),
      documentCount: documents.length,
      documents
    };
    
    await setDoc(doc(db, '_backups', backupId), backupData);
    return backupId;
  }

  /**
   * Detecta automáticamente colecciones disponibles en Firestore
   * Útil para encontrar colecciones que no están en FIRESTORE_CONVERTERS
   */
  async detectAvailableCollections(): Promise<string[]> {
    try {
      console.log('[DETECT-COLLECTIONS] Iniciando detección de colecciones...');
      
      // 1. Comenzar con las colecciones conocidas de FIRESTORE_CONVERTERS
      const knownCollections = Object.keys(FIRESTORE_CONVERTERS);
      console.log('[DETECT-COLLECTIONS] Colecciones conocidas:', knownCollections);
      
      // 2. Lista de colecciones comunes que pueden existir
      const commonCollections = [
        'usuarios', 'actividades', 'prestamos', 'material_deportivo', 'materials',
        'configuracion', 'notificaciones', 'mensajes', 'conversaciones',
        'weatherHistory', 'system', 'googleApis',
        '_schemas', '_backups', '_test'
      ];
      
      const existingCollections: string[] = [];
      const collectionStats: { [key: string]: number } = {};
      
      // 3. Probar cada colección para ver si existe y tiene documentos
      for (const collectionName of commonCollections) {
        try {
          const collectionRef = collection(db, collectionName);
          const q = query(collectionRef, limit(1));
          const snapshot = await getDocs(q);
          
          // La colección existe si podemos consultarla sin error
          const docCount = snapshot.docs.length;
          collectionStats[collectionName] = docCount;
          existingCollections.push(collectionName);
          
          console.log(`[DETECT-COLLECTIONS] ✅ ${collectionName}: ${docCount} documentos encontrados`);
        } catch (error) {
          // Error puede significar que no existe o no tenemos permisos
          console.log(`[DETECT-COLLECTIONS] ❌ ${collectionName}: No accesible`);
        }
      }
      
      // 4. Asegurar que todas las colecciones conocidas están incluidas
      knownCollections.forEach(collection => {
        if (!existingCollections.includes(collection)) {
          existingCollections.push(collection);
          console.log(`[DETECT-COLLECTIONS] 📝 ${collection}: Añadida desde FIRESTORE_CONVERTERS`);
        }
      });
      
      const sortedCollections = existingCollections.sort();
      
      console.log(`[DETECT-COLLECTIONS] Detección completada: ${sortedCollections.length} colecciones encontradas`);
      console.log(`[DETECT-COLLECTIONS] Colecciones finales:`, sortedCollections);
      console.log(`[DETECT-COLLECTIONS] Estadísticas:`, collectionStats);
      
      return sortedCollections;
    } catch (error) {
      console.error('[DETECT-COLLECTIONS] Error detectando colecciones:', error);
      // Fallback a las colecciones definidas en FIRESTORE_CONVERTERS
      return Object.keys(FIRESTORE_CONVERTERS);
    }
  }

  /**
   * Obtiene las colecciones disponibles (mejorado con detección automática)
   */
  async getAvailableCollectionsAsync(): Promise<string[]> {
    try {
      const detectedCollections = await this.detectAvailableCollections();
      
      // Filtrar colecciones internas que no queremos mostrar en la UI
      const filteredCollections = detectedCollections.filter(collection => 
        !collection.startsWith('_') && // Excluir colecciones internas como _schemas, _backups
        collection !== 'configuracion' // Excluir configuración ya que tiene su propia sección
      );
      
      return filteredCollections;
    } catch (error) {
      console.error('Error obteniendo colecciones disponibles:', error);
      return this.getAvailableCollections(); // Fallback al método sincrónico
    }
  }

  /**
   * Obtiene documentos usando el mismo método robusto que Smart Sample Analysis
   */
  private async getDocumentsFromSampleAnalysis(
    collectionType: keyof typeof FIRESTORE_CONVERTERS,
    limitCount: number
  ): Promise<FirestoreDocument[]> {
    try {
      console.log(`[SAMPLE-DOCS] Obteniendo documentos de ${collectionType} via sample analysis...`);
      
      const collectionRef = collection(db, collectionType);
      
      // Usar el mismo método que Smart Sample Analysis (muestra aleatoria)
      const docs = await this.getRandomSample(collectionRef, limitCount);
      
      const documents = docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`[SAMPLE-DOCS] ✅ Obtenidos ${documents.length} documentos de ${collectionType}`);
      
      return documents;
    } catch (error) {
      console.error(`[SAMPLE-DOCS] Error obteniendo documentos:`, error);
      return [];
    }
  }

  /**
   * Analiza una lista de documentos para normalización
   */
  private async analyzeDocumentsForNormalization(
    documents: FirestoreDocument[],
    schema: CollectionSchema,
    collectionType: string
  ): Promise<DocumentNormalizationNeeds[]> {
    console.log(`[NORMALIZATION] Analizando ${documents.length} documentos obtenidos...`);
    
    // Campos requeridos (obligatorios)
    const requiredFields = new Set([
      ...schema.baseFields.filter(f => f.definition.required).map(f => f.name),
      ...schema.customFields.filter(f => f.definition.required).map(f => f.name)
    ]);
    
    // MEJORA: Considerar TODOS los campos conocidos (base + custom + detectados)
    const allKnownFields = new Set([
      ...schema.baseFields.map(f => f.name),
      ...schema.customFields.map(f => f.name),
      ...schema.detectedFields.map(f => f.name) // ✅ CAMPOS DETECTADOS DINÁMICAMENTE
    ]);

    // ✅ ESTRATEGIA MEJORADA: Encontrar el documento con más campos como "referencia completa"
    let maxFieldCount = 0;
    let referenceFields = new Set<string>();
    
    documents.forEach(doc => {
      const docFields = Object.keys(doc).filter(key => key !== 'id');
      if (docFields.length > maxFieldCount) {
        maxFieldCount = docFields.length;
        referenceFields = new Set(docFields);
      }
    });
    
    console.log(`[NORMALIZATION] Campo de referencia: ${maxFieldCount} campos`);
    console.log(`[NORMALIZATION] Campos de referencia:`, Array.from(referenceFields));

    const analysisResults: DocumentNormalizationNeeds[] = [];

    for (const doc of documents) {
      const docFields = new Set(Object.keys(doc).filter(key => key !== 'id'));
      
      // Campos requeridos faltantes (críticos)
      const missingRequiredFields = Array.from(requiredFields).filter(field => !docFields.has(field));
      
      // ✅ MEJORA: Campos de referencia faltantes (documentos incompletos)
      const missingReferenceFields = Array.from(referenceFields).filter(field => !docFields.has(field));
      
      // Campos desconocidos (presentes pero no en esquema ni referencia)
      const unknownFields = Array.from(docFields).filter(field => 
        !allKnownFields.has(field) && !referenceFields.has(field)
      );
      
      // Campos con tipo incorrecto
      const invalidFields: DocumentNormalizationNeeds['invalidFields'] = [];
      
      Array.from(docFields).forEach(fieldName => {
        const schemaField = [...schema.baseFields, ...schema.customFields]
          .find(f => f.name === fieldName);
        
        if (schemaField && doc[fieldName] !== null && doc[fieldName] !== undefined) {
          const currentType = typeof doc[fieldName];
          const expectedType = schemaField.definition.type;
          
          // Verificar incompatibilidades de tipo
          if (!this.isTypeCompatible(currentType, expectedType, doc[fieldName])) {
            invalidFields.push({
              fieldName,
              currentType,
              expectedType
            });
          }
        }
      });

      // ✅ CRITERIO MEJORADO: Documento necesita actualización si:
      // 1. Le faltan campos requeridos (crítico)
      // 2. Le faltan campos de referencia (documento incompleto)
      // 3. Tiene campos desconocidos 
      // 4. Tiene campos con tipos incorrectos
      const needsUpdate = 
        missingRequiredFields.length > 0 || 
        missingReferenceFields.length > 0 || 
        unknownFields.length > 0 || 
        invalidFields.length > 0;
      
      if (needsUpdate) {
        // ✅ CORREGIR: Eliminar duplicados al combinar campos faltantes
        const allMissingFields = Array.from(new Set([...missingRequiredFields, ...missingReferenceFields]));
        
        analysisResults.push({
          documentId: doc.id,
          missingFields: allMissingFields,
          unknownFields,
          invalidFields,
          needsUpdate,
          // ✅ INFORMACIÓN ADICIONAL PARA DEBUGGING
          fieldCount: docFields.size,
          referenceFieldCount: maxFieldCount,
          missingFromReference: missingReferenceFields
        });
      }
    }

    console.log(`[NORMALIZATION] Análisis completado: ${analysisResults.length} documentos necesitan normalización de ${documents.length} analizados`);
    return analysisResults;
  }

}

// Instancia singleton del servicio
export const firestoreDynamicService = new FirestoreDynamicService();

/**
 * Estrategias de normalización disponibles
 */
export interface NormalizationStrategy {
  addMissingFields: boolean;      // Añadir campos faltantes
  useDefaultValues: boolean;      // Usar valores por defecto
  removeUnknownFields: boolean;   // Eliminar campos no reconocidos
  updateExistingFields: boolean;  // Actualizar campos existentes con nuevo tipo
}

export interface NormalizationOptions {
  strategy: NormalizationStrategy;
  batchSize?: number;            // Documentos por lote
  dryRun?: boolean;             // Solo simular sin aplicar cambios
  backupBeforeChange?: boolean; // Crear backup antes de cambios
}

export interface NormalizationResult {
  totalDocuments: number;
  documentsProcessed: number;
  documentsUpdated: number;
  documentsSkipped: number;
  errors: Array<{
    documentId: string;
    error: string;
  }>;
  changes: Array<{
    documentId: string;
    fieldsAdded: string[];
    fieldsRemoved: string[];
    fieldsUpdated: string[];
  }>;
  backupId?: string;
}

export interface DocumentNormalizationNeeds {
  documentId: string;
  missingFields: string[];
  unknownFields: string[];
  invalidFields: Array<{
    fieldName: string;
    currentType: string;
    expectedType: string;
  }>;
  needsUpdate: boolean;
  // Información adicional para debugging
  fieldCount?: number;
  referenceFieldCount?: number;
  missingFromReference?: string[];
}
